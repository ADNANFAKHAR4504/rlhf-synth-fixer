# EBS Default Encryption - Primary Region
resource "aws_ebs_encryption_by_default" "primary" {
  enabled = var.enable_ebs_encryption
}

# EBS Default Encryption - Secondary Region
resource "aws_ebs_encryption_by_default" "secondary" {
  provider = aws.eu_west_1
  enabled  = var.enable_ebs_encryption
}