### 1\. Critical Failure: Hardcoded Resource Names

  * **Issue:** The template explicitly sets physical names for the DynamoDB table, SQS queues, SNS topic, IAM roles, and Lambda functions using the `TableName`, `QueueName`, `TopicName`, `RoleName`, and `FunctionName` properties.
  * **Requirement Violated:** This violates the fundamental requirement for multi-region deployment and best practices for resource management. Hardcoding names prevents CloudFormation from creating resources if a resource with the same name already exists in the account (e.g., from a previous failed deployment or a deployment in another region). It also prevents multiple stacks from being deployed in the same account/region.
  * **Impact:** **High.** This is a critical architectural flaw that prevents the template from being reliably deployed across multiple environments or recovering from certain stack failures.
  * **Example Snippet (Failure):**
    ```yaml
    PatientDataTable:
      Type: 'AWS::DynamoDB::Table'
      Properties:
        TableName: !Sub '${ProjectName}-PatientDataTable' # <-- Hardcoded Name
    ```

### 2\. Security Failure: Overly Permissive IAM Role (`ProcessPatientDataRole`)

  * **Issue:** The `ProcessPatientDataRole` includes the `sqs:GetQueueAttributes` permission, which was not specified in the requirements.
  * **Requirement Violated:** The principle of least privilege. The prompt explicitly stated the role should *only* have `dynamodb:PutItem` and `sqs:SendMessage` permissions.
  * **Impact:** **Medium.** While not as severe as a wildcard permission, it grants the function an unnecessary capability, increasing the potential attack surface.
  * **Example Snippet (Failure):**
    ```yaml
    - PolicyName: 'SQSSendMessagePolicy'
      PolicyDocument:
        Statement:
          - Action:
              - 'sqs:SendMessage'
              - 'sqs:GetQueueAttributes' # <-- Unnecessary Permission
            Resource: !GetAtt AnalyticsTaskQueue.Arn
    ```

### 3\. Security Failure: Use of AWS Managed Policy for Logging

  * **Issue:** All three IAM roles use the `AWSLambdaBasicExecutionRole` managed policy for CloudWatch Logs permissions.
  * **Requirement Violated:** The principle of least privilege and the requirement to pass `cfn-lint` checks without security warnings. This AWS-managed policy grants `logs:CreateLogGroup` permissions on all resources (`*`), which is overly permissive. A best practice is to grant logging permissions only to the specific log group for that function.
  * **Impact:** **Medium.** This is a common finding in security scans. It allows a compromised function to potentially create log groups anywhere in the account, which could be used to disrupt logging or incur costs.
  * **Example Snippet (Failure):**
    ```yaml
    ProcessPatientDataRole:
      Type: 'AWS::IAM::Role'
      Properties:
        ManagedPolicyArns:
          - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' # <-- Overly Permissive
    ```

-----

### Summary of Non-Compliance

| Requirement                                        | Status  | Reason for Failure                                                                                             |
| -------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| **No Hardcoded Resource Names** | FAIL | All major resources have hardcoded physical names, preventing multi-region/multi-stack deployments.            |
| **Least Privilege: `ProcessPatientDataRole`** | FAIL | The role has an extra, unneeded permission (`sqs:GetQueueAttributes`).                                          |
| **Least Privilege: CloudWatch Logs** | FAIL | Uses the overly permissive `AWSLambdaBasicExecutionRole` instead of a specific, inline policy for logging.       |
| **Pass `cfn-lint` without security warnings** | FAIL | The use of the managed logging policy and hardcoded names would generate multiple warnings and errors.         |

**Conclusion:** The template must be refactored to remove all hardcoded names and to scope down IAM permissions to the absolute minimum required.
