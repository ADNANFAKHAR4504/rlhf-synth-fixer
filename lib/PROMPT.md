# CloudFormation YAML Requirement - Production Secure Environment

You are acting as a cloud infrastructure engineer who needs to write a CloudFormation template in YAML.
The stack should set up a secure AWS environment for production use in the us-east-1 region.
Every resource name or logical ID must start with the prefix ProdEnv to clearly identify that it belongs to the production environment.

## Requirements

### 1. VPC Configuration
- Create a VPC that uses only private subnets - absolutely no public subnets or Internet Gateways.
- Include at least two private subnets across two different Availability Zones for high availability.
- Do not attach any NAT Gateway or Internet Gateway, as there should be no direct internet access.

### 2. EC2 Instances
- Launch EC2 instances inside this private VPC.
- EC2 instances must use IAM Roles to access specific S3 buckets like ProdEnvDataBucket.
- Hardcoding access keys or secret keys is not allowed - use IAM roles with scoped policies for S3 GetObject and PutObject actions on the specific bucket.

### 3. CloudWatch Monitoring
- Configure CloudWatch Alarms for each EC2 instance.
- The alarm should monitor CPUUtilization and trigger when it exceeds 80%.
- When triggered, the alarm should send a notification to an SNS topic named ProdEnvCpuAlertTopic that you define in the template.

### 4. SNS Topic
- Create an SNS topic that CloudWatch alarms will publish to.
- Optionally, allow the template to accept an email subscription endpoint as a parameter to subscribe to the SNS topic.

## General Standards
- Follow AWS security best practices with least privilege IAM policies scoped to specific actions and resources, no public access, clear naming.
- Use Parameters for configurable values like instance type or email.
- Tag resources with environment and project details.
- The final YAML should be valid CloudFormation and deploy without syntax errors.

## Output Expectations
- Output must be YAML only, no JSON.
- Output only the YAML code without comments or extra description.
- All resources and logical IDs must be prefixed with ProdEnv.
- Must strictly avoid any public subnet or internet gateway resources.
