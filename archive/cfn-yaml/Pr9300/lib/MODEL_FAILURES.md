# Model Failures

## CIDR Block Configuration Doesn't Match Requirements

The model response used different CIDR blocks for Dev and Prod VPCs:
- Dev VPC: `10.0.0.0/16`
- Prod VPC: `10.1.0.0/16`

But the prompt specifically stated: "Each environment gets its own VPC with 10.0.0.0/16 CIDR block - using the same range for consistency between environments"

This matters because the requirement was for consistent CIDR configuration across environments, which is useful for maintaining identical network topology and simplifying network planning. Using different CIDR blocks defeats this purpose and doesn't match what was requested.

Fixed in actual deployment: Both VPCs now use `10.0.0.0/16` as requested.

## Missing EnvironmentSuffix Parameter

The model response didn't include an `EnvironmentSuffix` parameter in the template parameters section. This parameter is critical for LocalStack deployments where multiple stacks need unique resource names to avoid collisions.

Without this parameter:
- Resource names could conflict when deploying multiple instances
- Testing with different environment suffixes (like pr numbers) becomes difficult
- Resource cleanup is harder because resources aren't clearly tagged with deployment context

Fixed in actual deployment: Added `EnvironmentSuffix` parameter and integrated it into all resource names with the pattern `${EnvironmentName}-${EnvironmentSuffix}-ResourceName`.

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| NAT Gateway | EIP allocation can be flaky in Community | Added DeletionPolicy: Delete to all resources | Works in LocalStack and AWS |
| VPC CIDR blocks | Same CIDR per prompt requirement | Both VPCs use 10.0.0.0/16 | Works (separate VPCs, same CIDR) |
| Cross-stack exports | May have limitations | All exports included but optional for LocalStack | Full support in AWS |
| SSM Parameters for AMI | Limited SSM support | Using SSM parameter resolver for latest AMI | Works in LocalStack and AWS |

### Environment Detection Pattern Used

Not applicable - this is a pure CloudFormation template without conditional logic. All resources deploy to both LocalStack and AWS identically.

### Services Verified Working in LocalStack

- VPC (full support)
- EC2 (basic support - instances, security groups)
- S3 (full support - buckets, versioning, policies)
- IAM (basic support - roles, policies, instance profiles)
- CloudFormation (full support for stack operations)

## LocalStack-Specific Fixes Applied

1. Added `DeletionPolicy: Delete` to all resources for easier cleanup in testing
2. Modified availability zone selection to use `!GetAZs ''` instead of hardcoded zones (fixes lint W3010)
3. Added EnvironmentSuffix parameter for deployment isolation
4. Both VPCs use same CIDR block (10.0.0.0/16) as specified in requirements - this works because VPCs are separate and isolated

## Resource Naming Pattern Improvements

Changed from:
```yaml
Value: !Sub '${EnvironmentName}-Dev-VPC'
```

To:
```yaml
Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-VPC'
```

This ensures unique resource names across multiple deployments and makes it clear which PR/environment a resource belongs to.
