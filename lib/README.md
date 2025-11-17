```markdown
# Secure Infrastructure Baseline for Financial Services

This CDK application deploys a comprehensive security baseline infrastructure that meets SOC2 and PCI-DSS compliance requirements for financial services organizations.

## Architecture

The solution implements a defense-in-depth security model with the following components:

### 1. Encryption Layer
- **KMS Customer-Managed Key**: Automatic key rotation enabled
- All data encrypted at rest using KMS
- All data encrypted in transit using TLS 1.2+

### 2. Network Layer
- **VPC**: Multi-AZ deployment across 3 availability zones
- **Private Subnets**: Isolated subnets with no internet gateway
- **VPC Flow Logs**: All traffic logged to encrypted S3 bucket
- **Security Groups**: Explicit egress rules, HTTPS-only outbound

### 3. Data Layer
- **RDS Aurora MySQL Serverless V2**:
  - Encrypted at rest with KMS
  - Multi-AZ for high availability
  - Automated backups with 30-day retention
  - Deletion protection enabled
  - TLS 1.2+ enforcement via parameter group
- **S3 Buckets**:
  - Application data with versioning and lifecycle policies
  - Audit logs with 90-day retention
  - VPC flow logs with 90-day retention
  - AWS Config logs with 365-day retention
  - All encrypted with KMS, public access blocked

### 4. Identity and Access Management
- **IAM Roles**:
  - Least-privilege principles
  - 1-hour maximum session duration
  - MFA required for destructive operations
  - Explicit deny for unencrypted uploads

### 5. Monitoring and Alerting
- **CloudWatch Logs**: Encrypted log groups for security and audit events
- **Metric Filters**: Detect unauthorized API calls and privilege escalation
- **CloudWatch Alarms**: Trigger SNS notifications for security events
- **SNS Topics**: Encrypted message delivery for alerts

### 6. Compliance and Governance
- **AWS Config**: Continuous compliance monitoring
- **Config Rules**:
  - EBS encryption enforcement
  - S3 public access prohibition
  - RDS storage encryption verification
  - IAM password policy compliance
- **Systems Manager Parameter Store**: Secure configuration storage

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18 or later
- AWS CDK CLI installed: `npm install -g aws-cdk`
- Docker (for bundling Lambda functions if needed)

## Deployment

### 1. Install Dependencies

```bash
npm install
