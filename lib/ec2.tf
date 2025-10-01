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

  # No SSH ingress here; SSH rule is added conditionally below
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "ec2-sg-${var.resource_suffix}"
  }
}

# Conditional SSH rule: created only if use_ssm is false
resource "aws_security_group_rule" "ssh" {
  count        = var.use_ssm ? 0 : 1
  type         = "ingress"
  from_port    = 22
  to_port      = 22
  protocol     = "tcp"
  security_group_id = aws_security_group.ec2_sg.id
  cidr_blocks  = var.ssh_cidr_blocks
  description  = "SSH access (only when use_ssm = false)"
}

# Key pair created only if use_ssm is false
resource "aws_key_pair" "deployer" {
  count      = var.use_ssm ? 0 : 1
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = var.ssh_public_key
}

# IAM role / instance profile for SSM (created always; attachment harmless)
resource "aws_iam_role" "ssm" {
  name = "ssm-role-${var.resource_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "ssm-profile-${var.resource_suffix}"
  role = aws_iam_role.ssm.name
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  # if using SSH, key will be created; if using SSM, key_name is null
  key_name = var.use_ssm ? null : try(aws_key_pair.deployer[0].key_name, null)

  # attach instance profile for SSM
  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  tags = {
    Name = "web-instance-${var.resource_suffix}"
  }
}