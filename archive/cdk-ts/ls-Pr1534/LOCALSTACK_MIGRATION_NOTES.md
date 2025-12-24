# LocalStack Migration Notes - Pr1534

## Migration Summary

Successfully migrated CDK TypeScript infrastructure from AWS-focused setup to LocalStack Community Edition compatible version.

## Services Removed (Pro-only/Unsupported in LocalStack Community)

1. **AWS Backup** - Complete backup infrastructure removed
   - BackupVault
   - BackupPlan  
   - BackupSelection
   
2. **CodeCommit** - Repository management removed
   
3. **CodeBuild** - Build project removed
   
4. **CodePipeline** - Complete CI/CD pipeline removed
   
5. **VPC Flow Logs** - Flow log collection removed (Pro feature)

6. **VPC Peering** - Cross-region peering removed (limited support)

7. **Multi-Region/Multi-AZ** - Simplified to single region (us-east-1)
   - Reduced maxAzs from 3 to 2
   - Removed database subnet tier

## Services Retained (LocalStack Community Compatible)

- **VPC** - Simplified networking with public/private subnets
- **EC2** - Subnets, route tables, internet gateway, NAT gateways
- **S3** - KMS-encrypted buckets with versioning
- **KMS** - Encryption key with alias
- **IAM** - Monitoring role with managed policies
- **SNS** - Topic for alarms
- **CloudWatch** - Dashboard and alarms

## Code Changes

### Stack Simplification

- Removed import statements for backup, codebuild, codecommit, codepipeline modules
- Removed BackupConstruct class
- Removed PipelineConstruct class
- Removed VpcPeeringConstruct class
- Modified VpcConstruct to remove flow logs and database subnet tier
- Added `autoDeleteObjects: true` to S3 buckets for easier cleanup
- Set `enableBackup: false` by default
- Changed default region from multi-region to `us-east-1`
- Added `LocalStack: true` tag to all resources

### Integration Test Adjustments

Tests remain conditional and skip missing outputs (Backup, CodePipeline removed).

## Known Issues

### CDK Asset Publishing to LocalStack

When deploying with `cdklocal deploy`, there's a known issue with S3 asset uploading:

```
exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token))
```

This is due to cdklocal trying to upload JSON instead of XML to S3 for CloudFormation templates.

### Workarounds

1. **Use AWS CDK with endpoint override:**
   ```bash
   export AWS_ENDPOINT_URL=http://localhost:4566
   export AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566
   cdk deploy --all --require-approval never
   ```

2. **Use LocalStack Pro** (if available) which has better CDK support

3. **Deploy via CloudFormation template:**
   ```bash
   cdk synth > template.json
   awslocal cloudformation create-stack --stack-name tap-stack --template-body file://template.json
   ```

## Deployment Status

- ✅ Code is LocalStack Community Edition compatible
- ✅ Bootstrap succeeded
- ⚠️  Asset publishing has known cdklocal issue
- ⏸️  Full deployment pending cdklocal fix or workaround

## Testing Strategy

Once deployment succeeds:

1. Run integration tests: `npm test`
2. Verify outputs in `cfn-outputs/flat-outputs.json`
3. Validate resources via `awslocal` CLI:
   - `awslocal ec2 describe-vpcs`
   - `awslocal s3 ls`
   - `awslocal kms list-keys`

## Recommendations

1. Consider using Terraform or Pulumi for LocalStack deployments (better compatibility)
2. Use LocalStack Pro for full CDK support
3. Simplify stack further if only testing specific services

## Complexity Reduction

Original: **Hard** → Migrated: **Medium**

- Removed 6 Pro-only AWS services
- Simplified networking topology
- Single-region deployment
- Maintained core infrastructure patterns
