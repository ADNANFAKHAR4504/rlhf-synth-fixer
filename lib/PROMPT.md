## Objective

Design a **single** CloudFormation template in **YAML** named **`TapStack.yml`** that provisions a brand-new, secure, production-ready AWS infrastructure in **`us-west-2`**. The template must be self-contained (no external modules or pre-existing resources), declare **all variables/parameters with default example values**, include **in-line comments** explaining each major component, and define **comprehensive Outputs**.

## Functional scope (build everything new):

* VPC with **2 public** and **2 private** subnets across at least **two AZs** in `us-west-2`
* Internet Gateway, **two NAT Gateways** (one per AZ), route tables, and associations
* **Bastion Host** EC2 instance in a public subnet for SSH access (locked to a parameterized CIDR)
* **Application EC2 instance(s)** in private subnets using the **latest Amazon Linux 2** AMI (via SSM Parameter), with an **instance profile/role** limited to S3 access for the created bucket and SSM access
* **S3 application bucket** with **SSE-KMS**, **block public access**, bucket policy enforcing TLS, and **server access logging** to a dedicated **S3 logs bucket** (also SSE-KMS)
* **KMS CMK(s)** with appropriate key policies for S3, RDS, CloudTrail, and CloudWatch Logs encryption
* **RDS** Multi-AZ instance (e.g., `db.t3.micro`) in **private subnets only**, **SSE-KMS** enabled, parameterized engine (e.g., `postgres`), master creds via **NoEcho Parameters**
* **IAM roles & least-privilege policies**:

  * EC2 App Role: read-only access to the specific S3 application bucket, SSM core permissions, and CloudWatch agent (if used)
  * Bastion Role: SSM core permissions (optional), no S3 access
* **Security Groups**:

  * Bastion SG: allow SSH **only** from `AllowedSshCidr` (parameter)
  * App EC2 SG: allow inbound only from Bastion SG (SSH) and RDS SG as needed
  * RDS SG: allow inbound only from App EC2 SG on DB port
* **CloudTrail** (management events) delivering to the logs bucket, encrypted with KMS; Log File Validation enabled
* **CloudWatch Alarms** (with SNS topic + subscription parameter) for:

  * EC2 App CPUUtilization > 80% for 5 minutes
  * RDS CPUUtilization > 80% for 5 minutes
  * (Optional) StatusCheckFailed > 0 for 5 minutes on App instance
* **Outputs** for VPC/Subnet IDs, Security Group IDs, S3 bucket names, KMS Key ARNs, RDS endpoint/ARN, Bastion/Public EIP, App Instance ID, CloudTrail ARN, SNS Topic ARN

## Non-negotiable constraints

* **Region** fixed to `us-west-2` (hard-set or validated)
* **All resources tagged** with `Environment=Production` (plus `Project=TapStack`)
* **Public access to S3 buckets blocked**
* **KMS** used for all encryption operations (S3 buckets, RDS, CloudTrail, and any log groups)
* **Only** resources explicitly listed in scope
* **EC2** uses **latest Amazon Linux 2** AMI via SSM: `/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64` or AL2 equivalent
* **VPC private subnets** get outbound internet via **NAT Gateways**
* **SSH** access **restricted** by `AllowedSshCidr` parameter
* Template must pass **`aws cloudformation validate-template`** and be **cfn-lint clean**

## Template structure & style requirements

* **Single file**: `TapStack.yml`
* **YAML** CloudFormation with:

  * `AWSTemplateFormatVersion` and `Description`
  * **`Metadata`**: `AWS::CloudFormation::Interface` with ParameterGroups and ParameterLabels
  * **`Parameters`**: all inputs with sensible defaults (e.g., VpcCidr, AllowedSshCidr, KeyName, DbEngine, DbEngineVersion, DbInstanceClass, DbUsername, DbPassword [NoEcho], AlarmEmail, ProjectName default `TapStack`, Environment default `Production`)
  * **`Mappings`**: AZ names if needed; otherwise rely on `Fn::GetAZs`
  * **`Conditions`**: if any toggles (e.g., create SNS subscription only when email provided)
  * **`Resources`**: fully defined; no imports or pre-existing references
  * **`Outputs`**: explicit, well-named, with `Export` comments (no actual export required unless you choose)
* **In-line comments** (`#`) before each major block explaining intent and best practices
* **Naming**: logical names prefixed with `TapStack` and resource names tagged/labeled accordingly
* **Principle of least privilege** for all IAM policies (resource-scoped ARNs, no wildcards except where strictly unavoidable)
* **No** hardcoded secrets; DB password via `NoEcho` parameter
* **No** deprecated properties; prefer modern patterns (e.g., S3 `PublicAccessBlockConfiguration`, bucket policy enforcing `aws:SecureTransport`)
* **Explicit** KMS key policies allowing required service principals (CloudTrail, RDS, CloudWatch Logs, S3) and stack role access for encryption/decryption where needed

## Inputs (Parameters to include with example defaults)

* `ProjectName` (Default: `TapStack`)
* `Environment` (Default: `Production`)
* `VpcCidr` (Default: `10.0.0.0/16`)
* `PublicSubnet1Cidr` (Default: `10.0.0.0/24`)
* `PublicSubnet2Cidr` (Default: `10.0.1.0/24`)
* `PrivateSubnet1Cidr` (Default: `10.0.10.0/24`)
* `PrivateSubnet2Cidr` (Default: `10.0.11.0/24`)
* `AllowedSshCidr` (Default: `203.0.113.0/24`)  # replace with the real corporate IP/CIDR
* `KeyName` (no default)
* `DbEngine` (Default: `postgres`)
* `DbEngineVersion` (e.g., `16.3`)
* `DbInstanceClass` (Default: `db.t3.micro`)
* `DbName` (Default: `appdb`)
* `DbUsername` (NoEcho)
* `DbPassword` (NoEcho)
* `AlarmEmail` (optional; if set, create SNS subscription)
* `AppInstanceType` (Default: `t3.micro`)
* `BastionInstanceType` (Default: `t3.micro`)

## Security & compliance details

* **S3 (app bucket)**: SSE-KMS with a dedicated CMK; bucket policy denies non-TLS (`aws:SecureTransport=false`) and denies non-AWS principals; **access logging** to logs bucket
* **S3 (logs bucket)**: SSE-KMS, restricted access; lifecycle (optional) to transition logs after 90 days
* **RDS**: Multi-AZ, storage encryption with KMS CMK, private subnets only, no public accessibility
* **CloudTrail**: management events, global service events enabled, log validation on, delivery to logs bucket with KMS
* **CloudWatch**: Alarms created with SNS notification; Logs encrypted with KMS if log groups are created
* **IAM**: resource-scoped policies for S3 access to the **app bucket only**; SSM permissions for Session Manager; no `*:*` wildcards

## Deliverable:

* A single file **`TapStack.yml`** that:

  * Declares all **Parameters** with example defaults and labels/groups in **Metadata**
  * Creates **all** resources enumerated in the **Functional scope**
  * Applies required **Tags** (`Environment=Production`, `Project=TapStack`) to all taggable resources
  * Uses **KMS** for all encryption points (S3, RDS, CloudTrail, optional Log Groups)
  * Implements **least-privilege IAM** policies tied to the created resources
  * Restricts **SSH** via `AllowedSshCidr` and confines workloads to private subnets with **NAT** for egress
  * Retrieves **latest Amazon Linux 2** AMI via SSM Parameter
  * Includes clear **comments** (`#`) documenting each major component and rationale
  * Provides comprehensive **Outputs** (IDs/ARNs/endpoints) to verify deployment
  * **Validates** with `aws cloudformation validate-template` and is **cfn-lint clean**

## Verification notes (embed as comments in the YAML)

* Note how to confirm:

  * S3 encryption and access logging are enabled
  * RDS is Multi-AZ and not publicly accessible
  * EC2 in private subnets has outbound access via NAT
  * Bastion can SSH from `AllowedSshCidr` only
  * CloudTrail is writing encrypted logs to the logs bucket
  * CloudWatch alarms are **ALARM** when thresholds are exceeded
* Include brief command hints as comments (e.g., `# aws cloudformation validate-template --template-body file://TapStack.yml`)

## Output expectations

* The final **`TapStack.yml`** is production-grade, readable, and maintainable
* No placeholders for external stacks or modules; everything created **from scratch**
* No extraneous services beyond the scope listed
* Parameter defaults make the stack launchable in a demo account without edits (except `KeyName`, `DbUsername`, `DbPassword`, and optionally `AlarmEmail`)