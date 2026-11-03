
resource "aws_ecs_task_definition" "frontend" {
  family                   = "lunarops-${var.environment}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.frontend_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.lunarops_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "frontend" {
  name            = "lunarops-frontend-service"
  cluster         = aws_ecs_cluster.lunarops.id
  task_definition = aws_ecs_task_definition.frontend.arn

  desired_count    = var.frontend_desired_count
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = aws_subnet.private[*].id

    security_groups = [
      aws_security_group.frontend.id
    ]

    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution,
    aws_vpc_endpoint.s3,
    aws_vpc_endpoint.interfaces
  ]
}
