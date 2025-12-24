# LocalStack Migration Guide

## DynamoDB Migration Strategy

### Current Implementation (LocalStack Community)

This infrastructure has been adapted for **LocalStack Community Edition**, which has the following limitation:

- **DynamoDB**: Not available in Community edition

As a result, the following resources have been **removed** from the CloudFormation template:

1. `EnvironmentDynamoDBTable` (AWS::DynamoDB::Table)
2. `EnvironmentDynamoDBPolicy` (AWS::IAM::Policy for DynamoDB access)
3. DynamoDB-related outputs

### Migration Path to LocalStack Pro

If you need DynamoDB functionality, you can migrate to **LocalStack Pro** which includes full DynamoDB support.

#### Step 1: Upgrade to LocalStack Pro

1. Obtain a LocalStack Pro license key
2. Update your LocalStack configuration:
   ```bash
   export LOCALSTACK_API_KEY="your-pro-license-key"
   ```
3. Restart LocalStack with Pro features enabled

#### Step 2: Restore DynamoDB Resources

To restore full DynamoDB functionality, add the following resources back to the CloudFormation template:

**1. DynamoDB Table**

Add to the `Resources` section:

```yaml
EnvironmentDynamoDBTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-data'
    BillingMode: !FindInMap [EnvironmentConfig, !Ref Environment, DynamoDBBillingMode]
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
      - AttributeName: timestamp
        AttributeType: N
    KeySchema:
      - AttributeName: id
        KeyType: HASH
      - AttributeName: timestamp
        KeyType: RANGE
    ProvisionedThroughput: !If
      - IsProductionEnvironment
      - { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
      - !Ref AWS::NoValue
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: !If [IsProductionEnvironment, true, false]
    SSESpecification:
      SSEEnabled: true
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Application
        Value: !Ref ApplicationName
```

**2. DynamoDB IAM Policy**

Add to the `Resources` section:

```yaml
EnvironmentDynamoDBPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: !Sub '${ApplicationName}-${Environment}${EnvironmentSuffix}-dynamodb-policy'
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:Query
            - dynamodb:Scan
          Resource: !GetAtt EnvironmentDynamoDBTable.Arn
    Roles:
      - !Ref ApplicationExecutionRole
```

**3. DynamoDB Output**

Add to the `Outputs` section:

```yaml
DynamoDBTableName:
  Description: Environment-specific DynamoDB table name
  Value: !Ref EnvironmentDynamoDBTable
```

#### Step 3: Restore Tests

Update `test/tap-stack.unit.test.ts`:

1. Remove the `.skip` from the DynamoDB table test
2. Re-enable DynamoDB policy assertions
3. Restore ManagedPolicyArns check
4. Restore DynamoDBTableName output test

Update `test/tap-stack.int.test.ts`:

1. Add DynamoDB table name to required outputs check
2. Re-enable DynamoDB table name environment suffix check

#### Step 4: Deploy and Verify

```bash
# Deploy with LocalStack Pro
npm run deploy

# Run tests to verify DynamoDB functionality
npm test
```

### Comparison: Community vs Pro

| Feature | LocalStack Community | LocalStack Pro |
|---------|---------------------|----------------|
| S3 | ✅ Full Support | ✅ Full Support |
| IAM | ✅ Full Support | ✅ Full Support |
| CloudWatch Logs | ✅ Full Support | ✅ Full Support |
| KMS | ✅ Full Support | ✅ Full Support |
| SSM Parameter Store | ✅ Full Support | ✅ Full Support |
| **DynamoDB** | ❌ Not Available | ✅ **Full Support** |

### Alternative: AWS Deployment

If you don't need LocalStack and want full AWS functionality:

1. Change `provider` in `metadata.json` from `"localstack"` to `"aws"`
2. Restore all DynamoDB resources (as documented above)
3. Configure AWS credentials
4. Deploy to real AWS:
   ```bash
   npm run deploy
   ```

### References

- [LocalStack Community vs Pro Comparison](https://docs.localstack.cloud/getting-started/faq/#what-is-the-difference-between-localstack-community-and-pro)
- [LocalStack Pro Features](https://localstack.cloud/pricing)
- [DynamoDB LocalStack Documentation](https://docs.localstack.cloud/user-guide/aws/dynamodb/)

## Summary

This implementation prioritizes **LocalStack Community compatibility** for cost-free local development and testing. DynamoDB functionality can be restored by:

1. Upgrading to LocalStack Pro (recommended for full local testing), OR
2. Deploying to real AWS (for production use)

Both migration paths are fully documented above with step-by-step instructions.
