
terraform {
  backend "s3" {
    bucket       = "lunarops-tfstate-783112293087-us-east-1"
    key          = "lunarops/production/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
