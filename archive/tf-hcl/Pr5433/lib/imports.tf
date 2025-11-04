# Import existing Security Group
# Run: terraform import aws_security_group.imported_sg sg-0123456789abcdef
resource "aws_security_group" "imported_sg" {
  name        = "legacy-app-sg-${var.environment_suffix}"
  description = "Imported security group for legacy application"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name             = "legacy-app-sg-${var.environment_suffix}"
    Environment      = terraform.workspace
    MigrationPhase   = var.migration_phase
    ImportedResource = "true"
  }

}

# Import existing S3 Bucket
# Run: terraform import aws_s3_bucket.imported_bucket legacy-app-data-bucket
resource "aws_s3_bucket" "imported_bucket" {
  bucket = "legacy-app-data-bucket-${var.environment_suffix}"

  tags = {
    Name             = "legacy-app-data-bucket-${var.environment_suffix}"
    Environment      = terraform.workspace
    MigrationPhase   = var.migration_phase
    ImportedResource = "true"
  }

}

resource "aws_s3_bucket_versioning" "imported_bucket" {
  bucket = aws_s3_bucket.imported_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "imported_bucket" {
  bucket = aws_s3_bucket.imported_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Import existing IAM Role
# Run: terraform import aws_iam_role.imported_role LegacyAppRole
resource "aws_iam_role" "imported_role" {
  name = "LegacyAppRole-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name             = "LegacyAppRole-${var.environment_suffix}"
    Environment      = terraform.workspace
    MigrationPhase   = var.migration_phase
    ImportedResource = "true"
  }

}

resource "aws_iam_role_policy_attachment" "imported_role_s3_access" {
  role       = aws_iam_role.imported_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_instance_profile" "imported_role_profile" {
  name = "LegacyAppRole-profile-${var.environment_suffix}"
  role = aws_iam_role.imported_role.name

  tags = {
    Name           = "LegacyAppRole-profile-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}
