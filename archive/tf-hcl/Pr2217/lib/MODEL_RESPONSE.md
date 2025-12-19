Here's a Terraform configuration (`tap_stack.tf`) to set up a secure AWS environment according to your requirements:

```hcl
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "secure-vpc"
  }
}

# Create a private subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private-subnet"
  }
}

# Create an S3 bucket with encryption and no public access
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-bucket-name"
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  versioning {
    enabled = true
  }

  public_access_block_configuration {
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }

  tags = {
    Name = "secure-s3-bucket"
  }
}

# Create an IAM role for EC2 with minimal permissions
resource "aws_iam_role" "ec2_role" {
  name = "ec2-role"

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
}

# Attach a policy to the IAM role to allow S3 read-only access
resource "aws_iam_policy" "s3_read_only" {
  name        = "s3-read-only"
  description = "Allows read-only access to specific S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject"
        ]
        Effect   = "Allow"
        Resource = aws_s3_bucket.secure_bucket.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_read_only" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Create a security group with strict rules
resource "aws_security_group" "ec2_sg" {
  name_prefix = "ec2-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # Allow SSH from within VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # Allow all outbound traffic
  }

  tags = {
    Name = "ec2-security-group"
  }
}

# Create an EC2 instance in the private subnet
resource "aws_instance" "secure_instance" {
  ami           = "ami-0c55b159cbfafe1f0"  # Example AMI ID for Amazon Linux 2
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private.id
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  tags = {
    Name = "secure-ec2-instance"
  }
}

# Create an IAM instance profile to attach the role to the EC2 instance
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}
```

This Terraform script does the following:

1. Sets up a VPC with a CIDR block of `10.0.0.0/16`.
2. Creates a private subnet within the VPC.
3. Configures an S3 bucket with encryption enabled and blocks all public access.
4. Creates an IAM role for the EC2 instance with minimal permissions, specifically allowing read-only access to the S3 bucket.
5. Sets up a security group with strict inbound and outbound rules, allowing SSH access only from within the VPC.
6. Launches an EC2 instance in the private subnet with the created IAM role and security group attached.

Make sure to replace the placeholder values (like the AMI ID) with actual values that fit your needs. Save this as `tap_stack.tf` and run `terraform init`, `terraform plan`, and `terraform apply` to deploy the infrastructure.