
resource "aws_s3_bucket" "datasets" {
  bucket = "lunarops-data-${data.aws_caller_identity.current.account_id}-${var.environment}"

  tags = {
    Name    = "lunarops-datasets"
    Purpose = "ScientificData"
  }
}

resource "aws_s3_bucket_public_access_block" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "datasets_https" {
  bucket = aws_s3_bucket.datasets.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"

      Resource = [
        aws_s3_bucket.datasets.arn,
        "${aws_s3_bucket.datasets.arn}/*"
      ]

      Condition = {
        Bool = {
          "aws:SecureTransport" = "false"
        }
      }
    }]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.datasets
  ]
}
