# Zero-Trust Security Infrastructure for Payment Processing

Hey team,

We need to build a zero-trust network security architecture for a payment processing workload at our financial services company. The security team has asked us to create this infrastructure using **CloudFormation with JSON** to meet strict PCI-DSS compliance requirements. The business is concerned about data breaches and wants comprehensive security controls with encryption at every layer, network isolation, and continuous compliance monitoring.

The current situation is that we're launching a new payment processing system that handles sensitive cardholder data. Our security team requires zero-trust principles, which means no implicit trust, strict network segmentation, and verification at every layer. The compliance team needs full audit trails and automated security monitoring to satisfy PCI-DSS auditors. Traditional network security with perimeter defenses isn't enough anymore.

We've been tasked with implementing this entire security foundation as infrastructure as code so it can be deployed consistently and maintained over time. The infrastructure needs to support payment processing applications that will run on EC2 instances without any direct internet access, using AWS Systems Manager for secure management access.

## What we need to build

Create a zero-trust security infrastructure using **CloudFormation with JSON** for payment processing workloads in AWS.

### Core Requirements

1. **Network Foundation**
   - VPC with private subnets spanning 3 availability zones in us-east-1
   - Transit Gateway attachment for secure connectivity to other networks
   - No public subnets or internet gateways
   - Resource names must include environmentSuffix for uniqueness

2. **Traffic Inspection**
   - AWS Network Firewall deployed with firewall endpoints in each AZ
   - Stateful rule groups for comprehensive traffic inspection
   - All network traffic must route through firewall endpoints
   - Log all inspected traffic for audit purposes

3. **Encryption Key Management**
   - Separate KMS customer-managed keys for EBS, S3, and RDS
   - Enable automatic key rotation every 90 days
   - Appropriate key policies for each service
   - Keys must be destroyable (no Retain deletion policies)

4. **Identity and Access Management**
   - IAM roles for EC2 instances with least-privilege policies
   - No wildcard permissions in IAM policies
   - No SSH keys - use Systems Manager Session Manager for access
   - Instance profiles for EC2 with appropriate service permissions

5. **Network Monitoring**
   - Enable VPC Flow Logs for all network traffic
   - Encrypt flow logs with KMS customer-managed key
   - Store flow logs in S3 bucket with encryption
   - Flow log bucket must be destroyable

6. **Compliance Monitoring**
   - AWS Config enabled with security-focused rules
   - Include rules: encrypted-volumes, iam-password-policy
   - Use correct IAM role: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
   - Configure delivery channel to encrypted S3 bucket

7. **Threat Detection**
   - Enable GuardDuty detector for threat intelligence
   - WARNING: GuardDuty allows only ONE detector per AWS account per region
   - Consider using custom resource to check if detector already exists
   - Document manual cleanup requirements if needed

8. **Secure Instance Access**
   - VPC endpoints for AWS Systems Manager (ssm, ssmmessages, ec2messages)
   - Enable Session Manager for secure shell access
   - No SSH keys or bastion hosts required
   - VPC endpoints must be in private subnets

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use AWS native services only (no third-party marketplace)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region spanning 3 availability zones
- All resources must be destroyable (RemovalPolicy: Delete, no Retain policies)
- Include proper error handling and validation

### Deployment Requirements (CRITICAL)

1. **environmentSuffix Parameter**: Template must accept environmentSuffix parameter as string
2. **Destroyability**: All resources must use DeletionPolicy: Delete (FORBIDDEN: Retain)
3. **GuardDuty Limitation**: Only 1 detector per account/region - handle appropriately
4. **AWS Config IAM**: Use service-role prefix in policy ARN
5. **No Static Values**: Use parameters and pseudo-parameters (AWS::AccountId, AWS::Region)

### Constraints

- Private subnets only, no direct internet access
- All data encrypted with KMS customer-managed keys
- Network traffic flows through AWS Network Firewall endpoints
- Least-privilege IAM policies with no wildcards
- AWS Config for continuous compliance monitoring
- Systems Manager Session Manager for instance access only
- CloudFormation drift detection enabled
- Automatic KMS key rotation every 90 days
- All resources must be fully destroyable for testing

## Success Criteria

- **Functionality**: Zero-trust network deployed across 3 AZs with all security controls
- **Performance**: Network Firewall processes traffic without bottlenecks
- **Reliability**: Highly available across multiple availability zones
- **Security**: All data encrypted, least-privilege access, no internet exposure
- **Compliance**: AWS Config rules active, VPC Flow Logs enabled, GuardDuty monitoring
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Stack can be completely deleted without manual intervention
- **Code Quality**: CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation template in JSON format
- Parameters for environmentSuffix and configuration
- VPC with private subnets across 3 AZs
- Transit Gateway attachment resource
- AWS Network Firewall with stateful rules
- KMS keys for EBS, S3, RDS with automatic rotation
- IAM roles and policies for EC2 instances
- VPC Flow Logs with KMS encryption
- AWS Config with security rules (encrypted-volumes, iam-password-policy)
- GuardDuty detector (with account-level limitation handling)
- Systems Manager VPC endpoints (ssm, ssmmessages, ec2messages)
- Outputs for critical resource ARNs and endpoints
- Comprehensive documentation in README
