Human brief: Keep these critical corrections in the CloudFormation template for us‑east‑1 so it deploys cleanly and passes linting.

## AWS Config (do this)

- Don’t use `AWS::Config::ConfigurationRecorderStatus` (not a valid resource type in us‑east‑1).
- Configure only:
  - `AWS::Config::ConfigurationRecorder` (with a valid RoleArn and RecordingGroup)
  - `AWS::Config::DeliveryChannel`
  - `AWS::Config::ConfigRule` for security group monitoring
- Don’t try to “start” the recorder via a resource that doesn’t exist; rely on normal behavior when Recorder + DeliveryChannel are present.

## Tags (where supported only)

- Do not add Tags to unsupported resources (e.g., Logs MetricFilter, Lambda Permission, Config Recorder/DeliveryChannel/ConfigRule, certain EC2 associations, IAM InstanceProfile).
- It’s fine to tag VPC, Subnet, SecurityGroup, EC2 Instance, S3 Bucket, KMS Key, DBInstance, DBSubnetGroup, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, IAM Role, SecretsManager Secret.
- Ensure every taggable resource includes `Environment` and `Owner`.

## Keep earlier guardrails

- No hardcoded AZs (use GetAZs + Select).
- Avoid unnecessary `Fn::Sub`.
- RDS EngineVersion comes from a `DBEngineVersion` parameter constrained to allowed values (choose a valid default like `8.0.43`).
- Use Secrets Manager dynamic references for DB credentials; do not add a DBPassword parameter.
- CloudTrail: set multi‑region, logging enabled, and log file validation enabled.
- IAM: no wildcards in Action or Resource.