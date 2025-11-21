# Main configuration file for the payment-app module

locals {
  # Point directly to the resources we created in networking.tf
  vpc_id             = aws_vpc.main.id
  public_subnet_ids  = aws_subnet.public[*].id
  private_subnet_ids = aws_subnet.private[*].id

  common_tags = {
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}