############################################################################################
## A module for creating an ECS cluster
############################################################################################

resource "aws_ecs_cluster" "service_cluster" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
