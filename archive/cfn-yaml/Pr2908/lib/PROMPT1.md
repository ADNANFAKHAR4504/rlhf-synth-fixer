Your code failed at deploy stage with this error:

Uploading to pr2908/9a69c61c3a7298cb334d74d1f1e715ce.template  28476 / 28476.0  (100.00%)
An error occurred (ValidationError) when calling the CreateChangeSet operation: Circular dependency between resources: [ThreatAlertTopic, ThreatMonitoringLambdaRole, ThreatAlertEmailSubscription, ThreatMonitoringLambda, LogsKmsKeyAlias, SnsKmsKeyAlias, SnsKmsKey, LogsKmsKey, LogsReadRole, WafLogsBucketPolicy, WafLogsBucket, LambdaInvokePermission, WAFLoggingConfiguration]
Error: Process completed with exit code 254.