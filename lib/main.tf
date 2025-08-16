# Shared configuration and data sources
# This file includes shared resources and configuration
# Main stack orchestration is handled in tap_stack.tf

# AWS Region data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
