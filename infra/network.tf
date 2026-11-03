
data "aws_availability_zones" "available" {
  state = "available"
}

# Exclude an AZ unsupported by CloudFront VPC origins
locals {
  supported_azs = [
    for i, name in data.aws_availability_zones.available.names :
    name
    if data.aws_availability_zones.available.zone_ids[i] != "use1-az3"
  ]
}

resource "aws_vpc" "lunarops" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "lunarops-vpc"
  }
}

# Required by CloudFront VPC origins.
# No public routes are created for our private subnets.
resource "aws_internet_gateway" "lunarops" {
  vpc_id = aws_vpc.lunarops.id

  tags = {
    Name = "lunarops-igw"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id                  = aws_vpc.lunarops.id
  cidr_block              = cidrsubnet("10.20.0.0/16", 8, 11 + count.index)
  availability_zone       = local.supported_azs[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "lunarops-private-${count.index + 1}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.lunarops.id

  tags = {
    Name = "lunarops-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# S3 Gateway endpoint - no NAT required
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.lunarops.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.private.id
  ]
}

# Private access to ECR API, ECR Docker Registry and logs
resource "aws_vpc_endpoint" "interfaces" {
  for_each = toset([
    "ecr.api",
    "ecr.dkr",
    "logs"
  ])

  vpc_id              = aws_vpc.lunarops.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = aws_subnet.private[*].id

  security_group_ids = [
    aws_security_group.endpoints.id
  ]

  tags = {
    Name = "lunarops-${replace(each.value, ".", "-")}"
  }
}
