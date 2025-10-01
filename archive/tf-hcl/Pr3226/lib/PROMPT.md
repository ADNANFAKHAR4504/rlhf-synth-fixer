# Build PCI-DSS Compliant Payment Processing Infrastructure with Terraform

## Project Overview

I'm working on a critical infrastructure project for a financial institution that processes credit card payments. We handle 75,000 daily transactions and need to achieve full PCI-DSS compliance while maintaining enterprise-grade security. This isn't just about meeting checkboxes—it's about protecting customer payment data with the highest security standards.

## The Challenge

Payment card data is among the most sensitive information we handle. PCI-DSS compliance is mandatory, not optional, and requires defense-in-depth security controls across every layer of infrastructure. A single misconfiguration could expose cardholder data, result in massive fines, breach of trust, and regulatory consequences.

I need production-ready Terraform infrastructure in **us-east-1** that implements comprehensive security controls while remaining practical for a high-volume payment processing environment.

## Core Infrastructure Requirements

### Network Architecture (VPC 10.16.0.0/16)

- **Multi-tier subnet design across 3 AZs**:
  - DMZ/Public tier (10.16.0.0/20): ALB, NAT Gateways
  - Application tier (10.16.16.0/20): Private subnets for compute
  - Database tier (10.16.32.0/20): Isolated RDS subnets
  - Management tier (10.16.48.0/20): Admin and monitoring tools
- **Transit Gateway**: Network segmentation between VPCs
- **VPC Flow Logs**: Complete network traffic visibility
- **VPC Endpoints**: PrivateLink for S3, DynamoDB, Secrets Manager, KMS, SSM, CloudWatch, STS

### Database Layer

- **RDS Aurora MySQL cluster**:
  - Multi-AZ with 3 read replicas for high availability
  - Encrypted with dedicated KMS key (database tier)
  - 35-day automated backup retention (PCI-DSS requirement)
  - Enhanced monitoring and Performance Insights
  - Audit logs shipped to CloudWatch
  - Deletion protection enabled
  - Force SSL connections

### Security Controls - Defense in Depth

**Network Security:**

- Security Groups with strict rules—NO 0.0.0.0/0 egress (specific destinations only)
- Separate security groups per tier (ALB, app, database, management)
- Network ACLs providing subnet-level isolation
- Explicit allow/deny rules for each tier

**Identity & Access Management:**

- IAM roles with least privilege access
- Permission boundaries preventing privilege escalation
- AWS managed policies only (no custom inline policies)
- MFA required for all human access
- Condition keys for source IP and time-based access

**Encryption - Five Separate KMS Keys:**

- `dmz-tier-key`: ALB logs, public resources
- `app-tier-key`: Application data, EBS volumes
- `db-tier-key`: Database encryption
- `log-tier-key`: CloudWatch Logs, CloudTrail
- `backup-tier-key`: Backup encryption
- All keys with rotation enabled and service-specific policies

**Web Application Firewall:**

- AWS WAF with OWASP Top 10 rules
- Rate limiting (10,000 requests per 5 min per IP)
- SQL injection and XSS protection
- Geo-blocking configuration
- Request body size restrictions

### Compliance & Monitoring Stack

**Security Services:**

- **GuardDuty**: Threat detection with S3 protection
- **Security Hub**: PCI-DSS v3.2.1 standard + AWS Foundational Security Best Practices
- **AWS Config**: Continuous compliance checking with rules for:
  - encrypted-volumes
  - rds-encryption-enabled
  - s3-bucket-server-side-encryption-enabled
  - cloudtrail-enabled
  - multi-region-cloudtrail-enabled
  - iam-password-policy
  - access-keys-rotated
- **Amazon Macie**: Automated PII/PAN detection in S3

**Audit Trail:**

- **CloudTrail**: Multi-region trail with log file validation, encrypted with KMS, delivered to S3 with MFA delete
- **CloudWatch Logs**: Metric filters for security events:
  - Unauthorized API calls
  - Root account usage
  - IAM/Security Group/NACL changes
  - Failed console logins
- **VPC Flow Logs**: All accept/reject traffic sent to CloudWatch
- **Log retention**: 365 days minimum (PCI-DSS requirement)

**Secrets Management:**

- AWS Secrets Manager with automatic 30-day rotation
- Database credentials, API keys, third-party credentials
- Lambda functions for rotation automation
- All secrets encrypted with KMS

### Access Management - Zero SSH

- **Systems Manager Session Manager**: No SSH/RDP access allowed
- Session logging to S3 and CloudWatch
- Complete audit trail for all access
- MFA enforcement for human access

### Automated Remediation

- **Lambda functions** for:
  - Auto-remediate non-compliant security groups
  - Auto-enable encryption on new S3 buckets
  - Automated resource tagging
  - Security event response
- **EventBridge rules** triggering on:
  - Config rule violations
  - GuardDuty findings
  - Security Hub critical findings

### Alerting System

- **SNS Topics**:
  - `security-alerts`: Critical security events
  - `compliance-alerts`: Config violations
  - `operational-alerts`: Service health
- **CloudWatch Alarms** for:
  - Database metrics (CPU, memory, connections)
  - ALB target health
  - Lambda errors
  - Unusual API activity

### Backup & Disaster Recovery

- **S3 buckets** with:
  - MFA delete on audit logs bucket
  - Versioning enabled
  - Cross-region replication for critical data
  - Lifecycle policies (Glacier after 90 days)
- **RDS backups**:
  - Automated daily snapshots
  - Cross-region snapshot copy
  - Point-in-time recovery enabled

## What I Need

Complete Terraform HCL configuration that implements this PCI-DSS compliant infrastructure. The code should be production-ready and pass all compliance checks.

### File Structure

Organize into logical modules:

- `main.tf`: Provider and core configuration
- `vpc.tf`: Network architecture
- `security-groups.tf` & `nacls.tf`: Network security
- `kms.tf`: Five KMS keys with proper policies
- `iam.tf`: Roles and policies
- `rds.tf`: Aurora MySQL cluster
- `waf.tf`: WAF rules
- `guardduty.tf`, `securityhub.tf`, `config.tf`, `macie.tf`: Security services
- `cloudtrail.tf` & `cloudwatch.tf`: Audit and monitoring
- `secrets.tf`: Secrets Manager
- `lambda.tf`: Remediation functions
- `endpoints.tf`: VPC endpoints
- `transit-gateway.tf`: Network segmentation
- `s3.tf` & `sns.tf`: Storage and notifications
- `variables.tf` & `outputs.tf`: Inputs and outputs

### Critical Implementation Details

**Security Group Example (No 0.0.0.0/0 egress):**

```hcl
resource "aws_security_group" "app_tier" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Application tier - PCI-DSS compliant"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from ALB only"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Strict egress - specific destinations only
  egress {
    description     = "MySQL to RDS"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  egress {
    description = "HTTPS to VPC endpoints"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Environment = var.environment
    Tier        = "Application"
    PCI_DSS     = "Requirement-1.2.1"
  }
}
```

**KMS Key with Service Permissions:**

```hcl
resource "aws_kms_key" "db_tier" {
  description             = "${var.project_name}-${var.environment}-db-tier-cmk"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-${var.environment}-db-tier-cmk"
    Tier    = "Database"
    PCI_DSS = "Requirement-3.4"
  }
}
```

### Variables Required

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
  default     = "pci-payment"
}

variable "environment" {
  description = "Environment (prod/staging/dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.16.0.0/16"
}

variable "backup_retention_days" {
  description = "Backup retention days (min 35 for PCI-DSS)"
  type        = number
  default     = 35
  validation {
    condition     = var.backup_retention_days >= 35
    error_message = "PCI-DSS requires minimum 35 days retention"
  }
}

variable "log_retention_days" {
  description = "Log retention days (min 365 for PCI-DSS)"
  type        = number
  default     = 365
}
```

## Success Criteria

When deployed, this infrastructure must:

- ✅ Pass all AWS Config PCI-DSS compliance rules
- ✅ Pass Security Hub PCI-DSS v3.2.1 checks
- ✅ Encrypt all data at rest and in transit
- ✅ Provide complete audit trail (CloudTrail + Flow Logs)
- ✅ Implement network segmentation with strict firewall rules
- ✅ Use separate KMS keys per tier
- ✅ Enable automated threat detection (GuardDuty)
- ✅ Require MFA for all human access
- ✅ Auto-rotate secrets every 30 days
- ✅ Maintain 35-day backup retention
- ✅ Keep 1-year log retention
- ✅ Block all SSH/RDP (Session Manager only)

## PCI-DSS Requirement Mapping

Tag resources to map to specific requirements:

- **Req 1**: Firewall configuration (SG, NACL, WAF)
- **Req 3**: Protect stored data (KMS, RDS encryption)
- **Req 4**: Encrypt transmission (TLS 1.2+, Force SSL)
- **Req 5**: Anti-malware (GuardDuty)
- **Req 6**: Secure systems (Security Hub, Config)
- **Req 7**: Restrict access (IAM, permission boundaries)
- **Req 8**: Authentication (IAM, MFA)
- **Req 10**: Track access (CloudTrail, CloudWatch, Flow Logs)
- **Req 11**: Test security (Config rules, automated compliance)

This infrastructure protects payment card data for 75,000 daily transactions while maintaining full PCI-DSS compliance. Every component is hardened, monitored, and auditable.
