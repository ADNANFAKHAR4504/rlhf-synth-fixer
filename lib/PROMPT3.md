You are an expert AWS CloudFormation architect.

## Goal

Generate **one** CloudFormation **YAML** template that satisfies all previously stated functional and security requirements.
**Output rule:** print **exactly one** fenced code block that starts with \`\`\`yaml and contains **only** the YAML template. **No prose or extra blocks.**

---

## Critical Fixes (must be reflected in the template)

1. **AWS Config — remove invalid resource (fix E3006)**

   * **Do NOT** use `AWS::Config::ConfigurationRecorderStatus` (this resource type does **not** exist in `us-east-1`).
   * Configure AWS Config with **only** these resources:

     * `AWS::Config::ConfigurationRecorder` (with a valid `RoleARN` and `RecordingGroup`).
     * `AWS::Config::DeliveryChannel`.
     * `AWS::Config::ConfigRule`(s) for security group monitoring.
   * Do **not** attempt to “start” the recorder via a non‑existent resource. If needed, rely on standard behavior when `ConfigurationRecorder` and `DeliveryChannel` are present.

2. **Tags only on resources that support them (fix E3002)**

   * **Do NOT** add `Tags` to resources that don’t support it. In particular, **do not** put `Tags` on:

     * `AWS::Logs::MetricFilter`
     * `AWS::Lambda::Permission`
     * `AWS::Config::ConfigurationRecorder`
     * `AWS::Config::DeliveryChannel`
     * `AWS::Config::ConfigRule`
     * `AWS::EC2::Route`, `AWS::EC2::RouteTableAssociation`, `AWS::EC2::SubnetRouteTableAssociation`, `AWS::EC2::NetworkAclEntry`, `AWS::EC2::SubnetNetworkAclAssociation`
     * `AWS::IAM::InstanceProfile`
   * It’s fine to use `Tags` on resources that support them (e.g., `VPC`, `Subnet`, `SecurityGroup`, `EC2 Instance`, `S3 Bucket`, `KMS Key`, `DBInstance`, `DBSubnetGroup`, `CloudTrail Trail`, `Logs LogGroup`, `CloudWatch Alarm`, `IAM Role`, `SecretsManager Secret`).
   * Ensure **every taggable resource** has `Environment` and `Owner` tags. Avoid adding `Tags` to any non‑taggable resources listed above.

3. **Keep earlier linter fixes in place**

   * **No hardcoded AZs** — use `!GetAZs` + `!Select`.
   * **No unnecessary `Fn::Sub`** — use plain strings when no variables are present.
   * **RDS EngineVersion** — parameterize `DBEngineVersion` with **AllowedValues**:
     `5.7.44-rds.20240408, 5.7.44-rds.20240529, 5.7.44-rds.20240808, 5.7.44-rds.20250103, 5.7.44-rds.20250213, 5.7.44-rds.20250508, 8.0.37, 8.0.39, 8.0.40, 8.0.41, 8.0.42, 8.0.43, 8.4.3, 8.4.4, 8.4.5, 8.4.6` (choose a valid default, e.g., `8.0.43`).
   * **Secrets via dynamic refs** — **no `DBPassword` parameter**; create an `AWS::SecretsManager::Secret` and reference via `{{resolve:secretsmanager:...::password}}`.
   * **CloudTrail** — ensure `IsMultiRegionTrail: true`, `IsLogging: true`, and `LogFileValidationEnabled: true`.
   * **IAM** — absolutely **no wildcards** in `Action` or `Resource`.

---

## What to Print

* **Exactly one** fenced code block that starts with \`\`\`yaml and contains **only** the CloudFormation template (no commentary).
* The template must be valid in **us-east-1** and pass lint with the fixes above.