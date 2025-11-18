# Zero-Trust Payment Processing Infrastructure

Hey team,

We need to build secure infrastructure for our payment processing workloads. The business is serious about this - we're talking PCI-DSS Level 1 compliance and SOC 2 Type II requirements. They want a full zero-trust security architecture deployed in us-east-1.

The security team has been crystal clear about their requirements. No internet-facing resources, everything routed through VPC endpoints and Network Firewall. They want complete network isolation with private subnets only, comprehensive encryption everywhere, and immutable audit trails. This is going into production for financial services, so we need to get it right.

I've been asked to build this using **CDKTF with Python**. The infrastructure needs to span 3 availability zones for high availability and include all the compliance controls our auditors are expecting.

## What we need to build

Create a zero-trust security framework using **CDKTF with Python** for payment processing infrastructure in us-east-1.

### Core Requirements

1. **Network Isolation**
   - VPC with 3 private subnets across different availability zones
   - NO internet gateway
   - Complete network isolation from public internet
   - All resources must include environmentSuffix in names for uniqueness

2. **Network Security**
   - AWS Network Firewall with stateful rules
   - Allow ONLY HTTPS traffic to specific AWS service endpoints
   - Deny all other traffic by default
   - Traffic inspection and logging

3. **Encryption at Rest**
   - Customer-managed KMS keys for EBS, S3, and RDS encryption
   - Automatic key rotation enabled
   - Separate keys for each service type
   - All keys must be destroyable (no RETAIN policies)

4. **Audit Logging**
   - S3 buckets with object lock enabled
   - Versioning enabled on audit buckets
   - MFA delete protection
   - Immutable log storage for compliance

5. **VPC Endpoints**
   - Private endpoints for S3, DynamoDB, EC2, and Systems Manager
   - All AWS service communication through PrivateLink
   - No data traversing public internet

6. **Monitoring and Compliance**
   - CloudWatch Logs with 7-year retention
   - Log integrity validation enabled
   - Comprehensive logging for all services

7. **IAM Security**
   - IAM roles with 1-hour maximum session limits
   - External ID requirements for role assumption
   - Least privilege access controls

8. **Network Security Groups**
   - Default deny all traffic
   - Minimal allow rules for specific application ports only
   - Explicit deny rules for security hardening

9. **Parameter Storage**
   - Systems Manager Parameter Store for configuration
   - KMS encryption for all parameters
   - Secure storage for non-sensitive configuration data

10. **Resource Tagging**
    - Mandatory tags on all resources
    - Required tags: cost center, data classification, compliance scope
    - Consistent tagging for cost tracking and compliance auditing

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS Network Firewall for traffic inspection
- Use customer-managed KMS keys with automatic rotation
- Use S3 with object lock and versioning for audit logs
- Use VPC endpoints for S3, DynamoDB, EC2, Systems Manager
- Use CloudWatch Logs with log integrity validation
- Use IAM roles with session limits and external ID
- Use Security Groups with explicit deny rules
- Use Systems Manager Parameter Store with KMS encryption
- Deploy to us-east-1 region across 3 availability zones
- Resource names must include environmentSuffix for uniqueness
- All resources must be destroyable (no Retain policies or deletion protection)
- Modular structure: separate files for networking, security, monitoring, compliance
- Use data sources for AMI lookups and availability zone discovery

### Deployment Requirements (CRITICAL)

**environmentSuffix Requirement**:
- ALL named resources (VPC, subnets, KMS keys, S3 buckets, security groups, etc.) MUST include environmentSuffix
- Pattern: `resource-name-{environment_suffix}`
- This ensures uniqueness across parallel deployments and testing environments
- Example: `payment-vpc-{environment_suffix}`, `audit-logs-{environment_suffix}`

**Destroyability Requirement**:
- ALL resources MUST be destroyable after testing
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain
- NO deletion_protection or deletionProtection: true flags
- S3 buckets must allow deletion (no lifecycle rules preventing destruction)
- KMS keys must allow deletion (schedule deletion, not retention)
- RDS instances must have skip_final_snapshot: true

**Service-Specific Requirements**:
- IAM Identity Center: Document that this requires manual setup at AWS Organization level
- KMS Keys: Use schedule deletion, allow 7-day waiting period minimum
- S3 Object Lock: Configure for compliance mode but allow bucket deletion
- CloudWatch Logs: Set retention to 7 years but allow log group deletion
- Network Firewall: Ensure firewall policy and rule groups are deletable

### Constraints

- PCI-DSS Level 1 compliance mandatory
- SOC 2 Type II audit requirements
- Zero-trust architecture principles (verify everything, trust nothing)
- Encryption at rest mandatory for all data stores
- Encryption in transit mandatory (TLS 1.2+ only)
- MFA delete on audit logs
- IAM session duration: 1 hour maximum
- No internet-facing resources allowed
- All AWS service communication through VPC endpoints
- All resources must be destroyable for testing cleanup
- Include proper error handling and logging
- Follow AWS Well-Architected Framework security pillar

## Success Criteria

- Functionality: Complete zero-trust network architecture with no internet access
- Security: All encryption, IAM, and network controls implemented correctly
- Compliance: PCI-DSS and SOC 2 audit logging and controls in place
- High Availability: Resources distributed across 3 availability zones
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be cleanly deleted after testing
- Code Quality: Clean Python code, well-tested, comprehensive documentation
- Modularity: Separate files for networking, security, monitoring, compliance concerns

## What to deliver

- Complete CDKTF Python implementation with modular structure
- VPC with 3 private subnets (no internet gateway)
- AWS Network Firewall with HTTPS-only stateful rules
- Customer-managed KMS keys for EBS, S3, RDS (with auto-rotation)
- S3 buckets with object lock, versioning, MFA delete
- VPC endpoints for S3, DynamoDB, EC2, Systems Manager
- CloudWatch Logs with 7-year retention and integrity validation
- IAM roles with 1-hour session limits and external ID
- Security groups with explicit deny rules
- Systems Manager parameters with KMS encryption
- Mandatory resource tags (cost center, data classification, compliance scope)
- Unit tests for all infrastructure components
- Integration tests verifying security controls
- Documentation with deployment instructions
- Outputs: VPC endpoint DNS names, KMS key ARNs, S3 bucket names
