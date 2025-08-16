# Secure Cloud Infrastructure Design

I need to design a secure cloud infrastructure using CDK TypeScript that implements strict security policies and follows AWS best practices. The infrastructure needs to be deployed in the us-east-1 region.

## Core Requirements

1. **Data Storage with Encryption at Rest**
   - Multiple RDS databases with encryption enabled
   - EBS volumes with encryption
   - S3 buckets with server-side encryption
   - All storage must use AWS managed keys or customer managed keys

2. **EC2 Fleet with IAM Security**
   - Deploy multiple EC2 instances across different availability zones
   - Each instance must have a dedicated IAM role with minimal privileges
   - Use Systems Manager Session Manager for secure access
   - Enable CloudWatch monitoring for all instances

3. **S3 Security Controls**
   - Create multiple S3 buckets with strict bucket policies
   - Enable access logging for all buckets
   - Block public access by default
   - Configure lifecycle policies for cost optimization

4. **Modern Security Features**
   - Implement Amazon GuardDuty for threat detection
   - Set up AWS Security Hub for centralized security management
   - Use AWS Certificate Manager for SSL/TLS certificates
   - Configure AWS Config for compliance monitoring

## Infrastructure Requirements

- Use CDK TypeScript for infrastructure as code
- Deploy across multiple availability zones for high availability
- Implement proper networking with VPC, subnets, and security groups
- Add comprehensive tagging for resource management
- Include monitoring and alerting capabilities

Please provide the complete CDK TypeScript infrastructure code. Create one code block per file, ensuring each file can be independently deployed and manages a specific aspect of the security infrastructure.