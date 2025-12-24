Create a comprehensive CloudFormation template for a secure AWS infrastructure demonstrating defense-in-depth security architecture across multiple AWS services in us-east-1.

## Architecture Requirements

### Network Infrastructure
Design a custom VPC with the following specifications:
- CIDR block: 10.0.0.0/16
- Public subnet (10.0.1.0/24) with internet gateway for external connectivity
- Private subnet (10.0.2.0/24) isolated from direct internet access
- Database subnet (10.0.3.0/24) for RDS placement
- VPC Flow Logs capturing ALL traffic (accept and reject) and sending to dedicated CloudWatch log group for security monitoring
- Create separate subnets in different availability zones for RDS subnet group

### Compute Layer
Provision EC2 instances with comprehensive security controls:
- Instance type: t3.micro (parameterized for flexibility)
- Placement: Private subnet for production isolation
- Security group rules: Allow inbound SSH (port 22) only from specific trusted CIDR range, all outbound traffic for updates
- IAM instance profile with least-privilege permissions to access specific S3 bucket prefixes
- EBS volume encryption using customer-managed KMS key
- Enable detailed CloudWatch monitoring for security metrics
- User data script to install CloudWatch agent for log aggregation

### Storage Layer
Configure S3 buckets with layered security:
- Application bucket with server-side encryption using KMS customer-managed key
- Separate logging bucket to receive access logs from application bucket
- Block all public access on both buckets
- Enable versioning for data protection and compliance
- Bucket policies allowing access only from IAM roles, denying unencrypted uploads
- Lifecycle policies for automatic log rotation
- Tags for cost allocation and security compliance tracking

### Database Layer
Deploy RDS MySQL instance with enterprise security:
- Engine: MySQL 8.0.35 or later
- Instance class: db.t3.micro
- Placement: Private database subnets with multi-AZ disabled for cost optimization
- Security group: Allow inbound MySQL (port 3306) only from EC2 security group
- Storage encryption at rest using dedicated KMS key for RDS
- Credentials stored in AWS Secrets Manager with automatic rotation capability
- Enhanced monitoring enabled with 60-second intervals
- Automated backups with 7-day retention period
- CloudWatch log exports for error and general logs
- Subnet group spanning multiple availability zones

### Secrets Management
Implement secure credential handling:
- Secrets Manager secret for RDS database credentials with automatic password generation
- Separate secret for API credentials with custom KMS encryption
- Lambda function for automatic credential rotation on a schedule
- Lambda execution role with permissions to read secrets, update RDS passwords, and write CloudWatch logs
- VPC endpoint for Secrets Manager to keep traffic within AWS network

### Encryption and Key Management
Establish comprehensive encryption strategy:
- Dedicated KMS customer-managed key for S3 encryption with key rotation enabled
- Separate KMS key for RDS encryption with granular IAM key policies
- KMS key aliases for easier management
- Key policies restricting usage to specific IAM roles and services
- CloudTrail logging of all KMS API calls for audit compliance

### Audit and Compliance
Enable comprehensive logging and monitoring:
- CloudTrail trail capturing all management events across the account
- CloudTrail logs encrypted with KMS and stored in dedicated S3 bucket
- CloudWatch log group for CloudTrail events with retention policies
- IAM role for CloudTrail to write logs to CloudWatch
- SNS topic for CloudTrail notifications
- VPC Flow Logs for network traffic analysis
- CloudWatch log groups for application and database logs

### Access Control
Implement least-privilege IAM policies:
- EC2 instance role with permissions limited to specific S3 bucket paths and CloudWatch metrics
- Lambda execution role for secret rotation with minimal required permissions
- RDS monitoring role for enhanced monitoring metrics
- Service-linked roles for VPC Flow Logs
- Resource-based policies on S3 buckets and KMS keys

## Technical Specifications

### Parameters
Provide the following configurable parameters:
- Environment: String with allowed values "dev" or "prod", default "dev"
- Owner: String for resource tagging and ownership tracking
- ProjectName: String for resource identification and naming consistency
- InstanceType: String with allowed values t3.micro, t3.small, t3.medium for EC2
- CreateTrail: Boolean to conditionally create CloudTrail (default: false to avoid conflicts)

### Mappings
Include environment-specific mappings:
- EnvironmentConfig mapping with CIDR blocks for dev and prod VPCs
- Different subnet allocations per environment

### Resource Tagging
Apply consistent tags across all resources:
- env: Environment identifier (dev/prod)
- owner: Team ownership
- project: Project name for cost allocation

### Outputs
Export the following values for reference and integration:
- VPC ID for network integration
- Public and private subnet IDs for resource placement
- EC2 instance ID and public IP for access
- S3 bucket names and ARNs for application integration
- RDS endpoint address and port for database connections
- KMS key IDs and ARNs for encryption operations
- Security group IDs for firewall rules

## Security Best Practices
The template must demonstrate:
- Defense in depth with multiple security layers
- Encryption at rest for all data storage
- Encryption in transit using VPC endpoints where applicable
- Network isolation using security groups and NACLs
- Audit logging for compliance requirements
- Automated secret rotation for credential management
- Resource deletion policies for infrastructure lifecycle

## Acceptance Criteria
The final template must:
1. Deploy successfully in us-east-1 without errors
2. Pass AWS CloudFormation Linter validation
3. Create all resources with proper dependencies and ordering
4. Establish working connectivity between services through security groups
5. Enable all logging and monitoring without manual intervention
6. Support both dev and prod environments through parameters
7. Include comprehensive inline comments explaining security decisions
8. Follow AWS Well-Architected Framework security pillar recommendations
