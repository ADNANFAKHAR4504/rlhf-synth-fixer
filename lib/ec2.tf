# Add random suffix for unique log group names
resource "random_id" "log_suffix" {
  byte_length = 4
}
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
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
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
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
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

# VPC Flow Log for Bastion Host Subnets (Primary & Secondary)
resource "aws_flow_log" "bastion_primary_subnet" {
  provider             = aws.primary
  subnet_id            = aws_subnet.public_primary_1.id
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.bastion_primary_subnet.arn
  iam_role_arn         = aws_iam_role.vpc_flow_log.arn
  traffic_type         = "ALL"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-flowlog-bastion-primary-subnet"
  }
}

resource "aws_flow_log" "bastion_secondary_subnet" {
  provider             = aws.secondary
  subnet_id            = aws_subnet.public_secondary_1.id
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.bastion_secondary_subnet.arn
  iam_role_arn         = aws_iam_role.vpc_flow_log.arn
  traffic_type         = "ALL"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-flowlog-bastion-secondary-subnet"
  }
}

resource "aws_cloudwatch_log_group" "bastion_primary_subnet" {
  provider = aws.primary
  name     = "/aws/vpc/flowlogs/bastion-primary-subnet-${random_id.log_suffix.hex}"
  retention_in_days = 30
  tags = {
    Name = "${var.name_prefix}-${var.environment}-flowlogs-bastion-primary-subnet"
  }
}

resource "aws_cloudwatch_log_group" "bastion_secondary_subnet" {
  provider = aws.secondary
  name     = "/aws/vpc/flowlogs/bastion-secondary-subnet-${random_id.log_suffix.hex}"
  retention_in_days = 30
  tags = {
    Name = "${var.name_prefix}-${var.environment}-flowlogs-bastion-secondary-subnet"
  }
}

output "bastion_primary_id" {
  value = aws_instance.bastion_primary.id
}

output "bastion_secondary_id" {
  value = aws_instance.bastion_secondary.id
}