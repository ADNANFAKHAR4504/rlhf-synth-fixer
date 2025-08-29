## CDK DynamoDB Billing Mode Compatibility Issue

You need to update the DynamoDB table configuration in the serverless data processing pipeline to use the correct billing mode attribute.

### Problem Description

The current implementation is using a deprecated or incorrect billing mode attribute for DynamoDB that's causing deployment failures. The CDK stack needs to be updated to use the proper billing mode for on-demand capacity.

### Requirements

1. **Fix DynamoDB Billing Mode**: Update the DynamoDB table configuration to use the correct attribute for on-demand billing
2. **Maintain Functionality**: Ensure the table still uses pay-per-request pricing model
3. **Preserve Configuration**: Keep all other DynamoDB settings (partition key, point-in-time recovery, etc.)
4. **Test Compatibility**: Ensure the fix works with the current CDK version

### Expected Outcome

- DynamoDB table should deploy successfully with on-demand billing
- No changes to the overall architecture or functionality
- Stack synthesis should complete without errors
- All existing tests should continue to pass

### Context

This is part of a serverless data processing pipeline where:

- S3 bucket triggers Lambda function on file uploads
- Lambda processes files and stores metadata in DynamoDB
- DynamoDB needs to scale automatically based on demand
