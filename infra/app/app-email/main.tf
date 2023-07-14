# @TODO We have too many state buckets and our terraform is split into too many places.
# Refactor into a simpler setup.
locals {
  project_name = module.project_config.project_name
  app_name     = "prp-demo"
  region       = "us-west-2"

  # Set project tags that will be used to tag all resources.
  tags = merge(module.project_config.default_tags, {
    application      = local.app_name
    application_role = "email"
    description      = "Resources for configuring email services."
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
    key            = "infra/prp-demo/app-email.tfstate"
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


module "email" {
  source             = "../../modules/email"
  hosted_zone_domain = "wic-services.org"
  domain             = "wic-services.org"
}
