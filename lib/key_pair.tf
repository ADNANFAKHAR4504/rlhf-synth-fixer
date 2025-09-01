
# Generate a key pair if needed
resource "tls_private_key" "ec2_key" {
  count     = var.create_key_pair && var.public_key == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Create key pair
resource "aws_key_pair" "ec2_key_pair" {
  count      = var.create_key_pair ? 1 : 0
  key_name   = var.key_pair_name != "" ? var.key_pair_name : "terraform-generated-key"
  public_key = var.public_key != "" ? var.public_key : tls_private_key.ec2_key[0].public_key_openssh

  tags = merge(var.common_tags, {
    Name = "EC2 Key Pair"
  })
}

# Local value for key pair name
locals {
  key_pair_name = var.create_key_pair ? aws_key_pair.ec2_key_pair[0].key_name : var.key_pair_name
}