# lib/modules/payment-app/keys.tf

# 1. Generate a secure private key locally
resource "tls_private_key" "generated" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Upload the public key to AWS
resource "aws_key_pair" "generated" {
  count      = var.ssh_key_name == "" ? 1 : 0
  key_name   = "auto-key-${var.environment_suffix}"
  public_key = tls_private_key.generated[0].public_key_openssh

  tags = {
    Name        = "auto-key-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 3. Save the private key to your project root folder
resource "local_file" "private_key" {
  count           = var.ssh_key_name == "" ? 1 : 0
  content         = tls_private_key.generated[0].private_key_pem
  filename        = "${path.root}/${var.environment_suffix}-key.pem"
  file_permission = "0400" # Read-only for owner (required by SSH)
}