# Generate a key pair if needed
resource "tls_private_key" "ec2" {
  count     = var.create_key_pair ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create key pair
resource "aws_key_pair" "ec2" {
  count      = var.create_key_pair ? 1 : 0
  key_name   = "${var.environment}-key-pair"
  public_key = tls_private_key.ec2[0].public_key_openssh
}

locals {
  key_pair_name = var.create_key_pair ? aws_key_pair.ec2[0].key_name : var.key_pair_name
}