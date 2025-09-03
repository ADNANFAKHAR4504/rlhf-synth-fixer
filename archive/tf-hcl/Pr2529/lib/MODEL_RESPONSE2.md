The error occurs because the Route 53 hosted zone doesn't exist or the zone name in the variables doesn't match an existing hosted zone. Here are several ways to fix this issue:

## Option 1: Make Route 53 Optional (Recommended)

**Update `data.tf`:**
```hcl
# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get Route 53 hosted zone (optional)
data "aws_route53_zone" "main" {
  count        = var.create_route53_records ? 1 : 0
  name         = var.route53_zone_name
  private_zone = false
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
```

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
  description = "EC2 Key Pair name"
  type        = string
  default     = "my-key-pair"
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

**Update `route53.tf`:**
```hcl
# Route 53 DNS records for EC2 instances (optional)
resource "aws_route53_record" "vpc1_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "vpc1-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc1_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc1_ec2_eip_assoc]
}

resource "aws_route53_record" "vpc2_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "vpc2-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc2_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc2_ec2_eip_assoc]
}
```

**Update `outputs.tf`:**
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
```

**Update `terraform.tfvars.example`:**
```hcl
# Copy this file to terraform.tfvars and update the values
aws_region              = "us-west-2"
ami_id                 = "ami-0abcdef1234567890"
instance_type          = "t3.micro"
s3_bucket_name         = "my-production-bucket"
route53_zone_name      = "example.com"
create_route53_records = false  # Set to true if you have a hosted zone
key_pair_name          = "my-key-pair"
```

## Option 2: Create the Route 53 Hosted Zone

If you want to create the hosted zone as part of the Terraform deployment, add this to a new file:

**`route53_zone.tf`:**
```hcl
# Create Route 53 hosted zone if it doesn't exist
resource "aws_route53_zone" "main" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.route53_zone_name

  tags = merge(var.common_tags, {
    Name = "main-hosted-zone"
  })
}

# Use existing or created hosted zone
locals {
  hosted_zone_id = var.create_route53_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.main[0].zone_id
}
```

**Add to `variables.tf`:**
```hcl
variable "create_route53_zone" {
  description = "Whether to create a new Route 53 hosted zone"
  type        = bool
  default     = false
}
```

**Update `data.tf`:**
```hcl
# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get Route 53 hosted zone (only if not creating a new one)
data "aws_route53_zone" "main" {
  count        = var.create_route53_zone ? 0 : (var.create_route53_records ? 1 : 0)
  name         = var.route53_zone_name
  private_zone = false
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
```

**Update `route53.tf` to use local:**
```hcl
# Route 53 DNS records for EC2 instances
resource "aws_route53_record" "vpc1_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = local.hosted_zone_id
  name    = "vpc1-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc1_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc1_ec2_eip_assoc]
}

resource "aws_route53_record" "vpc2_ec2" {
  count   = var.create_route53_records ? 1 : 0
  zone_id = local.hosted_zone_id
  name    = "vpc2-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc2_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc2_ec2_eip_assoc]
}
```

## Option 3: Remove Route 53 Completely (Simplest)

If you don't need Route 53 for now, you can simply remove or comment out the Route 53 related resources:

**Remove or comment out these files:**
- The Route 53 data source in `data.tf`
- The entire `route53.tf` file
- Route 53 related outputs in `outputs.tf`

## Recommended Approach

I recommend **Option 1** as it makes the Route 53 functionality optional and allows you to deploy the infrastructure without requiring a pre-existing hosted zone. You can set `create_route53_records = true` in your `terraform.tfvars` file when you're ready to use Route 53.

**Your `terraform.tfvars` should look like:**
```hcl
aws_region              = "us-west-2"
ami_id                 = "ami-0abcdef1234567890"
instance_type          = "t3.micro"
s3_bucket_name         = "my-production-bucket"
route53_zone_name      = "example.com"
create_route53_records = false  # Set to true when you have a hosted zone
key_pair_name          = "my-key-pair"
```

This way, you can deploy the infrastructure immediately without the Route 53 dependency, and enable DNS records later when needed.