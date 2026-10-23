# LunarOps Production Cloud Infrastructure (AWS ECS Fargate)
# Role 05: Cloud & DevSecOps Architect (Arwa)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "LunarOps"
      Challenge   = "NASA-Space-Apps-2026"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Primary Deployment Region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment Stage (staging/production)"
}

# ECR Repositories for Docker images
resource "aws_ecr_repository" "frontend" {
  name                 = "lunarops-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "lunarops-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "lunarops" {
  name = "lunarops-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lunarops_logs" {
  name              = "/ecs/lunarops-${var.environment}"
  retention_in_days = 30
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR Repository URL for LunarOps Next.js Frontend"
}

output "ecr_backend_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR Repository URL for LunarOps FastAPI Scientific Engine"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.lunarops.name
  description = "ECS Fargate Cluster Name"
}
