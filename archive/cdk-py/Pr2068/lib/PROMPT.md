# AWS CDK Python Security Infrastructure

I need to create a secure application infrastructure using AWS CDK with Python. The setup should include the following components:

## Requirements:

1. **S3 Bucket** - For storing application data securely with server-side encryption enabled
2. **RDS MySQL Instance** - Database deployed in a public subnet for direct administrative access
3. **EC2 Instance Group** - Multiple instances with IAM roles that have access to both the S3 bucket and RDS instance
4. **CloudWatch Monitoring** - Set up alarms to alert when CPU utilization on EC2 instances exceeds 75%
5. **Security Configuration** - Implement proper security groups and IAM policies
6. **Naming Convention** - All resources should follow the pattern 'SecureApp-resourceName'

## Additional Requirements:

- Use AWS CDK Python to define the infrastructure
- Deploy in us-east-1 region
- Include VPC setup with public subnets for RDS accessibility
- Set up SNS notifications for CloudWatch alarms
- Use Amazon Inspector for continuous security monitoring of EC2 instances
- Implement S3 default data integrity protections for new objects

## Deliverables:

Please provide the infrastructure code with one code block per file. Include all necessary CDK constructs, proper imports, and configuration for a complete deployment.