
terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "euw1"
  region = "eu-central-1"
}

provider "aws" {
  alias  = "apse2"
  region = "ap-southeast-2"
}
# Variables
variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "team" {
  description = "Team name"
  type        = string
  default     = "platform"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "bastion_allowed_cidrs" {
  description = "CIDRs allowed to SSH into bastion"
  type        = list(string)
  default     = []
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine" {
  description = "RDS engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "14"
}

variable "rds_backup_retention_days" {
  description = "RDS backup retention days"
  type        = number
  default     = 7
}

# Locals
locals {
  env = terraform.workspace != "default" ? terraform.workspace : var.environment
  
  regions = {
    use1  = "us-east-1"
    euw1  = "eu-central-1"
    apse2 = "ap-southeast-2"
  }
  
  region_suffixes = {
    use1  = "use1"
    euw1  = "euw1"
    apse2 = "apse2"
  }
  
  common_tags = {
    environment = local.env
    team        = var.team
    project     = var.project
    ManagedBy   = "terraform"
  }
  
  is_production = local.env == "production"
}

# Data sources for AMIs
data "aws_ssm_parameter" "al2_ami_use1" {
  name     = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
  provider = aws.use1
}

data "aws_ssm_parameter" "al2_ami_euw1" {
  name     = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
  provider = aws.euw1
}

data "aws_ssm_parameter" "al2_ami_apse2" {
  name     = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
  provider = aws.apse2
}

# Data sources for AZs
data "aws_availability_zones" "use1" {
  state    = "available"
  provider = aws.use1
}

data "aws_availability_zones" "euw1" {
  state    = "available"
  provider = aws.euw1
}

data "aws_availability_zones" "apse2" {
  state    = "available"
  provider = aws.apse2
}

# KMS Keys
resource "aws_kms_key" "main_use1" {
  description             = "KMS key for ${var.project} in us-east-1"
  deletion_window_in_days = 7
  provider                = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-kms-use1"
    Region = "us-east-1"
  })
}

resource "aws_kms_alias" "main_use1" {
  name          = "alias/${var.project}-${local.env}-use1"
  target_key_id = aws_kms_key.main_use1.key_id
  provider      = aws.use1
}

resource "aws_kms_key" "main_euw1" {
  description             = "KMS key for ${var.project} in eu-central-1"
  deletion_window_in_days = 7
  provider                = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-kms-euw1"
    Region = "eu-central-1"
  })
}

resource "aws_kms_alias" "main_euw1" {
  name          = "alias/${var.project}-${local.env}-euw1"
  target_key_id = aws_kms_key.main_euw1.key_id
  provider      = aws.euw1
}

resource "aws_kms_key" "main_apse2" {
  description             = "KMS key for ${var.project} in ap-southeast-2"
  deletion_window_in_days = 7
  provider                = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-kms-apse2"
    Region = "ap-southeast-2"
  })
}

resource "aws_kms_alias" "main_apse2" {
  name          = "alias/${var.project}-${local.env}-apse2"
  target_key_id = aws_kms_key.main_apse2.key_id
  provider      = aws.apse2
}

# VPCs
resource "aws_vpc" "main_use1" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  provider             = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-use1"
    Region = "us-east-1"
  })
}

resource "aws_vpc" "main_euw1" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  provider             = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-euw1"
    Region = "eu-central-1"
  })
}

resource "aws_vpc" "main_apse2" {
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  provider             = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-apse2"
    Region = "ap-southeast-2"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main_use1" {
  vpc_id   = aws_vpc.main_use1.id
  provider = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-igw-use1"
    Region = "us-east-1"
  })
}

resource "aws_internet_gateway" "main_euw1" {
  vpc_id   = aws_vpc.main_euw1.id
  provider = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-igw-euw1"
    Region = "eu-central-1"
  })
}

resource "aws_internet_gateway" "main_apse2" {
  vpc_id   = aws_vpc.main_apse2.id
  provider = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-igw-apse2"
    Region = "ap-southeast-2"
  })
}

# Public Subnets - US East 1
resource "aws_subnet" "public_use1_a" {
  vpc_id                  = aws_vpc.main_use1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.use1.names[0]
  map_public_ip_on_launch = true
  provider                = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-use1-a"
    Region = "us-east-1"
    Type   = "public"
  })
}

resource "aws_subnet" "public_use1_b" {
  vpc_id                  = aws_vpc.main_use1.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.use1.names[1]
  map_public_ip_on_launch = true
  provider                = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-use1-b"
    Region = "us-east-1"
    Type   = "public"
  })
}

# Private Subnets - US East 1
resource "aws_subnet" "private_use1_a" {
  vpc_id            = aws_vpc.main_use1.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.use1.names[0]
  provider          = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-use1-a"
    Region = "us-east-1"
    Type   = "private"
  })
}

resource "aws_subnet" "private_use1_b" {
  vpc_id            = aws_vpc.main_use1.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.use1.names[1]
  provider          = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-use1-b"
    Region = "us-east-1"
    Type   = "private"
  })
}

# Public Subnets - EU West 1
resource "aws_subnet" "public_euw1_a" {
  vpc_id                  = aws_vpc.main_euw1.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.euw1.names[0]
  map_public_ip_on_launch = true
  provider                = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-euw1-a"
    Region = "eu-central-1"
    Type   = "public"
  })
}

resource "aws_subnet" "public_euw1_b" {
  vpc_id                  = aws_vpc.main_euw1.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = data.aws_availability_zones.euw1.names[1]
  map_public_ip_on_launch = true
  provider                = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-euw1-b"
    Region = "eu-central-1"
    Type   = "public"
  })
}

# Private Subnets - EU West 1
resource "aws_subnet" "private_euw1_a" {
  vpc_id            = aws_vpc.main_euw1.id
  cidr_block        = "10.1.10.0/24"
  availability_zone = data.aws_availability_zones.euw1.names[0]
  provider          = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-euw1-a"
    Region = "eu-central-1"
    Type   = "private"
  })
}

resource "aws_subnet" "private_euw1_b" {
  vpc_id            = aws_vpc.main_euw1.id
  cidr_block        = "10.1.11.0/24"
  availability_zone = data.aws_availability_zones.euw1.names[1]
  provider          = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-euw1-b"
    Region = "eu-central-1"
    Type   = "private"
  })
}

# Public Subnets - AP Southeast 2
resource "aws_subnet" "public_apse2_a" {
  vpc_id                  = aws_vpc.main_apse2.id
  cidr_block              = "10.2.1.0/24"
  availability_zone       = data.aws_availability_zones.apse2.names[0]
  map_public_ip_on_launch = true
  provider                = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-apse2-a"
    Region = "ap-southeast-2"
    Type   = "public"
  })
}

resource "aws_subnet" "public_apse2_b" {
  vpc_id                  = aws_vpc.main_apse2.id
  cidr_block              = "10.2.2.0/24"
  availability_zone       = data.aws_availability_zones.apse2.names[1]
  map_public_ip_on_launch = true
  provider                = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-apse2-b"
    Region = "ap-southeast-2"
    Type   = "public"
  })
}

# Private Subnets - AP Southeast 2
resource "aws_subnet" "private_apse2_a" {
  vpc_id            = aws_vpc.main_apse2.id
  cidr_block        = "10.2.10.0/24"
  availability_zone = data.aws_availability_zones.apse2.names[0]
  provider          = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-apse2-a"
    Region = "ap-southeast-2"
    Type   = "private"
  })
}

resource "aws_subnet" "private_apse2_b" {
  vpc_id            = aws_vpc.main_apse2.id
  cidr_block        = "10.2.11.0/24"
  availability_zone = data.aws_availability_zones.apse2.names[1]
  provider          = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-apse2-b"
    Region = "ap-southeast-2"
    Type   = "private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_use1_a" {
  domain   = "vpc"
  provider = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-use1-a"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.main_use1]
}

resource "aws_eip" "nat_use1_b" {
  domain   = "vpc"
  provider = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-use1-b"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.main_use1]
}

resource "aws_eip" "nat_euw1_a" {
  domain   = "vpc"
  provider = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-euw1-a"
    Region = "eu-central-1"
  })
  
  depends_on = [aws_internet_gateway.main_euw1]
}

resource "aws_eip" "nat_euw1_b" {
  domain   = "vpc"
  provider = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-euw1-b"
    Region = "eu-central-1"
  })
  
  depends_on = [aws_internet_gateway.main_euw1]
}

resource "aws_eip" "nat_apse2_a" {
  domain   = "vpc"
  provider = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-apse2-a"
    Region = "ap-southeast-2"
  })
  
  depends_on = [aws_internet_gateway.main_apse2]
}

resource "aws_eip" "nat_apse2_b" {
  domain   = "vpc"
  provider = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-eip-apse2-b"
    Region = "ap-southeast-2"
  })
  
  depends_on = [aws_internet_gateway.main_apse2]
}

# NAT Gateways
resource "aws_nat_gateway" "main_use1_a" {
  allocation_id = aws_eip.nat_use1_a.id
  subnet_id     = aws_subnet.public_use1_a.id
  provider      = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-use1-a"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.main_use1]
}

resource "aws_nat_gateway" "main_use1_b" {
  allocation_id = aws_eip.nat_use1_b.id
  subnet_id     = aws_subnet.public_use1_b.id
  provider      = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-use1-b"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.main_use1]
}

resource "aws_nat_gateway" "main_euw1_a" {
  allocation_id = aws_eip.nat_euw1_a.id
  subnet_id     = aws_subnet.public_euw1_a.id
  provider      = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-euw1-a"
    Region = "eu-central-1"
  })
  
  depends_on = [aws_internet_gateway.main_euw1]
}

resource "aws_nat_gateway" "main_euw1_b" {
  allocation_id = aws_eip.nat_euw1_b.id
  subnet_id     = aws_subnet.public_euw1_b.id
  provider      = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-euw1-b"
    Region = "eu-central-1"
  })
  
  depends_on = [aws_internet_gateway.main_euw1]
}

resource "aws_nat_gateway" "main_apse2_a" {
  allocation_id = aws_eip.nat_apse2_a.id
  subnet_id     = aws_subnet.public_apse2_a.id
  provider      = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-apse2-a"
    Region = "ap-southeast-2"
  })
  
  depends_on = [aws_internet_gateway.main_apse2]
}

resource "aws_nat_gateway" "main_apse2_b" {
  allocation_id = aws_eip.nat_apse2_b.id
  subnet_id     = aws_subnet.public_apse2_b.id
  provider      = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-nat-apse2-b"
    Region = "ap-southeast-2"
  })
  
  depends_on = [aws_internet_gateway.main_apse2]
}

# Route Tables - Public
resource "aws_route_table" "public_use1" {
  vpc_id   = aws_vpc.main_use1.id
  provider = aws.use1
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_use1.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-rt-use1"
    Region = "us-east-1"
    Type   = "public"
  })
}

resource "aws_route_table" "public_euw1" {
  vpc_id   = aws_vpc.main_euw1.id
  provider = aws.euw1
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_euw1.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-rt-euw1"
    Region = "eu-central-1"
    Type   = "public"
  })
}

resource "aws_route_table" "public_apse2" {
  vpc_id   = aws_vpc.main_apse2.id
  provider = aws.apse2
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_apse2.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-public-rt-apse2"
    Region = "ap-southeast-2"
    Type   = "public"
  })
}

# Route Tables - Private
resource "aws_route_table" "private_use1_a" {
  vpc_id   = aws_vpc.main_use1.id
  provider = aws.use1
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_use1_a.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-use1-a"
    Region = "us-east-1"
    Type   = "private"
  })
}

resource "aws_route_table" "private_use1_b" {
  vpc_id   = aws_vpc.main_use1.id
  provider = aws.use1
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_use1_b.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-use1-b"
    Region = "us-east-1"
    Type   = "private"
  })
}

resource "aws_route_table" "private_euw1_a" {
  vpc_id   = aws_vpc.main_euw1.id
  provider = aws.euw1
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_euw1_a.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-euw1-a"
    Region = "eu-central-1"
    Type   = "private"
  })
}

resource "aws_route_table" "private_euw1_b" {
  vpc_id   = aws_vpc.main_euw1.id
  provider = aws.euw1
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_euw1_b.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-euw1-b"
    Region = "eu-central-1"
    Type   = "private"
  })
}

resource "aws_route_table" "private_apse2_a" {
  vpc_id   = aws_vpc.main_apse2.id
  provider = aws.apse2
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_apse2_a.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-apse2-a"
    Region = "ap-southeast-2"
    Type   = "private"
  })
}

resource "aws_route_table" "private_apse2_b" {
  vpc_id   = aws_vpc.main_apse2.id
  provider = aws.apse2
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_apse2_b.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-private-rt-apse2-b"
    Region = "ap-southeast-2"
    Type   = "private"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public_use1_a" {
  subnet_id      = aws_subnet.public_use1_a.id
  route_table_id = aws_route_table.public_use1.id
  provider       = aws.use1
}

resource "aws_route_table_association" "public_use1_b" {
  subnet_id      = aws_subnet.public_use1_b.id
  route_table_id = aws_route_table.public_use1.id
  provider       = aws.use1
}

resource "aws_route_table_association" "public_euw1_a" {
  subnet_id      = aws_subnet.public_euw1_a.id
  route_table_id = aws_route_table.public_euw1.id
  provider       = aws.euw1
}

resource "aws_route_table_association" "public_euw1_b" {
  subnet_id      = aws_subnet.public_euw1_b.id
  route_table_id = aws_route_table.public_euw1.id
  provider       = aws.euw1
}

resource "aws_route_table_association" "public_apse2_a" {
  subnet_id      = aws_subnet.public_apse2_a.id
  route_table_id = aws_route_table.public_apse2.id
  provider       = aws.apse2
}

resource "aws_route_table_association" "public_apse2_b" {
  subnet_id      = aws_subnet.public_apse2_b.id
  route_table_id = aws_route_table.public_apse2.id
  provider       = aws.apse2
}

# Route Table Associations - Private
resource "aws_route_table_association" "private_use1_a" {
  subnet_id      = aws_subnet.private_use1_a.id
  route_table_id = aws_route_table.private_use1_a.id
  provider       = aws.use1
}

resource "aws_route_table_association" "private_use1_b" {
  subnet_id      = aws_subnet.private_use1_b.id
  route_table_id = aws_route_table.private_use1_b.id
  provider       = aws.use1
}

resource "aws_route_table_association" "private_euw1_a" {
  subnet_id      = aws_subnet.private_euw1_a.id
  route_table_id = aws_route_table.private_euw1_a.id
  provider       = aws.euw1
}

resource "aws_route_table_association" "private_euw1_b" {
  subnet_id      = aws_subnet.private_euw1_b.id
  route_table_id = aws_route_table.private_euw1_b.id
  provider       = aws.euw1
}

resource "aws_route_table_association" "private_apse2_a" {
  subnet_id      = aws_subnet.private_apse2_a.id
  route_table_id = aws_route_table.private_apse2_a.id
  provider       = aws.apse2
}

resource "aws_route_table_association" "private_apse2_b" {
  subnet_id      = aws_subnet.private_apse2_b.id
  route_table_id = aws_route_table.private_apse2_b.id
  provider       = aws.apse2
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_use1" {
  name              = "/aws/vpc/flowlogs/${var.project}-${local.env}-use1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_use1.arn
  provider          = aws.use1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-flow-logs-use1"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_euw1" {
  name              = "/aws/vpc/flowlogs/${var.project}-${local.env}-euw1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_euw1.arn
  provider          = aws.euw1
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-flow-logs-euw1"
    Region = "eu-central-1"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_apse2" {
  name              = "/aws/vpc/flowlogs/${var.project}-${local.env}-apse2"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_apse2.arn
  provider          = aws.apse2
  
  tags = merge(local.common_tags, {
    Name   = "${var.project}-${local.env}-vpc-flow-logs-apse2"
    Region = "ap-southeast-2"
  })
}