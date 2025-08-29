# Quick Fixes for Your Terraform Deployment Issues

Don't panic! These are common issues and I've got quick fixes for all three. Let me walk you through each one:

## Fix #1: S3 Lifecycle Configuration

The warning is because AWS now requires either a `filter` or `prefix` in lifecycle rules. Here's the updated `modules/storage/main.tf`:

```hcl
# S3 Bucket Lifecycle Configuration - FIXED VERSION
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    # ADD THIS: Empty filter to apply to all objects
    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
```

**What changed:** Added `filter {}` - an empty filter applies the rule to all objects in the bucket. This satisfies the AWS requirement.

## Fix #2: EC2 Key Pair Strategy

Best practice is to create the key pair in Terraform but make it optional. Here's the updated `modules/compute/main.tf`:

```hcl
# Add this at the top of modules/compute/main.tf, after the data sources

# Create EC2 Key Pair if one isn't provided
resource "aws_key_pair" "main" {
  count = var.key_name == null ? 1 : 0
  
  key_name   = "${var.project_name}-key-pair"
  public_key = var.public_key

  tags = {
    Name = "${var.project_name}-key-pair"
  }
}

# Local value to determine which key to use
locals {
  key_name = var.key_name != null ? var.key_name : aws_key_pair.main[0].key_name
}

# Update the EC2 instances to use the local value
resource "aws_instance" "web" {
  count = 2

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = local.key_name  # CHANGED THIS LINE
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = var.public_subnet_ids[count.index]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # ... rest of the configuration stays the same
  monitoring = true

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
  }))

  tags = {
    Name = "${var.project_name}-web-${count.index + 1}"
    Type = "web-server"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

Update `modules/compute/variables.tf`:

```hcl
variable "key_name" {
  description = "EC2 Key Pair name (optional - will create one if not provided)"
  type        = string
  default     = null  # CHANGED FROM NO DEFAULT
}

# ADD THIS NEW VARIABLE
variable "public_key" {
  description = "Public key for EC2 key pair (required if key_name is not provided)"
  type        = string
  default     = null
}
```

Update your root `variables.tf`:

```hcl
variable "key_name" {
  description = "EC2 Key Pair name (optional - will create one if not provided)"
  type        = string
  default     = null  # CHANGED THIS
}

# ADD THIS NEW VARIABLE
variable "public_key" {
  description = "Public key for EC2 key pair (required if key_name is not provided)"
  type        = string
  default     = null
}
```

Update the compute module call in `main.tf`:

```hcl
# Compute Module
module "compute" {
  source = "./modules/compute"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  s3_bucket_arn      = module.storage.s3_bucket_arn
  instance_type      = var.instance_type
  key_name           = var.key_name
  public_key         = var.public_key  # ADD THIS LINE
}
```

## Fix #3: RDS Password Character Restrictions

Update `modules/database/main.tf` to fix the password generation:

```hcl
# Random password for RDS - FIXED VERSION
resource "random_password" "db_password" {
  length  = 16
  special = true
  
  # ADDED THESE LINES: Exclude problematic characters
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```

**What changed:** Added `override_special` to exclude `/`, `@`, `"`, and spaces while keeping other special characters for security.

## Quick Deployment Strategy

Create a `terraform.tfvars` file for quick deployment:

```hcl
# terraform.tfvars
aws_region   = "us-west-2"
project_name = "prod-project-166"
environment  = "production"
owner        = "devops-team"

# EC2 Configuration
instance_type = "t3.medium"
# Option 1: Use existing key pair
# key_name = "your-existing-key-pair-name"

# Option 2: Create new key pair (paste your public key here)
public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ... your-public-key-here"

# Database Configuration
db_instance_class = "db.t3.micro"
db_name          = "proddb"
db_username      = "admin"

# Monitoring
sns_email = "your-email@company.com"

# Features
enable_nat_gateway = true
enable_encryption  = true
```

## Deployment Commands

```bash
# Initialize (if you haven't already)
terraform init

# Plan to see what will be created
terraform plan -var-file="terraform.tfvars"

# Apply the changes
terraform apply -var-file="terraform.tfvars"
```

## If You Need to Generate SSH Keys Quickly

If you don't have an SSH key pair:

```bash
# Generate a new key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/prod-project-166 -N ""

# Get the public key to paste into terraform.tfvars
cat ~/.ssh/prod-project-166.pub
```

## Additional Output for Key Pair Info

Add this to your root `outputs.tf`:

```hcl
output "ssh_key_name" {
  description = "Name of the SSH key pair being used"
  value       = module.compute.key_name
}

output "ssh_connection_command" {
  description = "Example SSH connection command"
  value       = "ssh -i ~/.ssh/your-key ec2-user@${module.compute.public_ips[0]}"
}
```

And add these to `modules/compute/outputs.tf`:

```hcl
output "key_name" {
  description = "Name of the key pair being used"
  value       = local.key_name
}
```

## Pro Tips for Production

1. **State Backend**: Once this works, set up remote state storage:
```hcl
# In main.tf, uncomment and configure:
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "prod/terraform.tfstate"
  region = "us-west-2"
}
```

2. **Security**: After deployment, restrict SSH access in the security group:
```hcl
# In modules/compute/main.tf, change SSH ingress to:
ingress {
  description = "SSH"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["YOUR_OFFICE_IP/32"]  # Replace with your actual IP
}
```

3. **Monitoring**: The SNS subscription will send you a confirmation email - make sure to confirm it!

These fixes should get you deployed quickly. The key changes are:
- Added `filter {}` to S3 lifecycle rules
- Made key pair creation flexible and optional
- Fixed password character restrictions

Run `terraform plan` first to make sure everything looks good, then `terraform apply`. You should be up and running! 🚀