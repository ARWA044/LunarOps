terraform {
  required_version = ">= 1.10.0"

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
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# Frontend Docker image repository
resource "aws_ecr_repository" "frontend" {
  name                 = "lunarops-frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Backend Docker image repository
resource "aws_ecr_repository" "backend" {
  name                 = "lunarops-backend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Container orchestration cluster
resource "aws_ecs_cluster" "lunarops" {
  name = "lunarops-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Central application logs
resource "aws_cloudwatch_log_group" "lunarops_logs" {
  name              = "/ecs/lunarops-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.lunarops.name
}