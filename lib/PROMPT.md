Generate a single CloudFormation template named “TapStack.yml” (YAML syntax) for us-east-1 that provisions a brand-new, secure baseline stack. Do not reference or import any pre-existing resources—create everything needed in this file. The stack must adhere to least-privilege and security-by-default practices, and it must pass both `aws cloudformation validate-template` and `cfn-lint` for us-east-1.

What to build (modules/resources to create from scratch)

* KMS

  * A customer-managed KMS key for general data-at-rest encryption (alias like alias/tapstack-kms), with a least-privilege key policy that allows: the account root, CloudTrail, CloudWatch Logs, and required services/roles in this stack. Enable key rotation.
* S3 (all new buckets; block public access)

  * Central “trail-logs” bucket for CloudTrail (SSE-KMS with the KMS key). Bucket policy: deny non-TLS (`aws:SecureTransport=false`), deny unencrypted puts, allow CloudTrail service principal per sample AWS policy. Enable object ownership = BucketOwnerEnforced, versioning, lifecycle to transition noncurrent versions and expire old logs, and server access logging to a separate dedicated “access-logs” bucket.
  * “config-logs” bucket for AWS Config (SSE-KMS, block public access, versioning, TLS-only bucket policy).
  * “lambda-artifacts” bucket for packaging code (SSE-KMS, block public access, TLS-only policy). If you add sample Lambda code inline, still keep this bucket for future updates.
* Networking

  * New VPC (10.0.0.0/16) with two public and two private subnets across distinct AZs. IGW attached. One NAT Gateway (cost-aware) in a public subnet, with private route tables egressing via NAT; public route tables to IGW.
  * VPC endpoints (Interface/Gateway as appropriate) for S3, KMS, CloudWatch Logs, SSM, and EC2 messages so private resources can reach AWS services over TLS without public internet. Restrictive endpoint policies (least-privilege).
* Security Groups (minimally permissive)

  * ALB SG: allow inbound TCP/80 from 0.0.0.0/0 only; egress 443/80 as needed. (No TLS listener—see “Exclusions” below.)
  * EC2 SG: allow inbound only from the ALB SG on app port (e.g., 8080). No SSH from the internet. Egress restricted to required destinations (443 to AWS endpoints, DB if added later).
  * Lambda SG (if placed in VPC): similar minimal egress, no inbound.
* Application Load Balancer (HTTP-only for now)

  * New ALB in public subnets with a single HTTP:80 listener forwarding to a target group for EC2 instances in private subnets. Health checks enabled. No ACM/HTTPS here by requirement.
* WAF (WAFv2)

  * New `AWS::WAFv2::WebACL` (REGIONAL) with AWS Managed rule groups enabled (e.g., `AWSManagedRulesCommonRuleSet`, `AWSManagedRulesKnownBadInputsRuleSet`, `AWSManagedRulesAmazonIpReputationList`, and `AWSManagedRulesAnonymousIpList`). Associate it with the ALB via a `WebACLAssociation`.
* EC2 (private, managed via SSM; no SSH)

  * Launch template + Auto Scaling group (min=1, max=2) in private subnets. User data should simply start a basic HTTP app on port 8080 for health checks. Do not expose SSH/22. Use SSM Agent (Session Manager) for access. No key pair.
  * Instance profile/role with least-privilege (CloudWatch logs write, SSM core, optional read to a specific S3 prefix in the artifacts bucket).
* Lambda (example function)

  * One minimal Lambda function (Node.js or Python) demonstrating least-privilege IAM and KMS-encrypted environment variables, optional VPC attachment, and logging to a dedicated CloudWatch log group with retention. Package can be inline (ZipFile) and/or uploaded to the artifacts bucket; either is fine but keep the bucket in the template.
* CloudTrail

  * Organization-agnostic, multi-region trail writing to the trail-logs bucket (SSE-KMS with the created key) and to a CloudWatch Logs log group (SSE-KMS via service-managed encryption; retention configured). Include the CloudTrail service role and the bucket policy statements required by AWS. Enable log file validation.
* AWS Config

  * Configuration Recorder, Delivery Channel to the config-logs bucket, and an IAM role for Config. Add a few foundational managed rules (e.g., s3-bucket-public-read-prohibited, s3-bucket-public-write-prohibited, cloudtrail-enabled, iam-password-policy, restricted-ssh) and show sample Remediation (SSM Doc) wiring for at least one rule.
* GuardDuty

  * Enable a `AWS::GuardDuty::Detector` with auto-enable set to true where supported; no cross-account needed here.
* CloudWatch

  * Log groups (with retention) for ALB access logs (if using Kinesis Firehose skip; otherwise keep S3), EC2 app logs via the agent (simple), Lambda logs (managed by Lambda but set retention explicitly).
* IAM (least-privilege everywhere)

  * Roles: `EC2InstanceRole`, `LambdaExecutionRole`, `CloudTrailLogsRole`, `ConfigRole`, and any roles for Firehose/Logging if added. Each role should have tight inline policies; prefer AWS managed policies only where appropriate (e.g., `AmazonSSMManagedInstanceCore`), with additional inline statements limited to the specific resources in this stack (S3 bucket ARNs, log groups, KMS key).
* Tagging

  * Apply consistent tags (Project=TapStack, Environment, Owner, CostCenter) on all taggable resources.

Encryption and in-transit expectations

* At rest: Use SSE-KMS with the created key for S3 buckets; enable KMS where supported (EBS volumes for EC2, if created by the launch template, should be encrypted by default). Enable KMS rotation.
* In transit: Enforce TLS to buckets via bucket policies (`aws:SecureTransport`). VPC endpoints use TLS. SSM/EC2 messages use TLS. (Front-end HTTPS is intentionally deferred; see Exclusions.)

Template structure and ergonomics

* Use standard sections: AWSTemplateFormatVersion, Description, Metadata, Parameters, Mappings, Conditions, Resources, Outputs.
* Parameters: include EnvironmentName, ProjectName, AllowedIngressCIDRForAlbHttp (default 0.0.0.0/0), InstanceType, Min/Max capacity, AppPort, LogRetentionDays, and any toggles you deem helpful. Validate inputs with AllowedPattern/AllowedValues where sensible.
* Mappings: for AZ selection or AMI lookup if you don’t use SSM Parameter Store for the latest Amazon Linux 2023 AMI.
* Conditions: example—`IsProd` to tune retention and ASG sizes.
* Naming: use `Fn::Sub` consistently; keep S3 bucket names lowercase with only allowed characters.
* Do not include deprecated or region-unsupported resource types.

Outputs (make them truly useful)

* VPCId, PublicSubnetIds, PrivateSubnetIds
* AlbArn, AlbDnsName, AlbSecurityGroupId, TargetGroupArn
* WebAclArn
* Ec2AutoScalingGroupName, Ec2InstanceProfileArn
* LambdaFunctionName, LambdaFunctionArn, LambdaLogGroupName
* TrailName, TrailArn, CloudTrailLogGroupArn
* ConfigRecorderName, ConfigDeliveryChannelName
* GuardDutyDetectorId
* KmsKeyArn
* Buckets and ARNs for: trail-logs, config-logs, access-logs, lambda-artifacts
* VpcEndpointIds (at least S3/KMS/Logs/SSM/EC2Messages)

Validation and quality bars

* Must be a single YAML file named TapStack.yml.
* Must create all resources from scratch; no imports to existing KMS keys, buckets, trails, etc.
* Must pass `aws cloudformation validate-template` and `cfn-lint` in us-east-1.
* Least-privilege IAM and KMS key policies. No wildcard “\*” on actions or resources unless there is a strong, documented reason (e.g., service-required statements), and then scope by Condition where possible.
* No hardcoded account IDs except where strictly required by service principals (use `!Sub arn:aws:iam::${AWS::AccountId}:…` style).
* Reasonable defaults so the stack can launch without edits.

Exclusions (important)

* Do not add or reference any SSL/TLS certificates (no ACM), and do not create HTTPS listeners. Keep the ALB HTTP-only for now and ensure the rest of the stack still enforces encryption in transit where applicable (S3, endpoints, service calls).

Deliverable

* Output only the complete TapStack.yml content—no commentary—ready to deploy.