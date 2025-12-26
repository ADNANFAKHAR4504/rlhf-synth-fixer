# LocalStack Migration Guide - IAM Roles Infrastructure

## Overview

This Terraform infrastructure has been migrated to be compatible with LocalStack for local development and testing. The original AWS production configuration is preserved and can be easily restored.

## What Changed

### 1. Provider Configuration (`provider.tf`)

**Added LocalStack Support:**
- New `use_localstack` variable to toggle between LocalStack and AWS
- Dynamic endpoint configuration for LocalStack (http://localhost:4566)
- LocalStack credentials (access_key: "test", secret_key: "test")
- Provider settings for LocalStack compatibility:
  - `skip_credentials_validation = true`
  - `skip_metadata_api_check = true`
  - `skip_requesting_account_id = true`
  - `s3_use_path_style = true`

**Both providers (default and eu alias) now support LocalStack.**

### 2. IAM Policy Simplification (`tap_stack.tf`)

**Permission Boundary Policy:**
- Original complex IAM conditions are **commented out** for LocalStack compatibility
- Replaced with a simplified `AllowAll` statement for LocalStack
- All original security controls are preserved in comments for AWS deployment
- **Why:** LocalStack has limited support for complex IAM condition operators like:
  - `StringNotEqualsIfExists`
  - `BoolIfExists`
  - `iam:PolicyArn` conditions

**What's Preserved:**
- Policy structure and documentation
- All deny statements (commented)
- SOC 2 and GDPR compliance intent
- Comments explain each security control

### 3. Variable Updates (`tap_stack.tf`)

**New Variables:**
- `use_localstack` (bool, default: false) - Toggle LocalStack mode

**Updated Defaults:**
- `target_account_id` = "000000000000" (LocalStack default account ID)

### 4. Terraform Variables (`terraform.tfvars`)

**Updated Values:**
- `use_localstack = false` (set to true for LocalStack deployment)
- `target_account_id = "000000000000"` (LocalStack account ID)
- `trusted_principals` changed from specific role ARNs to `arn:aws:iam::000000000000:root`
- `require_external_id = false` (simplified for LocalStack)
- `require_mfa = false` (LocalStack doesn't support MFA conditions)
- All `conditions = {}` (empty conditions for LocalStack)

### 5. New LocalStack-Specific File

**`localstack.tfvars`** - Dedicated LocalStack configuration:
```bash
terraform apply -var-file=localstack.tfvars
```

Contains:
- `use_localstack = true`
- LocalStack account ID (000000000000)
- Simplified role configurations
- No MFA or external ID requirements
- Empty condition blocks

### 6. Metadata Updates (`metadata.json`)

- `po_id`: "291325" → "LS-291325"
- `team`: "5" → "synth-2"
- Added `provider`: "localstack"
- Added `subtask`: "Infrastructure QA and Management"
- Added `subject_labels`: ["General Infrastructure Tooling QA"]
- Added `aws_services`: ["IAM"]
- Added `wave`: "P1"
- Added `migrated_from` tracking

## How to Use

### Deploy to LocalStack

1. **Start LocalStack:**
   ```bash
   localstack start -d
   ```

2. **Initialize Terraform:**
   ```bash
   cd lib
   terraform init -backend=false
   ```

3. **Deploy with LocalStack config:**
   ```bash
   terraform apply -var-file=localstack.tfvars
   ```

   Or set the variable inline:
   ```bash
   terraform apply -var="use_localstack=true"
   ```

4. **Verify deployment:**
   ```bash
   # List roles
   awslocal iam list-roles --endpoint-url http://localhost:4566

   # Get specific role
   awslocal iam get-role --role-name corp-security-auditor-localstack-pr1677
   ```

### Deploy to AWS Production

1. **Use original tfvars or create AWS-specific file:**
   ```bash
   terraform apply -var-file=terraform.tfvars
   ```

2. **Before AWS deployment, restore permission boundary:**
   - In `tap_stack.tf`, uncomment the deny statements
   - Comment out or remove the `AllowAllForLocalStack` statement
   - Restore MFA and external ID requirements in role configurations

3. **Update trusted principals:**
   - Replace `arn:aws:iam::000000000000:root` with actual AWS account/role ARNs
   - Set `require_external_id = true` where needed
   - Set `require_mfa = true` for sensitive roles

## LocalStack Limitations

### What Works in LocalStack:
- IAM role creation
- IAM policy creation
- IAM policy attachments
- Basic assume role policies
- Simple Allow/Deny statements
- Resource-level permissions
- Inline policies
- Tags on IAM resources

### What's Simplified for LocalStack:
- Complex IAM conditions (removed/commented)
- MFA requirements (not enforced)
- External ID validation (not enforced)
- Cross-account trust (simplified to root principal)
- Regional restrictions (not enforced)
- Policy condition operators (limited support)

### What to Re-enable for AWS:
1. **Permission Boundary Deny Statements:**
   - DenyAttachAdministratorAccess
   - EnforceRegionRestriction
   - RequireMFAForConsole
   - ProtectSecurityResources

2. **Role Trust Policies:**
   - Specific trusted principal ARNs
   - External ID conditions
   - MFA conditions

3. **Inline Policy Conditions:**
   - Region restrictions
   - Resource tagging requirements
   - MFA requirements

## Testing

### LocalStack Testing:
```bash
# Run Terraform validation
terraform fmt -check
terraform validate

# Plan deployment
terraform plan -var-file=localstack.tfvars

# Apply
terraform apply -var-file=localstack.tfvars -auto-approve

# Test role assumption (if LocalStack Pro)
awslocal sts assume-role \
  --role-arn arn:aws:iam::000000000000:role/corp-security-auditor-localstack-pr1677 \
  --role-session-name test-session
```

### Unit/Integration Tests:
The TypeScript tests in `/test` will work with LocalStack when:
- LocalStack is running
- `AWS_ENDPOINT_URL=http://localhost:4566` is set
- Tests use `awslocal` CLI or LocalStack-aware SDK config

## Compliance Notes

### SOC 2 / GDPR Controls:
These controls are **documented but not enforced** in LocalStack:

1. **CC6.1 - Logical Access Controls:**
   - MFA requirements (commented in LocalStack)
   - Permission boundaries (simplified)

2. **CC6.2 - System Access:**
   - External ID for third-party (not enforced)
   - Cross-account trust (simplified)

3. **CC6.3 - Network Access:**
   - Regional restrictions (not enforced)

4. **CC7.2 - System Monitoring:**
   - Resource tagging (works in LocalStack)
   - Audit trail metadata (works)

**Important:** Before AWS production deployment, **uncomment all security controls** to meet compliance requirements.

## Rollback to Original Configuration

To restore the original AWS-only configuration:

1. Revert `provider.tf` to remove LocalStack endpoints
2. Uncomment permission boundary deny statements in `tap_stack.tf`
3. Remove `use_localstack` variable
4. Restore original `terraform.tfvars` values
5. Update metadata.json to remove LocalStack fields

Or simply checkout the original commit before LocalStack migration.

## File Changes Summary

| File | Changes | Purpose |
|------|---------|---------|
| `provider.tf` | Added LocalStack endpoints and credentials | Enable LocalStack provider |
| `tap_stack.tf` | Simplified permission boundary, added use_localstack variable | LocalStack IAM compatibility |
| `terraform.tfvars` | Updated account IDs, simplified conditions | LocalStack-compatible values |
| `localstack.tfvars` | New file | Dedicated LocalStack config |
| `metadata.json` | Migration tracking fields | LocalStack task metadata |
| `LOCALSTACK_MIGRATION.md` | This file | Documentation |

## Support

For issues with:
- **LocalStack:** https://github.com/localstack/localstack/issues
- **Original Infrastructure:** See git history for original author
- **Migration Questions:** Check this migration guide

## References

- [LocalStack IAM Documentation](https://docs.localstack.cloud/user-guide/aws/iam/)
- [Terraform LocalStack Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/guides/custom-service-endpoints)
- [Original PR #1677](https://github.com/TuringGpt/iac-test-automations/pull/1677)

