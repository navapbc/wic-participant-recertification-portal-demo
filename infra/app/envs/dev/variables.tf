variable "participant_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the participant service"
  default     = "latest"
}

variable "staff_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the staff service"
  default     = "latest"
}
