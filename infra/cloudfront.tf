
# Private connection from CloudFront to internal ALB
resource "aws_cloudfront_vpc_origin" "alb" {
  vpc_origin_endpoint_config {
    name = "lunarops-private-alb"
    arn  = aws_lb.lunarops.arn

    http_port  = 80
    https_port = 443

    origin_protocol_policy = "http-only"

    origin_ssl_protocols {
      items    = ["TLSv1.2"]
      quantity = 1
    }
  }
}

# Web Application Firewall
resource "aws_wafv2_web_acl" "lunarops" {
  name  = "lunarops-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedCommonRules"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "LunarOpsCommonRules"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "LunarOpsWebACL"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "website" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Public LunarOps website"

  price_class = "PriceClass_100"

  origin {
    domain_name = aws_lb.lunarops.dns_name
    origin_id   = "lunarops-private-alb"

    vpc_origin_config {
      vpc_origin_id = aws_cloudfront_vpc_origin.alb.id
    }
  }

  # Dynamic Next.js pages and APIs
  default_cache_behavior {
    target_origin_id = "lunarops-private-alb"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET", "HEAD", "OPTIONS",
      "PUT", "POST", "PATCH", "DELETE"
    ]

    cached_methods = ["GET", "HEAD"]

    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be8bc"

    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"

    compress = true
  }

  # Cache versioned static Next.js assets
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    target_origin_id = "lunarops-private-alb"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    compress = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  web_acl_id = aws_wafv2_web_acl.lunarops.arn
}
