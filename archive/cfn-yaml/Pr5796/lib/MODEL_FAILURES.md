— Failure 1
Problem: Invalid `SSEType` configuration in DynamoDB tables caused deployment failure.
Solution: Removed unsupported `SSEType: AES256` from `SSESpecification`; DynamoDB now uses default AWS-managed encryption. (Fixed)
Affected area: DynamoDB Encryption Configuration

— Failure 2
Problem: Invalid `RetryPolicy` property `MaximumEventAgeInSeconds` in EventBridge Rule target.
Solution: Removed unsupported property and retained only `MaximumRetryAttempts` in `RetryPolicy`. (Fixed)
Affected area: EventBridge Rule Configuration

— Failure 3
Problem: Incorrect property name `MaximumEventAge` used in EventBridge Rule `RetryPolicy`.
Solution: Replaced `MaximumEventAge` with the correct property name `MaximumEventAgeInSeconds` to comply with AWS specification. (Fixed)
Affected area: EventBridge Configuration

**Summary**

* Total issues: 3
* Severity breakdown (qualitative):

  * Critical: 1 (Failure 1)
  * High: 1 (Failure 2)
  * Medium: 1 (Failure 3)
    All fixed 
