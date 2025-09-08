Create a complete, fully functional AWS CloudFormation **YAML** template named **TapStack.yml**. It must include all **Parameters**, **Conditions**, **Resources**, and **Outputs**, and it must **create everything from scratch** (no lookups or references to pre-existing resources). Keep it AWS best-practice focused (least privilege, encryption, no public buckets, etc.), and make sure it passes `cfn-lint` and CloudFormation validation.

### Scope (what this template must include)

* **VPC networking (single region deployment)**

  * One VPC with **two public** and **four private** subnets (app + db tiers), spread across **two AZs** using `Fn::GetAZs` (no AZ parameters).
  * Internet Gateway + public route table and associations.
  * **No NAT Gateways** (keep it lean).
* **Management access via IPSec VPN only**

  * Create **Virtual Private Gateway**, **VPCGatewayAttachment**, **CustomerGateway** (parameterized public IP + BGP ASN), **VPNConnection** (static routes), and a **VPNConnectionRoute** for an `OnPremCidr` parameter.
  * A **management Security Group** that allows **SSH (22)** **only** from `OnPremCidr`.
  * An **app Security Group** that does not allow SSH (no other inbound by default).
* **S3 (CloudTrail log bucket) with strong security**

  * Bucket must **block public access** and deny insecure transport.
  * **SSE-KMS** with a dedicated **KMS CMK** (key rotation enabled).
  * Bucket policy must allow CloudTrail writes and (optionally) include an **AWS Organizations guard** if an `OrganizationId` parameter is provided (deny access outside the org when set).
* **CloudTrail (optional toggle)**

  * Use a parameter `EnableCloudTrail` (`true|false`, default `false`).
  * When enabled: create a **multi-region trail** with log file validation, delivery to the S3 bucket above, **CloudWatch Logs** integration (log group + IAM role the service can assume), and **KMS** encryption.
  * Keep IAM permissions tight: allow only the actions CloudTrail actually needs (e.g., `logs:CreateLogGroup`, `logs:Describe*`, `logs:CreateLogStream`, `logs:PutLogEvents`).
* **ALB + WAF**

  * One **internet-facing ALB** in the public subnets.
  * A **port 80 listener** that **redirects HTTP → HTTPS (301)**.
  * **Note:** this template does **not** create an HTTPS listener or an ACM certificate; the redirect assumes HTTPS will be handled later.
  * Attach **AWS WAFv2 WebACL** (REGIONAL) with a small set of AWS Managed Rule Groups (Common, IP Reputation, SQLi).
  * Optional **Shield Advanced** protection on the ALB via `EnableShieldAdvanced` parameter.
* **Cross-account audit role (optional)**

  * A least-privilege, **read-only IAM role** that an external account can assume **only with MFA**.
  * Parameterize the external account with `ExternalAccountId`. If not provided, skip creating the role.
* **Multi-account awareness via AWS Organizations**

  * Parameter `OrganizationId` used only to tighten the S3 bucket policy when present (deny access outside the org).

### What is **out of scope** (do not include)

* **RDS** (no database resources; no automatic minor version upgrades here).
* **HTTPS listener / ACM certificate management** (we only set up HTTP→HTTPS redirect on 80).
* **CloudFront** and global distributions.
* **Multi-region duplication** and **VPC peering** between regions (keep this template region-agnostic but deployed once per region as needed).

### Parameters to include (with sensible defaults)

* `VpcCidr` (default `10.0.0.0/16`)
* `OnPremCidr` (default e.g. `192.168.0.0/16`)
* `CustomerGatewayIp` (example public IP default for clarity)
* `CustomerGatewayBgpAsn` (default `65000`)
* `OrganizationId` (default empty string; when set, enable org-guard in bucket policy)
* `ExternalAccountId` (default empty string; when set, create cross-account role with MFA)
* `EnableShieldAdvanced` (`true|false`, default `false`)
* `EnableCloudTrail` (`true|false`, default `false`)

### Conditions

* `UseOrganizationGuard` → true if `OrganizationId` provided.
* `AllowCrossAccountRole` → true if `ExternalAccountId` provided.
* `CreateShield` → true if `EnableShieldAdvanced` is `"true"`.
* `CreateTrail` → true if `EnableCloudTrail` is `"true"`.

### Resource notes & guardrails

* VPC: `EnableDnsSupport` and `EnableDnsHostnames` set to `true`.
* Public subnets map public IPs on launch; private subnets do not.
* S3 bucket policy must include: deny insecure transport; optional deny outside org; allow CloudTrail `s3:GetBucketAcl` and `s3:PutObject` with `bucket-owner-full-control`.
* KMS key policy must allow CloudTrail (`kms:GenerateDataKey*`, `kms:DescribeKey`, `kms:Encrypt`) with the proper encryption context, and root account admin. Rotation enabled.
* CloudTrail CWL role trust policy for `cloudtrail.amazonaws.com`; policy must allow `logs:CreateLogGroup` (on `*`), `logs:Describe*`, and `logs:CreateLogStream`/`logs:PutLogEvents` on the target log group.
* Cross-account audit role trust policy limited to the provided external account root **with MFA** required (`aws:MultiFactorAuthPresent = true`). Read-only permissions only (describe/list/get across EC2, ELB, S3, CloudTrail, IAM, CloudWatch Logs).
* ALB Security Group: allow inbound **80** from anywhere (for redirect only) and egress all; no SSH on app SG.
* WAFv2 WebACL and its association to the ALB.
* Shield Advanced resource created only when enabled.

### Outputs

* `VpcId`
* `PublicSubnets` (comma-joined)
* `AppSubnets` (comma-joined)
* `DbSubnets` (comma-joined)
* When trail is enabled: `TrailBucketName`, `CloudTrailName`, `CloudTrailArn`
* When cross-account role is enabled: `CrossAccountRoleArn`
* `ALBArn`, `ALBRedirectListenerArn`, `WAFArn`

**Deliverable:** Output the **entire content of `TapStack.yml`** (the YAML template) as your response. Keep the file commented lightly for clarity, but avoid noisy or generic AI wording—write like an engineer handing off a real template.
