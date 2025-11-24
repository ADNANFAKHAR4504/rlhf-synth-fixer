# Quick Start Guide - Multi-Account AWS Security Framework

This guide gets you deploying the infrastructure in under 20 minutes.

## Prerequisites (5 minutes)

Before starting, ensure you have:

1. AWS Management Account
   - AWS Organizations enabled (with all features for SCPs)
   - Admin or equivalent IAM permissions
   - No existing organization (or ready to manage it)

2. Local Tools
   - Terraform >= 1.0 installed
   - AWS CLI v2 configured
   - Credentials configured: `aws configure`

3. AWS Backend Resources
   ```bash
   # Create S3 bucket for state
   aws s3api create-bucket \
     --bucket terraform-state-backend-prod \
     --region us-east-1

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket terraform-state-backend-prod \
     --versioning-configuration Status=Enabled

   # Create DynamoDB lock table
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

## Configuration (2 minutes)

Edit `lib/terraform.tfvars`:

```hcl
# Change this
environment_suffix = "prod"

# Change these to your member account IDs
trusted_account_ids = [
  "111111111111",  # Your production account
  "222222222222"   # Your development account
]

# Optional: Add your MFA device ARN
# mfa_device_arn = "arn:aws:iam::ACCOUNT:mfa/your-device"
```

## Deploy (10 minutes)

```bash
cd lib

# Initialize Terraform
terraform init

# Review the plan (should show 75 resources)
terraform plan -out=tfplan

# Deploy
terraform apply tfplan

# Wait 5-10 minutes for all resources to create
```

## Verify (3 minutes)

```bash
# Check outputs
terraform output | head -20

# Run tests (should show mostly true values)
terraform output | grep test_ | head -10

# Verify in AWS console:
# - Organizations -> Check 3 OUs exist
# - CloudTrail -> Check trail is logging
# - Config -> Check rules are compliant
# - KMS -> Check keys exist in both regions
```

## Quick Commands Reference

### View all outputs
```bash
terraform output
```

### Run specific tests
```bash
terraform output | grep test_organization
terraform output | grep test_kms
terraform output | grep test_config
```

### Check specific resources
```bash
# View organization structure
aws organizations list-organizational-units-for-parent \
  --parent-id r-xxxx \
  --region us-east-1

# View KMS keys
aws kms list-keys --region us-east-1

# View Config rules
aws configservice describe-config-rules \
  --query 'ConfigRules[*].ConfigRuleName'
```

### Destroy (use with caution!)
```bash
# Destroy all infrastructure
terraform destroy

# Note: Organizations cannot be deleted until member accounts are removed
```

## Troubleshooting

**Error: Organization already exists**
- Use existing organization or delete old one
- Check: `aws organizations describe-organization`

**Error: CloudTrail permission denied**
- Verify S3 bucket exists: `aws s3 ls | grep terraform-state`
- Check IAM permissions in management account

**Error: Config recorder issue**
- Ensure recorder doesn't already exist
- Check: `aws configservice describe-configuration-recorders`

**Error: State lock timeout**
- Verify DynamoDB table exists: `aws dynamodb describe-table --table-name terraform-state-lock`
- May need to manually unlock: `terraform force-unlock <LOCK_ID>`

## Next Steps

After successful deployment:

1. **Add member accounts to organization**
   ```bash
   aws organizations create-account \
     --account-name "production" \
     --email prod@example.com
   ```

2. **Move accounts to OUs**
   ```bash
   aws organizations move-account \
     --account-id 111111111111 \
     --source-parent-id r-xxxx \
     --destination-parent-id ou-xxxx-xxxxxxxx
   ```

3. **Set up SNS notifications**
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT:config-notifications-prod \
     --protocol email \
     --notification-endpoint your-email@example.com
   ```

4. **Enable Config in member accounts**
   - Run similar Terraform config in member accounts
   - Use different environment_suffix values
   - Configure cross-account logging

5. **Monitor compliance**
   - Check Config dashboard for rule compliance
   - Review CloudTrail logs for API calls
   - Monitor CloudWatch alarms

## Architecture at a Glance

```
AWS Organization
├── Security OU
│   └── Compliance rules enforced
├── Production OU
│   └── Encryption mandated
└── Development OU
    └── SCPs inherited from root

Central Account (Management)
├── KMS Keys (Primary + Replica)
├── CloudTrail Organization Trail
├── CloudWatch Logs Central
├── AWS Config Rules (7)
└── Service Control Policies (4)

Member Accounts (Controlled)
├── S3 - Must be encrypted
├── EBS - Must be encrypted
├── RDS - Must be encrypted
└── Cross-account access via IAM roles with MFA
```

## Resource Summary

**What gets created:**
- 1 AWS Organization
- 3 Organizational Units
- 2 KMS Keys (primary + replica)
- 3 Cross-account IAM roles
- 4 Service Control Policies
- 5 CloudWatch Logs groups
- 7 AWS Config compliance rules
- 2 S3 buckets
- 1 Organization trail (CloudTrail)

**Total: 75 AWS resources**

## Documentation

For detailed information, see:
- `README.md` - Full architecture and operations guide
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment procedures
- `PROMPT.md` - Business requirements and use cases
- `tests/README.md` - Test suite documentation

## Support

If you encounter issues:

1. Check troubleshooting section above
2. Review deployment logs: `terraform apply 2>&1 | tail -50`
3. Check AWS CloudTrail for API errors
4. Verify all prerequisites are met
5. Review `DEPLOYMENT_GUIDE.md` troubleshooting section

## Estimated Costs

Monthly estimate:
- Organizations: Free
- CloudTrail: USD 2-5
- KMS: USD 1-2
- Config: USD 2
- CloudWatch Logs: USD 0.50
- S3: USD 5-10

**Total: USD 10-25/month for typical usage**

Costs scale with:
- Number of API calls (CloudTrail)
- Number of resources (Config rules)
- Log volume (CloudWatch)

## Success Indicators

After deployment, you should see:

1. All Terraform outputs display successfully
2. Test suite shows mostly true values (112 tests)
3. AWS console shows:
   - Organization with 3 OUs
   - CloudTrail logging
   - Config rules evaluating
   - KMS keys with rotation enabled
   - CloudWatch Logs with data flowing

If all of these check out, deployment was successful!

---

Deployment time: ~15 minutes
Documentation review: ~5 minutes
Total: ~20 minutes to fully operational infrastructure
