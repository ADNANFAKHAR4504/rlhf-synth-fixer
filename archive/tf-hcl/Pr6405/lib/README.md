# AWS Compliance Validation and Remediation Module

This Terraform module implements a comprehensive compliance validation and automated remediation system for AWS infrastructure using AWS Config, Lambda, EventBridge, and CloudWatch.

## Features

- **AWS Config Integration**: Continuous compliance monitoring with 9 managed rules
- **Automated Remediation**: Event-driven Lambda functions for automatic compliance fixes
- **Security Best Practices**: KMS encryption, least privilege IAM, secure S3 configuration
- **Compliance Notifications**: SNS alerts for compliance changes and remediation actions
- **CloudWatch Dashboard**: Real-time compliance monitoring and remediation tracking
- **Cost Optimization**: Lifecycle policies, serverless architecture, efficient resource usage

## Architecture

```
AWS Config → EventBridge → Lambda → Remediation Actions
    ↓                           ↓
S3 Bucket                 SNS Notifications
(encrypted)                      ↓
                          CloudWatch Logs
```

## Compliance Rules

1. **S3 Bucket Public Read Prohibited**: Prevents public read access to S3 buckets
2. **S3 Bucket Public Write Prohibited**: Prevents public write access to S3 buckets
3. **S3 Bucket Encryption**: Ensures server-side encryption is enabled
4. **Encrypted Volumes**: Validates EBS volumes are encrypted
5. **RDS Encryption**: Ensures RDS instances have encryption at rest
6. **EC2 No Public IP**: Validates EC2 instances don't have public IPs
7. **IAM Password Policy**: Enforces strong password requirements
8. **Root Account MFA**: Ensures MFA is enabled on root account
9. **Required Tags**: Validates resources have mandatory tags (Environment, Owner, CostCenter)

## Automated Remediation Actions

- S3 buckets: Enable public access block, encryption, and versioning
- EC2 instances: Tag for manual review (public IP removal requires restart)
- EBS volumes: Tag for manual encryption (requires snapshot/recreation)
- RDS instances: Tag for manual encryption (requires snapshot/recreation)
- Missing tags: Automatically add required tags

## Usage

### Basic Deployment

```bash
terraform init
terraform plan -var="environment_suffix=dev-12345" -var="sns_email_endpoint=alerts@example.com"
terraform apply -var="environment_suffix=dev-12345" -var="sns_email_endpoint=alerts@example.com"
```

### With Custom Configuration

```bash
terraform apply \
  -var="environment_suffix=prod-67890" \
  -var="sns_email_endpoint=compliance@example.com" \
  -var="enable_auto_remediation=true" \
  -var="config_snapshot_frequency=Three_Hours"
```

### Disable Auto-Remediation (Notification Only)

```bash
terraform apply \
  -var="environment_suffix=staging-54321" \
  -var="enable_auto_remediation=false"
```

## Variables

| Variable | Description | Type | Default | Required |
|----------|-------------|------|---------|----------|
| `aws_region` | AWS region for deployment | string | us-east-1 | No |
| `environment_suffix` | Unique suffix for resource naming | string | - | Yes |
| `compliance_rules` | List of Config rules to enable | list(string) | See variables.tf | No |
| `enable_auto_remediation` | Enable automatic remediation | bool | true | No |
| `sns_email_endpoint` | Email for notifications | string | "" | No |
| `config_snapshot_frequency` | Config snapshot frequency | string | Three_Hours | No |

## Outputs

| Output | Description |
|--------|-------------|
| `config_recorder_id` | AWS Config recorder ID |
| `config_bucket_name` | S3 bucket name for Config data |
| `kms_key_id` | KMS key ID for encryption |
| `remediation_lambda_arn` | Lambda function ARN |
| `sns_topic_arn` | SNS topic ARN for notifications |
| `compliance_dashboard_url` | CloudWatch dashboard URL |
| `config_rules` | List of enabled Config rules |

## Lambda Deployment

Before running Terraform, create the Lambda deployment package:

```bash
cd lib/lambda
zip -r remediation.zip index.py
cd ../..
```

> This function currently relies only on the AWS SDK (`boto3`) that ships with the Lambda runtime.  
> If you add third-party libraries, install them into the `lib/lambda` directory before zipping:
> `python -m pip install -r requirements.txt --target .`.

### Rebuilding and Verifying the Remediation Package

```bash
cd lib/lambda
zip -r remediation.zip index.py
ls -lh remediation.zip  # sanity-check package size (~kilobytes today)
cd ../..
```

Keeping these commands in source control makes it easy for reviewers to reproduce the `.zip` if the Lambda code changes.

## Monitoring

### View Compliance Status

1. Navigate to AWS Config console
2. View compliance dashboard
3. Check individual rule compliance

### View Remediation Logs

```bash
aws logs tail /aws/lambda/compliance-remediation-{environment_suffix} --follow
```

### CloudWatch Dashboard

Access the dashboard URL from Terraform outputs:
```bash
terraform output compliance_dashboard_url
```

## Cost Considerations

- **Config Snapshots**: The default snapshot frequency is now `Three_Hours`, which cuts AWS Config snapshot charges by ~66% compared to hourly runs while still providing timely visibility. Increase the frequency only when compliance requirements demand it.
- **AWS Config**: ~$2/rule/region/month + $0.003/configuration item
- **Lambda**: Free tier covers most usage (1M requests/month)
- **S3**: Minimal cost with lifecycle policies
- **KMS**: $1/month/key + $0.03/10,000 requests
- **SNS**: First 1,000 emails free, then $2/100,000

**Estimated monthly cost**: $20-30 for typical workloads

## Security

- All data encrypted at rest using KMS
- S3 buckets have public access blocked
- IAM roles follow least privilege principle
- CloudWatch logs retention set to 14 days
- No hardcoded credentials or secrets

## Compliance Standards

This module helps achieve compliance with:
- AWS Well-Architected Framework (Security Pillar)
- CIS AWS Foundations Benchmark
- SOC 2 Type II requirements
- PCI DSS (partial coverage)
- HIPAA technical safeguards (partial coverage)

## Limitations

1. **Encryption**: Cannot encrypt existing EBS volumes or RDS instances (requires recreation)
2. **Public IP**: Removing public IPs from EC2 instances requires stop/start (tagged for manual review)
3. **Global Resources**: Config recorder includes global resources (IAM, CloudFront) which may cause conflicts in multi-region deployments
4. **Manual Actions**: Some remediations require manual intervention and are tagged accordingly

## Troubleshooting

### Config Recorder Won't Start

Ensure the S3 bucket and IAM role are created before enabling the recorder:
```bash
terraform apply -target=aws_s3_bucket.config_bucket -target=aws_iam_role.config_role
terraform apply
```

### Lambda Remediation Failing

Check Lambda logs for detailed error messages:
```bash
aws logs tail /aws/lambda/compliance-remediation-{environment_suffix} --since 1h
```

### Permissions Issues

Verify IAM role has necessary permissions:
```bash
aws iam get-role-policy --role-name compliance-lambda-remediation-{environment_suffix} --policy-name compliance-lambda-remediation-policy
```

## Contributing

When adding new compliance rules:
1. Add the Config rule in `config_rules.tf`
2. Add remediation logic in `lambda/index.py`
3. Update documentation
4. Test with non-compliant resources
5. Verify remediation actions work as expected

## License

This module is provided as-is for infrastructure compliance automation.
