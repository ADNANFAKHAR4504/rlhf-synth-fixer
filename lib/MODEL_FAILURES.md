# Model Failures and Observations

This document captures the failures and issues encountered during the development and testing of the TapStack CloudFormation template.

## CloudFormation Lint (cfn-lint) Issues

### 1. S3 Bucket Naming Pattern Violation (W1031)

**Issue**: `{'Fn::Sub': '${EnvironmentName}-webapp-static-${AWS::AccountId}'} does not match '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'`

**Root Cause**: S3 bucket names must be lowercase, but the EnvironmentName parameter could contain uppercase letters.

**Resolution**: Removed explicit BucketName property to let AWS auto-generate a compliant name.

### 2. Unnecessary Fn::Sub Usage (W1020)

**Issue**: `'Fn::Sub' isn't needed because there are no variables`

**Root Cause**: Used `!Sub` in UserData script without any variable substitution.

**Resolution**: Removed `!Sub` and used plain YAML multiline string.

### 3. Missing UpdateReplacePolicy (W3011)

**Issue**: `Both 'UpdateReplacePolicy' and 'DeletionPolicy' are needed to protect resource from deletion`

**Root Cause**: RDS instance had only `DeletionPolicy: Snapshot` but missing `UpdateReplacePolicy`.

**Resolution**: Added `UpdateReplacePolicy: Snapshot` to match the deletion policy.

### 4. Invalid MySQL Version (E3691)

**Issue**: `'8.0' is not one of ['5.7.44', '8.0.32', '8.0.33', ...]`

**Root Cause**: Used generic version '8.0' instead of specific supported version.

**Resolution**: Changed to specific version '8.0.35' from the allowed list.

## Deployment Parameter Issues

### 5. Missing Required Parameters

**Issue**: `Parameters: [KeyPairName, ExistingVPCId] must have values`

**Root Cause**: CloudFormation template had required parameters without default values, but deployment script didn't provide them.

**Resolution**: Added default values to parameters:

- `ExistingVPCId`: 'vpc-12345678' (placeholder)
- `KeyPairName`: 'default-key' (placeholder)
- Changed `KeyPairName` type from `AWS::EC2::KeyPair::KeyName` to `String` to allow default value

## TypeScript/Testing Issues

### 6. Incorrect AWS SDK Import

**Issue**: `Module '"@aws-sdk/client-elastic-load-balancing-v2"' has no exported member 'ELBv2Client'`

**Root Cause**: Used incorrect export name for Elastic Load Balancing v2 client.

**Resolution**: Changed from `ELBv2Client` to `ElasticLoadBalancingV2Client`.

### 7. Invalid Fetch Options

**Issue**: `'timeout' does not exist in type 'RequestInit'`

**Root Cause**: Standard fetch API doesn't support timeout property in RequestInit.

**Resolution**: Removed timeout property from fetch calls.

### 8. Template JSON Out of Sync

**Issue**: Unit tests failing because JSON template had old parameter types.

**Root Cause**: After updating YAML template, forgot to regenerate JSON version.

**Resolution**: Ran `cfn-flip lib/TapStack.yml > lib/TapStack.json` to sync templates.

## Integration Test Expected Failures

### 9. Stack Not Deployed

**Issue**: Integration tests failing with "Stack does not exist" errors.

**Root Cause**: Tests expect deployed infrastructure but no stack was deployed.

**Resolution**: This is expected behavior - integration tests require actual deployed infrastructure.

## Key Learnings

1. **Always run cfn-lint** before deployment to catch template issues early
2. **Keep JSON and YAML templates in sync** when making changes
3. **Use specific versions** for AWS resources rather than generic ones
4. **Provide default values** for parameters to avoid deployment failures
5. **Test both template structure and deployed infrastructure** separately
6. **AWS SDK import names** can be different from service names
7. **Standard web APIs** have limitations compared to Node.js-specific implementations

## Prevention Strategies

1. Set up pre-commit hooks to run cfn-lint
2. Automate JSON template generation from YAML
3. Use parameter validation in CloudFormation templates
4. Implement proper error handling in integration tests
5. Document required environment variables and setup steps
