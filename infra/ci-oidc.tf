
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

# GitHub Actions AWS deployment role
resource "aws_iam_role" "github_ecr_push" {
  name               = "lunarops-github-ecr-push"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

# Permissions for frontend AND backend ECR/ECS deployment
resource "aws_iam_role_policy" "github_ecr_push" {
  name = "lunarops-ecr-ecs-deploy-policy"
  role = aws_iam_role.github_ecr_push.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      # 1. Authenticate with Amazon ECR
      {
        Sid      = "ECRLogin"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },

      # 2. Push images to frontend AND backend ECR repositories
      {
        Sid    = "ECRFrontendBackend"
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

        Resource = [
          aws_ecr_repository.frontend.arn,
          aws_ecr_repository.backend.arn
        ]
      },

      # 3. Read and register ECS task definitions
      {
        Sid    = "ECSTaskDefinition"
        Effect = "Allow"

        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]

        Resource = "*"
      },

      # 4. Deploy BOTH ECS services
      {
        Sid    = "ECSFrontendBackendServices"
        Effect = "Allow"

        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]

        Resource = [
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.lunarops.name}/${aws_ecs_service.frontend.name}",
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.lunarops.name}/${aws_ecs_service.backend.name}"
        ]
      },

      # 5. Allow ECS to receive the required IAM roles
      {
        Sid    = "PassECSTaskRoles"
        Effect = "Allow"

        Action = ["iam:PassRole"]

        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.frontend_task.arn,
          aws_iam_role.backend_task.arn
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
