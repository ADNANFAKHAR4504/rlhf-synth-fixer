# Use data source to lookup latest Amazon Linux 2 AMI in each region

data "aws_ami" "bastion_primary" {
  provider = aws.primary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "bastion_secondary" {
  provider = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "bastion_primary" {
  provider = aws.primary
  ami           = data.aws_ami.bastion_primary.id
  instance_type = var.bastion_instance_type
  subnet_id     = aws_subnet.public_primary_1.id
  vpc_security_group_ids = [aws_security_group.bastion_primary.id]
  associate_public_ip_address = true
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-bastion-primary"
    Role        = "bastion"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_instance" "bastion_secondary" {
  provider = aws.secondary
  ami           = data.aws_ami.bastion_secondary.id
  instance_type = var.bastion_instance_type
  subnet_id     = aws_subnet.public_secondary_1.id
  vpc_security_group_ids = [aws_security_group.bastion_secondary.id]
  associate_public_ip_address = true
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-bastion-secondary"
    Role        = "bastion"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

variable "bastion_instance_type" {
  description = "Instance type for bastion hosts"
  type        = string
  default     = "t3.micro"
}