
resource "aws_lb" "lunarops" {
  name               = "lunarops-alb"
  internal           = true
  load_balancer_type = "application"

  subnets = aws_subnet.private[*].id

  security_groups = [
    aws_security_group.alb.id
  ]

  enable_deletion_protection = false
  drop_invalid_header_fields = true

  tags = {
    Name = "lunarops-internal-alb"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "lunarops-frontend-tg"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.lunarops.id

  health_check {
    enabled             = true
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.lunarops.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}
