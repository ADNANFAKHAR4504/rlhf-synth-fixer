## Quick guardrails for CloudFormation template (us-west-2)

### AWS Config
- Use only valid resources:
  - `AWS::Config::ConfigurationRecorder` (valid RoleArn + RecordingGroup)
  - `AWS::Config::DeliveryChannel`
  - `AWS::Config::ConfigRule` (pick one managed rule for security group monitoring)
- No `AWS::Config::ConfigurationRecorderStatus` (doesn’t exist). No hacks to “start” the recorder.

### Tagging (only where supported)
- Tag: VPC, Subnet, SecurityGroup, EC2 Instance, S3 Bucket, KMS Key, DBInstance, DBSubnetGroup, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, IAM Role, SecretsManager Secret.
- Don’t tag: Logs MetricFilter, Lambda Permission, some EC2 associations, IAM InstanceProfile.
- Always include `Environment` and `Owner` on taggable resources.

### Other must-dos
- Don’t hardcode AZs; use `GetAZs` + `Select`.
- Avoid unnecessary `Fn::Sub`.
- RDS `EngineVersion` via `DBEngineVersion` parameter (constrained; e.g., default `8.0.43`).
- DB creds from Secrets Manager dynamic refs — no `DBPassword` parameter.
- CloudTrail multi-region with logging and Log File Validation enabled.
- IAM policies have no wildcards in `Action`/`Resource`.

### Validation notes
- S3 object/prefix ARNs must be full `arn:aws:s3:::bucket/*` in policies.
- CloudTrail `CloudWatchLogsLogGroupArn` must be the actual log group ARN (no `:*`).
- Region consistency: target `us-west-2`.