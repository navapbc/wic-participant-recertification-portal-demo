locals {
  # Machine readable project name (lower case letters, dashes, and underscores)
  project_name = "prp-demo"

  # Project owner
  owner = "navapbc"

  # URL of project source code repository
  code_repository_url = "https://github.com/navapbc/wic-participant-recertification-portal-demo"

  # Default AWS region for project (e.g. us-west-1, us-east-2, us-west-1)
  default_region = "us-west-2"

  github_actions_role_name = "${local.project_name}-github-actions"
}
