Region: us-west-2
Scope: Multi-account, single-region. All resources must live inside a specified VPC.
Naming: Use [ComponentName]-[Environment]-### pattern (e.g., Trail-prod-001). Support an Environment parameter (dev|stg|prod).

Core Requirements (DO implement):
1) IAM Isolation
   - Create least-privilege IAM Roles per function (EC2InstanceRole, CloudTrailRole, WAFLoggingRole, etc.).
   - Tag all resources with Project, Environment, Owner.

2) VPC Scoping
   - Take an existing VPCId as a Parameter (no new VPC). All resources attach to this VPC or its subnets as appropriate.
   - Accept PrivateSubnetIds and PublicSubnetIds as Parameters where needed.

3) CloudTrail (Account-level logging)
   - Single org-agnostic Trail that logs all management and data events for all regions set to "true" (multi-region trail).
   - Dedicated S3 bucket for Trail with SSE-KMS encryption (KMS CMK Parameter or auto-create CMK).
   - Optionally deliver to CloudWatch Logs using an IAM role (parameter to toggle).
   - Block public access on the Trail bucket with S3 PublicAccessBlock + bucket policy restricting to CloudTrail service.
   - S3 access logs to a separate, encrypted logs bucket.

4) S3 Encryption
   - Any S3 bucket defined by this stack must enforce default SSE-KMS (SSEAlgorithm: aws:kms) and Block Public Access.
   - Deny unencrypted PUTs via bucket policy (aws:SecureTransport, x-amz-server-side-encryption = aws:kms).

5) SSH Restriction (Security Groups)
   - Provide a parameter AllowedSshCidrs (List<Cidr>) and create a reusable SG that allows TCP/22 only from those CIDRs.
   - Deny all else by default; allow egress 0.0.0.0/0, TCP/UDP ephemeral.

6) CloudWatch Metrics on EC2
   - For any EC2 LaunchTemplate/ASG in this stack, set DetailedMonitoring: true.
   - Install/enable CloudWatch Agent via SSM Association (preferred) or user data (fallback) to ship CPU, mem, disk, net metrics.
   - Parameterize Agent config (minimal, secure defaults).

7) DDoS Protection with AWS Shield
   - Include optional AWS::Shield::Protection resources for ALB/NLB or EIP (Protect-<Env>-###).
   - Use a boolean parameter EnableShieldAdvanced; create protections only when true (assume account is already subscribed).

8) AWS WAF
   - Create an AWS::WAFv2::WebACL (REGIONAL) with AWS Managed Rule Groups (CommonRuleSet, KnownBadInputs, SQLi, etc.).
   - Associate the WebACL to the public ALB via AWS::WAFv2::WebACLAssociation.
   - Enable WAF logging to an encrypted S3 bucket or CloudWatch Logs (parameter-driven).

9) Secrets Manager
   - Define a rotation-enabled AWS::SecretsManager::Secret for database credentials (username/password JSON).
   - Provide rotation Lambda ARNs as parameters OR create a minimal rotation schedule placeholder (no external code).
   - Enforce KMS CMK for the secret (customer-managed key, parameterized).

Important: DO NOT implement AWS Config
- Do NOT add AWS::Config::* resources, no ConfigurationRecorder, no DeliveryChannel, no Remediation.
- Instead, create an SNS Topic (SecurityNotifications-<Env>-###) for future security notifications, but do not wire it to Config.

Parameters (non-exhaustive; choose sensible defaults and AllowedPattern where useful):
- Environment (String; dev|stg|prod)
- ProjectName (String; default "IaC - AWS Nova Model Breaking")
- VpcId (AWS::EC2::VPC::Id)
- PrivateSubnetIds (List<AWS::EC2::Subnet::Id>)
- PublicSubnetIds (List<AWS::EC2::Subnet::Id>)
- AllowedSshCidrs (List<String>)
- TrailBucketNameSuffix (String; lowercase pattern)
- KmsKeyArnForS3 (String; optional; if empty, create CMK)
- EnableCloudTrailToCloudWatch (Boolean; default false)
- EnableShieldAdvanced (Boolean; default false)
- WafLogDestination (String; "s3"|"cloudwatch"; default "s3")

Security & Compliance Musts:
- All S3 buckets: Block Public Access, SSE-KMS by default, versioning enabled, secure transport enforced.
- All IAM policies: least privilege, no wildcards unless strictly necessary with Condition keys.
- All logs (Trail/WAF/ALB/EC2) encrypted at rest.
- Use Conditions to toggle optional features (Shield, CW Logs for Trail).
- Use Outputs with Export-friendly names (e.g., ${ProjectName}-${Environment}-TrailBucketName).

Template Quality:
- Valid YAML, passes cfn-lint and CloudFormation validation.
- Include useful Descriptions on Parameters and Resources.
- Avoid deprecated resource types.
- No placeholders requiring manual edits post-deploy (everything parameterized or conditionally created).

Deliverables:
- A single YAML file named exactly: secure-infrastructure.yaml
- Nothing else—no prose, no comments about usage—just the template.
