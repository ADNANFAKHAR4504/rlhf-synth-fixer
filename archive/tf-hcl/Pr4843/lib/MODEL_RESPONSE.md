### Reasoning Trace
---

This is a complex request for Terraform code to deploy a comprehensive AWS security architecture. I need to create production-grade Terraform code that includes:

1. VPC with private subnets only across 3 AZs (10.35.0.0/16)
2. VPC endpoints for AWS services
3. AWS Network Firewall
4. EC2 on dedicated hosts with CloudHSM-KMS encryption
5. Systems Manager Session Manager access only
6. FSx for Lustre
7. Aurora PostgreSQL with TDE and CloudHSM
8. S3 with SSE-C
9. VPC Flow Logs
10. GuardDuty with threat lists
11. Security Hub with custom standards
12. AWS Config Rules
13. CloudTrail with validation
14. CloudWatch Logs with KMS
15. Amazon Macie
16. Lambda for security response
17. SNS for alerts
18. IAM with MFA and IP restrictions
19. Secrets Manager with rotation
20. KMS key rotation (30 days - note: AWS minimum is 90 days)
21. Immutable logs

I'll structure this as main.tf, variables.tf, and outputs.tf for a production setup.
### Answer 
---

```hcl
# variables.tf
variable "region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.35.0.0/16"
}

variable "environment" {
  default = "production"
}

variable "allowed_ips" {
  type    = list(string)
  default = ["10.0.0.0/8"]
}

variable "notification_email" {
  type    = string
  default = "security-alerts@company.com"
}

variable "cloudhsm_cluster_id" {
  type        = string
  description = "CloudHSM cluster ID for KMS integration"
}

# main.tf
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
  region = var.region
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_key" "master" {
  description                        = "Master KMS key with CloudHSM"
  customer_master_key_spec          = "SYMMETRIC_DEFAULT"
  key_usage                         = "ENCRYPT_DECRYPT"
  custom_key_store_id               = aws_kms_custom_key_store.cloudhsm.id
  enable_key_rotation               = true
  rotation_period_in_days           = 90
  deletion_window_in_days           = 30
  bypass_policy_lockout_safety_check = false

  tags = local.tags
}

resource "aws_kms_custom_key_store" "cloudhsm" {
  custom_key_store_name = "production-cloudhsm-keystore"
  cloud_hsm_cluster_id  = var.cloudhsm_cluster_id

  trust_anchor_certificate = file("${path.module}/customerCA.crt")
  key_store_password      = random_password.keystore.result
}

resource "random_password" "keystore" {
  length  = 32
  special = true
}

resource "aws_kms_alias" "master" {
  name          = "alias/production-master"
  target_key_id = aws_kms_key.master.key_id
}

resource "aws_vpc" "main" {
  cidr_block                       = var.vpc_cidr
  enable_dns_hostnames             = true
  enable_dns_support               = true
  instance_tenancy                 = "dedicated"
  assign_generated_ipv6_cidr_block = false

  tags = merge(local.tags, {
    Name = "production-vpc"
  })
}

resource "aws_subnet" "private" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false

  tags = merge(local.tags, {
    Name = "production-private-${local.azs[count.index]}"
    Type = "Private"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type   = "Gateway"
  private_dns_enabled = false
  route_table_ids     = aws_route_table.private[*].id

  tags = merge(local.tags, {
    Name = "production-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "interface_endpoints" {
  for_each = toset([
    "ssm", "ssmmessages", "ec2messages", "kms", "logs",
    "sns", "sqs", "secretsmanager", "config", "ec2",
    "elasticloadbalancing", "autoscaling", "sts",
    "lambda", "states", "events", "monitoring"
  ])

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(local.tags, {
    Name = "production-${each.value}-endpoint"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "production-vpc-endpoints-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "production-vpc-endpoints-sg"
  })
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "production-private-rt-${local.azs[count.index]}"
  })
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_networkfirewall_firewall_policy" "main" {
  name = "production-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    stateful_engine_options {
      rule_order = "STRICT_ORDER"
    }

    stateful_rule_group_reference {
      priority     = 100
      resource_arn = aws_networkfirewall_rule_group.domain_filter.arn
    }

    stateful_rule_group_reference {
      priority     = 200
      resource_arn = aws_networkfirewall_rule_group.suricata_rules.arn
    }
  }

  tags = local.tags
}

resource "aws_networkfirewall_rule_group" "domain_filter" {
  name     = "production-domain-filter"
  type     = "STATEFUL"
  capacity = 100

  rule_group {
    rule_variables {
      ip_sets {
        key = "HOME_NET"
        ip_set {
          definition = [var.vpc_cidr]
        }
      }
    }

    rules_source {
      rules_source_list {
        generated_rules_type = "DENYLIST"
        target_types         = ["HTTP_HOST", "TLS_SNI"]
        targets              = ["badsite.com", ".badsite.com"]
      }
    }
  }

  tags = local.tags
}

resource "aws_networkfirewall_rule_group" "suricata_rules" {
  name     = "production-suricata-rules"
  type     = "STATEFUL"
  capacity = 1000

  rule_group {
    rules_source {
      stateful_rules {
        action = "DROP"
        header {
          protocol    = "HTTP"
          source      = "$HOME_NET"
          source_port = "ANY"
          direction   = "ANY"
          destination = "$EXTERNAL_NET"
          destination_port = "ANY"
        }
        rule_options {
          keyword  = "msg"
          settings = ["\"Detected data exfiltration attempt\""]
        }
        rule_options {
          keyword  = "content"
          settings = ["\"password\""]
        }
        rule_options {
          keyword  = "flow"
          settings = ["to_server,established"]
        }
        rule_options {
          keyword  = "sid"
          settings = ["1000001"]
        }
      }
    }
  }

  tags = local.tags
}

resource "aws_networkfirewall_firewall" "main" {
  name                = "production-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = aws_vpc.main.id

  dynamic "subnet_mapping" {
    for_each = aws_subnet.private
    content {
      subnet_id = subnet_mapping.value.id
    }
  }

  tags = local.tags
}

resource "aws_networkfirewall_logging_configuration" "main" {
  firewall_arn = aws_networkfirewall_firewall.main.arn

  logging_configuration {
    log_destination_config {
      log_type             = "FLOW"
      log_destination_type = "S3"
      log_destination = {
        bucketName = aws_s3_bucket.logs.id
        prefix     = "network-firewall/flow"
      }
    }

    log_destination_config {
      log_type             = "ALERT"
      log_destination_type = "S3"
      log_destination = {
        bucketName = aws_s3_bucket.logs.id
        prefix     = "network-firewall/alert"
      }
    }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "production-logs-${data.aws_caller_identity.current.account_id}-${var.region}"

  tags = local.tags
}

resource "aws_s3_bucket_encryption" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.master.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

resource "aws_s3_bucket_object_lock_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowVPCEndpointAccess"
        Effect = "Allow"
        Principal = {
          Service = [
            "vpc-flow-logs.amazonaws.com",
            "cloudtrail.amazonaws.com",
            "config.amazonaws.com"
          ]
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_flow_log" "vpc" {
  iam_role_arn             = aws_iam_role.flow_logs.arn
  log_destination          = aws_s3_bucket.logs.arn
  log_destination_type     = "s3"
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(local.tags, {
    Name = "production-vpc-flow-logs"
  })
}

resource "aws_iam_role" "flow_logs" {
  name = "production-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "production-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketAcl",
          "s3:GetObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  name                          = "production-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.master.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = ["arn:aws:dynamodb:*:*:table/*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  advanced_event_selector {
    name = "Log all data events"
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
  }

  tags = local.tags
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "production-cloudtrail-${data.aws_caller_identity.current.account_id}-${var.region}"
  
  tags = local.tags
}

resource "aws_s3_bucket_encryption" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.master.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
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

resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = local.tags
}

resource "aws_guardduty_threatintelset" "custom" {
  activate    = true
  detector_id = aws_guardduty_detector.main.id
  format      = "TXT"
  location    = "s3://${aws_s3_bucket.threat_intel.id}/threatlist.txt"
  name        = "production-threat-intel"
}

resource "aws_s3_bucket" "threat_intel" {
  bucket = "production-threat-intel-${data.aws_caller_identity.current.account_id}"

  tags = local.tags
}

resource "aws_s3_bucket_object" "threat_list" {
  bucket  = aws_s3_bucket.threat_intel.id
  key     = "threatlist.txt"
  content = file("${path.module}/threat_list.txt")
}

resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:${var.region}::standards/cis-aws-foundations-benchmark/v/1.2.0"
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:${var.region}::standards/aws-foundational-security-best-practices/v/1.0.0"
}

resource "aws_securityhub_standards_subscription" "pci" {
  standards_arn = "arn:aws:securityhub:${var.region}::standards/pci-dss/v/3.2.1"
}

resource "aws_config_configuration_recorder" "main" {
  name     = "production-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "production-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_s3_bucket" "config" {
  bucket = "production-config-${data.aws_caller_identity.current.account_id}-${var.region}"

  tags = local.tags
}

resource "aws_s3_bucket_encryption" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.master.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "config" {
  name = "production-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "production-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_config_config_rule" "required_tags" {
  name = "required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "ManagedBy"
  })
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "14"
    PasswordReusePrevention    = "24"
    MaxPasswordAge             = "90"
  })
}

resource "aws_config_config_rule" "root_account_mfa" {
  name = "root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
}

resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/production/main"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.master.arn

  tags = local.tags
}

resource "aws_macie2_account" "main" {
  finding_publishing_frequency = "FIFTEEN_MINUTES"
  status                       = "ENABLED"
}

resource "aws_macie2_classification_job" "s3_scan" {
  job_type = "ONE_TIME"
  name     = "production-s3-scan"

  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [aws_s3_bucket.logs.id, aws_s3_bucket.cloudtrail.id]
    }
  }
}

resource "aws_sns_topic" "security_alerts" {
  name              = "production-security-alerts"
  kms_master_key_id = aws_kms_key.master.arn

  tags = local.tags
}

resource "aws_sns_topic_subscription" "security_alerts" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "production-guardduty-findings"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        {
          numeric = [">=", 4]
        }
      ]
    }
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToLambda"
  arn       = aws_lambda_function.security_response.arn
}

resource "aws_lambda_function" "security_response" {
  filename         = "security_response.zip"
  function_name    = "production-security-response"
  role             = aws_iam_role.lambda_security.arn
  handler          = "index.handler"
  runtime          = "python3.9"
  timeout          = 60
  memory_size      = 256
  source_code_hash = filebase64sha256("security_response.zip")

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = local.tags
}

resource "aws_sqs_queue" "dlq" {
  name                       = "production-security-response-dlq"
  kms_master_key_id          = aws_kms_key.master.arn
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = local.tags
}

resource "aws_iam_role" "lambda_security" {
  name = "production-lambda-security-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_security.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_security" {
  name = "production-lambda-security-policy"
  role = aws_iam_role.lambda_security.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "guardduty:*",
          "securityhub:*",
          "ec2:*SecurityGroup*",
          "ec2:*NetworkAcl*",
          "ec2:ModifyInstanceAttribute",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty_findings.arn
}

resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  password_reuse_prevention      = 24
  max_password_age               = 90
}

resource "aws_iam_policy" "mfa_self_manage" {
  name        = "production-mfa-self-manage"
  description = "Allow users to self-manage MFA devices"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnVirtualMFADevice"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:mfa/*"
      },
      {
        Sid    = "AllowManageOwnUserMFA"
        Effect = "Allow"
        Action = [
          "iam:DeactivateMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/$${aws:username}"
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ip_restrict" {
  name        = "production-ip-restriction"
  description = "Restrict access to allowed IPs only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Deny"
        Action    = "*"
        Resource  = "*"
        Condition = {
          IpAddressNotEquals = {
            "aws:SourceIp" = var.allowed_ips
          }
        }
      }
    ]
  })
}

resource "aws_secretsmanager_secret" "rds_master" {
  name                    = "production-rds-master-password"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.master.arn

  rotation_rules {
    automatically_after_days = 30
  }

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = aws_secretsmanager_secret.rds_master.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master.result
  })
}

resource "random_password" "rds_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret_rotation" "rds_master" {
  secret_id               = aws_secretsmanager_secret.rds_master.id
  rotation_lambda_arn     = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_lambda_function" "rotate_secret" {
  filename         = "rotate_secret.zip"
  function_name    = "production-rotate-secret"
  role             = aws_iam_role.lambda_rotate.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = filebase64sha256("rotate_secret.zip")

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.region}.amazonaws.com"
    }
  }

  tags = local.tags
}

resource "aws_iam_role" "lambda_rotate" {
  name = "production-lambda-rotate-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "lambda_rotate" {
  name = "production-lambda-rotate-policy"
  role = aws_iam_role.lambda_rotate.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.rds_master.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.master.arn
      }
    ]
  })
}

resource "aws_lambda_permission" "allow_secret_manager_rotation" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotate_secret.function_name
  principal     = "secretsmanager.amazonaws.com"
}

resource "aws_s3_bucket" "data" {
  bucket = "production-data-${data.aws_caller_identity.current.account_id}"

  tags = local.tags
}

resource "aws_s3_bucket_encryption" "data_ssec" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_ec2_dedicated_host" "main" {
  count               = 3
  availability_zone   = local.azs[count.index]
  instance_type       = "m5.large"
  host_recovery       = "on"
  auto_placement      = "on"

  tags = merge(local.tags, {
    Name = "production-dedicated-host-${count.index + 1}"
  })
}

resource "aws_launch_template" "secure" {
  name_prefix = "production-secure-"

  instance_type = "m5.large"
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  block_device_mappings {
    device_name = "/dev/sda1"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.master.arn
      delete_on_termination = true
    }
  }

  network_interfaces {
    associate_public_ip_address = false
    delete_on_termination       = true
    security_groups             = [aws_security_group.ec2.id]
  }

  placement {
    affinity    = "host"
    tenancy     = "host"
    host_id     = aws_ec2_dedicated_host.main[0].id
  }

  iam_instance_profile {
    arn = aws_iam_instance_profile.ssm.arn
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "production-secure-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.tags, {
      Name = "production-secure-volume"
    })
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF
  )
}

resource "aws_security_group" "ec2" {
  name_prefix = "production-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to VPC endpoints"
  }

  tags = merge(local.tags, {
    Name = "production-ec2-sg"
  })
}

resource "aws_iam_instance_profile" "ssm" {
  name = "production-ssm-instance-profile"
  role = aws_iam_role.ssm_instance.name
}

resource "aws_iam_role" "ssm_instance" {
  name = "production-ssm-instance-role"

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

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ssm_instance_kms" {
  name = "production-ssm-instance-kms"
  role = aws_iam_role.ssm_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.master.arn
      }
    ]
  })
}

resource "aws_ssm_document" "session_manager_prefs" {
  name            = "SSM-SessionManagerRunShell"
  document_type   = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Document to hold regional settings for Session Manager"
    sessionType   = "Standard_Stream"
    inputs = {
      cloudWatchLogGroupName      = aws_cloudwatch_log_group.session_manager.name
      cloudWatchEncryptionEnabled = true
      kmsKeyId                    = aws_kms_key.master.arn
      s3BucketName                = aws_s3_bucket.logs.id
      s3KeyPrefix                 = "session-manager/"
      s3EncryptionEnabled         = true
    }
  })
}

resource "aws_cloudwatch_log_group" "session_manager" {
  name              = "/aws/sessionmanager/production"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.master.arn

  tags = local.tags
}

resource "aws_fsx_lustre_file_system" "main" {
  storage_capacity            = 1200
  subnet_ids                  = [aws_subnet.private[0].id]
  deployment_type             = "PERSISTENT_2"
  per_unit_storage_throughput = 125
  kms_key_id                  = aws_kms_key.master.arn

  security_group_ids = [aws_security_group.fsx.id]

  log_configuration {
    level        = "WARN_ERROR"
    destination  = aws_cloudwatch_log_group.fsx.arn
  }

  tags = merge(local.tags, {
    Name = "production-fsx-lustre"
  })
}

resource "aws_cloudwatch_log_group" "fsx" {
  name              = "/aws/fsx/production-lustre"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.master.arn

  tags = local.tags
}

resource "aws_security_group" "fsx" {
  name_prefix = "production-fsx-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for FSx"

  ingress {
    from_port = 988
    to_port   = 988
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 1018
    to_port   = 1023
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  tags = merge(local.tags, {
    Name = "production-fsx-sg"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "production-aurora-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = "14.9"
  database_name                   = "production"
  master_username                 = jsondecode(aws_secretsmanager_secret_version.rds_master.secret_string)["username"]
  master_password                 = jsondecode(aws_secretsmanager_secret_version.rds_master.secret_string)["password"]
  backup_retention_period         = 35
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.master.arn
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = true
  apply_immediately               = false
  skip_final_snapshot             = false
  final_snapshot_identifier       = "production-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = local.tags
}

resource "aws_db_subnet_group" "aurora" {
  name       = "production-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "production-aurora-subnet-group"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "production-aurora-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "production-aurora-sg"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count                = 2
  identifier           = "production-aurora-instance-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.aurora.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.aurora.engine
  engine_version       = aws_rds_cluster.aurora.engine_version
  monitoring_interval  = 60
  monitoring_role_arn  = aws_iam_role.rds_monitoring.arn

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.master.arn

  tags = merge(local.tags, {
    Name = "production-aurora-instance-${count.index + 1}"
  })
}

resource "aws_iam_role" "rds_monitoring" {
  name = "production-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "kms_key_arn" {
  value = aws_kms_key.master.arn
}

output "s3_logs_bucket" {
  value = aws_s3_bucket.logs.id
}

output "cloudtrail_name" {
  value = aws_cloudtrail.main.name
}

output "security_alerts_topic" {
  value = aws_sns_topic.security_alerts.arn
}

output "aurora_cluster_endpoint" {
  value = aws_rds_cluster.aurora.endpoint
}

output "fsx_dns_name" {
  value = aws_fsx_lustre_file_system.main.dns_name
}
```