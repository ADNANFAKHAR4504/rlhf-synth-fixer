# Requirement 6: Data sources for VPC and existing infrastructure

# US-East-1 VPC data sources
data "aws_vpc" "east" {
  tags = {
    Environment = var.environment
    Region      = "us-east-1"
  }
}

data "aws_subnets" "public_east" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.east.id]
  }

  tags = {
    Type = "public"
  }
}

data "aws_subnets" "private_east" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.east.id]
  }

  tags = {
    Type = "private"
  }
}

data "aws_subnet" "public_east_details" {
  for_each = toset(data.aws_subnets.public_east.ids)
  id       = each.value
}

data "aws_subnet" "private_east_details" {
  for_each = toset(data.aws_subnets.private_east.ids)
  id       = each.value
}

# US-West-2 VPC data sources
data "aws_vpc" "west" {
  provider = aws.west

  tags = {
    Environment = var.environment
    Region      = "us-west-2"
  }
}

data "aws_subnets" "public_west" {
  provider = aws.west

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.west.id]
  }

  tags = {
    Type = "public"
  }
}

data "aws_subnets" "private_west" {
  provider = aws.west

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.west.id]
  }

  tags = {
    Type = "private"
  }
}

# Existing Application Load Balancers
data "aws_lb" "east" {
  tags = {
    Environment = var.environment
    Region      = "us-east-1"
  }
}

data "aws_lb" "west" {
  provider = aws.west

  tags = {
    Environment = var.environment
    Region      = "us-west-2"
  }
}

# Existing Auto Scaling Groups
data "aws_autoscaling_groups" "east" {
  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }

  filter {
    name   = "tag:Region"
    values = ["us-east-1"]
  }
}

data "aws_autoscaling_groups" "west" {
  provider = aws.west

  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }

  filter {
    name   = "tag:Region"
    values = ["us-west-2"]
  }
}

# Availability Zones
data "aws_availability_zones" "east" {
  state = "available"
}

data "aws_availability_zones" "west" {
  provider = aws.west
  state    = "available"
}

# Current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Latest Amazon Linux 2 AMI (used for all EC2 instances)
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}