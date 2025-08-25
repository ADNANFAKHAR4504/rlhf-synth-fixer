########################
# Security Groups (Public/Private EC2, Lambda)
########################

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access to public EC2 instances"
  type        = list(string)
  # PRODUCTION: Replace with your trusted office VPN or bastion host CIDR, e.g., 10.0.0.0/24
  default     = ["10.0.0.0/24"] # Example: office VPN/private network. Do NOT use public IPs in production.
}

# Security Group for Public EC2 (bastion hosts) - Primary
resource "aws_security_group" "public_ec2_primary" {
  provider    = aws.primary
  name        = "${var.name_prefix}-${var.environment}-public-ec2-sg-primary"
  description = "Security group for public EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  # Allow SSH access from specified CIDR blocks (update for production security)
  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-ec2-sg-primary"
  }
}

# Security Group for Public EC2 (bastion hosts) - Secondary
resource "aws_security_group" "public_ec2_secondary" {
  provider    = aws.secondary
  name        = "${var.name_prefix}-${var.environment}-public-ec2-sg-secondary"
  description = "Security group for public EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  # Allow SSH access from specified CIDR blocks (update for production security)
  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-ec2-sg-secondary"
  }
}

# Security Group for Private EC2 - Primary
resource "aws_security_group" "private_ec2_primary" {
  provider    = aws.primary
  name        = "${var.name_prefix}-${var.environment}-private-ec2-sg-primary"
  description = "Security group for private EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  # Allow SSH from public EC2 instances (bastion hosts)
  ingress {
    description     = "SSH from public EC2 instances"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public_ec2_primary.id]
    cidr_blocks     = var.allowed_ssh_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-ec2-sg-primary"
  }
}

# Security Group for Private EC2 - Secondary
resource "aws_security_group" "private_ec2_secondary" {
  provider    = aws.secondary
  name        = "${var.name_prefix}-${var.environment}-private-ec2-sg-secondary"
  description = "Security group for private EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  # Allow SSH from public EC2 instances (bastion hosts)
  ingress {
    description     = "SSH from public EC2 instances"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public_ec2_secondary.id]
    cidr_blocks     = var.allowed_ssh_cidr
  }
  
  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-ec2-sg-secondary"
  }
}

# Security Group for Lambda - Primary
resource "aws_security_group" "lambda_primary" {
  provider    = aws.primary
  name        = "${var.name_prefix}-${var.environment}-lambda-sg-primary"
  description = "Security group for Lambda functions in primary region"
  vpc_id      = aws_vpc.primary.id

  # Allow Lambda functions to access HTTPS endpoints
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-lambda-sg-primary"
  }
}

# Security Group for Lambda - Secondary
resource "aws_security_group" "lambda_secondary" {
  provider    = aws.secondary
  name        = "${var.name_prefix}-${var.environment}-lambda-sg-secondary"
  description = "Security group for Lambda functions in secondary region"
  vpc_id      = aws_vpc.secondary.id

  # Allow Lambda functions to access HTTPS endpoints
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-lambda-sg-secondary"
  }
}

output "sg_lambda_primary_id" {
  value = aws_security_group.lambda_primary.id
}
output "sg_lambda_secondary_id" {
  value = aws_security_group.lambda_secondary.id
}

########################
# Bastion Host Security Groups (Primary and Secondary Regions)
########################

# Security Group for Bastion Host - Primary
resource "aws_security_group" "bastion_primary" {
  provider    = aws.primary
  name        = "${var.name_prefix}-${var.environment}-bastion-sg-primary"
  description = "Security group for bastion host in primary region"
  vpc_id      = aws_vpc.primary.id

  # Allow SSH access from specified CIDR blocks (update for production security)
  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-bastion-sg-primary"
    Role = "bastion"
    Environment = var.environment
    ManagedBy = "terraform"
    Project = "secure-env"
  }
}

# Security Group for Bastion Host - Secondary
resource "aws_security_group" "bastion_secondary" {
  provider    = aws.secondary
  name        = "${var.name_prefix}-${var.environment}-bastion-sg-secondary"
  description = "Security group for bastion host in secondary region"
  vpc_id      = aws_vpc.secondary.id

  # Allow SSH access from specified CIDR blocks (update for production security)
  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-${var.environment}-bastion-sg-secondary"
    Role = "bastion"
    Environment = var.environment
    ManagedBy = "terraform"
    Project = "secure-env"
  }
}