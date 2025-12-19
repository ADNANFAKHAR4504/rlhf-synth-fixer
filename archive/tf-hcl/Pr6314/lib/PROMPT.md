# Zero-Trust Security Infrastructure Project

## Project Overview

We need to build a secure AWS infrastructure that follows zero-trust security principles for handling sensitive workloads. This project was initiated following a security audit at a financial services company that highlighted the need for stricter security controls.

## What We're Building

We're creating a Terraform configuration that sets up a completely isolated and secure AWS environment. Here's what the infrastructure will include:

### Network Security
- A Virtual Private Cloud (VPC) with private subnets spread across available availability zones (2 AZs in us-west-1)
- No direct internet access - everything stays private
- VPC endpoints to securely connect to AWS services like S3, EC2, SSM, and CloudWatch Logs

### Encryption & Key Management
- Customer-managed KMS encryption keys that automatically rotate every 90 days
- All data encrypted both at rest and in transit
- Proper key policies to control access

### Storage & Logging
- S3 buckets for application data and audit logs, all encrypted
- CloudWatch Log groups for comprehensive audit trails
- 90-day log retention policy for compliance

### Access Control
- IAM roles with strict permission boundaries
- Session limits of 1 hour maximum
- Principle of least privilege access

### Security Monitoring
- AWS Config rules to continuously monitor compliance
- Automatic checks for S3 encryption, password policies, and unused access keys
- Automated remediation for security violations

### Network Rules
- Security groups that only allow HTTPS traffic (port 443)
- No broad network access (no 0.0.0.0/0 rules)
- Traffic restricted to specific IP ranges

## Deployment Details

- **Region**: US West 1 (us-west-1)
- **Availability Zones**: 3 zones for high availability
- **Compliance**: FIPS endpoints where available
- **Architecture**: Zero-trust model with no internet gateways

## Key Requirements

The infrastructure must meet these security standards:

- **Encryption**: All S3 buckets use customer-managed KMS keys with automatic rotation
- **Network Isolation**: All AWS service communication goes through VPC endpoints
- **Access Control**: IAM roles follow least privilege with time-limited sessions
- **Network Security**: Explicit security group rules with no open internet access
- **Audit Logging**: CloudWatch Logs retain audit data for exactly 90 days with encryption
- **Compliance**: AWS Config automatically fixes non-compliant resources

## Expected Deliverables

The final Terraform configuration should include:
- Proper resource dependencies and relationships
- FIPS endpoint configurations where supported
- Output values for key infrastructure components (KMS key ARNs, VPC endpoint IDs, Config rule ARNs)
- Complete documentation and implementation guide