Generate a production-ready AWS CDKTF TypeScript project that creates a secure, auditable, and cost-aware AWS infrastructure in the ap-south-1 region. The generator must output only two files: `lib/tap-stack.ts` and `lib/modules.ts`.

REQUIREMENTS

1. IAM and MFA:
- Define IAM roles with the least privilege inline policies for EC2, RDS, S3, and CloudWatch.
- Create IAM instance profiles for EC2 (set `createInstanceProfile: true`).
- Create an MFA enforcement policy that denies actions unless `aws:MultiFactorAuthPresent` equals true.
- Automatically create the RDS monitoring IAM role when `monitoringInterval > 0` using the `AmazonRDSEnhancedMonitoringRole` managed policy.
- Document manual steps in comments, such as attaching the MFA policy to users and configuring MFA devices.

2. Logging and Monitoring:
- Use CloudWatch Log Groups with configurable retention for application logs and RDS exports.
- Enable RDS enhanced monitoring with a configurable interval and auto-created monitoring role.
- Set CloudWatch Alarms for EC2 CPU usage above 80%, covering two evaluation periods with a 5-minute period.
- Create an SNS topic for notifications with AWS-managed KMS encryption (`alias/aws/sns`).

3. Environment and Secrets:
- Support the `AWS_REGION_OVERRIDE` environment variable and a parameterized environment suffix.
- RDS should use a managed master password.
- Validate the configuration at instantiation.

4. Encryption and Backups:
- Use customer-managed KMS keys with auto-rotation and aliases.
- For S3, apply SSE-KMS or AES256, enforce SSL in bucket policies, deny unencrypted uploads, and block public access.
- For RDS, implement storage encryption, automated backups with a default retention of 7 days, deletion protection (configurable), and create final snapshots with timestamps, including copying tags to snapshots.
- Enable S3 versioning with lifecycle policies.
- Ensure EC2 has encrypted EBS volumes (gp3, 20GB).

5. Network Controls:
- Create a VPC with a configurable CIDR (default: 10.0.0.0/16), supporting multiple Availability Zones (AZ).
- Configure public subnets with an Internet Gateway and private subnets with NAT Gateways and Elastic IPs.
- Set Security Groups: Public (allow HTTP, HTTPS, SSH from VPC CIDR), Private (from Public SG), and RDS (allow MySQL from Private SG).
- Create private NACLs that allow VPC traffic and ephemeral ports inbound, as well as VPC traffic and HTTPS outbound.
- Automatically create a DB subnet group from private subnets using sanitized names.
- Use `Fn.element()` to access the AZ array instead of direct indexing.

6. Cost Management:
- Create an AWS Budget (monthly, default $100) with threshold alerts (80%, 100%) to SNS.
- Tag all resources with `Project`, `Environment`, `Owner`, and `CostCenter` (capitalized, no hyphens).
- Implement tag deduplication (case-insensitive) in IAM roles.
- Use minimal instance sizes (t3.micro, db.t3.micro).

7. State Management and Outputs:
- Use an S3 backend with encryption, setting the path to `{environment}/{stack-id}.tfstate`, and native locking (`use_lockfile: true`).
- Outputs should include VPC/subnet IDs, EC2 IDs/IPs, S3 names, RDS endpoint, KMS key ID, account ID, and SNS ARN.

8. Security and Validation:
- Ensure least privilege IAM, encryption at rest and in transit, network segmentation, and audit logging.
- Include validation commands in comments: `cdktf synth`, `cdktf diff`, `cdktf deploy`.
- Note manual steps: attach the MFA policy, configure MFA devices, and subscribe to the SNS topic.