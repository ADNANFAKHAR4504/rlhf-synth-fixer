# CloudTrail Configuration Error - Need Fix

I'm setting up audit logging for our security infrastructure but the CloudFormation deployment is failing with a validation error:

```
CloudTrail | Properties validation failed for resource CloudTrail with message:
#: required key [IsLogging] not found
```

I need help fixing this CloudTrail configuration. The requirements are:
- Enable comprehensive audit logging for all AWS API calls
- Store logs in encrypted S3 bucket with proper access controls
- Enable log file validation for integrity checking
- Multi-region trail for complete coverage
- Integration with CloudWatch for real-time monitoring

Can you help fix the CloudTrail resource configuration so it passes CloudFormation validation and meets our security audit requirements?
