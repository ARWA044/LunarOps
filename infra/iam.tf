
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRole"
    ]

    principals {
      type = "Service"

      identifiers = [
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "lunarops-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "frontend_task" {
  name               = "lunarops-frontend-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

# Example: allow application read-only access to LunarOps datasets
resource "aws_iam_role_policy" "frontend_s3_read" {
  name = "lunarops-frontend-s3-read"
  role = aws_iam_role.frontend_task.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.datasets.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.datasets.arn}/*"
      }
    ]
  })
}
