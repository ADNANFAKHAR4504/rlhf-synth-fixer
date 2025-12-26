Please check the following error and fix this issue that I am facing on deployment:

Error:

```
The resource SecureCloudTrail is in a CREATE_FAILED state
This AWS::CloudTrail::Trail resource is in a CREATE_FAILED state.

Properties validation failed for resource SecureCloudTrail with message: #: required key [IsLogging] not found
```

Stack is in failed rollback complete state after this issue and also make sure that lambda-function.zip code is added as well.
