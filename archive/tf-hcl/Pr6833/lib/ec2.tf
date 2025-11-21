data "aws_ami" "amazon_linux_2" {
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

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg-${var.resource_suffix}"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # SSH access as per requirements
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH access from configurable IP addresses"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name            = "ec2-sg-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# SSH Key Pair for EC2 access
resource "aws_key_pair" "deployer" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = var.ssh_public_key

  tags = {
    Name            = "deployer-key-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# IAM role for SSM access (kept for additional security option)
resource "aws_iam_role" "ec2_ssm_role" {
  name = "ec2-ssm-role-${var.resource_suffix}"

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
    Name            = "ec2-ssm-role-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Inline policy granting S3 access to the instance role for the terraform state bucket
resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "ec2-ssm-s3-access-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::terraform-state-${data.aws_caller_identity.current.account_id}-${var.resource_suffix}",
          "arn:aws:s3:::terraform-state-${data.aws_caller_identity.current.account_id}-${var.resource_suffix}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-profile-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.name

  tags = {
    Name            = "ec2-profile-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.ssh_public_key != "" ? aws_key_pair.deployer[0].key_name : null

  tags = {
    Name            = "web-instance-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# Inline policy granting Secrets Manager read access for the instance to fetch RDS credentials
resource "aws_iam_role_policy" "ec2_secrets_access" {
  name = "ec2-ssm-secrets-access-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      }
    ]
  })
}