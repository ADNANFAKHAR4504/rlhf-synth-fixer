You are an expert AWS CloudFormation engineer. Based on the following requirements, create a valid AWS CloudFormation YAML template that sets up a secure cloud environment for a production enterprise application, ensuring compliance with stringent security, logging, and data protection policies.

## Key Requirements

1. Implement strict security configurations on all AWS resources as outlined in the constraints.
2. Use best-practice IAM roles and service-linked roles for resource access management.
3. Incorporate logging and monitoring mechanisms to track access and changes to resources.
4. Deploy resources within the specified VPC and subnets, adhering to environment rules.
5. Ensure compliance with data protection regulations by encrypting all data at rest and in transit.
6. Output a single CloudFormation template named 'secure-infrastructure.yaml' that passes AWS CloudFormation validation and creates all resources successfully when deployed.

## Environment

The infrastructure must be deployed in the us-west-2 region. Use the existing VPC with ID 'vpc-056d1fe3a8ef12345'. Follow the naming convention 'Prod-<ComponentName>' for all resources. Tag all resources with 'Environment: Production' and 'Project: SecureApp'. Store all secrets in AWS Secrets Manager.

## Constraints

- Implement strict security groups to allow only inbound SSH and HTTP traffic from specific IP ranges.
- Ensure all S3 buckets have versioning and encryption enabled.
- Use IAM roles instead of user-specific credentials for EC2 instance profiles.
- Enforce TLS encryption for data in transit between application servers and databases.
- Deploy resources within the specified VPC and subnets.
- Use service-linked roles for AWS services that support them.
- Provision an RDS instance with automatic backups and multi-AZ failover enabled.
- Use the latest AMI for EC2 instances.
- Implement CloudWatch alarms to identify unauthorized access attempts.
- Enable AWS Config rules to monitor changes to critical resources.
- Use managed policies for IAM roles, avoiding inline policies.
- Configure all DynamoDB tables with Point-In-Time Recovery.
- Store application logs in a central logging S3 bucket with restricted access.
- Use Parameter Store for storing sensitive configuration data.
- Enable GuardDuty across all accounts for threat detection.
- Restrict management console access through IP whitelisting.
- Implement an S3 lifecycle policy to transition objects to Glacier for compliance.
- Ensure all Lambda function environment variables are encrypted.
- Configure CloudTrail to log all account activity and deliver logs to a secure S3 bucket.

## Expected Output

Output only the complete, valid YAML template that adheres to all constraints and best practices for security, compliance, and availability. The template should be launchable in AWS without errors. Do not include any additional explanations or code outside the YAML.