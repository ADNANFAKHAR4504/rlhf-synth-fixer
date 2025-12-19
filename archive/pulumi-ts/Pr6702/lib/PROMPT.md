Hey team,

We need to build a zero-trust security framework for our payment processing infrastructure. The business is working with a financial services company that's shifting to zero-trust architecture for their payment workloads, and they need strict network segmentation, encrypted traffic flows, and comprehensive audit logging while maintaining PCI-DSS compliance standards.

The current challenge is that their payment processing systems need to operate in a completely isolated environment with no direct internet access. Everything needs to flow through AWS PrivateLink endpoints, all data must be encrypted at rest and in transit using customer-managed KMS keys, and they need detailed audit trails of all network activity and authentication attempts. The business wants to eliminate SSH key management entirely and use AWS Systems Manager for secure access.

They're also dealing with complex IAM requirements around attribute-based access control using session tags to enforce data classification and cost allocation policies. Database credentials need automatic rotation every 30 days, and they need CloudWatch metric filters to alert on any failed authentication attempts. This is for production workloads handling sensitive payment data, so security is non-negotiable.

## What we need to build

Create a zero-trust security framework using **Pulumi with TypeScript** that implements isolated network architecture with comprehensive security controls for payment processing infrastructure.

### Core Requirements

1. **Isolated Network Infrastructure**
   - Create VPC with private subnets across 3 availability zones (us-east-1)
   - No internet gateway - completely isolated from public internet
   - Private subnets only, no public subnets
   - Network ACLs with numbered rules blocking all traffic except explicitly allowed flows
   - VPC Flow Logs encrypted with KMS stored in S3 with 90-day retention

2. **AWS PrivateLink Endpoints**
   - VPC endpoints for S3 (gateway endpoint)
   - VPC endpoints for DynamoDB (gateway endpoint)
   - VPC endpoint for Secrets Manager (interface endpoint)
   - All endpoints encrypted with customer-managed KMS keys
   - Security groups restricting access to HTTPS (443) only

3. **Security Groups and Network Controls**
   - Security groups with explicit allow rules only
   - Allow port 443 for HTTPS traffic
   - Allow port 5432 for RDS PostgreSQL (if database workload included)
   - Deny all by default, whitelist specific ports
   - Stateful firewall rules for required traffic flows

4. **Encryption and Key Management**
   - Customer-managed KMS keys for all encryption
   - KMS key for VPC Flow Logs encryption
   - KMS key for Secrets Manager encryption
   - KMS key for S3 bucket encryption
   - KMS key policies with least privilege access
   - Key rotation enabled on all KMS keys

5. **IAM Attribute-Based Access Control (ABAC)**
   - IAM roles using session tags for access control
   - Session tags for 'Environment' attribute
   - Session tags for 'DataClassification' attribute
   - Session tags for 'CostCenter' attribute
   - IAM policies checking session tag values before granting access
   - Enforce tag-based permissions for S3, DynamoDB, Secrets Manager

6. **Secrets Management with Rotation**
   - AWS Secrets Manager for database credentials
   - Automatic rotation every 30 days
   - Lambda rotation function for credential updates
   - Secrets encrypted with customer-managed KMS key
   - Secret version tracking and auditing

7. **Audit Logging and Monitoring**
   - VPC Flow Logs for all network traffic
   - Flow logs stored in S3 with 90-day retention
   - CloudWatch Logs for application and system logs
   - CloudWatch metric filters for failed authentication attempts
   - CloudWatch alarms for security events
   - Log encryption with KMS

8. **Secure Access with Session Manager**
   - AWS Systems Manager Session Manager for bastion-less access
   - No SSH keys required
   - SSM agent on instances for secure shell access
   - Session logging to CloudWatch and S3
   - IAM policies controlling Session Manager access

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** region across 3 availability zones
- Use **VPC** with private subnets (10.0.0.0/16 CIDR)
- Use **VPC Endpoints** for S3, DynamoDB, Secrets Manager
- Use **Security Groups** and **Network ACLs** for network controls
- Use **KMS** customer-managed keys for all encryption
- Use **IAM** roles with ABAC using session tags
- Use **Secrets Manager** with 30-day rotation
- Use **CloudWatch Logs** with metric filters
- Use **SSM Session Manager** for secure access
- Use **VPC Flow Logs** with S3 storage
- Optional: **RDS PostgreSQL** for database workload (if needed)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: ALL named resources (VPC, subnets, security groups, KMS keys, IAM roles, S3 buckets, etc.) MUST include `${environmentSuffix}` variable for uniqueness
- **Destroyability Requirement**: All resources MUST be destroyable (no RemovalPolicy.RETAIN, no DeletionProtection flags)
- **GuardDuty Note**: Do NOT create GuardDuty detectors in code (account-level resource, one per account). Add comment to enable manually if needed
- **AWS Config Note**: If using AWS Config, use correct IAM policy: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
- **Lambda Runtime**: If using Lambda for Secrets Manager rotation, ensure Node.js 18+ compatibility with AWS SDK v3
- **RDS Settings**: If including RDS PostgreSQL, prefer Aurora Serverless v2 with skip_final_snapshot=true for destroyability
- **NAT Gateway**: Avoid NAT Gateways (use VPC Endpoints instead for cost optimization)
- **No Hardcoded Values**: No hardcoded environment names, account IDs, or regions

### Constraints

- Zero-trust architecture - no internet gateway, all traffic through PrivateLink
- PCI-DSS compliance required - encryption, audit logging, least privilege access
- Network isolation - private subnets only, no public endpoints
- Customer-managed encryption - all data encrypted with KMS keys
- Secure credential management - Secrets Manager with rotation
- Comprehensive audit trails - VPC Flow Logs, CloudWatch Logs
- Bastion-less access - SSM Session Manager only
- All resources must be destroyable (no Retain policies)
- No SSH key management - eliminate manual key distribution

## Success Criteria

- **Functionality**: Complete zero-trust network with isolated VPC, PrivateLink endpoints, and secure access
- **Security**: All traffic encrypted, KMS-managed keys, IAM ABAC with session tags, no public internet access
- **Compliance**: VPC Flow Logs with 90-day retention, CloudWatch metric filters, audit logging for PCI-DSS
- **Reliability**: Multi-AZ deployment across 3 availability zones, automatic secret rotation
- **Resource Naming**: All resources include environmentSuffix variable
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: TypeScript, well-tested, 100% coverage, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with private subnets across 3 AZs, no internet gateway
- VPC Endpoints for S3, DynamoDB, Secrets Manager with KMS encryption
- Security Groups with explicit allow rules (443, 5432)
- Network ACLs with numbered rules blocking all by default
- Customer-managed KMS keys for all encryption
- IAM roles with ABAC using session tags (Environment, DataClassification, CostCenter)
- Secrets Manager with 30-day rotation
- CloudWatch Logs with metric filters for failed authentication
- SSM Session Manager configuration
- VPC Flow Logs encrypted and stored in S3 (90-day retention)
- Unit tests for all components with mocks
- Integration tests validating deployed resources
- Documentation and deployment instructions