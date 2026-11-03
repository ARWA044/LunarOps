
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
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

locals {
  state_bucket_name = "lunarops-tfstate-${data.aws_caller_identity.current.account_id}-us-east-1"
}

resource "aws_s3_bucket" "state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Project = "LunarOps"
    Purpose = "TerraformState"
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "https_only" {
  bucket = aws_s3_bucket.state.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Sid       = "DenyUnencryptedTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"

      Resource = [
        aws_s3_bucket.state.arn,
        "${aws_s3_bucket.state.arn}/*"
      ]

      Condition = {
        Bool = {
          "aws:SecureTransport" = "false"
        }
      }
    }]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.state
  ]
}

output "state_bucket_name" {
  value = aws_s3_bucket.state.bucket
}
