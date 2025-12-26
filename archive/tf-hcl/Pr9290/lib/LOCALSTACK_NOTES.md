# LocalStack Deployment Notes

This Terraform configuration has been adapted for LocalStack compatibility.

## LocalStack Compatibility

### Supported Services

- VPC (full support)
- RDS MySQL (basic support)
- Elastic Beanstalk (Pro feature - requires LocalStack Pro)
- Application Load Balancer (full support)
- Security Groups (full support)
- IAM (basic support)
- Secrets Manager (full support)

### LocalStack Limitations

#### NAT Gateway (Community Edition)
- NAT Gateway is disabled in LocalStack Community due to EIP allocation issues
- Private subnets route directly to Internet Gateway in LocalStack
- In AWS production, NAT Gateway is enabled for proper network isolation

#### RDS Configuration
- Storage encryption disabled in LocalStack (not fully supported)
- Auto-scaling storage disabled in LocalStack
- Backup windows and maintenance windows disabled in LocalStack
- Specific engine version required (8.0.32)

#### Elastic Beanstalk
- Requires LocalStack Pro subscription
- Basic functionality supported
- Some advanced features may have limited support

## Deployment

### LocalStack Deployment

1. Start LocalStack:
```bash
localstack start -d
```

2. Set endpoint URL:
```bash
export TF_VAR_aws_endpoint_url="http://localhost:4566"
```

3. Initialize and apply:
```bash
cd lib
tflocal init
tflocal plan
tflocal apply
```

### AWS Deployment

1. Ensure AWS credentials are configured:
```bash
aws configure
```

2. Initialize and apply (without endpoint URL):
```bash
cd lib
terraform init
terraform plan
terraform apply
```

## Environment Detection

The configuration automatically detects LocalStack by checking the `aws_endpoint_url` variable:
- If set to localhost:4566, LocalStack mode is enabled
- If empty or not set, AWS production mode is used

## Key Differences

| Feature | LocalStack | AWS |
|---------|-----------|-----|
| NAT Gateway | Disabled | Enabled |
| RDS Encryption | Disabled | Enabled |
| RDS Auto-scaling | Disabled | Enabled |
| RDS Backups | Disabled | Enabled (7 days) |
| EIP Allocation | Skipped | Created |

## Testing

After deployment to LocalStack, test the endpoints:

```bash
# Check VPC
awslocal ec2 describe-vpcs

# Check RDS
awslocal rds describe-db-instances

# Check Elastic Beanstalk (Pro only)
awslocal elasticbeanstalk describe-applications

# Check Load Balancers
awslocal elbv2 describe-load-balancers
```
