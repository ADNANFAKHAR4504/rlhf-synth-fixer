########################
# EC2 Bastion Hosts (Primary and Secondary Regions)
########################

resource "aws_instance" "bastion_primary" {
  provider = aws.primary
  ami           = var.bastion_ami_primary
  instance_type = var.bastion_instance_type
  subnet_id     = aws_subnet.public_primary_1.id
  vpc_security_group_ids = [aws_security_group.bastion_primary.id]
  associate_public_ip_address = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-bastion-primary"
    Role = "bastion"
    Environment = var.environment
    ManagedBy = "terraform"
    Project = "secure-env"
  }
}

resource "aws_instance" "bastion_secondary" {
  provider = aws.secondary
  ami           = var.bastion_ami_secondary
  instance_type = var.bastion_instance_type
  subnet_id     = aws_subnet.public_secondary_1.id
  vpc_security_group_ids = [aws_security_group.bastion_secondary.id]
  associate_public_ip_address = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-bastion-secondary"
    Role = "bastion"
    Environment = var.environment
    ManagedBy = "terraform"
    Project = "secure-env"
  }
}

variable "bastion_ami_primary" {
  description = "AMI ID for bastion host in primary region"
  type        = string
}

variable "bastion_ami_secondary" {
  description = "AMI ID for bastion host in secondary region"
  type        = string
}

variable "bastion_instance_type" {
  description = "Instance type for bastion hosts"
  type        = string
  default     = "t3.micro"
}
