# AWS Config Compliance Analysis System

This Terraform configuration implements an automated infrastructure compliance scanning system for AWS resources across multiple regions. It uses AWS Config with custom Lambda-based compliance rules to monitor EC2, RDS, S3, and IAM resources for encryption, tagging, and backup policy compliance.

## Architecture

The solution deploys:

- **AWS Config**: Continuous configuration recording in us-east-1, us-west-2, and eu-west-1
- **Lambda Functions**: Python 3.9 functions for custom compliance rule evaluation (ARM64/Graviton2)
- **S3 Bucket**: Centralized storage for Config snapshots and compliance reports
- **SNS Topic**: Notifications for non-compliant resources
- **Config Aggregator**: Multi-region data collection
- **IAM Roles**: Least-privilege policies for Config and Lambda
- **EventBridge Rules**: Scheduled compliance checks every 6 hours

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create Config, Lambda, S3, SNS, IAM resources
- Email address for compliance notifications

## Configuration

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   environment_suffix = "your-unique-suffix"
   notification_email = "your-email@example.com"
   ```

3. Review and adjust other variables as needed (regions, schedules, etc.)

## Deployment

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the planned changes:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

4. Confirm your email subscription:
   - Check your email inbox for the SNS subscription confirmation
   - Click the confirmation link to receive compliance notifications

## Compliance Rules

The system implements three types of compliance checks:

### 1. Encryption Compliance
- **EC2 Instances**: All EBS volumes must be encrypted
- **RDS Instances**: Storage encryption must be enabled
- **S3 Buckets**: Server-side encryption must be configured

### 2. Tagging Compliance
All resources must have the following tags:
- `Environment`: Deployment environment (e.g., prod, dev)
- `Owner`: Team or individual responsible for the resource
- `CostCenter`: Cost allocation identifier

### 3. Backup Compliance
- **EC2 Instances**: Must have `Backup: true` tag and recent snapshots (last 7 days)
- **RDS Instances**: Automated backups enabled with retention >= 7 days
- **S3 Buckets**: Versioning must be enabled

## Compliance Evaluation

- **Real-time**: Config rules evaluate resources within 15 minutes of changes
- **Scheduled**: Lambda functions scan all resources every 6 hours
- **Notifications**: SNS alerts sent immediately for non-compliant resources

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}-{region}`

Example: `config-recorder-prod-us-east-1`

## Monitoring

Access AWS Config console to view:
- Compliance dashboard across all regions
- Config aggregator for multi-region view
- Compliance timeline and history
- Resource configuration changes

## Cost Optimization

- Lambda functions use ARM64 (Graviton2) for 20% cost savings
- 30-second timeout limits prevent runaway executions
- Config recording limited to specific resource types
- S3 lifecycle policies can be added for log archival

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: The S3 bucket has `force_destroy = true` enabled, so it will be deleted with all contents during cleanup.

## Troubleshooting

### Config Not Recording
- Verify IAM role permissions
- Check Config delivery channel S3 bucket policy
- Ensure Config recorder is started

### Lambda Execution Errors
- Review CloudWatch Logs for Lambda functions
- Verify Lambda execution role has required permissions
- Check Lambda environment variables

### SNS Notifications Not Received
- Confirm email subscription is active
- Check SNS topic policy allows Lambda and Config to publish
- Review CloudWatch Logs for SNS publish errors

## Security Considerations

- All S3 data encrypted with SSE-S3
- Public access blocked on S3 bucket
- IAM roles follow least-privilege principle
- Config data includes unique S3 prefixes per region
- Lambda functions run with minimal required permissions

## Compliance Standards

This solution helps meet requirements for:
- SOC 2 Type II
- PCI DSS
- HIPAA
- GDPR
- NIST Cybersecurity Framework

## Support

For issues or questions, please refer to:
- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## License

This code is provided as-is for infrastructure compliance monitoring purposes.
