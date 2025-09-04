Yes, let's fix these errors one by one:

## Error 1: Key Pair doesn't exist
## Error 2: RDS Subnet Group spans multiple VPCs

Here are the fixes:

## Fix 1: Make Key Pair Optional or Create It

**Update `variables.tf`:**
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0abcdef1234567890"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for read-only access"
  type        = string
  default     = "my-production-bucket"
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
  default     = "example.com"
}

variable "create_route53_records" {
  description = "Whether to create Route 53 DNS records"
  type        = bool
  default     = false
}

variable "key_pair_name" {
  description = "EC2 Key Pair name (leave empty to create a new one)"
  type        = string
  default     = ""
}

variable "create_key_pair" {
  description = "Whether to create a new key pair"
  type        = bool
  default     = true
}

variable "public_key" {
  description = "Public key content for the key pair (required if create_key_pair is true)"
  type        = string
  default     = ""
}

# Common tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Department  = "IT"
  }
}
```

**Create a new file `key_pair.tf`:**
```hcl
# Generate a key pair if needed
resource "tls_private_key" "ec2_key" {
  count     = var.create_key_pair && var.public_key == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Create key pair
resource "aws_key_pair" "ec2_key_pair" {
  count      = var.create_key_pair ? 1 : 0
  key_name   = var.key_pair_name != "" ? var.key_pair_name : "terraform-generated-key"
  public_key = var.public_key != "" ? var.public_key : tls_private_key.ec2_key[0].public_key_openssh

  tags = merge(var.common_tags, {
    Name = "EC2 Key Pair"
  })
}

# Local value for key pair name
locals {
  key_pair_name = var.create_key_pair ? aws_key_pair.ec2_key_pair[0].key_name : var.key_pair_name
}
```

## Fix 2: Correct RDS Subnet Group and EC2 Configuration

**Update `subnets.tf`:**
```hcl
# VPC 1 Subnets
resource "aws_subnet" "vpc1_public" {
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc1-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc1_private" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet"
    Type = "Private"
  })
}

# Additional private subnet in VPC 1 for RDS (different AZ)
resource "aws_subnet" "vpc1_private_db" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = merge(var.common_tags, {
    Name = "vpc1-private-db-subnet"
    Type = "Private"
  })
}

# VPC 2 Subnets
resource "aws_subnet" "vpc2_public" {
  vpc_id                  = aws_vpc.vpc2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc2-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc2_private" {
  vpc_id            = aws_vpc.vpc2.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc2-private-subnet"
    Type = "Private"
  })
}

# RDS Subnet Group (only in VPC 1)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = [aws_subnet.vpc1_private.id, aws_subnet.vpc1_private_db.id]

  tags = merge(var.common_tags, {
    Name = "rds-subnet-group"
  })
}
```

**Update `route_tables.tf` to include the new subnet:**
```hcl
# VPC 1 Route Tables
resource "aws_route_table" "vpc1_public" {
  vpc_id = aws_vpc.vpc1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw1.id
  }

  route {
    cidr_block                = aws_vpc.vpc2.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-public-rt"
  })
}

resource "aws_route_table" "vpc1_private" {
  vpc_id = aws_vpc.vpc1.id

  route {
    cidr_block           = "0.0.0.0/0"
    nat_gateway_id       = aws_nat_gateway.vpc1_nat.id
  }

  route {
    cidr_block                = aws_vpc.vpc2.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-private-rt"
  })
}

# VPC 2 Route Tables
resource "aws_route_table" "vpc2_public" {
  vpc_id = aws_vpc.vpc2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw2.id
  }

  route {
    cidr_block                = aws_vpc.vpc1.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-public-rt"
  })
}

resource "aws_route_table" "vpc2_private" {
  vpc_id = aws_vpc.vpc2.id

  route {
    cidr_block           = "0.0.0.0/0"
    nat_gateway_id       = aws_nat_gateway.vpc2_nat.id
  }

  route {
    cidr_block                = aws_vpc.vpc1.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-private-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "vpc1_public" {
  subnet_id      = aws_subnet.vpc1_public.id
  route_table_id = aws_route_table.vpc1_public.id
}

resource "aws_route_table_association" "vpc1_private" {
  subnet_id      = aws_subnet.vpc1_private.id
  route_table_id = aws_route_table.vpc1_private.id
}

resource "aws_route_table_association" "vpc1_private_db" {
  subnet_id      = aws_subnet.vpc1_private_db.id
  route_table_id = aws_route_table.vpc1_private.id
}

resource "aws_route_table_association" "vpc2_public" {
  subnet_id      = aws_subnet.vpc2_public.id
  route_table_id = aws_route_table.vpc2_public.id
}

resource "aws_route_table_association" "vpc2_private" {
  subnet_id      = aws_subnet.vpc2_private.id
  route_table_id = aws_route_table.vpc2_private.id
}
```

**Update `ec2.tf` to use the local key pair name:**
```hcl
# Elastic IPs for EC2 instances
resource "aws_eip" "vpc1_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-eip"
  })
}

resource "aws_eip" "vpc2_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-eip"
  })
}

# EC2 Instance in VPC 1
resource "aws_instance" "vpc1_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc1_private.id
  vpc_security_group_ids = [aws_security_group.vpc1_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = local.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc1_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-instance"
  })
}

# EC2 Instance in VPC 2
resource "aws_instance" "vpc2_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc2_private.id
  vpc_security_group_ids = [aws_security_group.vpc2_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = local.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc2_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-instance"
  })
}

# Associate Elastic IPs with EC2 instances
resource "aws_eip_association" "vpc1_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc1_ec2.id
  allocation_id = aws_eip.vpc1_ec2_eip.id
}

resource "aws_eip_association" "vpc2_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc2_ec2.id
  allocation_id = aws_eip.vpc2_ec2_eip.id
}
```

**Update `providers.tf` to include the TLS provider:**
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

**Update `outputs.tf` to include key pair information:**
```hcl
output "vpc1_id" {
  description = "ID of VPC 1"
  value       = aws_vpc.vpc1.id
}

output "vpc2_id" {
  description = "ID of VPC 2"
  value       = aws_vpc.vpc2.id
}

output "vpc_peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.peer.id
}

output "vpc1_ec2_private_ip" {
  description = "Private IP of VPC 1 EC2 instance"
  value       = aws_instance.vpc1_ec2.private_ip
}

output "vpc2_ec2_private_ip" {
  description = "Private IP of VPC 2 EC2 instance"
  value       = aws_instance.vpc2_ec2.private_ip
}

output "vpc1_ec2_public_ip" {
  description = "Public IP of VPC 1 EC2 instance"
  value       = aws_eip.vpc1_ec2_eip.public_ip
}

output "vpc2_ec2_public_ip" {
  description = "Public IP of VPC 2 EC2 instance"
  value       = aws_eip.vpc2_ec2_eip.public_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "route53_records" {
  description = "Route 53 DNS records"
  value = var.create_route53_records ? {
    vpc1_app = aws_route53_record.vpc1_ec2[0].fqdn
    vpc2_app = aws_route53_record.vpc2_ec2[0].fqdn
  } : {}
}

output "key_pair_name" {
  description = "Name of the key pair used"
  value       = local.key_pair_name
}

output "private_key_pem" {
  description = "Private key in PEM format (only if generated)"
  value       = var.create_key_pair && var.public_key == "" ? tls_private_key.ec2_key[0].private_key_pem : "Not generated by Terraform"
  sensitive   = true
}
```

**Update `terraform.tfvars.example`:**
```hcl
# Copy this file to terraform.tfvars and update the values
aws_region              = "us-west-2"
ami_id                 = "ami-0abcdef1234567890"
instance_type          = "t3.micro"
s3_bucket_name         = "my-production-bucket"
route53_zone_name      = "example.com"
create_route53_records = false
create_key_pair        = true
key_pair_name          = ""  # Leave empty to auto-generate
public_key             = ""  # Leave empty to auto-generate, or paste your public key
```

## Deployment Steps:

1. **Initialize Terraform again** (due to new provider):
   ```bash
   terraform init
   ```

2. **Update your `terraform.tfvars`:**
   ```hcl
   aws_region              = "us-west-2"
   ami_id                 = "ami-0abcdef1234567890"
   instance_type          = "t3.micro"
   s3_bucket_name         = "my-production-bucket"
   route53_zone_name      = "example.com"
   create_route53_records = false
   create_key_pair        = true
   key_pair_name          = "terraform-generated-key"
   public_key             = ""
   ```

3. **Plan and apply:**
   ```bash
   terraform plan
   terraform apply
   ```

## Key Changes Made:

1. **Key Pair**: Added automatic key pair generation with TLS provider
2. **RDS Subnet Group**: Fixed to use only subnets from VPC 1 (added a third subnet for RDS)
3. **Made components optional**: Both Route 53 and key pair creation are now configurable

The private key will be available in the Terraform output (marked as sensitive). You can retrieve it with:
```bash
terraform output -raw private_key_pem > private_key.pem
chmod 600 private_key.pem
```

This should resolve all the errors you encountered!