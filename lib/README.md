# Security Foundation Infrastructure

Comprehensive security-first infrastructure foundation implementing zero-trust principles with multi-region KMS encryption, automated secret rotation, fine-grained IAM controls, and compliance monitoring.

## Architecture Overview

This Terraform configuration deploys:

- **Multi-Region KMS Keys**: Primary key in us-east-1 with replicas in eu-west-1 and ap-southeast-1
- **Secrets Manager**: Automated rotation for database credentials every 30 days
- **IAM Roles**: MFA-enforced roles with 1-hour session limits
- **VPC Endpoints**: Secure access to Secrets Manager, KMS, and EC2 services
- **AWS Config**: 7 compliance rules monitoring encryption and security
- **CloudWatch Logs**: Encrypted logs with 90-day retention
- **Service Control Policies**: Prevent root account usage and enforce encryption

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS Organizations enabled (for SCPs)
- VPC with private subnets (or will create one)

## Deployment

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create `terraform.tfvars`:

```hcl
environment = "production"
primary_region = "us-east-1"
environment_suffix = "prod-001"

# Optional: Provide existing VPC
vpc_id = "vpc-xxx"
subnet_ids = ["subnet-xxx", "subnet-yyy"]

# Optional: For AWS Organizations
organization_id = "o-xxx"
audit_account_id = "123456789012"
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

## Validation

After deployment, run the validation commands:

```bash
# Get validation commands
terraform output -raw validation_commands > validate.sh
chmod +x validate.sh
./validate.sh
```

## Key Features

### Multi-Region KMS Encryption

- Primary key in us-east-1 with automatic rotation enabled
- Replica keys in eu-west-1 and ap-southeast-1
- Key policy explicitly denies root account decrypt
- 7-day deletion window

### Automated Secret Rotation

- Secrets Manager with Lambda-based rotation
- Rotation every 30 days
- Python 3.9 Lambda function with validation
- VPC endpoint restrictions for secure access

### IAM Security

- MFA enforcement for role assumption
- 1-hour maximum session duration
- No Resource: '*' in policies
- Least-privilege access controls

### Compliance Monitoring

- AWS Config with 7 rules:
  1. KMS rotation enabled
  2. Secrets encrypted with CMK
  3. CloudWatch logs encrypted
  4. S3 buckets encrypted
  5. IAM users have MFA
  6. VPC endpoints enabled
  7. Required tags present

### Network Security

- VPC endpoints for Secrets Manager, KMS, EC2
- Resource-based policies require VPC endpoint access
- VPC Flow Logs with encryption
- Private subnet deployment for Lambda

## Service Control Policies

The configuration generates SCPs that should be applied via AWS Organizations:

```bash
# Get SCP policies
terraform output -raw scp_deny_root_policy > scp-deny-root.json
terraform output -raw scp_require_encryption_policy > scp-require-encryption.json

# Apply via AWS Organizations console or CLI
```

## Resource Naming Convention

All resources follow: `{environment}-security-{purpose}-{environmentSuffix}`

Examples:
- `production-security-primary-key-abc12345`
- `production-security-db-credentials-abc12345`
- `production-security-rotation-abc12345`

## Cost Optimization

Estimated monthly costs (us-east-1):
- KMS keys: ~$3 (3 keys x $1/month)
- Secrets Manager: ~$0.40 (1 secret)
- Lambda: ~$0.20 (rotation executions)
- AWS Config: ~$2 (recorder + rules)
- VPC Endpoints: ~$21.60 (3 endpoints x $7.20/month)
- CloudWatch Logs: ~$0.50 (minimal usage)

**Total: ~$28/month**

## Security Considerations

1. **KMS Keys**: Multi-region keys enable disaster recovery
2. **Secret Rotation**: Automated rotation reduces credential exposure
3. **MFA Enforcement**: Prevents unauthorized access
4. **VPC Endpoints**: Prevents data exfiltration
5. **SCPs**: Organization-wide security guardrails
6. **Config Rules**: Continuous compliance monitoring

## Troubleshooting

### Lambda Rotation Fails

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/production-security-rotation-xxx --follow
```

### Config Recorder Not Starting

Verify IAM role has correct permissions:
```bash
aws iam get-role-policy --role-name production-security-config-xxx --policy-name production-security-config-s3-policy-xxx
```

### VPC Endpoint Connection Issues

Verify security group rules:
```bash
aws ec2 describe-security-groups --group-ids sg-xxx
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Some resources have `prevent_destroy = false` to allow cleanup. In production, set this to `true` for critical resources.

## Compliance

This configuration helps meet requirements for:
- PCI-DSS
- HIPAA
- SOC 2
- ISO 27001

Always consult with compliance officers for specific requirements.

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda/Config errors
2. Review AWS Config compliance dashboard
3. Validate IAM policies and trust relationships
4. Ensure AWS Organizations is properly configured
