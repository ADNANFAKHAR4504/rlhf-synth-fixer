# providers.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_central_1"
  region = "eu-central-1"
}

provider "aws" {
  alias  = "ap_southeast_2"
  region = "ap-southeast-2"
}

# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_regions" {
  description = "List of AWS regions to deploy to"
  type = map(object({
    name      = string
    vpc_cidr  = string
    short_name = string
  }))
  default = {
    "us-east-1" = {
      name       = "us-east-1"
      vpc_cidr   = "10.0.0.0/16"
      short_name = "use1"
    }
    "eu-central-1" = {
      name       = "eu-central-1"
      vpc_cidr   = "10.1.0.0/16"
      short_name = "euc1"
    }
    "ap-southeast-2" = {
      name       = "ap-southeast-2"
      vpc_cidr   = "10.2.0.0/16"
      short_name = "apse2"
    }
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "global-app"
    ManagedBy   = "terraform"
    Owner       = "devops-team"
  }
}

# main.tf
module "vpc_us_east_1" {
  source = "./modules/vpc_setup"
  
  providers = {
    aws = aws.us_east_1
  }
  
  region      = var.aws_regions["us-east-1"].name
  vpc_cidr    = var.aws_regions["us-east-1"].vpc_cidr
  short_name  = var.aws_regions["us-east-1"].short_name
  environment = var.environment
  common_tags = var.common_tags
}

module "vpc_eu_central_1" {
  source = "./modules/vpc_setup"
  
  providers = {
    aws = aws.eu_central_1
  }
  
  region      = var.aws_regions["eu-central-1"].name
  vpc_cidr    = var.aws_regions["eu-central-1"].vpc_cidr
  short_name  = var.aws_regions["eu-central-1"].short_name
  environment = var.environment
  common_tags = var.common_tags
}

module "vpc_ap_southeast_2" {
  source = "./modules/vpc_setup"
  
  providers = {
    aws = aws.ap_southeast_2
  }
  
  region      = var.aws_regions["ap-southeast-2"].name
  vpc_cidr    = var.aws_regions["ap-southeast-2"].vpc_cidr
  short_name  = var.aws_regions["ap-southeast-2"].short_name
  environment = var.environment
  common_tags = var.common_tags
}

# modules/vpc_setup/variables.tf
variable "region" {
  description = "AWS region name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "short_name" {
  description = "Short name for the region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

# modules/vpc_setup/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data source to get all available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-${var.short_name}"
    Environment = var.environment
    Region      = var.region
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-igw-${var.short_name}"
    Environment = var.environment
    Region      = var.region
  })
}

# Public Subnets (one per AZ)
resource "aws_subnet" "public" {
  count = length(data.aws_availability_zones.available.names)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-subnet-${var.short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.region
    Type        = "public"
    AZ          = data.aws_availability_zones.available.names[count.index]
  })
}

# Private Subnets (one per AZ)
resource "aws_subnet" "private" {
  count = length(data.aws_availability_zones.available.names)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(data.aws_availability_zones.available.names))
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-subnet-${var.short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.region
    Type        = "private"
    AZ          = data.aws_availability_zones.available.names[count.index]
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rt-${var.short_name}"
    Environment = var.environment
    Region      = var.region
    Type        = "public"
  })
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rt-${var.short_name}"
    Environment = var.environment
    Region      = var.region
    Type        = "private"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Public Security Group
resource "aws_security_group" "public" {
  name        = "${var.environment}-public-sg-${var.short_name}"
  description = "Security group for public resources"
  vpc_id      = aws_vpc.main.id

  # Inbound rules - HTTP and HTTPS only
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound rules - Allow all
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-sg-${var.short_name}"
    Environment = var.environment
    Region      = var.region
    Type        = "public"
  })
}

# Private Security Group
resource "aws_security_group" "private" {
  name        = "${var.environment}-private-sg-${var.short_name}"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.main.id

  # Inbound rules - Allow traffic from within VPC CIDR
  ingress {
    description = "All traffic from VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  # Outbound rules - Allow all
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-sg-${var.short_name}"
    Environment = var.environment
    Region      = var.region
    Type        = "private"
  })
}

# modules/vpc_setup/outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

output "public_security_group_id" {
  description = "ID of the public security group"
  value       = aws_security_group.public.id
}

output "private_security_group_id" {
  description = "ID of the private security group"
  value       = aws_security_group.private.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# outputs.tf
output "us_east_1" {
  description = "US East 1 region outputs"
  value = {
    vpc_id                    = module.vpc_us_east_1.vpc_id
    vpc_cidr_block           = module.vpc_us_east_1.vpc_cidr_block
    public_subnet_ids        = module.vpc_us_east_1.public_subnet_ids
    private_subnet_ids       = module.vpc_us_east_1.private_subnet_ids
    public_security_group_id = module.vpc_us_east_1.public_security_group_id
    private_security_group_id = module.vpc_us_east_1.private_security_group_id
    availability_zones       = module.vpc_us_east_1.availability_zones
  }
}

output "eu_central_1" {
  description = "EU Central 1 region outputs"
  value = {
    vpc_id                    = module.vpc_eu_central_1.vpc_id
    vpc_cidr_block           = module.vpc_eu_central_1.vpc_cidr_block
    public_subnet_ids        = module.vpc_eu_central_1.public_subnet_ids
    private_subnet_ids       = module.vpc_eu_central_1.private_subnet_ids
    public_security_group_id = module.vpc_eu_central_1.public_security_group_id
    private_security_group_id = module.vpc_eu_central_1.private_security_group_id
    availability_zones       = module.vpc_eu_central_1.availability_zones
  }
}

output "ap_southeast_2" {
  description = "AP Southeast 2 region outputs"
  value = {
    vpc_id                    = module.vpc_ap_southeast_2.vpc_id
    vpc_cidr_block           = module.vpc_ap_southeast_2.vpc_cidr_block
    public_subnet_ids        = module.vpc_ap_southeast_2.public_subnet_ids
    private_subnet_ids       = module.vpc_ap_southeast_2.private_subnet_ids
    public_security_group_id = module.vpc_ap_southeast_2.public_security_group_id
    private_security_group_id = module.vpc_ap_southeast_2.private_security_group_id
    availability_zones       = module.vpc_ap_southeast_2.availability_zones
  }
}

output "summary" {
  description = "Summary of deployed infrastructure"
  value = {
    regions_deployed = keys(var.aws_regions)
    environment     = var.environment
    total_vpcs      = length(var.aws_regions)
  }
}