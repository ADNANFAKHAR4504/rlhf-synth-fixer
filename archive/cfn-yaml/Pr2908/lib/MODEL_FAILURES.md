# model\_failure.md

## What initially went wrong

1. **Circular dependencies (E3004)**

   * `SnsKmsKey` ↔ `ThreatMonitoringLambdaRole` ↔ `ThreatAlertTopic` referenced each other in policies and resource properties.
   * **Fix:** KMS key policies grant to the **account root** and the **SNS service**, while the IAM role policies reference the **topic ARN**. Avoid referencing the role inside the key policy if the role also needs the key to be created.

2. **Malformed YAML (E0000: “mapping values are not allowed in this context”)**

   * Caused by missing indentation, escaped colons, stray backslashes, and incorrect list markers.
   * **Fix:** Reformat YAML, correct list items, remove escape characters, ensure proper nesting.

3. **Redundant dependencies (W3005)**

   * `DependsOn` was declared where `Ref`/`GetAtt` already enforce ordering.
   * **Fix:** Remove unnecessary `DependsOn` on the Firehose Delivery Stream.

4. **Invalid property placement (E3001)**

   * `Tags` on `AWS::SNS::Topic` were outside of `Properties`.
   * **Fix:** Move `Tags` under `ThreatAlertTopic.Properties`.

5. **WAF logging destination rejected at runtime (InvalidRequest)**

   * WAF requires **log destination names** to begin with **`aws-waf-logs-`**. The stream was named `KDF-WafLogs-prod`.
   * **Fix:** Rename the Firehose stream to `aws-waf-logs-${Environment}-${AWS::StackName}`.

6. **Potential S3→Lambda circularity**

   * Direct S3 bucket notifications to Lambda can create ordering/circular refs.
   * **Fix:** Use **EventBridge** “Object Created” events to invoke Lambda.

## Preventing similar failures

* **Author in YAML, validate early and often:** run `cfn-lint` and `aws cloudformation validate-template` before deployment.
* **Be cautious with KMS/IAM references:** prefer granting to the account and service principals; avoid mutual references between roles and keys.
* **Know service quirks:** WAF logging destination naming rules, S3 bucket policy TLS enforcement, and Firehose permissions to S3/KMS.
* **Use EventBridge for S3 → Lambda** to avoid tight coupling and ordering issues.
* **Tag everything** and keep parameters fully initialized to avoid surprises during deploy.

## Quick validation checklist

* `cfn-lint` passes with **0 errors** (and no avoidable warnings).
* **Validate template:**

  ```
  aws cloudformation validate-template --region us-east-1 --template-body file://lib/TapStack.yml
  ```
* **Deploy** with `CAPABILITY_NAMED_IAM`.
* **Confirm** SNS subscription, WebACL association, Firehose delivery, and Lambda alerts after generating blocked traffic.
