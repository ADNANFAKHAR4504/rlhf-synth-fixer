**Prompt: Build `TapStack.yml` (brand-new secure stack, us-east-1)**

I need a single CloudFormation **YAML** template named **`TapStack.yml`** that stands up a **new**, production-grade, secure, multi-tier VPC stack in **us-east-1**. Put **everything** (Parameters, Conditions, Mappings, Resources, Outputs) into this one file. Do **not** reference any existing resources—create all required modules fresh. Follow AWS best practices, clear logical IDs, and pass cfn-lint.

### Scope & architecture

* **VPC (10.0.0.0/16)** with **2 public** and **2 private** subnets across **at least two AZs**.
* **Internet Gateway**, **public route tables**, **NAT Gateways** (one per public AZ), and **private route tables** for egress.
* **Network segmentation**: App instances in **private** subnets; a **bastion host** in **public** subnet.
* **VPC endpoints** (Gateway: S3; Interface: SSM/EC2Messages/SSMMessages) for private management via Session Manager.

### Security & encryption

* **KMS CMK** (+ alias) dedicated to S3 encryption and CloudTrail (key policy scoped to needed principals).
* **S3 application data bucket** (SSE-KMS with our CMK) and a separate **S3 logs bucket** (SSE-KMS) with:

  * Bucket policies enforcing **`aws:SecureTransport` = true** (HTTPS-only),
  * Enforced SSE-KMS (`x-amz-server-side-encryption` = `aws:kms`), and
  * Access logging (logs→logs bucket), versioning on the logs bucket.
* **CloudTrail** (multi-AZ, management events) delivering to the logs bucket with **log file validation** and **KMS encryption**.
* **IAM MFA enforcement** for console users: create a **managed policy** that **DENY**s `iam:*`, `sts:*`, and `signin:*` console actions when `aws:MultiFactorAuthPresent != true`, attachable to a “ConsoleUsers” group (show attachment in template via group + policy attachment). Do **not** use AccountPasswordPolicy if it causes regional schema issues; rely on the deny-when-no-MFA pattern.
* **Security Groups**:

  * Bastion SG: **allow SSH (22) only from a parameterized CIDR** (e.g., `AllowedSshCidr`).
  * Private EC2 SG: **no public ingress**; allow **SSH only from bastion SG**; egress open to VPC egress/NAT as needed.
  * (No public HTTP/80 rules; prepare infra to favor TLS-only paths later without adding certificates in this template.)

### Compute & access

* **Bastion EC2** in a public subnet with Instance Profile for SSM; user data should harden basics (e.g., disable password auth, use SSM).
* **Example private EC2** (or small Auto Scaling Group with a Launch Template) in private subnets:

  * Attach an **IAM Role** via **Instance Profile** with **no inline policies**.
  * Attach **managed policies** you define in this template to allow:

    * `s3:GetObject/PutObject/ListBucket` on the **app data bucket**,
    * `kms:Decrypt`, `kms:Encrypt`, `kms:GenerateDataKey*` on the **CMK** (scope to the S3 use case),
    * SSM core permissions for Session Manager (or attach AmazonSSMManagedInstanceCore).
* **No hardcoded credentials** anywhere.

### Cost hygiene (automatic EBS cleanup)

* Add a **Lambda** (Python, inline `ZipFile`) + **EventBridge** rule (daily) + **IAM role** to automatically **delete unattached EBS volumes** that are in `available` state and either older than N hours (parameterized) **and**/or tagged `AutoDelete=true`.
* Lambda needs least-privilege (`ec2:DescribeVolumes`, `ec2:DeleteVolume`, CloudWatch Logs).
* Make the retention window and optional controlling tag **parameters**.

### Parameters (suggested)

* `ProjectName` (default `TapStack`), `Environment` (default `production`, AllowedValues: dev|staging|production),
* `AllowedSshCidr` (string, required),
* `VpcCidr` (default `10.0.0.0/16`),
* `PublicSubnetCidrs` / `PrivateSubnetCidrs` (list parameters),
* `BastionInstanceType` (default `t3.micro`),
* `PrivateInstanceType` (default `t3.micro`),
* `EbsCleanupRetentionHours` (default `24`),
* `EbsCleanupRequireTag` (default `true`/`false`),
* KMS key admin/principal ARNs if you expose them (or keep key policy scoped to the account root + needed roles).

### Managed policies (not inline)

Create separate **AWS::IAM::ManagedPolicy** resources for:

1. **AppDataAccessPolicy** (S3 + KMS access scoped to the app bucket and CMK),
2. **MfaEnforcementPolicy** (deny console actions when `aws:MultiFactorAuthPresent` is false),
3. **LambdaEbsCleanupPolicy** (Describe/Delete volumes, logs).

Attach them to roles/groups via **AWS::IAM::Role** + **AWS::IAM::Group** + **AWS::IAM::Policy/ManagedPolicyAttachment** resources—**do not** embed inline statements in the roles.

### TLS in transit (without certificates)

* Enforce **HTTPS-only** to S3 via bucket policies.
* Prefer **TLS-based** VPC endpoints (Interface endpoints) for SSM/EC2Messages/SSMMessages.
* **Do not** create ACM certificates, HTTPS listeners, or any certificate-related resources in this file. We’ll attach certificates and any ALB/HTTPS listeners later—exclude them from this template.

### Tags & metadata

* Tag all resources with `Project`, `Environment`, and `Owner` (parameterized `Owner`).
* Add helpful **Descriptions** on Parameters and Outputs.

### Outputs (clear, consumable)

Provide outputs for:

* `VpcId`, `PublicSubnetIds`, `PrivateSubnetIds`,
* `NatGatewayIds`, `InternetGatewayId`,
* `S3AppBucketName`, `S3LogsBucketName`,
* `KmsKeyArn`, `KmsAliasName`,
* `CloudTrailArn`, `TrailS3LogPrefix`,
* `BastionInstanceId`, `BastionPublicIp`,
* `PrivateInstanceProfileName`, `PrivateInstanceRoleName`,
* `EbsCleanupLambdaArn`, `EbsCleanupRuleName`.

### Best-practice details

* Use **least privilege** everywhere; scope ARNs tightly (buckets, prefixes, KMS key).
* Enable **bucket versioning** at least on the **logs** bucket.
* Use **DeletionPolicy/UpdateReplacePolicy** sensibly (e.g., `Retain` on KMS key and logs bucket; `Delete` on ephemeral resources).
* NAT per AZ for resilience; subnet AZs should be chosen via `Fn::GetAZs`.
* Keep template **region-agnostic** where possible but **document** that deployment is **us-east-1**; you may add a `Condition` that evaluates `AWS::Region == us-east-1` to guard resources if needed.

### Explicit exclusions

* **No ACM/SSL certificate resources**, no HTTPS listeners, no certificate ARNs/parameters, no CloudFront, no Route53.
* Do not include any hardcoded access keys/secrets.

Deliver the final **`TapStack.yml`** as a single, valid CloudFormation YAML file ready to deploy in **us-east-1**.