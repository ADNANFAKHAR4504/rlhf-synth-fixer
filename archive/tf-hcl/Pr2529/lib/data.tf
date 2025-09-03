# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get Route 53 hosted zone (optional)
data "aws_route53_zone" "main" {
  count         = var.create_route53_records ? 1 : 0
  name          = var.route53_zone_name
  private_zone  = false
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}