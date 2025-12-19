# Quick Guardrails for CloudFormation (us-east-1)

## AWS Config

- Only use valid resources:
  - `AWS::Config::ConfigurationRecorder` (must include valid `RoleArn` + `RecordingGroup`)
  - `AWS::Config::DeliveryChannel`
  - `AWS::Config::ConfigRule` (choose at least one managed rule, e.g., for Security Group monitoring)

- Do **not** use `AWS::Config::ConfigurationRecorderStatus` (it doesn’t exist).
- No hacks to “start” the recorder.

## Tagging Rules (only where supported)

- Apply tags to:
  - VPC, Subnet, SecurityGroup, EC2 Instance, S3 Bucket, KMS Key, DBInstance, DBSubnetGroup, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, IAM Role, SecretsManager Secret

- Do **not** tag:
  - Logs MetricFilter, Lambda Permission, some EC2 associations, IAM InstanceProfile

- Always include tags:
  - `Environment`
  - `Owner`

## Other Must-Dos

- Don’t hardcode AZs → always use `GetAZs` + `Select`
- Avoid unnecessary `Fn::Sub`
- RDS:
  - `EngineVersion` must come from `DBEngineVersion` parameter
  - Constrain parameter values (e.g., default `8.0.43`)

- DB credentials must come from **Secrets Manager dynamic refs** (never a `DBPassword` parameter)
- CloudTrail:
  - Must be multi-region
  - `IsLogging: true`
  - Log File Validation enabled

- IAM policies → no wildcards in `Action` or `Resource`

## Validation Notes

- S3 in policies → always use full object ARNs like:

  ```
  arn:aws:s3:::bucket/*
  ```

- CloudTrail → `CloudWatchLogsLogGroupArn` must be the **exact log group ARN** (not `:*`)
- Region → all resources must consistently target `us-east-1`
