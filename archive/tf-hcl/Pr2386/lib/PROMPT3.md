Based on prompt following is incomplete code ,so complete this code as for requirement.

# lib/tap_stack.tf

# Random suffixes for unique naming

resource "random_id" "staging_suffix" {
byte_length = 4
}

resource "random_id" "production_suffix" {
byte_length = 4
}

# Local values for environment configurations

locals {
environments = {
staging = {
name = "staging"
instance_type = "t3.micro"
min_size = 1
max_size = 2
desired_size = 1
cost_center = "development"
owner = "dev-team"
}
production = {
name = "production"
instance_type = "t3.medium"
min_size = 2
max_size = 10
desired_size = 2
cost_center = "operations"
owner = "ops-team"
}
}

common_tags = {
Project = "IaC - AWS Nova Model Breaking"
ManagedBy = "Terraform"
}
}

# Data sources

data "aws_availability_zones" "available" {
state = "available"
}

data "aws_ami" "amazon_linux" {
most_recent = true
owners = ["amazon"]

filter {
name = "name"
values = ["amzn2-ami-hvm-*-x86_64-gp2"]
}
}

# VPC for Staging

resource "aws_vpc" "staging" {
cidr_block = "10.0.0.0/16"
enable_dns_hostnames = true
enable_dns_support = true

tags = merge(local.common_tags, {
Name = "myapp-staging-vpc-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

# VPC for Production

resource "aws_vpc" "production" {
cidr_block = "10.1.0.0/16"
enable_dns_hostnames = true
enable_dns_support = true

tags = merge(local.common_tags, {
Name = "myapp-production-vpc-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Internet Gateways

resource "aws_internet_gateway" "staging" {
vpc_id = aws_vpc.staging.id

tags = merge(local.common_tags, {
Name = "myapp-staging-igw-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_internet_gateway" "production" {
vpc_id = aws_vpc.production.id

tags = merge(local.common_tags, {
Name = "myapp-production-igw-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Public Subnets for Staging

resource "aws_subnet" "staging_public" {
count = 2
vpc_id = aws_vpc.staging.id
cidr_block = "10.0.${count.index + 1}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "myapp-staging-public-subnet-${count.index + 1}-${random_id.staging_suffix.hex}"
Environment = "staging"
Type = "public"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

# Public Subnets for Production

resource "aws_subnet" "production_public" {
count = 2
vpc_id = aws_vpc.production.id
cidr_block = "10.1.${count.index + 1}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "myapp-production-public-subnet-${count.index + 1}-${random_id.production_suffix.hex}"
Environment = "production"
Type = "public"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Private Subnets for Staging

resource "aws_subnet" "staging_private" {
count = 2
vpc_id = aws_vpc.staging.id
cidr_block = "10.0.${count.index + 10}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]

tags = merge(local.common_tags, {
Name = "myapp-staging-private-subnet-${count.index + 1}-${random_id.staging_suffix.hex}"
Environment = "staging"
Type = "private"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

# Private Subnets for Production

resource "aws_subnet" "production_private" {
count = 2
vpc_id = aws_vpc.production.id
cidr_block = "10.1.${count.index + 10}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]

tags = merge(local.common_tags, {
Name = "myapp-production-private-subnet-${count.index + 1}-${random_id.production_suffix.hex}"
Environment = "production"
Type = "private"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# NAT Gateways for private subnet internet access

resource "aws_eip" "staging_nat" {
count = 2
domain = "vpc"

tags = merge(local.common_tags, {
Name = "myapp-staging-nat-eip-${count.index + 1}-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})

depends_on = [aws_internet_gateway.staging]
}

resource "aws_eip" "production_nat" {
count = 2
domain = "vpc"

tags = merge(local.common_tags, {
Name = "myapp-production-nat-eip-${count.index + 1}-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})

depends_on = [aws_internet_gateway.production]
}

resource "aws_nat_gateway" "staging" {
count = 2
allocation_id = aws_eip.staging_nat[count.index].id
subnet_id = aws_subnet.staging_public[count.index].id

tags = merge(local.common_tags, {
Name = "myapp-staging-nat-${count.index + 1}-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})

depends_on = [aws_internet_gateway.staging]
}

resource "aws_nat_gateway" "production" {
count = 2
allocation_id = aws_eip.production_nat[count.index].id
subnet_id = aws_subnet.production_public[count.index].id

tags = merge(local.common_tags, {
Name = "myapp-production-nat-${count.index + 1}-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})

depends_on = [aws_internet_gateway.production]
}

# Route Tables for Staging

resource "aws_route_table" "staging_public" {
vpc_id = aws_vpc.staging.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.staging.id
}

tags = merge(local.common_tags, {
Name = "myapp-staging-public-rt-${random_id.staging_suffix.hex}"
Environment = "staging"
Type = "public"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_route_table" "staging_private" {
count = 2
vpc_id = aws_vpc.staging.id

route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.staging[count.index].id
}

tags = merge(local.common_tags, {
Name = "myapp-staging-private-rt-${count.index + 1}-${random_id.staging_suffix.hex}"
Environment = "staging"
Type = "private"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

# Route Tables for Production

resource "aws_route_table" "production_public" {
vpc_id = aws_vpc.production.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.production.id
}

tags = merge(local.common_tags, {
Name = "myapp-production-public-rt-${random_id.production_suffix.hex}"
Environment = "production"
Type = "public"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

resource "aws_route_table" "production_private" {
count = 2
vpc_id = aws_vpc.production.id

route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.production[count.index].id
}

tags = merge(local.common_tags, {
Name = "myapp-production-private-rt-${count.index + 1}-${random_id.production_suffix.hex}"
Environment = "production"
Type = "private"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Route Table Associations for Staging

resource "aws_route_table_association" "staging_public" {
count = 2
subnet_id = aws_subnet.staging_public[count.index].id
route_table_id = aws_route_table.staging_public.id
}

resource "aws_route_table_association" "staging_private" {
count = 2
subnet_id = aws_subnet.staging_private[count.index].id
route_table_id = aws_route_table.staging_private[count.index].id
}

# Route Table Associations for Production

resource "aws_route_table_association" "production_public" {
count = 2
subnet_id = aws_subnet.production_public[count.index].id
route_table_id = aws_route_table.production_public.id
}

resource "aws_route_table_association" "production_private" {
count = 2
subnet_id = aws_subnet.production_private[count.index].id
route_table_id = aws_route_table.production_private[count.index].id
}

# Security Groups for HTTPS-only access

resource "aws_security_group" "staging_web" {
name_prefix = "myapp-staging-web-"
vpc_id = aws_vpc.staging.id
description = "Security group for staging web servers - HTTPS only"

ingress {
description = "HTTPS"
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "myapp-staging-web-sg-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_security_group" "production_web" {
name_prefix = "myapp-production-web-"
vpc_id = aws_vpc.production.id
description = "Security group for production web servers - HTTPS only"

ingress {
description = "HTTPS"
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "myapp-production-web-sg-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# S3 Buckets with versioning and encryption

resource "aws_s3_bucket" "staging" {
bucket = "myapp-staging-${random_id.staging_suffix.hex}"

tags = merge(local.common_tags, {
Name = "myapp-staging-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_s3_bucket" "production" {
bucket = "myapp-production-${random_id.production_suffix.hex}"

tags = merge(local.common_tags, {
Name = "myapp-production-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# S3 Bucket Versioning

resource "aws_s3_bucket_versioning" "staging" {
bucket = aws_s3_bucket.staging.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_versioning" "production" {
bucket = aws_s3_bucket.production.id
versioning_configuration {
status = "Enabled"
}
}

# S3 Bucket Server-side Encryption

resource "aws_s3_bucket_server_side_encryption_configuration" "staging" {
bucket = aws_s3_bucket.staging.id

rule {
apply_server_side_encryption_by_default {
sse_algorithm = "AES256"
}
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "production" {
bucket = aws_s3_bucket.production.id

rule {
apply_server_side_encryption_by_default {
sse_algorithm = "AES256"
}
}
}

# S3 Bucket Public Access Block

resource "aws_s3_bucket_public_access_block" "staging" {
bucket = aws_s3_bucket.staging.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "production" {
bucket = aws_s3_bucket.production.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

# S3 Bucket Policies for CloudTrail

resource "aws_s3_bucket_policy" "staging_cloudtrail" {
bucket = aws_s3_bucket.staging.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "AWSCloudTrailAclCheck"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.staging.arn
},
{
Sid = "AWSCloudTrailWrite"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.staging.arn}/*"
Condition = {
StringEquals = {
"s3:x-amz-acl" = "bucket-owner-full-control"
}
}
}
]
})
}

resource "aws_s3_bucket_policy" "production_cloudtrail" {
bucket = aws_s3_bucket.production.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "AWSCloudTrailAclCheck"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.production.arn
},
{
Sid = "AWSCloudTrailWrite"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.production.arn}/*"
Condition = {
StringEquals = {
"s3:x-amz-acl" = "bucket-owner-full-control"
}
}
}
]
})
}

# IAM Roles for EC2 instances

resource "aws_iam_role" "staging_ec2_role" {
name = "myapp-staging-ec2-role-${random_id.staging_suffix.hex}"

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
Name = "myapp-staging-ec2-role-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_iam_role" "production_ec2_role" {
name = "myapp-production-ec2-role-${random_id.production_suffix.hex}"

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
Name = "myapp-production-ec2-role-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# IAM Policies for S3 access

resource "aws_iam_role_policy" "staging_s3_policy" {
name = "myapp-staging-s3-policy-${random_id.staging_suffix.hex}"
role = aws_iam_role.staging_ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"s3:GetObject",
"s3:PutObject",
"s3:DeleteObject"
]
Resource = "${aws_s3_bucket.staging.arn}/\*"
},
{
Effect = "Allow"
Action = [
"s3:ListBucket"
]
Resource = aws_s3_bucket.staging.arn
}
]
})
}

resource "aws_iam_role_policy" "production_s3_policy" {
name = "myapp-production-s3-policy-${random_id.production_suffix.hex}"
role = aws_iam_role.production_ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"s3:GetObject",
"s3:PutObject",
"s3:DeleteObject"
]
Resource = "${aws_s3_bucket.production.arn}/\*"
},
{
Effect = "Allow"
Action = [
"s3:ListBucket"
]
Resource = aws_s3_bucket.production.arn
}
]
})
}

# IAM Policies for CloudWatch Logs

resource "aws_iam_role_policy" "staging_cloudwatch_policy" {
name = "myapp-staging-cloudwatch-policy-${random_id.staging_suffix.hex}"
role = aws_iam_role.staging_ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"logs:CreateLogGroup",
"logs:CreateLogStream",
"logs:PutLogEvents",
"logs:DescribeLogStreams"
]
Resource = "${aws_cloudwatch_log_group.staging.arn}:\*"
}
]
})
}

resource "aws_iam_role_policy" "production_cloudwatch_policy" {
name = "myapp-production-cloudwatch-policy-${random_id.production_suffix.hex}"
role = aws_iam_role.production_ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"logs:CreateLogGroup",
"logs:CreateLogStream",
"logs:PutLogEvents",
"logs:DescribeLogStreams"
]
Resource = "${aws_cloudwatch_log_group.production.arn}:\*"
}
]
})
}

# IAM Instance Profiles

resource "aws_iam_instance_profile" "staging" {
name = "myapp-staging-instance-profile-${random_id.staging_suffix.hex}"
role = aws_iam_role.staging_ec2_role.name

tags = merge(local.common_tags, {
Name = "myapp-staging-instance-profile-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_iam_instance_profile" "production" {
name = "myapp-production-instance-profile-${random_id.production_suffix.hex}"
role = aws_iam_role.production_ec2_role.name

tags = merge(local.common_tags, {
Name = "myapp-production-instance-profile-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Application Load Balancers

resource "aws_lb" "staging" {
name = "myapp-staging-alb-${random_id.staging_suffix.hex}"
internal = false
load_balancer_type = "application"
security_groups = [aws_security_group.staging_web.id]
subnets = aws_subnet.staging_public[*].id

enable_deletion_protection = false

tags = merge(local.common_tags, {
Name = "myapp-staging-alb-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_lb" "production" {
name = "myapp-production-alb-${random_id.production_suffix.hex}"
internal = false
load_balancer_type = "application"
security_groups = [aws_security_group.production_web.id]
subnets = aws_subnet.production_public[*].id

enable_deletion_protection = true

tags = merge(local.common_tags, {
Name = "myapp-production-alb-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Target Groups

resource "aws_lb_target_group" "staging" {
name = "myapp-staging-tg-${random_id.staging_suffix.hex}"
port = 80
protocol = "HTTP"
vpc_id = aws_vpc.staging.id

health_check {
enabled = true
healthy_threshold = 2
unhealthy_threshold = 2
timeout = 5
interval = 30
path = "/health"
matcher = "200"
port = "traffic-port"
protocol = "HTTP"
}

tags = merge(local.common_tags, {
Name = "myapp-staging-tg-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_lb_target_group" "production" {
name = "myapp-production-tg-${random_id.production_suffix.hex}"
port = 80
protocol = "HTTP"
vpc_id = aws_vpc.production.id

health_check {
enabled = true
healthy_threshold = 2
unhealthy_threshold = 2
timeout = 5
interval = 30
path = "/health"
matcher = "200"
port = "traffic-port"
protocol = "HTTP"
}

tags = merge(local.common_tags, {
Name = "myapp-production-tg-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Load Balancer Listeners

resource "aws_lb_listener" "staging" {
load_balancer_arn = aws_lb.staging.arn
port = "443"
protocol = "HTTPS"
ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
certificate_arn = aws_acm_certificate.staging.arn

default_action {
type = "forward"
target_group_arn = aws_lb_target_group.staging.arn
}
}

resource "aws_lb_listener" "production" {
load_balancer_arn = aws_lb.production.arn
port = "443"
protocol = "HTTPS"
ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
certificate_arn = aws_acm_certificate.production.arn

default_action {
type = "forward"
target_group_arn = aws_lb_target_group.production.arn
}
}

# ACM Certificates (self-signed for demo purposes)

resource "aws_acm_certificate" "staging" {
domain_name = "staging.myapp.local"
validation_method = "DNS"

lifecycle {
create_before_destroy = true
}

tags = merge(local.common_tags, {
Name = "myapp-staging-cert-${random_id.staging_suffix.hex}"
Environment = "staging"
CostCenter = local.environments.staging.cost_center
Owner = local.environments.staging.owner
})
}

resource "aws_acm_certificate" "production" {
domain_name = "production.myapp.local"
validation_method = "DNS"

lifecycle {
create_before_destroy = true
}

tags = merge(local.common_tags, {
Name = "myapp-production-cert-${random_id.production_suffix.hex}"
Environment = "production"
CostCenter = local.environments.production.cost_center
Owner = local.environments.production.owner
})
}

# Launch Templates

resource "aws_launch_template" "staging" {
name_prefix = "myapp-staging-lt-"
image_id = data.aws_ami.amazon_linux.id
instance_type = local.environments.staging.instance_type

vpc_security_group_ids = [aws_security_group.staging_web.id]

iam_instance_profile {
name = aws_iam_instance_profile.staging.name
}

user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd mod_ssl awslogs
systemctl start httpd
systemctl enable httpd
systemctl start awslogsd
systemctl enable awslogsd
echo "<h1>Staging Environment</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
