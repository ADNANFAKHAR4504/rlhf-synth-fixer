To achieve the requirements outlined, we can create a Terraform configuration file (`main.tf`) that defines the necessary AWS resources. Below is a comprehensive solution that adheres to the specified requirements.

```hcl
provider "aws" {
  region = "us-west-2"
}

# Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name        = "production-vpc"
    Environment = "Production"
  }
}

# Create public subnet
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet"
    Environment = "Production"
  }
}

# Create private subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name        = "private-subnet"
    Environment = "Production"
  }
}

# Create an Internet Gateway and attach it to the VPC
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "production-igw"
    Environment = "Production"
  }
}

# Create a route table for the public subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "public-route-table"
    Environment = "Production"
  }
}

# Associate the public route table with the public subnet
resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Create an Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  vpc = true

  tags = {
    Name        = "nat-eip"
    Environment = "Production"
  }
}

# Create a NAT Gateway
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name        = "production-nat"
    Environment = "Production"
  }
}

# Create a route table for the private subnet
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name        = "private-route-table"
    Environment = "Production"
  }
}

# Associate the private route table with the private subnet
resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# Create a security group for the application servers
resource "aws_security_group" "app" {
  name_prefix = "app-sg"
  vpc_id       = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["<TRUSTED_IP_RANGE>"] # Replace with your trusted IP range
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "app-security-group"
    Environment = "Production"
  }
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_id" {
  value = aws_subnet.private.id
}
```

### Steps to Deploy:

1. **Install Terraform**: Ensure Terraform is installed on your local machine.
2. **Configure AWS CLI**: Make sure your AWS CLI is configured with the necessary access credentials.
3. **Initialize Terraform**:
   ```bash
   terraform init
   ```
4. **Plan the Deployment**:
   ```bash
   terraform plan
   ```
5. **Apply the Configuration**:
   ```bash
   terraform apply
   ```

This configuration will create a secure and scalable AWS environment in the `us-west-2` region, with proper tagging, networking, and security settings as specified. Ensure you replace `<TRUSTED_IP_RANGE>` with the actual trusted IP range for SSH access.