# AWS Infrastructure Deployment Challenge

## Context
Design and implement a secure, highly available AWS infrastructure using CloudFormation in YAML format. The infrastructure will be deployed in the us-east-1 region and must follow AWS best practices for security, high availability, and compliance.

## Requirements

### Network Infrastructure
- Create a VPC with a minimum of:
  - 2 public subnets across different Availability Zones
  - 2 private subnets across different Availability Zones
  - Appropriate route tables and Internet Gateway configuration

### Security & Compliance
- Implement KMS encryption for all EBS volumes
- Configure IAM roles following the principle of least privilege
- Enable server-side encryption for all S3 buckets
- Enable S3 bucket logging
- Restrict SSH access to EC2 instances using Security Groups with whitelisted IPs
- Implement AWS WAF for public-facing applications
- Set up AWS Config rules to enforce resource compliance

### Database
- Deploy an RDS instance (MySQL/PostgreSQL) with:
  - Minimum 7-day backup retention
  - Multi-AZ deployment for high availability
  - Encrypted storage using KMS
- Create a dedicated S3 bucket for RDS backups with appropriate security controls

### Compute
- Launch EC2 instances with:
  - IAM instance profiles attached
  - EBS volumes encrypted using KMS
  - Placement in private subnets
  - Security group restrictions

### Monitoring & Logging
- Enable comprehensive logging across all resources
- Configure CloudWatch alarms for critical metrics
- Implement monitoring for:
  - Resource utilization
  - Security events
  - Application performance

### Lambda Functions
- Implement secure environment variable usage
- Configure appropriate IAM roles
- Enable logging and monitoring

## Success Criteria
1. CloudFormation template successfully deploys all resources
2. All security controls are properly implemented
3. High availability is achieved through multi-AZ deployment
4. All resources are properly tagged and documented
5. Monitoring and logging are comprehensively configured
6. All test cases pass, including deployment validation

## Deliverables
1. CloudFormation template in YAML format
2. Documentation of security controls and configurations
3. Test results demonstrating successful deployment
4. Architecture diagram showing the infrastructure layout

## Constraints
- Region: us-east-1 only
- Infrastructure must be defined entirely in CloudFormation YAML
- All sensitive data must be encrypted
- No hard-coded credentials in templates
- Must follow AWS Well-Architected Framework guidelines

## Evaluation Metrics
1. Successful deployment without errors
2. Proper implementation of security controls
3. High availability configuration
4. Resource optimization and cost-effectiveness
5. Code quality and documentation
6. Test coverage and results
