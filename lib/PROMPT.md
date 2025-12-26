# AWS CloudFormation Payment Processing Application

You are an expert AWS CloudFormation architect. I need a single CloudFormation YAML template that deploys our payment processing application infrastructure. The template needs to work for both dev and prod environments using the same stack by adapting based on parameters.

## What I Need

Deploy a payment processing app with:

- EC2 instances that connect to an RDS MySQL database for transaction storage
- Lambda functions that process payments by reading from and writing to the RDS database
- S3 buckets that store payment receipts and logs, accessed by both Lambda and EC2
- Lambda functions that send execution logs to CloudWatch for monitoring
- VPC with subnets where EC2 and RDS resources communicate through security groups
- IAM roles that grant Lambda access to S3, RDS, and CloudWatch

## Environment Handling

The stack should accept an Environment parameter (dev or prod) to control resource sizing and configuration:

- dev uses t3.micro for EC2, prod uses m5.large
- dev has single-AZ RDS, prod has multi-AZ
- dev skips automated backups, prod enables them
- CloudWatch alarm thresholds differ: 70% for dev, 80% for prod

Also needs an EnvironmentSuffix parameter for unique naming to support parallel deployments.

## Cross-Account Portability

No hardcoded account IDs, ARNs, or regions. Use intrinsic functions like !Sub, !Ref, !GetAtt so it works anywhere.

## Technical Details

### RDS
- MySQL instance with encryption enabled
- EC2 and Lambda connect via security group ingress rules
- Multi-AZ and backup retention only in prod

### EC2
- Instance type based on Environment parameter
- AMI IDs via Mappings by region
- Security group allows ingress from application tier

### S3
- Bucket names must be unique using EnvironmentSuffix
- Versioning enabled
- Lifecycle policies: shorter retention in dev

### Lambda
- Environment variables point to RDS endpoint and S3 bucket
- Reserved concurrency only in prod
- IAM execution role with access to RDS, S3, CloudWatch

### Security Groups
- CIDR ranges as parameters
- Database security group allows access from EC2 and Lambda
- Application tier security group controls ingress

### IAM
- Lambda execution role with policies scoped to specific resources
- No wildcard actions
- Use Conditions to adjust permissions by environment

### CloudWatch
- Alarms for RDS CPU and connections
- Alarm thresholds differ by environment

### Resource Naming
All resources follow this pattern using !Sub:
Name: ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Examples:
- VPC to paymentapp-us-east-1-pr4056-vpc
- RDS to paymentapp-us-east-1-pr4056-rds
- Lambda to paymentapp-us-east-1-pr4056-payment-processor

### Tagging
Tag all resources with Environment and Application.

## Output

Provide RDS endpoint, S3 bucket name, EC2 instance ID, and Lambda function name as outputs.
