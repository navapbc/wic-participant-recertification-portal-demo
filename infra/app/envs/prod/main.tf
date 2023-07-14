data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  environment_name = "prod"
  # The prefix key/value pair is used for terraform workspaces, which is useful for projects with multiple infrastructure developers. 
  # Leave this as a static string if you are not using workspaces for this environment (recommended). Change it to terraform.workspace 
  # if you want to use workspaces in this environment.
  prefix = "prod"
  # Choose the region where this infrastructure should be deployed.
  region = "us-west-2"
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = "prod"
    description = "Application resources created in production environment"
  })
  tfstate_bucket = "prp-demo-636249768232-us-west-2-tf-state"
  tfstate_key    = "infra/prp-demo/environments/prod.tfstate"
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
    key            = "infra/prp-demo/environments/prod.tfstate"
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
  source = "../../../project-config"
}

# Add application modules below
module "app" {
  source           = "../../env-template"
  environment_name = local.environment_name

  # Image tags
  participant_image_tag = var.participant_image_tag
  staff_image_tag       = var.staff_image_tag

  # Urls
  participant_url = "wic-recertification.demo.navapbc.com"
  staff_url       = "wic-recertification-staff.demo.navapbc.com"
}
