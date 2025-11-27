resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name              = "eks-vpc-${local.environment_suffix}"
    EnvironmentSuffix = local.environment_suffix
  }
}

resource "aws_subnet" "private" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags = {
    Name              = "eks-private-subnet-${count.index}-${local.environment_suffix}"
    Type              = "private"
    EnvironmentSuffix = local.environment_suffix
  }
}