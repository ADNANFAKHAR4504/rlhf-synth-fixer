# Model Failures

## Shared IAM role instead of separate roles

The prompt said each function should have its own IAM role, but the model created a single LambdaExecutionRole shared by both functions.

Wrong:
```yaml
# Single role for both functions
LambdaExecutionRole:
  Type: AWS::IAM::Role
```

Should be:
```yaml
# Separate roles
DataProcessorRole:
  Type: AWS::IAM::Role

ResponseHandlerRole:
  Type: AWS::IAM::Role
```

This matters because the prompt specifically asked for "each function should have its own IAM role" for isolation. Sharing roles violates the least-privilege principle mentioned in the requirements.

## Missing function-specific permissions

The single IAM role gives logging permissions for both functions, but doesn't follow least-privilege. Each function's role should only have access to its own log group.

Current policy gives both functions access to both log groups:
```yaml
Resource:
  - !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectXDataProcessorFunctionName}:*"
  - !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectXResponseHandlerFunctionName}:*"
```

Should be scoped per function - dataProcessor role should only access dataProcessor logs.