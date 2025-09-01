# Generate a key pair if needed
resource "tls_private_key" "ec2" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create key pair
resource "aws_key_pair" "ec2_key_pair" {
  key_name   = "${var.environment}-key-pair"
  public_key = var.public_key != "" ? var.public_key : tls_private_key.ec2.public_key_openssh
}

# Local value for key pair name
locals {
  key_pair_name = var.create_key_pair ? aws_key_pair.ec2_key_pair[0].key_name : var.key_pair_name
}