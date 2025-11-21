Overview
---
- Scope: foundational AWS environment using Terraform.
- Key requirements:
  - Amazon RDS MySQL with automated backups.
  - EC2 instance using Amazon Linux 2 in a public subnet.
  - Security group for EC2 allowing SSH from a configurable IP.
  - Variables for sensitive info and configuration.
  - Remote state stored in S3 (backend configured at runtime).
  - Resource names include a suffix for uniqueness.

Let's create the Terraform configuration files for this setup:

1. First, let's create the main Terraform configuration file (`main.tf`):

```hcl
provider "aws" {
  region = "us-west-2"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state-bucket-${var.resource_suffix}"
    key    = "terraform.tfstate"
    region = "us-west-2"
  }
}
```

2. Next, let's create the variables file (`variables.tf`):

```hcl
variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mydb"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Not recommended for production, should be restricted
}
```

3. Let's create the VPC and subnet configuration (`vpc.tf`):

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc-${var.resource_suffix}"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-west-2a"

  tags = {
    Name = "public-subnet-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-west-2b"

  tags = {
    Name = "private-subnet-${var.resource_suffix}"
  }
}

# For RDS, we need at least two subnets in different AZs
resource "aws_subnet" "private_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = "us-west-2c"

  tags = {
    Name = "private-subnet-2-${var.resource_suffix}"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw-${var.resource_suffix}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-rt-${var.resource_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

4. Now, let's create the EC2 instance and security group configuration (`ec2.tf`):

```hcl
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg-${var.resource_suffix}"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "ec2-sg-${var.resource_suffix}"
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.deployer.key_name

  tags = {
    Name = "web-instance-${var.resource_suffix}"
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = file("${path.module}/ssh/deployer.pub")
}
```

5. Let's create the RDS database configuration (`rds.tf`):

```hcl
resource "aws_db_subnet_group" "default" {
  name       = "main-${var.resource_suffix}"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name = "DB subnet group-${var.resource_suffix}"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-sg-${var.resource_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
    description     = "MySQL access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "rds-sg-${var.resource_suffix}"
  }
}

resource "aws_db_instance" "default" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  name                   = var.db_name
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  backup_retention_period = 7  # 7 days backup retention
  backup_window           = "03:00-04:00"  # UTC
  maintenance_window      = "Mon:04:00-Mon:05:00"  # UTC
  identifier              = "mysql-db-${var.resource_suffix}"
  
  tags = {
    Name = "mysql-db-${var.resource_suffix}"
  }
}
```

6. Let's create an S3 bucket for Terraform state (`s3.tf`):

```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-bucket-${var.resource_suffix}"

  tags = {
    Name = "Terraform State Bucket-${var.resource_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_encryption" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state_public_access" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

7. Finally, let's create an outputs file (`outputs.tf`):

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.default.endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}
```

Actually, we need to make a couple of corrections to make this work:

1. The S3 backend configuration can't use variables directly in the `terraform` block. We need to define it separately or use partial configuration that can be completed at runtime.

2. The S3 bucket for Terraform state should be created separately before applying the main configuration, as it's needed for the backend.

Let's adjust the Terraform configuration with these considerations in mind:

1. Updated `main.tf` with a partial backend configuration:

```hcl
provider "aws" {
  region = "us-west-2"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    region = "us-west-2"
    # The bucket name and key will be provided via CLI or a separate backend.tf file
  }
}
```

Now, let's put it all together with the necessary fixes and adjustments:

main.tf:
```hcl
provider "aws" {
  region = "us-west-2"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  # Backend configuration should be provided separately
  # The following is commented out as it should be configured after the S3 bucket is created
  # backend "s3" {
  #   bucket = "terraform-state-bucket-SUFFIX"
  #   key    = "terraform.tfstate"
  #   region = "us-west-2"
  # }
}
```

variables.tf:
```hcl
variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mydb"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Not recommended for production, should be restricted
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instance access"
  type        = string
}
```

vpc.tf:
```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc-${var.resource_suffix}"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-west-2a"

  tags = {
    Name = "public-subnet-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-west-2b"

  tags = {
    Name = "private-subnet-${var.resource_suffix}"
  }
}

# For RDS, we need at least two subnets in different AZs
resource "aws_subnet" "private_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = "us-west-2c"

  tags = {
    Name = "private-subnet-2-${var.resource_suffix}"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw-${var.resource_suffix}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-rt-${var.resource_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

ec2.tf:
```hcl
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg-${var.resource_suffix}"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "ec2-sg-${var.resource_suffix}"
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = var.ssh_public_key
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.deployer.key_name

  tags = {
    Name = "web-instance-${var.resource_suffix}"
  }
}
```

rds.tf:
```hcl
resource "aws_db_subnet_group" "default" {
  name       = "main-${var.resource_suffix}"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name = "DB subnet group-${var.resource_suffix}"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-sg-${var.resource_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
    description     = "MySQL access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "rds-sg-${var.resource_suffix}"
  }
}

resource "aws_db_instance" "default" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  backup_retention_period = 7  # 7 days backup retention
  backup_window           = "03:00-04:00"  # UTC
  maintenance_window      = "Mon:04:00-Mon:05:00"  # UTC
  identifier              = "mysql-db-${var.resource_suffix}"
  
  tags = {
    Name = "mysql-db-${var.resource_suffix}"
  }
}
```

s3.tf:
```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-bucket-${var.resource_suffix}"

  tags = {
    Name = "Terraform State Bucket-${var.resource_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_encryption" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state_public_access" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

outputs.tf:
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.default.endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}
```

## backend.tf.example

```hcl
# Copy this file to backend.tf and update the bucket name with your resource_suffix
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket-REPLACE_WITH_SUFFIX"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
  }
}
```

## terraform.tfvars.example

```hcl
resource_suffix = "dev"
db_username     = "admin"
db_password     = "YourSecurePassword123!"
db_name         = "application_db"
db_instance_class = "db.t3.micro"
ec2_instance_type = "t3.micro"
ssh_cidr_blocks  = ["192.168.1.0/24"] # Restrict to your IP or network
ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
```

## Deployment Instructions

1. Create a `terraform.tfvars` file from the example, filling in your specific values
2. Initialize Terraform:
   ```
   terraform init
   ```
3. Run a plan to see what will be created:
   ```
   terraform plan
   ```
4. Apply the configuration:
   ```
   terraform apply
   ```
5. After the S3 bucket is created, copy `backend.tf.example` to `backend.tf` and update with your suffix
6. Re-initialize Terraform to use the S3 backend:
   ```
   terraform init -force-copy
   ```

This configuration implements all requirements:
- RDS MySQL database in us-west-2 with automated backups
- EC2 instance using the latest Amazon Linux 2 AMI in a public subnet
- Security group allowing SSH from configurable IPs
- Terraform state stored in S3 with versioning
- Resource names with suffix variable for uniqueness
- Security best practices implemented throughout