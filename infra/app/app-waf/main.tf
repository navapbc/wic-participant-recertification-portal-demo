locals {
  project_name     = module.project_config.project_name
  app_name         = "prp-demo"
  region           = "us-west-2"
  waf_name         = "${local.project_name}-${local.app_name}-waf" # @TODO this should be cleaned up with the root module centralization
  waf_logging_name = "waf/${local.project_name}"

  # Set project tags that will be used to tag all resources.
  tags = merge(module.project_config.default_tags, {
    application      = local.app_name
    application_role = "waf"
    description      = "Web application firewall to protect AWS resources"
  })
}

terraform {
  required_version = ">=1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">=4.59.0"
    }
  }

  # Terraform does not allow interpolation here, values must be hardcoded.

  backend "s3" {
    bucket         = "prp-demo-636249768232-us-west-2-tf-state"
    key            = "infra/prp-demo/app-waf.tfstate"
    dynamodb_table = "prp-demo-tf-state-locks"
    region         = "us-west-2"
    encrypt        = "true"
  }
}

provider "aws" {
  region = local.region
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../../project-config"
}


module "waf" {
  source           = "../../modules/waf"
  waf_name         = local.waf_name
  waf_logging_name = local.waf_logging_name
}
