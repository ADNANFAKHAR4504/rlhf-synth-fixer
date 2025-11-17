# Data source to get existing VPC
data "aws_vpc" "existing" {
  filter {
    name   = "cidr-block"
    values = [var.vpc_cidr]
  }
}

# Data source to get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source to get public subnets
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }
  
  tags = {
    Type = "public"
  }
}

# Data source to get private subnets
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }
  
  tags = {
    Type = "private"
  }
}

# Get individual subnet details
data "aws_subnet" "public" {
  count = length(data.aws_subnets.public.ids)
  id    = data.aws_subnets.public.ids[count.index]
}

data "aws_subnet" "private" {
  count = length(data.aws_subnets.private.ids)
  id    = data.aws_subnets.private.ids[count.index]
}