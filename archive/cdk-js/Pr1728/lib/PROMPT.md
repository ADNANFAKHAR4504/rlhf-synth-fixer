I need to create a secure AWS infrastructure for a financial application using CDK with JavaScript. The infrastructure must implement the highest security standards and leverage the latest AWS security services.

Requirements:
1. All S3 buckets must be encrypted using AES-256 server-side encryption
2. IAM roles must enforce MFA for critical actions, especially altering IAM policies
3. Enable comprehensive logging for all API Gateway stages
4. Deploy EC2 instances within a secure VPC with restrictive network controls
5. RDS databases must use KMS encryption at rest and in transit
6. Security groups must default to deny all inbound traffic with only explicit exceptions
7. Implement AWS Systems Manager Patch Manager for configuration compliance

Additional modern security requirements:
- Integrate Amazon GuardDuty Extended Threat Detection for advanced threat monitoring
- Use Amazon Security Lake for centralized security data collection and analysis
- Apply least privilege access principles throughout the infrastructure
- Enable VPC Flow Logs for network traffic monitoring
- Implement AWS Config for compliance checking
- Use KMS customer managed keys where appropriate

Please provide complete CDK JavaScript infrastructure code that includes:
- Main CDK stack with all security configurations
- VPC with private subnets for database and application tiers
- Application Load Balancer with HTTPS termination
- Auto Scaling Group for EC2 instances with security hardening
- RDS Aurora cluster with encryption and automated backups
- S3 buckets for application data with versioning and lifecycle policies
- API Gateway with throttling and logging
- IAM roles with minimal required permissions
- CloudWatch monitoring and alerting
- Systems Manager configuration for patch management

The code should be production-ready and follow CDK best practices with proper resource naming and comprehensive security configurations.