# Data sources for availability zones in spoke regions
data "aws_availability_zones" "us_west" {
  provider = aws.us_west
  state    = "available"
}

data "aws_availability_zones" "eu_west" {
  provider = aws.eu_west
  state    = "available"
}

# AP-Northeast-1 Spoke VPC (Tokyo)
module "us_west_spoke_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_west
  }

  vpc_name             = "ap-northeast-1-spoke-vpc"
  vpc_cidr             = var.spoke_vpc_cidrs["ap-northeast-1"]
  azs                  = slice(data.aws_availability_zones.us_west.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["ap-northeast-1"], 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["ap-northeast-1"], 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name   = "ap-northeast-1-spoke-vpc"
    Type   = "spoke"
    Region = "ap-northeast-1"
  })
}

# US-West-1 Spoke VPC (California)
module "eu_west_spoke_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.eu_west
  }

  vpc_name             = "ap-southeast-2-spoke-vpc"
  vpc_cidr             = var.spoke_vpc_cidrs["ap-southeast-2"]
  azs                  = slice(data.aws_availability_zones.eu_west.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["ap-southeast-2"], 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["ap-southeast-2"], 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name   = "ap-southeast-2-spoke-vpc"
    Type   = "spoke"
    Region = "ap-southeast-2"
  })
}