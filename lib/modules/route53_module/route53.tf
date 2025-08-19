# DNS Module - Creates Route 53 hosted zone and health checks
# This module implements failover routing between regions using health checks
# Primary region gets priority, secondary region serves as failover

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "${var.environment}-hosted-zone"
    Environment