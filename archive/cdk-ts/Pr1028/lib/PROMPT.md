I need to deploy enterprise-level secure network infrastructure using AWS CDK with TypeScript. This is for a security-focused implementation that prioritizes monitoring, compliance, and threat detection.

Requirements:
- Deploy in us-east-1 with multi-region capabilities to us-west-2 for high availability
- Create a VPC with at least three subnets across at least two availability zones
- Implement VPC Flow Logs for traffic monitoring and store logs securely in S3 bucket
- Use AWS VPC Block Public Access feature for enhanced security controls
- Configure Security Group sharing capabilities for better security group management
- Set up comprehensive security monitoring with GuardDuty for threat detection
- Include proper IAM roles and policies following least privilege principle
- Ensure all resources follow AWS security best practices and compliance frameworks

The infrastructure should be production-ready with proper logging, monitoring, and security controls. Make sure to use the latest security features available in AWS as of 2024-2025.

Please provide infrastructure code with separate files for different components. Each file should be complete and ready to deploy.