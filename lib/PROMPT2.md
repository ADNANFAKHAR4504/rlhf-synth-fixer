Human brief: Build a CloudFormation template for us‑east‑1 that passes common linters and follows least‑privilege practices.

## Standards

- Use current properties across EC2, S3, RDS, Lambda, CloudTrail, Config, CloudWatch, KMS, and IAM.
- Avoid wildcards in IAM `Action` and `Resource`.

## Linter‑friendly guidance

1) Availability Zones
- Don’t hardcode `us-east-1a`, etc. Use dynamic AZ lookup (GetAZs + Select).

2) Avoid unnecessary `Fn::Sub`
- If a string has no variables, use a plain string.

3) RDS engine version
- Use MySQL. Add a `DBEngineVersion` parameter constrained to allowed values.
- Default to a valid value like `8.0.43`. Reference this param from the DB instance.

4) Secrets handling
- Don’t use a `DBPassword` parameter.
- Create a Secrets Manager secret that generates a password and reference it via dynamic ref for RDS.

5) CloudTrail settings
- Set `IsMultiRegionTrail: true`, `IsLogging: true`, enable log file validation, deliver to a KMS‑encrypted S3 bucket, and send to CloudWatch Logs.

6) Tags only where supported
- Tag resources that support it (VPC, Subnet, SG, EC2, RDS, S3, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, KMS Key, IAM Role, Secret, DBSubnetGroup).
- Do not tag unsupported resources (e.g., Logs MetricFilter, Lambda Permission, certain EC2 associations, IAM InstanceProfile).

## Functional scope

- S3 with KMS and a bucket policy that enforces encryption and denies unencrypted PUTs.
- EC2 with an instance profile limited to required S3 bucket/prefix permissions.
- SG allowing only SSH (22) from `AllowedSshCidr` with clear descriptions.
- RDS encrypted with KMS in private subnets.
- Lambda with explicit Log Group and minimal logs permissions.
- Private‑only VPC (no IGW/public subnets; MapPublicIpOnLaunch: false).
- Tag every supported resource with `Environment` and `Owner`.
- No IAM wildcards.
- Termination protection on critical EC2 instances.
- CloudTrail multi‑region with LFV, KMS S3 delivery, and CloudWatch Logs.
- MetricFilter for Unauthorized/AccessDenied with a CloudWatch Alarm (SNS parameterized).
- AWS Config: recorder + delivery channel + SG monitoring rule.

## Parameters

- `Environment`, `Owner`, `AllowedSshCidr`.
- `DBEngineVersion` with allowed values; default to a valid version.
- Optional: `DbUsername` (non‑secret), `NotificationEmail`, `S3BucketName`, `TrailBucketName`.

## AMI resolution

- Don’t hardcode AMI IDs. Use SSM param `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` with type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`.

## Final checklist

- Dynamic AZs, minimal `Fn::Sub`, valid RDS EngineVersion via param, no DBPassword param (use secret), CloudTrail logging + LFV, tags only where supported, no IAM wildcards, private‑only VPC, and overall deployment‑ready YAML.