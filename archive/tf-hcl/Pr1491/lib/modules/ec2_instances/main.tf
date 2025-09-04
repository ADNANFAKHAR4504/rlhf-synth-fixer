data "aws_ami" "amazon_linux_us_west_1" {
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

data "aws_ami" "amazon_linux_eu_central_1" {
  provider    = aws.eu_central_1
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

resource "aws_instance" "primary" {
  count                  = var.create_vpcs ? 1 : 0
  ami                    = data.aws_ami.amazon_linux_us_west_1.id
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null
  subnet_id              = var.primary_subnet_id
  vpc_security_group_ids = [var.primary_security_group_id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = var.primary_kms_key_arn
  }

  tags = {
    Name        = "primary-ec2-instance"
    Environment = "production"
    Region      = "us-west-1"
  }
}

resource "aws_instance" "secondary" {
  count                  = var.create_vpcs ? 1 : 0
  provider               = aws.eu_central_1
  ami                    = data.aws_ami.amazon_linux_eu_central_1.id
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null
  subnet_id              = var.secondary_subnet_id
  vpc_security_group_ids = [var.secondary_security_group_id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = var.secondary_kms_key_arn
  }

  tags = {
    Name        = "secondary-ec2-instance"
    Environment = "production"
    Region      = "eu-central-1"
  }
}
