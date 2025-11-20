# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "ec2-role-${var.pr_number}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ec2-role-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach SSM policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM policy for KMS operations
resource "aws_iam_role_policy" "ec2_kms" {
  name = "ec2-kms-policy-${var.pr_number}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# IAM policy for Secrets Manager access
resource "aws_iam_role_policy" "ec2_secrets" {
  name = "ec2-secrets-policy-${var.pr_number}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-profile-${var.pr_number}"
  role = aws_iam_role.ec2.name

  tags = {
    Name        = "ec2-profile-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# EC2 instances
resource "aws_instance" "app" {
  count = var.instance_count

  ami           = var.ami_id != "" ? var.ami_id : data.aws_ami.default.id
  instance_type = var.ec2_instance_type

  subnet_id              = local.private_subnet_ids[count.index % length(local.private_subnet_ids)]
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : aws_key_pair.generated[0].key_name

  monitoring = var.environment == "prod" ? true : false

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.environment == "prod" ? 50 : 20
    encrypted             = true
    kms_key_id            = aws_kms_key.main.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
    db_name     = aws_db_instance.main.db_name
    environment = var.environment
    secret_name = aws_secretsmanager_secret.db_password.name
    aws_region  = var.aws_region
  }))

  tags = {
    Name        = "ec2-${var.pr_number}-${count.index + 1}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_ami" "default" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}