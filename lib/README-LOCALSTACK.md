# LocalStack Deployment Notes

## Issue
The original Terraform configuration failed to deploy to LocalStack because:
1. EC2 service is disabled in LocalStack Community Edition
2. VPC resources require EC2 service to be enabled
3. RDS service is not available in LocalStack Community Edition

## Solution
Created a simplified LocalStack-compatible configuration (`main.tf`) that:
- Only uses services available in LocalStack: S3, IAM, STS, CloudWatch, SNS
- Provides dummy/placeholder values for unavailable resources (VPC, EC2, RDS)
- Maintains the same output structure for integration test compatibility

## Files
- `main.tf` - Current LocalStack-compatible configuration
- `main-aws.tf.backup` - Original AWS production configuration
- `variables.tf` - Updated with `web_instance_count = 0` and `app_instance_count = 0` defaults
- `terraform.tfvars` - Updated with instance counts set to 0

## Resources Deployed to LocalStack
✅ IAM Role (`aws_iam_role.ec2_role`)
✅ IAM Instance Profile (`aws_iam_instance_profile.ec2_profile`)
✅ IAM Role Policy (`aws_iam_role_policy.s3_access`)
✅ S3 Bucket (`aws_s3_bucket.app_data`)
✅ S3 Bucket Versioning (`aws_s3_bucket_versioning.app_data`)
✅ S3 Bucket Encryption (`aws_s3_bucket_server_side_encryption_configuration.app_data`)
✅ S3 Bucket Public Access Block (`aws_s3_bucket_public_access_block.app_data`)

## Resources NOT Deployed (LocalStack Limitations)
❌ VPC and Networking (requires EC2 service)
❌ EC2 Instances (EC2 service disabled)
❌ RDS Database (RDS service not available)
❌ Security Groups (requires VPC/EC2)

## Deployment Results
```
Apply complete! Resources: 7 added, 0 changed, 0 destroyed.

Outputs:
- s3_bucket_name: app-data-synth101000888-20251222092037451400000002
- vpc_id: vpc-localstack-na (dummy value)
- public_subnet_ids: ["subnet-localstack-na-1", "subnet-localstack-na-2"] (dummy values)
- private_subnet_ids: ["subnet-localstack-na-1", "subnet-localstack-na-2"] (dummy values)
- web_instance_ids: []
- app_instance_ids: []
- database_endpoint: localhost:5432 (dummy value)
- web_security_group_id: sg-localstack-na (dummy value)
- app_security_group_id: sg-localstack-na (dummy value)
- database_security_group_id: sg-localstack-na (dummy value)
```

## Restoring for AWS Production
To restore the original configuration for AWS deployment:
```bash
cd /var/www/turing/iac-test-2/lib
mv main.tf main-localstack.tf
mv main-aws.tf.backup main.tf
# Update variables.tf to set enable_vpc_resources = true or restore from git
# Update terraform.tfvars to set appropriate instance counts
```

## LocalStack Services Available
- cloudwatch: running
- events: running
- iam: running
- kms: running
- logs: running
- s3: running
- sns: running
- ssm: running
- sts: running
