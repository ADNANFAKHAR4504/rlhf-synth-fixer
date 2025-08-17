## Ideal Response — Secure AWS Infrastructure with Terraform (single main.tf, no provider)

The corrected `main.tf` addresses the failures: removes nonexistent modules, adds a clear region guard, avoids backend bootstrap conflicts, uses a region-safe AMI lookup, fixes unsupported arguments, and tightens security. It follows the `prod-<resource>-<id>` naming via an explicit `var.resource_id`.

```hcl
# =========================
# Variables
# =========================
variable "resource_id" {
  description = "Lowercase id used in names (e.g., 'abcd1234')."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]{4,32}$", var.resource_id))
    error_message = "resource_id must be 4-32 chars, lowercase letters, digits or hyphens."
  }
}

variable "trusted_admin_cidr" {
  description = "Optional /32 or CIDR for admin SSH access to public resources. Leave empty to disable SSH."
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR for the primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# =========================
# Data sources
# =========================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" { state = "available" }

# Region-safe Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name",         values = ["al2023-ami-*-x86_64"] }
  filter { name = "architecture", values = ["x86_64"] }
  filter { name = "state",        values = ["available"] }
}

# =========================
# Locals & naming helpers
# =========================
locals {
  allowed_regions = ["us-west-2"]
  common_tags = {
    Environment = "production"
    Project     = "secure-infrastructure"
    ManagedBy   = "terraform"
    Region      = data.aws_region.current.name
  }
  n = {
    kms_main          = "prod-kms-${var.resource_id}"
    cloudtrail_bucket = "prod-cloudtrail-logs-${var.resource_id}"
    vpc               = "prod-vpc-${var.resource_id}"
    igw               = "prod-igw-${var.resource_id}"
    public_subnet     = "prod-public-subnet-${var.resource_id}"
    private_subnet    = "prod-private-subnet-${var.resource_id}"
    nat_eip           = "prod-nat-eip-${var.resource_id}"
    nat_gw            = "prod-nat-gw-${var.resource_id}"
    rt_public         = "prod-public-rt-${var.resource_id}"
    rt_private        = "prod-private-rt-${var.resource_id}"
    sg_private        = "prod-private-sg-${var.resource_id}"
    sg_public         = "prod-public-sg-${var.resource_id}"
    nacl_private      = "prod-private-nacl-${var.resource_id}"
    lt                = "prod-lt-${var.resource_id}"
    asg               = "prod-asg-${var.resource_id}"
    logs              = "prod-system-logs-${var.resource_id}"
    cloudtrail        = "prod-cloudtrail-${var.resource_id}"
  }
}

# =========================
# Region guard via precondition
# =========================
resource "null_resource" "region_guard" {
  lifecycle {
    precondition {
      condition     = contains(local.allowed_regions, data.aws_region.current.name)
      error_message = "Deployment is allowed only in regions: ${join(", ", local.allowed_regions)}"
    }
  }
}

# =========================
# KMS for encryption
# =========================
resource "aws_kms_key" "main" {
  description             = local.n.kms_main
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid      = "EnableIAMUserPermissions"
        Effect   = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid      = "AllowCloudTrailEncryptLogs"
        Effect   = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = ["kms:GenerateDataKey*", "kms:DescribeKey", "kms:Decrypt"]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = local.n.kms_main })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.n.kms_main}"
  target_key_id = aws_kms_key.main.key_id
}

# =========================
# CloudTrail log bucket (SSE-KMS, private)
# =========================
resource "aws_s3_bucket" "cloudtrail" {
  bucket = local.n.cloudtrail_bucket
  tags   = merge(local.common_tags, { Name = local.n.cloudtrail_bucket })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid      = "AWSCloudTrailAclCheck"
        Effect   = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid      = "AWSCloudTrailWrite"
        Effect   = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}
```

```hcl
# =========================
# CloudWatch & CloudTrail, Outputs
# =========================
resource "aws_cloudwatch_log_group" "system_logs" {
  name              = local.n.logs
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(local.common_tags, { Name = local.n.logs })
}

resource "aws_cloudtrail" "main" {
  name                          = local.n.cloudtrail
  s3_bucket_name                = aws_s3_bucket.cloudtrail.bucket
  s3_key_prefix                 = "cloudtrail-logs"
  kms_key_id                    = aws_kms_key.main.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource { type = "AWS::S3::Object", values = ["arn:aws:s3:::*/*"] }
  }
  depends_on = [aws_s3_bucket_policy.cloudtrail]
  tags       = merge(local.common_tags, { Name = local.n.cloudtrail })
}

output "vpc_id"                { value = aws_vpc.main.id }
output "private_subnet_ids"   { value = aws_subnet.private[*].id }
output "public_subnet_ids"    { value = aws_subnet.public[*].id }
output "kms_key_arn"          { value = aws_kms_key.main.arn }
output "cloudtrail_name"      { value = aws_cloudtrail.main.name }
output "cloudtrail_s3_bucket" { value = aws_s3_bucket.cloudtrail.bucket }
```

# =========================

# Compute (Launch Template & ASG)

# =========================

resource "aws_launch_template" "private" {
name_prefix = "${local.n.lt}-"
  image_id                = data.aws_ami.al2023.id
  instance_type           = "t3.micro"
  vpc_security_group_ids  = [aws_security_group.private.id]
  iam_instance_profile { name = aws_iam_instance_profile.ec2.name }
  user_data = base64encode(<<-EOT
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CFG'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "${local.n.logs}",
"log_stream_name": "{instance_id}"
}
]
}
}
}
}
CFG
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
EOT
)
tag_specifications { resource_type = "instance" tags = merge(local.common_tags, { Name = "prod-ec2-${var.resource_id}" }) }
tags = local.common_tags
}

resource "aws_autoscaling_group" "private" {
name = local.n.asg
vpc_zone_identifier = aws_subnet.private[*].id
health_check_type = "EC2"
min_size = 1
max_size = 3
desired_capacity = 2
launch_template { id = aws_launch_template.private.id, version = "$Latest" }
tag { key = "Name", value = local.n.asg, propagate_at_launch = true }
dynamic "tag" {
for_each = local.common_tags
content { key = tag.key, value = tag.value, propagate_at_launch = true }
}
}

```
# =========================
# Security (SGs & NACLs)
# =========================
resource "aws_security_group" "private" {
  name        = local.n.sg_private
  description = "Security group for private resources"
  vpc_id      = aws_vpc.main.id
  ingress { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = [aws_vpc.main.cidr_block] }
  ingress { from_port = 80,  to_port = 80,  protocol = "tcp", cidr_blocks = [aws_vpc.main.cidr_block] }
  egress  { from_port = 0,   to_port = 0,   protocol = "-1",  cidr_blocks = ["0.0.0.0/0"] }
  tags = merge(local.common_tags, { Name = local.n.sg_private })
}

resource "aws_security_group" "public" {
  name        = local.n.sg_public
  description = "Security group for public resources"
  vpc_id      = aws_vpc.main.id
  ingress { from_port = 80,  to_port = 80,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0,   to_port = 0,   protocol = "-1",  cidr_blocks = ["0.0.0.0/0"] }
  tags = merge(local.common_tags, { Name = local.n.sg_public })
}

# Optional SSH for admin (off by default)
resource "aws_vpc_security_group_ingress_rule" "public_ssh" {
  count = length(var.trusted_admin_cidr) > 0 ? 1 : 0
  security_group_id = aws_security_group.public.id
  cidr_ipv4         = var.trusted_admin_cidr
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  description       = "Admin SSH"
}

resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id
  ingress { rule_no = 100, protocol = "tcp", action = "allow", cidr_block = aws_vpc.main.cidr_block, from_port = 80,  to_port = 80 }
  ingress { rule_no = 110, protocol = "tcp", action = "allow", cidr_block = aws_vpc.main.cidr_block, from_port = 443, to_port = 443 }
  egress  { rule_no = 100, protocol = "-1",  action = "allow", cidr_block = "0.0.0.0/0", from_port = 0, to_port = 0 }
  tags = merge(local.common_tags, { Name = local.n.nacl_private })
}

resource "aws_network_acl_association" "private" {
  count          = 2
  network_acl_id = aws_network_acl.private.id
  subnet_id      = aws_subnet.private[count.index].id
}
```

# =========================

# VPC, Subnets, NAT, Routes

# =========================

resource "aws_vpc" "main" {
cidr_block = var.vpc_cidr
enable_dns_hostnames = true
enable_dns_support = true
tags = merge(local.common_tags, { Name = local.n.vpc })
}

resource "aws_internet_gateway" "main" {
vpc_id = aws_vpc.main.id
tags = merge(local.common_tags, { Name = local.n.igw })
}

resource "aws_subnet" "public" {
count = 2
vpc_id = aws_vpc.main.id
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
availability_zone = data.aws_availability_zones.available.names[count.index]
map_public_ip_on_launch = true
tags = merge(local.common_tags, { Name = "${local.n.public_subnet}-${count.index + 1}", Type = "public" })
}

resource "aws_subnet" "private" {
count = 2
vpc_id = aws_vpc.main.id
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
availability_zone = data.aws_availability_zones.available.names[count.index]
tags = merge(local.common_tags, { Name = "${local.n.private_subnet}-${count.index + 1}", Type = "private" })
}

resource "aws_eip" "nat" {
count = 2
domain = "vpc"
depends_on = [aws_internet_gateway.main]
tags = merge(local.common_tags, { Name = "${local.n.nat_eip}-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
count = 2
allocation_id = aws_eip.nat[count.index].id
subnet_id = aws_subnet.public[count.index].id
depends_on = [aws_internet_gateway.main]
tags = merge(local.common_tags, { Name = "${local.n.nat_gw}-${count.index + 1}" })
}

resource "aws_route_table" "public" {
vpc_id = aws_vpc.main.id
route { cidr_block = "0.0.0.0/0", gateway_id = aws_internet_gateway.main.id }
tags = merge(local.common_tags, { Name = local.n.rt_public })
}

resource "aws_route_table_association" "public" {
count = 2
subnet_id = aws_subnet.public[count.index].id
route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
count = 2
vpc_id = aws_vpc.main.id
route { cidr_block = "0.0.0.0/0", nat_gateway_id = aws_nat_gateway.main[count.index].id }
tags = merge(local.common_tags, { Name = "${local.n.rt_private}-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
count = 2
subnet_id = aws_subnet.private[count.index].id
route_table_id = aws_route_table.private[count.index].id
}

```
# =========================
# IAM minimal instance role & profile
# =========================
resource "aws_iam_role" "ec2_instance" {
  name               = "prod-iam-role-${var.resource_id}"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" } }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_minimal" {
  name        = "prod-iam-policy-${var.resource_id}"
  description = "Minimal permissions for EC2 instances"
  policy      = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["ec2:DescribeInstances", "ec2:DescribeTags"], Resource = "*" },
      { Effect = "Allow", Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"], Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*" }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_minimal" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = aws_iam_policy.ec2_minimal.arn
}

resource "aws_iam_instance_profile" "ec2" {
  name = "prod-iam-instance-profile-${var.resource_id}"
  role = aws_iam_role.ec2_instance.name
  tags = local.common_tags
}
```
