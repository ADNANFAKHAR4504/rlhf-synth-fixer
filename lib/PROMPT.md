You are an AWS Security + CloudFormation expert.

TASK
Generate a single **CloudFormation template in YAML** that builds a secure, production-grade baseline for a high-profile, sensitive application. The template must **successfully deploy** and strictly follow the requirements below.

SCOPE & HARD REQUIREMENTS
1) Region: **All resources must be created in us-east-1 only** (assume the stack is launched there; do not hardcode other regions).
2) **KMS encryption for data at rest** across all relevant services (S3, EBS volumes, CloudTrail, AWS Config, Route 53 DNSSEC KSK).
3) **Least-privilege IAM**: every role/policy grants only what is required.
4) **S3**: default encryption with **SSE-KMS**, **Block Public Access** = true, server access logging **enabled** (use a dedicated logging bucket). Ensure logging works by configuring bucket ACL/ownership controls as required by S3 access logging.
5) **EC2**: use latest Amazon Linux 2 AMI via SSM Parameter; **no static credentials**; use an **Instance Profile** with **AmazonSSMManagedInstanceCore** only (plus anything strictly needed). Encrypt root EBS with KMS.
6) **Security Groups**: inbound is **restricted to known CIDR ranges** provided via a parameter; instances accept traffic only from the ALB security group; SSH restricted to the known CIDRs.
7) **CloudTrail**: log all API calls (management events, and S3 object-level data events); deliver to an encrypted S3 bucket and to a CloudWatch Logs group with KMS.
8) **AWS Config**: configuration recorder + delivery channel to encrypted S3 + SNS topic; add key **managed rules** to alert on non-compliance (e.g., s3-bucket-logging-enabled, s3-bucket-server-side-encryption-enabled, cloud-trail-enabled, vpc-flow-logs-enabled, iam-user-mfa-enabled, restricted-ssh). Use least-privilege IAM role for the recorder.
9) **IAM MFA enforcement**: create a managed policy that **denies all actions when aws:MultiFactorAuthPresent is false**, except actions needed to set up/activate MFA and read own account info; attach this policy to a group (e.g., AllUsers). (Note: administrators must add all IAM users to this group.)
10) **Load Balancer**: Application Load Balancer with **HTTPS-only** listener; **do not create an HTTP listener**. The certificate must be provided via an **ACM certificate ARN parameter**. Security group allows **443 only** from the known CIDRs.
11) **Route 53 DNSSEC**: create a public hosted zone and **enable DNSSEC** using **AWS::Route53::KeySigningKey** with a dedicated KMS key (ECC_NIST_P256, SIGN_VERIFY). Include a correct KMS key policy granting the Route 53 DNSSEC service principal permissions to **DescribeKey/GetPublicKey/Sign**.
12) **VPC Flow Logs**: enabled to a CloudWatch Logs group using a role with minimal permissions; logs encrypted with KMS.
13) Tag all resources with `Environment: Production` (or a parameterized Environment value).

PARAMETERS (define all with sensible defaults/examples and validation where applicable)
- AllowedIpRanges: List of CIDR strings for allowed ingress (e.g., ["203.0.113.0/24","198.51.100.10/32"])
- ACMCertificateArn: String (for the ALB HTTPS listener)
- HostedZoneName: String (e.g., example.com.)
- Environment: String (default "Production")
- TrailLogBucketName / ConfigBucketName / AccessLogsBucketName: optional Strings if you want to allow injection; otherwise create named buckets with unique suffix via Fn::Sub and stack ID.
- (Any other minimal parameters you truly need—avoid placeholder values.)

MANDATORY IMPLEMENTATION DETAILS
- Use SSM Parameter for AL2 AMI: `/aws/service/ami-amazon-linux-latest/amzn2-ami-kernel-5.10-hvm-x86_64-gp3`.
- S3 buckets: 
  - BlockPublicAccess on.
  - Default SSE-KMS with a CMK you define.
  - Access logging: dedicate a target logs bucket with required ACL/OwnershipControls to allow server access logging delivery.
- CloudTrail:
  - Management events = All, Read/Write = All.
  - Data events: S3 object-level for all buckets created in this stack.
  - Deliver to encrypted S3 and encrypted CloudWatch Logs.
- AWS Config:
  - Recorder + DeliveryChannel to encrypted S3 + SNS Topic.
  - Include the managed rules listed above.
- EC2:
  - Instance profile & role: AmazonSSMManagedInstanceCore and only strictly necessary permissions (e.g., read from its own log group if needed).
  - Root volume encrypted with the CMK you create.
  - Place instance in private subnet if you build subnets; if you keep it simple, single public subnet is acceptable but still behind ALB with SG rules as above.
- ALB:
  - HTTPS listener only, default action can be a fixed 200 response or forward to instance/target group; **no HTTP listener**.
- Route 53 DNSSEC:
  - Create HostedZone + KeySigningKey referencing a KMS key with KeySpec ECC_NIST_P256 and KeyUsage SIGN_VERIFY; include a correct key policy for the Route 53 DNSSEC service principal `dnssec-route53.amazonaws.com`.
- VPC Flow Logs:
  - Deliver to CloudWatch Logs with KMS + least-privilege role.

OUTPUT FORMAT (STRICT)
- Return **only** the final CloudFormation **YAML** inside a single fenced code block with language `yaml`.
- No explanations before or after the code block.
- Use logical resource names that are readable.
- Include Outputs for: 
  - VPC ID, ALB DNSName, InstanceId (or ASG/TargetGroup ARN), CloudTrailArn, ConfigRecorderName, HostedZoneId, KeySigningKeyArn, FlowLogId.
- Avoid placeholders that would block stack creation; use parameters where external values are required (e.g., ACM cert ARN).

QUALITY BAR
- Must pass `cfn-lint` basic checks.
- Policies must be least-privilege (no `*` unless absolutely unavoidable for service-delivered logs).
- KMS key policies should be explicit, granting only necessary service principals.
- Buckets and logs must be encrypted with the CMK(s) you define.
- Security groups must restrict ingress with the AllowedIpRanges parameter.
- No hardcoded ARNs except well-known service principals.
- The template should deploy cleanly without manual steps, except:
  - Supplying a valid ACM certificate ARN,
  - (Optional) delegating your domain to the hosted zone and validating the ACM cert (out of band),
  - Subscribing to the SNS topic for Config alerts (standard AWS confirmation behavior).

Produce the YAML now.