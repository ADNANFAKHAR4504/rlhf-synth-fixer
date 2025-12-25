Need a CloudFormation template in JSON for a web application environment in us-east-1 region.

## Infrastructure Requirements

Set up a multi-tier web app with proper service connectivity:

1. **VPC with Multi-AZ Subnets**
   - Create VPC for network isolation
   - Add subnets across multiple availability zones for high availability

2. **EC2 Instances Connected to Services**
   - Launch EC2 instances within the VPC subnets
   - Attach IAM roles to instances to securely access S3 and DynamoDB without hardcoded credentials
   - Security groups must allow HTTP port 80 and HTTPS port 443 from internet, deny other inbound ports
   - EC2 instances send metrics to CloudWatch for monitoring

3. **S3 Bucket for Application Logs**
   - Create S3 bucket with versioning enabled
   - EC2 instances write application logs to this S3 bucket using IAM role permissions

4. **DynamoDB for Application Data**
   - Create DynamoDB table with on-demand capacity mode
   - EC2 instances connect to DynamoDB to read/write application data via IAM role

5. **IAM Roles with Least Privilege**
   - IAM role attached to EC2 instances must grant only specific S3 PutObject/GetObject actions on the logging bucket
   - IAM role must grant only specific DynamoDB read/write actions on the application table
   - No wildcard permissions or overly broad access

6. **CloudWatch Monitoring Integration**
   - Enable CloudWatch detailed monitoring on all EC2 instances
   - EC2 instances automatically send metrics to CloudWatch

## Key Integration Points

- EC2 instances use IAM role to write logs to S3 bucket
- EC2 instances use IAM role to access DynamoDB table for data persistence
- Security groups control network access to EC2 instances
- CloudWatch receives monitoring data from EC2 instances
- All resources deployed across multiple availability zones where applicable

## Naming Convention

Resources follow pattern: AppResource-Stage-RandomId

## Output

Single CloudFormation JSON template that provisions all resources with proper connectivity and security.