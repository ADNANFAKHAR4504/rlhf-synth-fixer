# Complete Terraform configuration for multi-region VPC deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider configuration for all three regions
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

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_regions" {
  description = "List of AWS regions to deploy to"
  type = map(object({
    name       = string
    vpc_cidr   = string
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
    Project   = "global-app"
    ManagedBy = "terraform"
    Owner     = "devops-team"
  }
}

# ===== US EAST 1 REGION RESOURCES =====

# Data source to get all available AZs in us-east-1
data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

# VPC for us-east-1
resource "aws_vpc" "us_east_1" {
  provider = aws.us_east_1

  cidr_block           = var.aws_regions["us-east-1"].vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
  })
}

# Internet Gateway for us-east-1
resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1

  vpc_id = aws_vpc.us_east_1.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-igw-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
  })
}

# Public Subnets for us-east-1 (one per AZ)
resource "aws_subnet" "us_east_1_public" {
  provider = aws.us_east_1
  count    = length(data.aws_availability_zones.us_east_1.names)

  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = cidrsubnet(var.aws_regions["us-east-1"].vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.us_east_1.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-subnet-${var.aws_regions["us-east-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "public"
    AZ          = data.aws_availability_zones.us_east_1.names[count.index]
  })
}

# Private Subnets for us-east-1 (one per AZ)
resource "aws_subnet" "us_east_1_private" {
  provider = aws.us_east_1
  count    = length(data.aws_availability_zones.us_east_1.names)

  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = cidrsubnet(var.aws_regions["us-east-1"].vpc_cidr, 8, count.index + length(data.aws_availability_zones.us_east_1.names))
  availability_zone = data.aws_availability_zones.us_east_1.names[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-subnet-${var.aws_regions["us-east-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "private"
    AZ          = data.aws_availability_zones.us_east_1.names[count.index]
  })
}

# Public Route Table for us-east-1
resource "aws_route_table" "us_east_1_public" {
  provider = aws.us_east_1

  vpc_id = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rt-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "public"
  })
}

# Private Route Table for us-east-1
resource "aws_route_table" "us_east_1_private" {
  provider = aws.us_east_1

  vpc_id = aws_vpc.us_east_1.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rt-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "private"
  })
}

# Public Route Table Associations for us-east-1
resource "aws_route_table_association" "us_east_1_public" {
  provider = aws.us_east_1
  count    = length(aws_subnet.us_east_1_public)

  subnet_id      = aws_subnet.us_east_1_public[count.index].id
  route_table_id = aws_route_table.us_east_1_public.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rta-${var.aws_regions["us-east-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "public"
    Association = "route-table"
  })
}

# Private Route Table Associations for us-east-1
resource "aws_route_table_association" "us_east_1_private" {
  provider = aws.us_east_1
  count    = length(aws_subnet.us_east_1_private)

  subnet_id      = aws_subnet.us_east_1_private[count.index].id
  route_table_id = aws_route_table.us_east_1_private.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rta-${var.aws_regions["us-east-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "private"
    Association = "route-table"
  })
}

# Public Security Group for us-east-1
resource "aws_security_group" "us_east_1_public" {
  provider = aws.us_east_1

  name        = "${var.environment}-public-sg-${var.aws_regions["us-east-1"].short_name}"
  description = "Security group for public resources"
  vpc_id      = aws_vpc.us_east_1.id

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
    Name        = "${var.environment}-public-sg-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "public"
  })
}

# Private Security Group for us-east-1
resource "aws_security_group" "us_east_1_private" {
  provider = aws.us_east_1

  name        = "${var.environment}-private-sg-${var.aws_regions["us-east-1"].short_name}"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.us_east_1.id

  # Inbound rules - Allow traffic from within VPC CIDR
  ingress {
    description = "All traffic from VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.aws_regions["us-east-1"].vpc_cidr]
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
    Name        = "${var.environment}-private-sg-${var.aws_regions["us-east-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["us-east-1"].name
    Type        = "private"
  })
}

# ===== EU CENTRAL 1 REGION RESOURCES =====

# Data source to get all available AZs in eu-central-1
data "aws_availability_zones" "eu_central_1" {
  provider = aws.eu_central_1
  state    = "available"
}

# VPC for eu-central-1
resource "aws_vpc" "eu_central_1" {
  provider = aws.eu_central_1

  cidr_block           = var.aws_regions["eu-central-1"].vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
  })
}

# Internet Gateway for eu-central-1
resource "aws_internet_gateway" "eu_central_1" {
  provider = aws.eu_central_1

  vpc_id = aws_vpc.eu_central_1.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-igw-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
  })
}

# Public Subnets for eu-central-1 (one per AZ)
resource "aws_subnet" "eu_central_1_public" {
  provider = aws.eu_central_1
  count    = length(data.aws_availability_zones.eu_central_1.names)

  vpc_id                  = aws_vpc.eu_central_1.id
  cidr_block              = cidrsubnet(var.aws_regions["eu-central-1"].vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.eu_central_1.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-subnet-${var.aws_regions["eu-central-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "public"
    AZ          = data.aws_availability_zones.eu_central_1.names[count.index]
  })
}

# Private Subnets for eu-central-1 (one per AZ)
resource "aws_subnet" "eu_central_1_private" {
  provider = aws.eu_central_1
  count    = length(data.aws_availability_zones.eu_central_1.names)

  vpc_id            = aws_vpc.eu_central_1.id
  cidr_block        = cidrsubnet(var.aws_regions["eu-central-1"].vpc_cidr, 8, count.index + length(data.aws_availability_zones.eu_central_1.names))
  availability_zone = data.aws_availability_zones.eu_central_1.names[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-subnet-${var.aws_regions["eu-central-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "private"
    AZ          = data.aws_availability_zones.eu_central_1.names[count.index]
  })
}

# Public Route Table for eu-central-1
resource "aws_route_table" "eu_central_1_public" {
  provider = aws.eu_central_1

  vpc_id = aws_vpc.eu_central_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eu_central_1.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rt-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "public"
  })
}

# Private Route Table for eu-central-1
resource "aws_route_table" "eu_central_1_private" {
  provider = aws.eu_central_1

  vpc_id = aws_vpc.eu_central_1.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rt-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "private"
  })
}

# Public Route Table Associations for eu-central-1
resource "aws_route_table_association" "eu_central_1_public" {
  provider = aws.eu_central_1
  count    = length(aws_subnet.eu_central_1_public)

  subnet_id      = aws_subnet.eu_central_1_public[count.index].id
  route_table_id = aws_route_table.eu_central_1_public.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rta-${var.aws_regions["eu-central-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "public"
    Association = "route-table"
  })
}

# Private Route Table Associations for eu-central-1
resource "aws_route_table_association" "eu_central_1_private" {
  provider = aws.eu_central_1
  count    = length(aws_subnet.eu_central_1_private)

  subnet_id      = aws_subnet.eu_central_1_private[count.index].id
  route_table_id = aws_route_table.eu_central_1_private.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rta-${var.aws_regions["eu-central-1"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "private"
    Association = "route-table"
  })
}

# Public Security Group for eu-central-1
resource "aws_security_group" "eu_central_1_public" {
  provider = aws.eu_central_1

  name        = "${var.environment}-public-sg-${var.aws_regions["eu-central-1"].short_name}"
  description = "Security group for public resources"
  vpc_id      = aws_vpc.eu_central_1.id

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
    Name        = "${var.environment}-public-sg-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "public"
  })
}

# Private Security Group for eu-central-1
resource "aws_security_group" "eu_central_1_private" {
  provider = aws.eu_central_1

  name        = "${var.environment}-private-sg-${var.aws_regions["eu-central-1"].short_name}"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.eu_central_1.id

  # Inbound rules - Allow traffic from within VPC CIDR
  ingress {
    description = "All traffic from VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.aws_regions["eu-central-1"].vpc_cidr]
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
    Name        = "${var.environment}-private-sg-${var.aws_regions["eu-central-1"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["eu-central-1"].name
    Type        = "private"
  })
}

# ===== AP SOUTHEAST 2 REGION RESOURCES =====

# Data source to get all available AZs in ap-southeast-2
data "aws_availability_zones" "ap_southeast_2" {
  provider = aws.ap_southeast_2
  state    = "available"
}

# VPC for ap-southeast-2
resource "aws_vpc" "ap_southeast_2" {
  provider = aws.ap_southeast_2

  cidr_block           = var.aws_regions["ap-southeast-2"].vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
  })
}

# Internet Gateway for ap-southeast-2
resource "aws_internet_gateway" "ap_southeast_2" {
  provider = aws.ap_southeast_2

  vpc_id = aws_vpc.ap_southeast_2.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-igw-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
  })
}

# Public Subnets for ap-southeast-2 (one per AZ)
resource "aws_subnet" "ap_southeast_2_public" {
  provider = aws.ap_southeast_2
  count    = length(data.aws_availability_zones.ap_southeast_2.names)

  vpc_id                  = aws_vpc.ap_southeast_2.id
  cidr_block              = cidrsubnet(var.aws_regions["ap-southeast-2"].vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.ap_southeast_2.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-subnet-${var.aws_regions["ap-southeast-2"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "public"
    AZ          = data.aws_availability_zones.ap_southeast_2.names[count.index]
  })
}

# Private Subnets for ap-southeast-2 (one per AZ)
resource "aws_subnet" "ap_southeast_2_private" {
  provider = aws.ap_southeast_2
  count    = length(data.aws_availability_zones.ap_southeast_2.names)

  vpc_id            = aws_vpc.ap_southeast_2.id
  cidr_block        = cidrsubnet(var.aws_regions["ap-southeast-2"].vpc_cidr, 8, count.index + length(data.aws_availability_zones.ap_southeast_2.names))
  availability_zone = data.aws_availability_zones.ap_southeast_2.names[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-subnet-${var.aws_regions["ap-southeast-2"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "private"
    AZ          = data.aws_availability_zones.ap_southeast_2.names[count.index]
  })
}

# Public Route Table for ap-southeast-2
resource "aws_route_table" "ap_southeast_2_public" {
  provider = aws.ap_southeast_2

  vpc_id = aws_vpc.ap_southeast_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ap_southeast_2.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rt-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "public"
  })
}

# Private Route Table for ap-southeast-2
resource "aws_route_table" "ap_southeast_2_private" {
  provider = aws.ap_southeast_2

  vpc_id = aws_vpc.ap_southeast_2.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rt-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "private"
  })
}

# Public Route Table Associations for ap-southeast-2
resource "aws_route_table_association" "ap_southeast_2_public" {
  provider = aws.ap_southeast_2
  count    = length(aws_subnet.ap_southeast_2_public)

  subnet_id      = aws_subnet.ap_southeast_2_public[count.index].id
  route_table_id = aws_route_table.ap_southeast_2_public.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rta-${var.aws_regions["ap-southeast-2"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "public"
    Association = "route-table"
  })
}

# Private Route Table Associations for ap-southeast-2
resource "aws_route_table_association" "ap_southeast_2_private" {
  provider = aws.ap_southeast_2
  count    = length(aws_subnet.ap_southeast_2_private)

  subnet_id      = aws_subnet.ap_southeast_2_private[count.index].id
  route_table_id = aws_route_table.ap_southeast_2_private.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rta-${var.aws_regions["ap-southeast-2"].short_name}-${count.index + 1}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "private"
    Association = "route-table"
  })
}

# Public Security Group for ap-southeast-2
resource "aws_security_group" "ap_southeast_2_public" {
  provider = aws.ap_southeast_2

  name        = "${var.environment}-public-sg-${var.aws_regions["ap-southeast-2"].short_name}"
  description = "Security group for public resources"
  vpc_id      = aws_vpc.ap_southeast_2.id

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
    Name        = "${var.environment}-public-sg-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "public"
  })
}

# Private Security Group for ap-southeast-2
resource "aws_security_group" "ap_southeast_2_private" {
  provider = aws.ap_southeast_2

  name        = "${var.environment}-private-sg-${var.aws_regions["ap-southeast-2"].short_name}"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.ap_southeast_2.id

  # Inbound rules - Allow traffic from within VPC CIDR
  ingress {
    description = "All traffic from VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.aws_regions["ap-southeast-2"].vpc_cidr]
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
    Name        = "${var.environment}-private-sg-${var.aws_regions["ap-southeast-2"].short_name}"
    Environment = var.environment
    Region      = var.aws_regions["ap-southeast-2"].name
    Type        = "private"
  })
}

# ===== OUTPUTS =====

output "us_east_1" {
  description = "US East 1 region outputs"
  value = {
    vpc_id                    = aws_vpc.us_east_1.id
    vpc_cidr_block            = aws_vpc.us_east_1.cidr_block
    public_subnet_ids         = aws_subnet.us_east_1_public[*].id
    private_subnet_ids        = aws_subnet.us_east_1_private[*].id
    public_security_group_id  = aws_security_group.us_east_1_public.id
    private_security_group_id = aws_security_group.us_east_1_private.id
    availability_zones        = data.aws_availability_zones.us_east_1.names
  }
}

output "eu_central_1" {
  description = "EU Central 1 region outputs"
  value = {
    vpc_id                    = aws_vpc.eu_central_1.id
    vpc_cidr_block            = aws_vpc.eu_central_1.cidr_block
    public_subnet_ids         = aws_subnet.eu_central_1_public[*].id
    private_subnet_ids        = aws_subnet.eu_central_1_private[*].id
    public_security_group_id  = aws_security_group.eu_central_1_public.id
    private_security_group_id = aws_security_group.eu_central_1_private.id
    availability_zones        = data.aws_availability_zones.eu_central_1.names
  }
}

output "ap_southeast_2" {
  description = "AP Southeast 2 region outputs"
  value = {
    vpc_id                    = aws_vpc.ap_southeast_2.id
    vpc_cidr_block            = aws_vpc.ap_southeast_2.cidr_block
    public_subnet_ids         = aws_subnet.ap_southeast_2_public[*].id
    private_subnet_ids        = aws_subnet.ap_southeast_2_private[*].id
    public_security_group_id  = aws_security_group.ap_southeast_2_public.id
    private_security_group_id = aws_security_group.ap_southeast_2_private.id
    availability_zones        = data.aws_availability_zones.ap_southeast_2.names
  }
}

output "summary" {
  description = "Summary of deployed infrastructure"
  value = {
    regions_deployed = keys(var.aws_regions)
    environment      = var.environment
    total_vpcs       = length(var.aws_regions)
  }
}
