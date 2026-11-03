

# AWS account information
data "aws_caller_identity" "kms_account" {}

# Define who can use the encryption key
data "aws_iam_policy_document" "cloudwatch_kms" {

  # Allow this AWS account to administer the key
  statement {
    sid    = "AllowAccountAdministration"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${data.aws_caller_identity.kms_account.account_id}:root"
      ]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Allow CloudWatch Logs to use the key
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = [
        "logs.${var.aws_region}.amazonaws.com"
      ]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Describe*"
    ]

    resources = ["*"]

    condition {
      test     = "ArnEquals"
      variable = "kms:EncryptionContext:aws:logs:arn"

      values = [
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.kms_account.account_id}:log-group:/ecs/lunarops-${var.environment}"
      ]
    }
  }
}

# Create the KMS key
resource "aws_kms_key" "logs" {
  description             = "LunarOps CloudWatch Logs encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = data.aws_iam_policy_document.cloudwatch_kms.json
}

# Give the key a readable name
resource "aws_kms_alias" "logs" {
  name          = "alias/lunarops-logs-${var.environment}"
  target_key_id = aws_kms_key.logs.key_id
}
