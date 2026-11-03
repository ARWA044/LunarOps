
variable "frontend_image_tag" {
  description = "Docker image tag for the LunarOps frontend"
  type        = string
  default     = "initial"
}

variable "frontend_desired_count" {
  description = "Number of frontend ECS tasks"
  type        = number
  default     = 1
}
