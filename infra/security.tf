
# AWS-maintained CloudFront origin IP ranges
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# Internal Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "lunarops-alb-sg"
  description = "Security group for private ALB"
  vpc_id      = aws_vpc.lunarops.id
}

# Frontend ECS tasks
resource "aws_security_group" "frontend" {
  name        = "lunarops-frontend-sg"
  description = "Security group for Next.js ECS tasks"
  vpc_id      = aws_vpc.lunarops.id
}

# VPC interface endpoints
resource "aws_security_group" "endpoints" {
  name        = "lunarops-endpoints-sg"
  description = "Private AWS service endpoints"
  vpc_id      = aws_vpc.lunarops.id
}

# CloudFront -> ALB
resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id = aws_security_group.alb.id

  prefix_list_id = data.aws_ec2_managed_prefix_list.cloudfront.id

  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
}

# ALB -> Frontend
resource "aws_vpc_security_group_egress_rule" "alb_to_frontend" {
  security_group_id = aws_security_group.alb.id

  referenced_security_group_id = aws_security_group.frontend.id

  from_port   = 3000
  to_port     = 3000
  ip_protocol = "tcp"
}

# Frontend accepts requests only from ALB
resource "aws_vpc_security_group_ingress_rule" "frontend_from_alb" {
  security_group_id = aws_security_group.frontend.id

  referenced_security_group_id = aws_security_group.alb.id

  from_port   = 3000
  to_port     = 3000
  ip_protocol = "tcp"
}

# Frontend -> private AWS interface endpoints
resource "aws_vpc_security_group_egress_rule" "frontend_to_endpoints" {
  security_group_id = aws_security_group.frontend.id

  referenced_security_group_id = aws_security_group.endpoints.id

  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}

# Frontend -> S3 Gateway endpoint
resource "aws_vpc_security_group_egress_rule" "frontend_to_s3" {
  security_group_id = aws_security_group.frontend.id

  prefix_list_id = aws_vpc_endpoint.s3.prefix_list_id

  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}

# VPC endpoints accept HTTPS from the frontend
resource "aws_vpc_security_group_ingress_rule" "endpoints_from_frontend" {
  security_group_id = aws_security_group.endpoints.id

  referenced_security_group_id = aws_security_group.frontend.id

  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}
