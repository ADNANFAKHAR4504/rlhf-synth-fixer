This configuration will implement defense-in-depth security principles with strict network controls, least-privilege IAM access, and proper resource governance.

```terraform
# secure_env/variables.tf
variable "trusted_account_id" {
  description = "AWS Account ID that is allowed to assume the cross-account role"
  type        = string
  default     = "123456789012"  # Replace with actual trusted account ID
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access HTTP/HTTPS ports"
  type        = list(string)
  default = [
    "10.0.0.0/8",     # Private network range
    "172.16.0.0/12",  # Private network range
    "192.168.0.0/16"  # Private network range
  ]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for instance access"
  type        = string
  default     = "secure-env-key"  # Replace with your actual key pair name
}

# secure_env/locals.tf
locals {
  common_tags = {
    Environment = "Production"
    Owner      = "SecurityTeam"
    Project    = "SecureEnvironment"
    ManagedBy  = "Terraform"
  }
}

# secure_env/data.tf
# Get the default VPC
data "aws_vpc" "default" {
  default = true
}

# Get the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
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

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

# secure_env/security_groups.tf
# Security Group with restricted HTTP/HTTPS access
resource "aws_security_group" "secure_web_sg" {
  name_prefix = "secure-web-sg-"
  description = "Security group with restricted HTTP/HTTPS access"
  vpc_id      = data.aws_vpc.default.id

  # HTTP ingress rule - restricted to allowed CIDR blocks
  ingress {
    description = "HTTP access from allowed networks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # HTTPS ingress rule - restricted to allowed CIDR blocks
  ingress {
    description = "HTTPS access from allowed networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Outbound rules - allow all outbound traffic (can be further restricted based on requirements)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "secure-web-security-group"
    Type = "SecurityGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# secure_env/iam.tf
# IAM role for cross-account access with least privilege
resource "aws_iam_role" "cross_account_role" {
  name = "SecureCrossAccountRole"

  # Trust policy allowing the specified account to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.trusted_account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "secure-environment-access"
          }
          IpAddress = {
            "aws:SourceIp" = var.allowed_cidr_blocks
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cross-account-access-role"
    Type = "IAMRole"
  })
}

# Least privilege policy for the cross-account role
resource "aws_iam_policy" "cross_account_policy" {
  name        = "SecureCrossAccountPolicy"
  description = "Least privilege policy for cross-account access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyEC2Access"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = data.aws_region.current.name
          }
        }
      },
      {
        Sid    = "LimitedS3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::secure-environment-*",
          "arn:aws:s3:::secure-environment-*/*"
        ]
      },
      {
        Sid    = "CloudWatchLogsRead"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/secure-environment*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cross-account-access-policy"
    Type = "IAMPolicy"
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "cross_account_attachment" {
  role       = aws_iam_role.cross_account_role.name
  policy_arn = aws_iam_policy.cross_account_policy.arn
}

# IAM role for EC2 instance
resource "aws_iam_role" "ec2_role" {
  name = "SecureEC2Role"

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

  tags = merge(local.common_tags, {
    Name = "secure-ec2-role"
    Type = "IAMRole"
  })
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "SecureEC2Profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "secure-ec2-instance-profile"
    Type = "IAMInstanceProfile"
  })
}

# secure_env/ec2.tf
# Get the first available subnet in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# EC2 instance with security group attached
resource "aws_instance" "secure_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.secure_web_sg.id]
  subnet_id             = data.aws_subnets.default.ids[0]
  iam_instance_profile  = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring
  monitoring = true

  # EBS optimization
  ebs_optimized = true

  # Root block device configuration
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true

    tags = merge(local.common_tags, {
      Name = "secure-instance-root-volume"
      Type = "EBSVolume"
    })
  }

  # User data script for basic hardening
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent

    # Configure automatic security updates
    yum install -y yum-cron
    systemctl enable yum-cron
    systemctl start yum-cron

    # Basic security hardening
    echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
    sysctl -p

    # Install and configure fail2ban
    amazon-linux-extras install epel -y
    yum install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "secure-production-instance"
    Type = "EC2Instance"
  })

  # Prevent accidental termination
  disable_api_termination = true

  lifecycle {
    ignore_changes = [ami]
  }
}

# secure_env/outputs.tf
output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = aws_instance.secure_instance.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.secure_instance.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.secure_instance.private_ip
}

output "security_group_id" {
  description = "ID of the created security group"
  value       = aws_security_group.secure_web_sg.id
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account IAM role"
  value       = aws_iam_role.cross_account_role.arn
}

output "cross_account_role_external_id" {
  description = "External ID required for assuming the cross-account role"
  value       = "secure-environment-access"
  sensitive   = true
}

# secure_env/versions.tf
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
  region = "us-west-2"  # Change to your preferred region

  default_tags {
    tags = local.common_tags
  }
}
```

## 🔒 Security Features Implemented

### **Network Security**

- **Restrictive Security Group**: Only allows HTTP (80) and HTTPS (443) from specified CIDR blocks
- **No SSH Access**: SSH port (22) is intentionally excluded for enhanced security
- **Egress Control**: Configured to allow outbound traffic (can be further restricted)

### **IAM Security**

- **Cross-Account Role**: Implements secure cross-account access with external ID condition
- **IP Restriction**: Trust policy includes IP address conditions for additional security
- **Least Privilege**: Permissions limited to read-only EC2 operations and specific S3/CloudWatch access
- **Regional Restriction**: Policies include region-based conditions

### **Instance Security**

- **Encrypted Storage**: EBS root volume is encrypted
- **Instance Profile**: Dedicated IAM role for the EC2 instance
- **Termination Protection**: Prevents accidental instance termination
- **Security Hardening**: User data script includes basic OS hardening measures

### **Governance & Compliance**

- **Consistent Tagging**: All resources tagged with required Environment and Owner tags
- **Resource Naming**: Consistent naming convention across all resources
- **Monitoring**: CloudWatch detailed monitoring enabled

## 🚀 Deployment Instructions

1. **Prerequisites**:

   ```bash
   # Ensure you have Terraform 1.0+ installed
   terraform version

   # Configure AWS credentials
   aws configure
   ```

2. **Customize Variables**:
   - Update `trusted_account_id` with the actual AWS account ID
   - Modify `allowed_cidr_blocks` with your organization's IP ranges
   - Set `key_pair_name` to an existing EC2 key pair

3. **Deploy**:
   ```bash
   cd secure_env/
   terraform init
   terraform plan
   terraform apply
   ```

This configuration provides a robust, secure foundation that meets enterprise security standards while maintaining operational flexibility through proper IAM controls and network segmentation.
