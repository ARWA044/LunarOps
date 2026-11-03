
# GitHub Actions OIDC identity provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]
}

# Only LunarOps GitHub production environment
# can assume this IAM role.
data "aws_iam_policy_document" "github_assume" {
  statement {
    effect = "Allow"

    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type = "Federated"
      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        "repo:ARWA044@137212322/LunarOps@1433269293:environment:production"
      ]
    }
  }
}

resource "aws_iam_role" "github_ecr_push" {
  name               = "lunarops-github-ecr-push"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

# Permissions for ECR publishing and ECS deployment
resource "aws_iam_role_policy" "github_ecr_push" {
  name = "lunarops-ecr-ecs-deploy-policy"
  role = aws_iam_role.github_ecr_push.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid      = "ECRLogin"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "ECRFrontend"
        Effect = "Allow"
        Action = [
          "ecr:DescribeImages",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = aws_ecr_repository.frontend.arn
      },
      {
        Sid    = "ECSTaskDefinition"
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECSFrontendService"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = [
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.lunarops.name}/${aws_ecs_service.frontend.name}"
        ]
      },
      {
        Sid    = "PassECSTaskRoles"
        Effect = "Allow"
        Action = ["iam:PassRole"]

        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.frontend_task.arn
        ]

        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      }
    ]
  })
}

output "github_ecr_push_role_arn" {
  description = "GitHub Actions AWS deployment role ARN"
  value       = aws_iam_role.github_ecr_push.arn
}
