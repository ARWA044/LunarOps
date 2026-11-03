
output "website_url" {
  description = "Public HTTPS URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "vpc_id" {
  description = "LunarOps VPC identifier"
  value       = aws_vpc.lunarops.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "ecs_service_name" {
  value = aws_ecs_service.frontend.name
}

output "alb_dns_name" {
  value = aws_lb.lunarops.dns_name
}

output "datasets_bucket_name" {
  value = aws_s3_bucket.datasets.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website.id
}
