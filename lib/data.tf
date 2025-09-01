# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get Route 53 hosted zone
data "aws_route53_zone" "main" {
  name         = var.route53_zone_name
  private_zone = false
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
