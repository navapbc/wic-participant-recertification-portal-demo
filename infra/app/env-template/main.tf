############################################################################################
## The root module used to manage all per-environment resources
## Note: This module assumes that the Route53 Hosted Zone has been created in the AWS Console.
##       It also assumes that SSL cert has been created in ACM in the AWS Console.
############################################################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "project_config" {
  source = "../../project-config"
}

module "app_config" {
  source = "../app-config"
}

locals {
  project_name              = module.project_config.project_name
  app_name                  = module.app_config.app_name
  hosted_zone_domain        = "wic-recertification.demo.navapbc.com"
  cluster_name              = "${local.project_name}-${local.app_name}-${var.environment_name}"
  participant_database_name = "${local.project_name}-participant-${var.environment_name}"
  participant_service_name  = "${local.project_name}-participant-${var.environment_name}"
  staff_service_name        = "${local.project_name}-staff-${var.environment_name}"
  document_upload_s3_name   = "${local.project_name}-doc-upload-${var.environment_name}"
  side_load_s3_name         = "${local.project_name}-side-load-${var.environment_name}"
  s3_logging_bucket_name    = "${local.project_name}-s3-logging-${var.environment_name}"
  waf_name                  = "${local.project_name}-${local.project_name}-waf" # @TODO this should be cleaned up with the root module centralization
}

data "aws_acm_certificate" "ssl_cert" {
  domain = local.hosted_zone_domain
}

############################################################################################
## VPC
## - Currently uses the default VPC
############################################################################################

# TODO(https://github.com/navapbc/template-infra/issues/152) use non-default VPC
data "aws_vpc" "default" {
  default = true
}

# TODO(https://github.com/navapbc/template-infra/issues/152) use private subnets
data "aws_subnets" "default" {
  filter {
    name   = "default-for-az"
    values = [true]
  }
}

############################################################################################
## S3 logging bucket
## - Creates an S3 bucket for logging purposes
## - Resources that log to this bucket include: doc upload and side load s3 buckets and ALB
############################################################################################

module "s3_logging_bucket" {
  source              = "../../modules/s3-logging"
  logging_bucket_name = local.s3_logging_bucket_name
}

############################################################################################
## Document upload
## - Creates an IAM user to pass to the AWS SDK in the participant app for S3 operations
## - Creates an S3 bucket
## - Sets CORS policy for the document upload S3 bucket
############################################################################################

module "s3_machine_user" {
  # checkov:skip=CKV_AWS_273:Explicitly using an IAM user for longer S3 presigned url expiration times

  source            = "../../modules/iam-machine-user"
  machine_user_name = local.document_upload_s3_name
}

module "doc_upload" {
  source               = "../../modules/s3-encrypted"
  s3_bucket_name       = local.document_upload_s3_name
  s3_logging_bucket_id = module.s3_logging_bucket.bucket_id
  read_group_names     = [module.s3_machine_user.machine_user_group_name]
  write_group_names    = [module.s3_machine_user.machine_user_group_name]
  delete_group_names   = [module.s3_machine_user.machine_user_group_name]
}

resource "aws_s3_bucket_cors_configuration" "doc_upload_cors" {
  bucket = local.document_upload_s3_name

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["https://${var.participant_url}"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

############################################################################################
## ECS service cluster
## - Contains services for the participant, staff, and analytics applications
############################################################################################

module "service_cluster" {
  source       = "../../modules/service-cluster"
  cluster_name = local.cluster_name
}

############################################################################################
## The participant application
## - Creates an RDS Aurora postgresql database
## - Creates an A record for the application
## - Creates an ECS service and task for the Remix application
## - Sets autoscaling for the ECS service
## - Creates an Eventbridge schedule to update S3 presigned urls saved to the database
##   so that they don't expire and become inaccessible
## - Creates an S3 bucket to side load data, such as staff users, into the database
############################################################################################

data "aws_ecr_repository" "participant_image_repository" {
  name = "${local.project_name}-participant"
}

module "participant_database" {
  source        = "../../modules/database"
  database_name = local.participant_database_name
  vpc_id        = data.aws_vpc.default.id
  cidr_blocks   = [data.aws_vpc.default.cidr_block]
}

module "participant" {
  source                             = "../../modules/service"
  service_name                       = local.participant_service_name
  image_repository_url               = data.aws_ecr_repository.participant_image_repository.repository_url
  image_repository_arn               = data.aws_ecr_repository.participant_image_repository.arn
  waf_name                           = local.waf_name
  s3_logging_bucket_id               = module.s3_logging_bucket.bucket_id
  image_tag                          = var.participant_image_tag
  vpc_id                             = data.aws_vpc.default.id
  subnet_ids                         = data.aws_subnets.default.ids
  ssl_cert_arn                       = data.aws_acm_certificate.ssl_cert.arn
  service_cluster_arn                = module.service_cluster.service_cluster_arn
  container_port                     = 3000
  memory                             = 2048
  healthcheck_path                   = "/healthcheck"
  service_deployment_maximum_percent = 250
  task_role_max_session_duration     = 12 * 60 * 60 # 12 hours
  # The database seed needs longer lead time before healthchecks kick in to kill the container
  healthcheck_start_period = 120
  enable_exec              = var.participant_enable_exec
  container_secrets = [
    {
      name      = "DATABASE_URL",
      valueFrom = module.participant_database.admin_db_url_secret_arn,
    },
    {
      name      = "POSTGRES_PASSWORD",
      valueFrom = module.participant_database.admin_password_secret_arn,
    },
    {
      name      = "POSTGRES_USER",
      valueFrom = module.participant_database.admin_user_secret_arn,
    },
    {
      name      = "AWS_ACCESS_KEY_ID",
      valueFrom = module.s3_machine_user.access_key_id_secret_arn,
    },
    {
      name      = "AWS_SECRET_ACCESS_KEY",
      valueFrom = module.s3_machine_user.secret_access_key_secret_arn,
    },
  ]
  container_env_vars = [
    {
      name  = "S3_PRESIGNED_URL_EXPIRATION",
      value = var.participant_s3_presigned_url_expiration,
    },
    {
      name  = "S3_PRESIGNED_URL_RENEWAL_THRESHOLD",
      value = var.participant_s3_presigned_url_renewal_threshold,
    },
    {
      name  = "MAX_UPLOAD_SIZE_BYTES",
      value = var.participant_max_upload_size_bytes,
    },
    {
      name  = "MAX_UPLOAD_FILECOUNT",
      value = var.participant_max_upload_filecount,
    },
    {
      name  = "MAX_SESSION_SECONDS",
      value = var.participant_max_session_seconds,
    },
    {
      name  = "AWS_REGION",
      value = data.aws_region.current.name,
    },
    {
      name  = "S3_BUCKET",
      value = local.document_upload_s3_name,
    },
    {
      name  = "PUBLIC_DEMO_MODE",
      value = true,
    },
    {
      name  = "LOG_LEVEL",
      value = var.participant_log_level,
    }
  ]
  ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_arn,
    module.participant_database.admin_password_secret_arn,
    module.participant_database.admin_user_secret_arn,
    module.s3_machine_user.access_key_id_secret_arn,
    module.s3_machine_user.secret_access_key_secret_arn,
  ]
  container_bind_mounts = {
    "tmp" : {
      volume_name    = "${local.participant_service_name}-tmp",
      container_path = "/tmp",
    }
  }

  depends_on = [
    module.participant_database,
  ]
}

module "side_load" {
  source               = "../../modules/s3-encrypted"
  s3_bucket_name       = local.side_load_s3_name
  s3_logging_bucket_id = module.s3_logging_bucket.bucket_id
  read_group_names     = [module.s3_machine_user.machine_user_group_name]
}

############################################################################################
## The staff application
## - Creates an A record for the application
## - Creates an ECS service and task for the Lowdefy application
############################################################################################

data "aws_ecr_repository" "staff_image_repository" {
  name = "${local.project_name}-staff"
}

module "staff_secret" {
  source = "../../modules/random-password"
  length = 256
}

module "staff" {
  source               = "../../modules/service"
  service_name         = local.staff_service_name
  image_repository_url = data.aws_ecr_repository.staff_image_repository.repository_url
  waf_name             = local.waf_name
  s3_logging_bucket_id = module.s3_logging_bucket.bucket_id
  image_repository_arn = data.aws_ecr_repository.staff_image_repository.arn
  image_tag            = var.staff_image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  ssl_cert_arn         = data.aws_acm_certificate.ssl_cert.arn
  service_cluster_arn  = module.service_cluster.service_cluster_arn
  container_port       = 3000
  enable_exec          = var.staff_enable_exec
  enable_healthcheck   = false

  ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_arn,
  ]
  depends_on = [
    module.participant_database,
  ]
}
