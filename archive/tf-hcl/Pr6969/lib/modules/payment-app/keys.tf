# lib/modules/payment-app/keys.tf

# 1. Generate a secure private key
resource "tls_private_key" "generated" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Upload the public key to AWS
resource "aws_key_pair" "generated" {
  count = var.ssh_key_name == "" ? 1 : 0

  key_name   = "payment-app-${var.pr_number}-key"
  public_key = tls_private_key.generated[0].public_key_openssh

  tags = {
    Name        = "payment-app-${var.pr_number}-key"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 3. Store the private key securely in AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "private_key" {
  count = var.ssh_key_name == "" ? 1 : 0

  name        = "/payment-app/${var.environment}/ssh-keys/payment-app-${var.pr_number}-key"
  description = "Private SSH key for payment-app-${var.pr_number}-key"
  type        = "SecureString"
  value       = tls_private_key.generated[0].private_key_pem

  tags = {
    Name        = "payment-app-${var.pr_number}-key-private"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}