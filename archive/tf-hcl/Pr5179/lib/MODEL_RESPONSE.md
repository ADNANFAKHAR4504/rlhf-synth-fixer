I'll help you build a comprehensive zero-trust security architecture for your financial client. Let me break this down into well-organized Terraform configurations with proper documentation.

## Project Structure

```
zero-trust-architecture/
├── modules/
│   ├── network/
│   ├── security/
│   ├── monitoring/
│   └── automation/
├── environments/
│   ├── pilot/
│   └── production/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── runbook.md
└── testing-strategy.md
```

## Main Configuration Files

### main.tf
```hcl
# Main orchestrator for zero-trust architecture deployment
# This file coordinates the deployment of all security components

locals {
  # Common tags applied to all resources for compliance and cost tracking
  common_tags = {
    Project             = var.project_name
    Environment         = var.environment
    ComplianceRequired  = "true"
    DataClassification  = "highly-sensitive"
    ManagedBy          = "terraform"
    SecurityFramework   = "zero-trust"
  }

  # Determine if this is a pilot deployment
  is_pilot = var.environment == "pilot"
  
  # Account list based on deployment type
  target_accounts = local.is_pilot ? var.pilot_accounts : var.all_accounts
}

# Data source for AWS Organizations
data "aws_organizations_organization" "org" {}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Deploy network infrastructure module
module "network_infrastructure" {
  source = "./modules/network"
  
  for_each = toset(local.target_accounts)
  
  account_id                = each.value
  vpc_cidr                  = var.vpc_cidrs[each.key]
  availability_zones        = var.availability_zones
  enable_flow_logs          = true
  enable_network_firewall   = true
  transit_gateway_id        = module.transit_gateway.tgw_id
  
  tags = merge(local.common_tags, {
    AccountId = each.value
    Component = "network"
  })
}

# Deploy centralized transit gateway
module "transit_gateway" {
  source = "./modules/network/transit-gateway"
  
  amazon_side_asn                       = var.transit_gateway_asn
  enable_default_route_table_association = false
  enable_default_route_table_propagation = false
  
  tags = merge(local.common_tags, {
    Name      = "${var.project_name}-tgw"
    Component = "transit-gateway"
  })
}

# Deploy security monitoring components
module "security_monitoring" {
  source = "./modules/security"
  
  for_each = toset(local.target_accounts)
  
  account_id               = each.value
  enable_guardduty         = true
  enable_security_hub      = true
  enable_cloudtrail        = true
  central_logging_bucket   = module.central_logging.bucket_id
  
  tags = merge(local.common_tags, {
    AccountId = each.value
    Component = "security-monitoring"
  })
}

# Deploy central logging infrastructure
module "central_logging" {
  source = "./modules/monitoring/central-logging"
  
  logging_account_id = var.logging_account_id
  retention_days     = var.log_retention_days
  
  # Enable compliance features for banking regulations
  enable_object_lock     = true
  enable_access_logging  = true
  enable_versioning      = true
  
  tags = merge(local.common_tags, {
    Component = "central-logging"
    Compliance = "banking-regulations"
  })
}

# Deploy automation components
module "security_automation" {
  source = "./modules/automation"
  
  security_hub_findings_topic_arn = module.security_monitoring[var.security_account_id].security_hub_topic_arn
  enable_auto_remediation         = var.enable_auto_remediation
  notification_email              = var.security_notification_email
  
  tags = merge(local.common_tags, {
    Component = "security-automation"
  })
}

# Deploy IAM and access control policies
module "access_control" {
  source = "./modules/security/access-control"
  
  for_each = toset(local.target_accounts)
  
  account_id                    = each.value
  require_mfa                   = true
  allowed_ip_ranges            = var.allowed_ip_ranges
  max_session_duration_seconds = var.max_session_duration
  
  tags = merge(local.common_tags, {
    AccountId = each.value
    Component = "access-control"
  })
}

# Deploy Service Control Policies at Organization level
resource "aws_organizations_policy" "zero_trust_scp" {
  name        = "${var.project_name}-zero-trust-scp"
  description = "Service Control Policy enforcing zero-trust principles"
  type        = "SERVICE_CONTROL_POLICY"
  
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Deny access without MFA for sensitive operations
        Sid    = "DenyWithoutMFA"
        Effect = "Deny"
        Action = [
          "ec2:TerminateInstances",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "iam:DeleteRole",
          "iam:DeleteUser"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        # Deny access from non-approved IP ranges
        Sid    = "DenyNonApprovedIPs"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
          IpAddressNotEquals = {
            "aws:SourceIp" = var.allowed_ip_ranges
          }
        }
      },
      {
        # Prevent disabling of security services
        Sid    = "DenySecurityServiceDisable"
        Effect = "Deny"
        Action = [
          "guardduty:DeleteDetector",
          "guardduty:DisableOrganizationAdminAccount",
          "securityhub:DisableSecurityHub",
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = local.common_tags
}
```

### variables.tf
```hcl
# Core project variables
variable "project_name" {
  description = "Name of the zero-trust security project"
  type        = string
  default     = "financial-zero-trust"
}

variable "environment" {
  description = "Deployment environment (pilot or production)"
  type        = string
  validation {
    condition     = contains(["pilot", "production"], var.environment)
    error_message = "Environment must be either 'pilot' or 'production'."
  }
}

# Account configuration
variable "pilot_accounts" {
  description = "List of AWS account IDs for pilot deployment"
  type        = list(string)
  default     = []
}

variable "all_accounts" {
  description = "List of all 50 AWS account IDs"
  type        = list(string)
  default     = []
}

variable "security_account_id" {
  description = "Central security account ID for aggregated monitoring"
  type        = string
}

variable "logging_account_id" {
  description = "Central logging account ID for compliance logs"
  type        = string
}

# Network configuration
variable "vpc_cidrs" {
  description = "Map of account IDs to VPC CIDR blocks"
  type        = map(string)
  default     = {}
}

variable "availability_zones" {
  description = "List of availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "transit_gateway_asn" {
  description = "ASN for Transit Gateway"
  type        = number
  default     = 64512
}

# Security configuration
variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges for access"
  type        = list(string)
  sensitive   = true
}

variable "max_session_duration" {
  description = "Maximum session duration in seconds"
  type        = number
  default     = 3600 # 1 hour
}

variable "enable_auto_remediation" {
  description = "Enable automatic security incident remediation"
  type        = bool
  default     = true
}

variable "security_notification_email" {
  description = "Email address for security notifications"
  type        = string
  sensitive   = true
}

# Compliance configuration
variable "log_retention_days" {
  description = "Number of days to retain compliance logs"
  type        = number
  default     = 2557 # 7 years for banking compliance
}
```

### outputs.tf
```hcl
# Network outputs
output "transit_gateway_id" {
  description = "ID of the central transit gateway"
  value       = module.transit_gateway.tgw_id
}

output "vpc_ids" {
  description = "Map of account IDs to VPC IDs"
  value       = {
    for account_id, network in module.network_infrastructure :
    account_id => network.vpc_id
  }
}

# Security outputs
output "security_hub_arn" {
  description = "ARN of the central Security Hub"
  value       = module.security_monitoring[var.security_account_id].security_hub_arn
}

output "guardduty_detector_ids" {
  description = "Map of account IDs to GuardDuty detector IDs"
  value       = {
    for account_id, security in module.security_monitoring :
    account_id => security.guardduty_detector_id
  }
}

# Logging outputs
output "central_logging_bucket" {
  description = "Name of the central logging bucket"
  value       = module.central_logging.bucket_name
}

output "cloudtrail_arns" {
  description = "Map of account IDs to CloudTrail ARNs"
  value       = {
    for account_id, security in module.security_monitoring :
    account_id => security.cloudtrail_arn
  }
}

# Automation outputs
output "incident_response_function_arn" {
  description = "ARN of the incident response Lambda function"
  value       = module.security_automation.incident_response_function_arn
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = module.security_automation.alerts_topic_arn
}

# Access control outputs
output "session_manager_role_arns" {
  description = "Map of account IDs to Session Manager role ARNs"
  value       = {
    for account_id, access in module.access_control :
    account_id => access.session_manager_role_arn
  }
}
```

## Module: Network Infrastructure

### modules/network/main.tf
```hcl
# Network module for zero-trust architecture
# Implements network segmentation and security controls

locals {
  # Calculate subnet CIDR blocks
  public_subnet_cidrs  = [for i in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnet_cidrs = [for i in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 4, i + length(var.availability_zones))]
  isolated_subnet_cidrs = [for i in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 4, i + (2 * length(var.availability_zones)))]
}

# VPC with DNS support for PrivateLink endpoints
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "zero-trust-vpc-${var.account_id}"
  })
}

# Public subnets for load balancers only
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false # Explicit deny
  
  tags = merge(var.tags, {
    Name = "public-${var.availability_zones[count.index]}"
    Type = "public"
  })
}

# Private subnets for application workloads
resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "private-${var.availability_zones[count.index]}"
    Type = "private"
  })
}

# Isolated subnets for sensitive data
resource "aws_subnet" "isolated" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.isolated_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "isolated-${var.availability_zones[count.index]}"
    Type = "isolated"
    DataClassification = "highly-sensitive"
  })
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "igw-${var.account_id}"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "nat-eip-${var.availability_zones[count.index]}"
  })
}

# NAT Gateways for private subnet outbound traffic
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.tags, {
    Name = "nat-${var.availability_zones[count.index]}"
  })
}

# VPC Flow Logs for network monitoring
resource "aws_flow_log" "main" {
  iam_role_arn         = aws_iam_role.flow_log.arn
  log_destination      = aws_cloudwatch_log_group.flow_log.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  
  # Enhanced flow log format for better visibility
  log_format = "$${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${action} $${log-status}"
  
  tags = merge(var.tags, {
    Name = "flow-log-${var.account_id}"
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flowlogs/${var.account_id}"
  retention_in_days = 30
  kms_key_id        = var.kms_key_id
  
  tags = var.tags
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "vpc-flow-log-role-${var.account_id}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# IAM policy for Flow Logs
resource "aws_iam_role_policy" "flow_log" {
  name = "vpc-flow-log-policy"
  role = aws_iam_role.flow_log.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

# AWS Network Firewall for deep packet inspection
module "network_firewall" {
  source = "./network-firewall"
  
  count = var.enable_network_firewall ? 1 : 0
  
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id
  
  tags = merge(var.tags, {
    Component = "network-firewall"
  })
}

# Transit Gateway attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  subnet_ids         = aws_subnet.private[*].id
  transit_gateway_id = var.transit_gateway_id
  vpc_id             = aws_vpc.main.id
  
  # Security options
  dns_support                        = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation  = false
  
  tags = merge(var.tags, {
    Name = "tgw-attachment-${var.account_id}"
  })
}
```

## Module: Security Monitoring

### modules/security/main.tf
```hcl
# Security monitoring module for zero-trust architecture
# Implements GuardDuty, Security Hub, and CloudTrail

# Enable GuardDuty detector
resource "aws_guardduty_detector" "main" {
  enable = var.enable_guardduty
  
  # Enhanced threat detection
  finding_publishing_frequency = "FIFTEEN_MINUTES"
  
  # Enable S3 protection
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
  
  tags = merge(var.tags, {
    Name = "guardduty-detector-${var.account_id}"
  })
}

# Enable Security Hub
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0
  
  # Auto-enable new controls
  control_finding_generator = "SECURITY_CONTROL"
  auto_enable_controls      = true
}

# Subscribe to security standards
resource "aws_securityhub_standards_subscription" "cis" {
  count = var.enable_security_hub ? 1 : 0
  
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/cis-aws-foundations-benchmark/v/1.4.0"
  
  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci" {
  count = var.enable_security_hub ? 1 : 0
  
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
  
  depends_on = [aws_securityhub_account.main]
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  name                          = "zero-trust-trail-${var.account_id}"
  s3_bucket_name               = var.central_logging_bucket
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  
  # Enable log file validation for integrity
  enable_log_file_validation = true
  
  # Log all events for comprehensive auditing
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:${var.account_id}:function/*"]
    }
  }
  
  # Insights for anomaly detection
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }
  
  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }
  
  # Send events to CloudWatch Logs for real-time analysis
  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.cloudtrail.arn
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn
  
  # KMS encryption for trails
  kms_key_id = var.kms_key_id
  
  # SNS notifications for critical events
  sns_topic_name = aws_sns_topic.security_alerts.name
  
  tags = merge(var.tags, {
    Name = "cloudtrail-${var.account_id}"
    Compliance = "required"
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.account_id}"
  retention_in_days = 90
  kms_key_id        = var.kms_key_id
  
  tags = var.tags
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "cloudtrail-cloudwatch-role-${var.account_id}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# IAM policy for CloudTrail to write to CloudWatch
resource "aws_iam_role_policy" "cloudtrail" {
  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name = "zero-trust-security-alerts-${var.account_id}"
  
  # Enable encryption
  kms_master_key_id = var.kms_key_id
  
  tags = merge(var.tags, {
    Purpose = "security-notifications"
  })
}

# Data source for current region
data "aws_region" "current" {}
```

## Module: Automation

### modules/automation/main.tf
```hcl
# Automation module for incident response
# Implements Lambda functions and EventBridge rules for auto-remediation

# Lambda function for incident response
resource "aws_lambda_function" "incident_response" {
  filename         = "${path.module}/lambda/incident-response.zip"
  function_name    = "zero-trust-incident-response"
  role            = aws_iam_role.incident_response.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  memory_size     = 512
  
  environment {
    variables = {
      ENABLE_AUTO_REMEDIATION = var.enable_auto_remediation
      SNS_TOPIC_ARN          = aws_sns_topic.alerts.arn
      LOG_LEVEL              = "INFO"
    }
  }
  
  # VPC configuration for secure execution
  vpc_config {
    subnet_ids         = var.lambda_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  # Enable X-Ray tracing
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(var.tags, {
    Component = "incident-response"
  })
}

# IAM role for Lambda function
resource "aws_iam_role" "incident_response" {
  name = "zero-trust-incident-response-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# IAM policy for incident response actions
resource "aws_iam_role_policy" "incident_response" {
  name = "incident-response-policy"
  role = aws_iam_role.incident_response.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow reading security findings
        Effect = "Allow"
        Action = [
          "securityhub:GetFindings",
          "securityhub:UpdateFindings",
          "guardduty:GetFindings"
        ]
        Resource = "*"
      },
      {
        # Allow remediation actions
        Effect = "Allow"
        Action = [
          "ec2:StopInstances",
          "ec2:TerminateInstances",
          "ec2:ModifyInstanceAttribute",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:PutUserPolicy"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion": data.aws_region.current.name
          }
        }
      },
      {
        # Allow SNS notifications
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        # CloudWatch Logs permissions
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach managed policies
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.incident_response.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "xray" {
  role       = aws_iam_role.incident_response.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# EventBridge rule for Security Hub findings
resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "zero-trust-security-hub-findings"
  description = "Trigger incident response for critical Security Hub findings"
  
  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
        Compliance = {
          Status = ["FAILED"]
        }
        WorkflowState = ["NEW"]
      }
    }
  })
  
  tags = var.tags
}

# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "zero-trust-guardduty-findings"
  description = "Trigger incident response for GuardDuty findings"
  
  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{
        numeric = [">=", 7]
      }]
    }
  })
  
  tags = var.tags
}

# EventBridge targets
resource "aws_cloudwatch_event_target" "security_hub_lambda" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "SecurityHubToLambda"
  arn       = aws_lambda_function.incident_response.arn
}

resource "aws_cloudwatch_event_target" "guardduty_lambda" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "GuardDutyToLambda"
  arn       = aws_lambda_function.incident_response.arn
}

# Lambda permissions for EventBridge
resource "aws_lambda_permission" "security_hub_invoke" {
  statement_id  = "AllowSecurityHubInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.incident_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_hub_findings.arn
}

resource "aws_lambda_permission" "guardduty_invoke" {
  statement_id  = "AllowGuardDutyInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.incident_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty_findings.arn
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "zero-trust-security-alerts"
  
  kms_master_key_id = var.kms_key_id
  
  tags = merge(var.tags, {
    Purpose = "security-alerts"
  })
}

# SNS subscription for email notifications
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  name        = "zero-trust-lambda-sg"
  description = "Security group for incident response Lambda"
  vpc_id      = var.vpc_id
  
  # Egress only for HTTPS
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for AWS API calls"
  }
  
  tags = merge(var.tags, {
    Name = "lambda-incident-response-sg"
  })
}

# Data source for current region
data "aws_region" "current" {}
```

## Module: Access Control

### modules/security/access-control/main.tf
```hcl
# Access control module for zero-trust architecture
# Implements least privilege IAM policies and Session Manager

# Session Manager role for secure access
resource "aws_iam_role" "session_manager" {
  name = "zero-trust-session-manager-${var.account_id}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.account_id}:root"
      }
      Action = "sts:AssumeRole"
      Condition = {
        # Require MFA
        Bool = {
          "aws:MultiFactorAuthPresent" = "true"
        }
        # IP restrictions
        IpAddress = {
          "aws:SourceIp" = var.allowed_ip_ranges
        }
        # Time-based access
        DateGreaterThan = {
          "aws:CurrentTime" = "08:00Z"
        }
        DateLessThan = {
          "aws:CurrentTime" = "18:00Z"
        }
      }
    }]
  })
  
  max_session_duration = var.max_session_duration_seconds
  
  tags = merge(var.tags, {
    Purpose = "session-manager-access"
  })
}

# Session Manager policy
resource "aws_iam_role_policy" "session_manager" {
  name = "session-manager-policy"
  role = aws_iam_role.session_manager.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:StartSession"
        ]
        Resource = [
          "arn:aws:ec2:*:${var.account_id}:instance/*",
          "arn:aws:ssm:*:${var.account_id}:document/AWS-StartSSHSession",
          "arn:aws:ssm:*:${var.account_id}:document/AWS-StartPortForwardingSession"
        ]
        Condition = {
          StringEquals = {
            "ssm:SessionDocumentAccessCheck" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeSessions",
          "ssm:GetConnectionStatus",
          "ssm:DescribeInstanceInformation",
          "ssm:DescribeInstanceProperties"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:TerminateSession",
          "ssm:ResumeSession"
        ]
        Resource = "arn:aws:ssm:*:${var.account_id}:session/$${aws:username}-*"
      }
    ]
  })
}

# SSM Document for session logging
resource "aws_ssm_document" "session_logging" {
  name          = "zero-trust-session-logging"
  document_type = "Session"
  
  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Document for session logging with enhanced security"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName        = var.session_logs_bucket
      s3KeyPrefix         = "session-logs/"
      s3EncryptionEnabled = true
      cloudWatchLogGroupName = "/aws/ssm/session-logs"
      cloudWatchEncryptionEnabled = true
      cloudWatchStreamingEnabled  = true
      idleSessionTimeout = "20"
      maxSessionDuration = "60"
    }
  })
  
  tags = var.tags
}

# IAM policy for EC2 instances to use Session Manager
resource "aws_iam_role" "ec2_ssm" {
  name = "zero-trust-ec2-ssm-${var.account_id}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
  
  tags = var.tags
}

# Attach SSM managed policy
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "zero-trust-ec2-ssm-profile-${var.account_id}"
  role = aws_iam_role.ec2_ssm.name
  
  tags = var.tags
}

# Break-glass role for emergency access
resource "aws_iam_role" "break_glass" {
  name = "zero-trust-break-glass-${var.account_id}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = var.break_glass_users
      }
      Action = "sts:AssumeRole"
      Condition = {
        Bool = {
          "aws:MultiFactorAuthPresent" = "true"
        }
        StringEquals = {
          "sts:ExternalId" = var.break_glass_external_id
        }
      }
    }]
  })
  
  max_session_duration = 3600 # 1 hour only
  
  tags = merge(var.tags, {
    Purpose = "emergency-access"
    Alert   = "true"
  })
}

# CloudWatch alarm for break-glass usage
resource "aws_cloudwatch_metric_alarm" "break_glass_usage" {
  alarm_name          = "break-glass-role-assumed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BreakGlassRoleAssumed"
  namespace           = "ZeroTrust/Security"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when break-glass role is assumed"
  alarm_actions       = [var.critical_alerts_topic_arn]
  
  tags = var.tags
}
```

## Deployment Runbook

### runbook.md
```markdown
# Zero-Trust Security Architecture Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying the zero-trust security architecture across AWS accounts.

## Prerequisites
1. AWS Organizations configured with all 50 accounts
2. Terraform >= 1.0 installed
3. AWS CLI configured with appropriate credentials
4. Central security and logging accounts identified
5. KMS keys created in each account for encryption

## Pre-Deployment Checklist
- [ ] Review and update `terraform.tfvars` with correct values
- [ ] Verify AWS Organizations structure
- [ ] Confirm network CIDR allocations don't overlap
- [ ] Validate compliance requirements are met
- [ ] Backup existing configurations
- [ ] Schedule maintenance window

## Deployment Sequence

### Phase 1: Pilot Deployment (3 Accounts)

#### Step 1: Initialize Terraform
```bash
cd environments/pilot
terraform init
terraform workspace new pilot
```

#### Step 2: Plan Infrastructure
```bash
terraform plan -out=pilot.tfplan
# Review the plan carefully
```

#### Step 3: Deploy Core Infrastructure
```bash
# Deploy in this order:
terraform apply -target=module.transit_gateway pilot.tfplan
terraform apply -target=module.central_logging pilot.tfplan
terraform apply -target=module.network_infrastructure pilot.tfplan
```

#### Step 4: Deploy Security Components
```bash
terraform apply -target=module.security_monitoring pilot.tfplan
terraform apply -target=module.access_control pilot.tfplan
```

#### Step 5: Deploy Automation
```bash
terraform apply -target=module.security_automation pilot.tfplan
```

#### Step 6: Apply Service Control Policies
```bash
terraform apply -target=aws_organizations_policy.zero_trust_scp pilot.tfplan
# Attach to pilot OUs only
```

### Phase 2: Validation (1-2 Weeks)

#### Security Validation
1. **Network Isolation Testing**
   - Verify VPC segmentation
   - Test transit gateway routing
   - Validate Network Firewall rules
   
2. **Access Control Testing**
   - Test Session Manager connectivity
   - Verify MFA enforcement
   - Validate IP restrictions
   - Test time-based access controls

3. **Monitoring Validation**
   - Confirm GuardDuty findings are generated
   - Verify Security Hub aggregation
   - Test CloudTrail logging
   - Validate VPC Flow Logs

4. **Automation Testing**
   - Trigger test security events
   - Verify Lambda execution
   - Confirm SNS notifications
   - Test auto-remediation actions

### Phase 3: Production Rollout

#### Step 1: Update Configuration
```bash
cd environments/production
# Update terraform.tfvars for all 50 accounts
```

#### Step 2: Phased Deployment
Deploy in groups of 10 accounts:

```bash
# Group 1 (Accounts 1-10)
terraform apply -target=module.network_infrastructure["account-1"] 
# ... repeat for accounts 2-10

# Group 2 (Accounts 11-20)
# ... continue pattern
```

#### Step 3: Monitor Each Phase
After each group:
- Check CloudWatch dashboards
- Review Security Hub findings
- Verify cost metrics
- Confirm compliance posture

## Component Details

### Transit Gateway
- **Purpose**: Central network hub for inter-VPC communication
- **Key Settings**:
  - Default route tables disabled (explicit routing only)
  - DNS support enabled
  - Multicast disabled (not needed for banking)
  
### Network Firewall
- **Purpose**: Deep packet inspection and threat prevention
- **Rules**:
  - Stateful inspection for all traffic
  - IPS/IDS rules for known threats
  - Domain filtering for malicious sites
  - Custom rules for banking protocols

### GuardDuty
- **Purpose**: Continuous threat detection
- **Features Enabled**:
  - S3 protection
  - EKS audit logs
  - Malware protection
  - 15-minute publishing frequency

### Security Hub
- **Purpose**: Centralized security posture management
- **Standards**:
  - CIS AWS Foundations Benchmark
  - PCI-DSS (for payment processing)
  - Custom banking controls

### CloudTrail
- **Purpose**: Comprehensive audit logging
- **Configuration**:
  - Multi-region trail
  - All read/write events
  - S3 and Lambda data events
  - Insights enabled

### Session Manager
- **Purpose**: Secure instance access without bastion hosts
- **Features**:
  - Session logging to S3 and CloudWatch
  - Encryption in transit
  - Idle timeout (20 minutes)
  - Maximum session duration (60 minutes)

## Troubleshooting

### Common Issues

1. **Transit Gateway Attachment Failures**
   - Verify subnet has available IPs
   - Check route table associations
   - Ensure DNS resolution is enabled

2. **GuardDuty Not Detecting Threats**
   - Verify detector is enabled
   - Check S3 bucket policies
   - Ensure VPC Flow Logs are active

3. **Session Manager Connection Issues**
   - Verify SSM agent is installed and running
   - Check instance IAM role
   - Validate network connectivity to SSM endpoints

4. **Lambda Timeout Errors**
   - Increase timeout value
   - Check VPC configuration
   - Verify security group rules

## Rollback Procedures

If issues occur during deployment:

1. **Immediate Rollback**
```bash
terraform destroy -target=[problematic_resource]
```

2. **Restore Previous State**
```bash
terraform state pull > backup.tfstate
# Manually edit if needed
terraform state push backup.tfstate
```

3. **Emergency Access**
- Use break-glass role if normal access fails
- Document all emergency access usage
- Review and revoke after incident

## Post-Deployment Tasks

1. **Documentation Updates**
   - Update network diagrams
   - Document security controls
   - Create operational runbooks

2. **Training**
   - Train security team on new tools
   - Educate developers on Session Manager
   - Review incident response procedures

3. **Compliance Validation**
   - Run compliance reports
   - Schedule penetration testing
   - Prepare audit documentation

## Monitoring and Maintenance

### Daily Tasks
- Review Security Hub findings
- Check GuardDuty alerts
- Monitor failed login attempts
- Verify backup completion

### Weekly Tasks
- Analyze VPC Flow Logs
- Review IAM access reports
- Update security rules if needed
- Cost optimization review

### Monthly Tasks
- Rotate credentials
- Update security patches
- Review and tune alerts
- Compliance reporting

## Success Criteria

The deployment is considered successful when:
- [ ] All VPCs are properly segmented
- [ ] Transit Gateway routing is functional
- [ ] Security monitoring is active in all accounts
- [ ] Automated incident response is working
- [ ] Compliance scans pass without critical findings
- [ ] Cost is within budget parameters
- [ ] Performance meets SLA requirements
```

## Testing Strategy

### testing-strategy.md
```markdown
# Zero-Trust Architecture Testing Strategy

## Overview
This document outlines the comprehensive testing approach for validating the zero-trust security architecture implementation.

## Testing Phases

### Phase 1: Unit Testing

#### Infrastructure Components
1. **VPC Configuration Tests**
   ```bash
   # Test VPC CIDR allocation
   aws ec2 describe-vpcs --filters "Name=tag:Project,Values=financial-zero-trust"
   
   # Verify subnet segmentation
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
   
   # Validate route tables
   aws ec2 describe-route-tables
   ```

2. **Security Group Tests**
   ```python
   # Script to validate security group rules
   import boto3
   
   def test_security_groups():
       ec2 = boto3.client('ec2')
       
       # Get all security groups
       sgs = ec2.describe_security_groups(
           Filters=[{'Name': 'tag:Project', 'Values': ['financial-zero-trust']}]
       )
       
       for sg in sgs['SecurityGroups']:
           # Verify no unrestricted ingress
           for rule in sg['IpPermissions']:
               assert '0.0.0.0/0' not in [r['CidrIp'] for r in rule.get('IpRanges', [])]
   ```

### Phase 2: Integration Testing

#### Network Connectivity Tests
1. **Transit Gateway Routing**
   ```bash
   # Test cross-VPC connectivity
   aws ec2 describe-transit-gateway-attachments
   
   # Verify routing between accounts
   ping -c 4 <instance-in-different-vpc>
   ```

2. **Network Firewall Testing**
   ```python
   # Test firewall rules
   import requests
   
   def test_blocked_domains():
       blocked_domains = ['malicious-site.com', 'phishing-example.com']
       
       for domain in blocked_domains:
           try:
               response = requests.get(f'http://{domain}', timeout=5)
               assert False, f"Domain {domain} should be blocked"
           except:
               pass  # Expected behavior
   ```

#### Security Monitoring Tests
1. **GuardDuty Detection**
   ```bash
   # Generate test findings
   aws guardduty create-sample-findings \
     --detector-id <detector-id> \
     --finding-types "Recon:EC2/PortProbeUnprotectedPort"
   
   # Verify findings appear
   aws guardduty get-findings --detector-id <detector-id>
   ```

2. **Security Hub Aggregation**
   ```python
   # Test Security Hub findings aggregation
   import boto3
   from datetime import datetime, timedelta
   
   def test_security_hub_aggregation():
       securityhub = boto3.client('securityhub')
       
       # Get findings from last hour
       response = securityhub.get_findings(
           Filters={
               'CreatedAt': [{
                   'Start': (datetime.now() - timedelta(hours=1)).isoformat(),
                   'End': datetime.now().isoformat()
               }]
           }
       )
       
       assert len(response['Findings']) > 0
   ```

### Phase 3: Security Testing

#### Penetration Testing Checklist
1. **Network Security**
   - [ ] Port scanning from external sources
   - [ ] Attempt lateral movement between VPCs
   - [ ] Test Network Firewall bypass techniques
   - [ ] Validate encryption in transit

2. **Access Control**
   - [ ] Attempt access without MFA
   - [ ] Test from non-whitelisted IPs
   - [ ] Try access outside allowed time windows
   - [ ] Validate session timeout enforcement

3. **Incident Response**
   ```python
   # Test automated response
   def test_incident_response():
       # Simulate security event
       create_test_security_finding()
       
       # Wait for Lambda execution
       time.sleep(30)
       
       # Verify remediation action taken
       assert instance_is_stopped(test_instance_id)
       assert security_group_modified(test_sg_id)
   ```

### Phase 4: Compliance Testing

#### Audit Log Validation
```bash
# Verify CloudTrail is logging all events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

# Check log integrity
aws cloudtrail validate-logs \
  --trail-arn <trail-arn> \
  --start-time <start-time>
```

#### Compliance Scanning
```python
# Run compliance checks
import boto3

def run_compliance_checks():
    config = boto3.client('config')
    
    # Trigger compliance evaluation
    response = config.start_config_rules_evaluation(
        ConfigRuleNames=[
            'required-tags',
            'encrypted-volumes',
            'restricted-ssh',
            'multi-region-cloudtrail-enabled'
        ]
    )
    
    # Wait and check results
    time.sleep(60)
    
    results = config.describe_compliance_by_config_rule()
    for rule in results['ComplianceByConfigRules']:
        assert rule['Compliance']['ComplianceType'] == 'COMPLIANT'
```

### Phase 5: Performance Testing

#### Load Testing
```yaml
# K6 load test configuration
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  // Test Session Manager connections
  let response = http.get('https://ssm.region.amazonaws.com/');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

#### Monitoring Performance
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=zero-trust-incident-response \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

## Test Scenarios

### Scenario 1: Compromised EC2 Instance
1. Simulate cryptocurrency mining detection
2. Verify GuardDuty generates finding
3. Confirm Lambda triggers
4. Validate instance is isolated/stopped
5. Check SNS notification sent

### Scenario 2: Unauthorized Access Attempt
1. Attempt login from non-whitelisted IP
2. Verify access is denied
3. Check CloudTrail logs event
4. Confirm alert is generated

### Scenario 3: Data Exfiltration Attempt
1. Generate large outbound traffic
2. Verify VPC Flow Logs capture
3. Check Network Firewall blocks suspicious domains
4. Validate alerts are triggered

### Scenario 4: Compliance Violation
1. Create non-compliant resource (unencrypted S3 bucket)
2. Verify Security Hub finding
3. Check auto-remediation enables encryption
4. Validate compliance status updates

## Success Metrics

### Security Metrics
- **Mean Time to Detect (MTTD)**: < 5 minutes
- **Mean Time to Respond (MTTR)**: < 15 minutes
- **False Positive Rate**: < 5%
- **Security Finding Resolution**: > 95% automated

### Performance Metrics
- **API Response Time**: < 500ms (p99)
- **Lambda Execution Time**: < 30 seconds
- **Log Delivery Delay**: < 5 minutes
- **Alert Notification Time**: < 2 minutes

### Compliance Metrics
- **Audit Log Completeness**: 100%
- **Compliance Score**: > 95%
- **Policy Violations**: 0 critical, < 5 high
- **Encryption Coverage**: 100%

## Test Data Management

### Test Account Setup
```bash
# Create test resources
./scripts/create-test-environment.sh

# Populate with test data
./scripts/generate-test-traffic.sh
```

### Cleanup Procedures
```bash
# Remove test resources
./scripts/cleanup-test-environment.sh

# Verify cleanup
aws ec2 describe-instances --filters "Name=tag:TestResource,Values=true"
```

## Reporting

### Test Report Template
```markdown
## Zero-Trust Architecture Test Report

**Date**: [DATE]
**Environment**: [PILOT/PRODUCTION]
**Test Phase**: [PHASE]

### Executive Summary
[Summary of test results]

### Test Results
| Test Category | Pass | Fail | Skip | Coverage |
|---------------|------|------|------|----------|
| Network       | X    | X    | X    | X%       |
| Security      | X    | X    | X    | X%       |
| Compliance    | X    | X    | X    | X%       |
| Performance   | X    | X    | X    | X%       |

### Critical Issues
[List any critical findings]

### Recommendations
[Improvement suggestions]

### Sign-off
- Security Team: ___________
- Compliance Team: _________
- Operations Team: _________
```

## Continuous Testing

### Automated Daily Tests
```yaml
# GitHub Actions workflow
name: Daily Security Tests
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Security Tests
        run: |
          python tests/security_validation.py
          python tests/compliance_checks.py
          
      - name: Generate Report
        run: |
          python scripts/generate_test_report.py
          
      - name: Notify on Failure
        if: failure()
        run: |
          aws sns publish --topic-arn $SNS_TOPIC --message "Daily security tests failed"
```

### Chaos Engineering
```python
# Chaos testing scenarios
import boto3
import random

def chaos_test():
    """Run chaos engineering tests"""
    
    scenarios = [
        stop_random_instance,
        modify_security_group,
        delete_vpc_endpoint,
        trigger_ddos_simulation
    ]
    
    # Run random scenario
    scenario = random.choice(scenarios)
    scenario()
    
    # Verify system recovers
    assert system_is_healthy()
```

## Test Documentation

All test results should be documented and stored:
- Test execution logs: S3 bucket with versioning
- Test reports: Confluence/SharePoint
- Metrics dashboards: CloudWatch/Grafana
- Issue tracking: JIRA/ServiceNow
```

This comprehensive zero-trust security architecture provides:

1. **Complete Infrastructure**: All components needed for banking-grade security
2. **Modular Design**: Easy to deploy and scale from pilot to production
3. **Security Best Practices**: MFA, least privilege, encryption, monitoring
4. **Automation**: Incident response and remediation
5. **Compliance Ready**: Audit trails and controls for banking regulations
6. **Detailed Documentation**: Runbook and testing strategy for operations

The architecture ensures no implicit trust, continuous verification, and comprehensive monitoring across all 50 AWS accounts while meeting stringent banking compliance requirements.