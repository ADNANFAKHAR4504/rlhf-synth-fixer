### Reasoning Trace
---

I need to create a comprehensive Terraform configuration that meets all the requirements. Let me break this down:

1. **Provider**: AWS provider version >= 3.0, region us-east-1, default_tags with Environment = "Production"

2. **Networking**:
   - VPC with CIDR 10.0.0.0/16
   - Use first two AZs from data source
   - 2 public subnets (one per AZ) with map_public_ip_on_launch = true
   - 2 private subnets (one per AZ)
   - Internet Gateway for public subnets
   - 2 NAT Gateways (one per public subnet) with EIPs
   - Route tables for public/private subnets

3. **Compute**:
   - t2.micro EC2 instances in private subnets (one per AZ)
   - IAM instance profile attached

4. **S3 Logs**:
   - S3 bucket for logs
   - SSE-S3 with AES256
   - Block public access
   - Bucket policy requiring TLS

5. **IAM**:
   - IAM role for EC2 with trust policy for ec2.amazonaws.com
   - Policy allowing least-privilege access to logs bucket
   - Instance profile

6. **Security Groups**:
   - SSH port 22 restricted to 203.0.113.0/24
   - Allow necessary egress

7. **Monitoring**:
   - CloudWatch alarms for CPU > 70%
   - 5-minute period, 2+ evaluation periods

Let me structure this properly:

First, I need to think about the subnet CIDRs. With 10.0.0.0/16, I can use:
- Public subnet AZ1: 10.0.1.0/24
- Public subnet AZ2: 10.0.2.0/24


- Private subnet AZ1: 10.0.11.0/24
- Private subnet AZ2: 10.0.12.0/24

I'll split the configuration across two files as requested. The provider configuration will go in `provider.tf`, with the main infrastructure details in `tap_stack.tf`. This approach ensures clean, modular Terraform code that's easy to manage and understand.

The provider configuration specifies the AWS region as us-east-1 and sets a default production environment tag. I'll continue defining the VPC and subnet resources, using the availability zones data source to dynamically select appropriate zones for the subnets.

I'm creating two public subnets across different availability zones, each with a unique CIDR block and mapped to a specific zone. The subnets are configured to automatically assign public IP addresses and are tagged with sequential names. Similarly, I'll create two private subnets in different zones, using a separate CIDR block range to ensure network isolation.

The infrastructure design ensures high availability by distributing subnets across multiple availability zones, which helps improve fault tolerance and network resilience for the production environment.

For internet connectivity, I'll allocate two Elastic IPs and set up corresponding NAT Gateways in the public subnets. These NAT Gateways will enable private subnets to access the internet securely while remaining isolated. I'll create route tables for both public and private subnets, with the public route table directing traffic to the internet gateway and private route tables routing through the NAT gateways.

I'll associate the route tables with their respective subnets, ensuring proper network segmentation. For the application's security, I'll define a security group that controls inbound and outbound traffic to the EC2 instances, starting with SSH access configuration.

The infrastructure design prioritizes network isolation, controlled internet access, and secure communication between different network segments using AWS networking constructs.

I'll create an S3 bucket for centralized logging with server-side encryption, implementing best practices for secure log storage and preventing unauthorized access.

The configuration blocks public access completely and enforces secure transport protocols. A bucket policy is added to explicitly deny any non-HTTPS connections, ensuring all interactions with the log bucket occur over encrypted channels.

The policy uses a condition to block insecure transport, protecting sensitive log data from potential network-level interceptions.

An IAM role is created specifically for EC2 instances, granting minimal and precise access to the log S3 bucket. The role's assume role policy allows EC2 services to assume this role, while the inline policy provides granular permissions for listing and managing log objects.

The IAM policy follows the principle of least privilege, permitting only essential S3 actions like retrieving bucket location, listing bucket contents, and reading/writing log objects.

An IAM instance profile is generated to attach the role to EC2 instances, enabling seamless access to the specified S3 bucket. Two EC2 instances are provisioned across different private subnets, each assigned the custom IAM instance profile and configured with specific tags for identification.

The infrastructure leverages Amazon Linux AMI, selecting the most recent version to ensure up-to-date system configurations.

I'll filter the AMI to match specific naming conventions, targeting the latest Amazon Linux 2 HVM image with GP2 storage. CloudWatch alarms are established to monitor CPU utilization across these instances, triggering alerts when average CPU usage exceeds 70% for two consecutive evaluation periods.

The outputs provide critical infrastructure details, revealing the VPC identifier, public and private subnet IDs, logs bucket name, and specific EC2 instance identifiers. These outputs enable easy reference and integration with other infrastructure components.

I'm noting some key configuration updates required for AWS provider v3+, specifically around S3 bucket management and IAM role policies. These changes involve using separate resources for encryption configuration, public access controls, and inline policy definitions to maintain compliance with current provider standards.

My infrastructure checklist confirms comprehensive coverage: multi-AZ design, network segmentation, secure routing, compute instances with appropriate IAM permissions, and robust S3 logging infrastructure. The configuration ensures production-grade network isolation, with public and private subnets strategically distributed across availability zones and protected by network address translation and internet gateway configurations.

I'll validate the remaining security and monitoring requirements: precise IAM permissions for log storage, restricted SSH access, performance monitoring through CloudWatch, and meaningful infrastructure outputs to support operational visibility.
### Answer 
---

```hcl
# provider.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "Production"
    }
  }
}
```

```hcl
# tap_stack.tf

# Data sources for AZ selection and AMI
data "aws_availability_zones" "this" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "production-igw"
  }
}

# Public Subnets (one per AZ)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.this.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "production-public-subnet-${count.index + 1}"
  }
}

# Private Subnets (one per AZ)
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.this.names[count.index]

  tags = {
    Name = "production-private-subnet-${count.index + 1}"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = {
    Name = "production-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per public subnet)
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "production-nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "production-public-rt"
  }
}

# Route Tables for Private Subnets (one per AZ for NAT Gateway routing)
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "production-private-rt-${count.index + 1}"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Application Instances
resource "aws_security_group" "app" {
  name_prefix = "production-app-"
  vpc_id      = aws_vpc.main.id

  # SSH access restricted to specified CIDR
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-app-sg"
  }
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket_prefix = "production-logs-"

  tags = {
    Name = "production-logs-bucket"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy to Require TLS
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_logs" {
  name_prefix = "production-ec2-logs-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  # Inline policy for least-privilege S3 logs access
  inline_policy {
    name = "S3LogsAccess"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ]
          Resource = aws_s3_bucket.logs.arn
        },
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject"
          ]
          Resource = "${aws_s3_bucket.logs.arn}/*"
        }
      ]
    })
  }

  tags = {
    Name = "production-ec2-logs-role"
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_logs" {
  name_prefix = "production-ec2-logs-"
  role        = aws_iam_role.ec2_logs.name

  tags = {
    Name = "production-ec2-logs-profile"
  }
}

# EC2 Instances (one per private subnet/AZ)
resource "aws_instance" "app" {
  count = 2

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_logs.name

  tags = {
    Name = "production-app-${count.index + 1}"
  }
}

# CloudWatch Alarms for CPU Utilization
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = 2

  alarm_name          = "production-cpu-high-${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"  # 5 minutes
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors EC2 CPU utilization"

  dimensions = {
    InstanceId = aws_instance.app[count.index].id
  }

  tags = {
    Name = "production-cpu-alarm-${count.index + 1}"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.app[*].id
}
```