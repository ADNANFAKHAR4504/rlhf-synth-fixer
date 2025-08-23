# Security Configuration as Code with AWS CDK Python

As a security engineer, I need to create an AWS CDK Python application that implements comprehensive security controls across our AWS infrastructure. The solution should demonstrate security best practices and meet our organization's compliance requirements.

## Requirements

The CDK application should include these security configurations:

1. **IAM Security**
   - Create IAM policies following least privilege principles
   - Configure strong IAM password policy (minimum 14 characters, require uppercase letter and number)
   - Enforce MFA for AWS console access
   - Implement mechanisms to identify and disable unused IAM accounts

2. **Network Security**
   - Deploy security groups that explicitly deny unrestricted SSH access on port 22
   - Enable VPC Flow Logs for all VPCs to monitor network traffic
   - Ensure proper network isolation

3. **Storage Security**
   - Configure S3 buckets with private access only (no public exposure)
   - Enable automatic backups for RDS instances
   - Ensure EBS volumes attached to EC2 instances have encryption enabled

4. **Data Analytics Security**
   - Deploy Redshift clusters in private subnets only (no public accessibility)

5. **Audit and Compliance**
   - Enable CloudTrail logging across all AWS regions for comprehensive audit trail
   - Implement CloudFormation Hooks for security validation using the new 2025 managed controls feature

6. **Advanced Threat Detection**
   - Configure GuardDuty Extended Threat Detection with EKS coverage for container security monitoring

## Technical Specifications

- Use AWS CDK Python constructs
- Target deployment region: us-east-1
- All resources should be properly tagged
- Code should pass CDK synthesis without warnings
- Follow CDK best practices for resource naming and organization

Please provide complete infrastructure code with separate files for different components. Each file should contain all necessary imports and be self-contained. The code should be production-ready and deployable without modifications.