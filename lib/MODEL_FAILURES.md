**model_failure**

# Failure modes to avoid

* **EarlyValidation collisions** from explicit physical names (e.g., `BucketName`, `DBInstanceIdentifier`, `FunctionName`) causing `AWS::EarlyValidation::ResourceExistenceCheck` failures.
* **CloudTrail “Incorrect S3 bucket policy”** when bucket policy lacks:

  * `s3:GetBucketAcl` allow for `cloudtrail.amazonaws.com`.
  * `s3:PutObject` allow on `cloudtrail/AWSLogs/${AccountId}/*` with `s3:x-amz-acl = bucket-owner-full-control`.
* **CloudTrail “Insufficient permissions to access S3 bucket or KMS key”** when the CMK policy does not allow `kms:GenerateDataKey*`, `kms:Encrypt`, and `kms:DescribeKey` to the CloudTrail service principal with the proper encryption context.
* **AWS Config loops**:

  * `NoAvailableDeliveryChannelException` if the recorder starts before a delivery channel exists.
  * `NoAvailableConfigurationRecorderException` if a delivery channel is created before any recorder exists or when bucket policy/role denies required S3 actions.
* **RDS parameter group mismatch** (e.g., `postgres15` family with a Postgres 17 engine default) or **nonexistent engine minor** when hard-pinned (`Cannot find version X.Y`).
* **RDS invalid master password** when omitted or failing policy; resolved by using Secrets Manager via `ManageMasterUserPassword: true` and a validated username.
* **Service write failures to S3** when bucket policy attempts to enforce request-header SSE-KMS rather than relying on default bucket encryption, breaking some service integrations.
* **EC2 public IP leakage** if network interfaces aren’t explicitly configured in the launch template.
* **Over-permissive security groups** admitting inbound traffic by default.
* **GuardDuty not enabled** or missing data sources, reducing visibility.
* **Parameters missing defaults** or lacking validation, causing pipeline prompts or invalid inputs at deploy time.

# Remediation patterns embedded in the template

* Remove physical names; let CloudFormation generate unique names to prevent collisions.
* Provide explicit **allow** statements for CloudTrail and AWS Config in the logs bucket policy; retain TLS-only deny.
* Add CMK policy statements for CloudTrail (`kms:GenerateDataKey*`, `kms:Encrypt`, `kms:DescribeKey`) with encryption-context condition.
* Define AWS Config role with least-privilege S3 write permissions to the logs prefix; ensure both recorder and delivery channel are declared without circular dependencies and rules depend on both.
* Set RDS parameter group `Family: postgres17`; omit `EngineVersion` to let AWS choose a valid minor; enable `ManageMasterUserPassword`.
* Enforce EC2 IMDSv2 and no public IPs via the launch template; encrypt root volumes with CMK.
* Keep S3 at-rest encryption via default bucket encryption; avoid blocking service writes with overly strict header checks.
* Initialize all parameters with safe defaults and apply regex/range constraints; restrict regions via a CloudFormation Rule.

# Signals that indicate success

* ChangeSet creation succeeds with EarlyValidation.
* CloudTrail goes to `RUNNING` and writes to the logs bucket and CloudWatch Logs (if toggled).
* AWS Config lists a single recorder and delivery channel in `ACTIVE`/`AVAILABLE`, and rules evaluate resources.
* RDS instance reaches `available`, with an auto-managed secret present in Secrets Manager.
* GuardDuty detector is `ENABLED` with configured data sources.
* No resources depend on existing infrastructure; redeployments do not conflict across environments due to generated physical names and `ENVIRONMENT_SUFFIX` tagging.
