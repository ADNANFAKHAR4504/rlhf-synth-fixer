# Model Failures

## IAM Policy Using Wildcard Resource

The original IAM policy used a wildcard for S3 resource access:

```yaml
Resource: "*"
```

This is a security issue because it grants access to all S3 buckets, not just the one created by this stack. Fixed to scope to the specific bucket:

```yaml
Resource: !Sub 'arn:aws:s3:::${ProdS3Bucket}/*'
```

This follows least-privilege principles by limiting S3 access to only the bucket created in this stack.

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| NAT Gateway | EIP allocation works but costs credits | Kept as-is for compatibility | Enabled in AWS |
| RDS MySQL | Basic support with simplified features | Using MySQL 8.0.42, Multi-AZ enabled | Enabled in AWS |
| CloudWatch | Basic metrics support | Standard metrics configured | Enabled in AWS |
| ALB/ELB | Supported with basic features | Application Load Balancer used | Enabled in AWS |
| Auto Scaling | Supported with basic features | Standard ASG configuration | Enabled in AWS |
| IAM | Simplified IAM in LocalStack | Least-privilege policies used | Full policies in AWS |

### Service Connectivity Pattern Used

The CloudFormation template implements these connectivity patterns:

- EC2 instances connect to RDS via security group references
- ALB forwards HTTP traffic to EC2 through target groups
- EC2 uses IAM instance profiles for S3 access
- CloudWatch monitors ASG and RDS with CPU alarms
- Private subnets route through NAT Gateways
- RDS spans both private subnets for Multi-AZ

### Services Verified Working in LocalStack

- VPC (full support)
- EC2 (full support)
- S3 (full support)
- RDS MySQL (basic support)
- ELB/ALB (basic support)
- Auto Scaling (basic support)
- CloudWatch (basic metrics)
- IAM (basic support)
- Secrets Manager (basic support)
