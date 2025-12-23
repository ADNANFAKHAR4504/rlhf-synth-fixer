# Zero-Trust IAM and KMS Infrastructure

This Terraform configuration implements a comprehensive role-based access control system with encryption key management for a zero-trust security model.

## Features

- **Three IAM Roles**: SecurityAdmin, DevOps, and Auditor with MFA-enforced assume role policies
- **KMS Key Hierarchy**: Separate keys for application data, infrastructure secrets, and Terraform state
- **Time-Based Access Controls**: Explicit deny statements for sensitive operations outside business hours
- **Audit Trails**: CloudWatch Logs with 90-day retention for all IAM and KMS activity
- **Service-Linked Roles**: Custom permission boundaries for ECS and RDS services
- **Cross-Account Access**: External ID validation for secure cross-account role assumptions

## Prerequisites

- Terraform 1.5+
- AWS Provider 5.x
- AWS CLI configured with appropriate credentials
- MFA device for role assumptions

## Usage

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your environment-specific values:
   ```hcl
   environment_suffix = "prod-001"
   trusted_account_ids = ["123456789012"]
   ```

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the planned changes:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Architecture

### IAM Roles

1. **SecurityAdmin**: Full access to IAM and KMS resources with time-based restrictions
   - Max session duration: 1 hour
   - MFA required
   - Permission boundary: us-east-1 only

2. **DevOps**: Access to EC2, S3, RDS, ECS with time-based restrictions
   - Max session duration: 1 hour
   - MFA required
   - Permission boundary: us-east-1 only

3. **Auditor**: Read-only access to all resources
   - Max session duration: 1 hour
   - MFA required
   - No write permissions

### KMS Keys

1. **Application Data Key**: For encrypting application data
   - Automatic rotation: Enabled (365 days)
   - Access: SecurityAdmin, DevOps (encrypt/decrypt), Auditor (describe only)

2. **Infrastructure Secrets Key**: For encrypting infrastructure secrets
   - Automatic rotation: Enabled (365 days)
   - Access: SecurityAdmin (encrypt/decrypt), Auditor (describe only)

3. **Terraform State Key**: For encrypting Terraform state files
   - Automatic rotation: Enabled (365 days)

### CloudWatch Logs

- `/aws/iam/activity-*`: General IAM activity
- `/aws/iam/security-admin-*`: SecurityAdmin role activity
- `/aws/iam/devops-*`: DevOps role activity
- `/aws/iam/auditor-*`: Auditor role activity
- `/aws/iam/kms/activity-*`: KMS key activity

All logs encrypted with infrastructure secrets KMS key and retained for 90 days.

## Assuming Roles

To assume a role with MFA:

```bash
aws sts assume-role \
  --role-arn "arn:aws:iam::ACCOUNT_ID:role/security-admin-dev-001" \
  --role-session-name "security-admin-session-$(date +%s)" \
  --external-id "EXTERNAL_ID_FROM_OUTPUT" \
  --serial-number "arn:aws:iam::ACCOUNT_ID:mfa/USERNAME" \
  --token-code "MFA_TOKEN"
```

## Security Considerations

- All roles require MFA for assumption
- External ID is randomly generated (32 characters)
- Permission boundaries restrict all operations to us-east-1
- Time-based restrictions prevent sensitive operations outside business hours
- Session duration limited to 1 hour maximum
- No IAM user access keys - temporary credentials only
- All audit logs encrypted at rest

## Testing

Run Terraform validate and format:
```bash
terraform fmt -recursive
terraform validate
```

## Compliance

This configuration meets the following compliance requirements:
- Zero-trust security model
- Least-privilege access
- MFA enforcement
- Encryption at rest and in transit
- Comprehensive audit trails
- Time-based access controls

## Outputs

- `security_admin_role_arn`: ARN of SecurityAdmin role
- `devops_role_arn`: ARN of DevOps role
- `auditor_role_arn`: ARN of Auditor role
- `application_data_key_arn`: ARN of application data KMS key
- `infrastructure_secrets_key_arn`: ARN of infrastructure secrets KMS key
- `terraform_state_key_arn`: ARN of Terraform state KMS key
- `external_id`: External ID for role assumption (sensitive)

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

Note: KMS keys have a 7-day deletion window and cannot be immediately deleted.
