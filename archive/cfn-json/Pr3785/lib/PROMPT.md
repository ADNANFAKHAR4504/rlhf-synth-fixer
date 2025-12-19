# Goal

Author a **single CloudFormation template in JSON** that provisions a **secure AWS environment** implementing the items below. The output file must be valid JSON (not YAML) and should pass CloudFormation validation and custom compliance tests.

**Hard requirements to satisfy in the template:**

1. **IAM** for all access management, with a **custom policy for DynamoDB read-only**.
2. **S3 buckets are private** and only accessible by **specified IAM roles**.
3. **VPC** spanning **at least two Availability Zones**, with **public and private subnets**.
4. **Security Groups** to control EC2 instance access.
5. **S3 encryption** using **AWS KMS**.
6. **Least privilege** across all resources (no wildcards unless unavoidable and justified).
7. **User access only via IAM roles** (no root or inline user creds).
8. **CloudTrail** enabled to log/monitor API activity across the account/region.
9. **RDS** with **encryption at rest (KMS)** in **private subnets**.
10. A **bastion host** in a **public subnet** to securely reach private subnets.

---

# File & Format

* Produce **one file**: `main-template.json`.
* CloudFormation **JSON** only. Use intrinsic functions via JSON form (e.g., `{"Fn::Sub": ...}`, `{"Ref": ...}`, `{"Fn::Join": ...}`, `{"Fn::GetAtt": ...}`, `{"Fn::If": ...}`, `{"Fn::Equals": ...}`, `{"Fn::FindInMap": ...}`).

---

# Parameters (portable, secure, and testable)

Include (at minimum) the following **Parameters**, with sensible defaults and constraints:

* `ProjectPrefix` (String; default e.g., `securex`; used as a name prefix and Tag)
* `Environment` (String; AllowedValues: `dev`, `stg`, `prod`; default `dev`)
* `VpcCidr` (String; default `10.0.0.0/16`; CIDR pattern)
* `PublicSubnet1Cidr`, `PublicSubnet2Cidr` (String; CIDR defaults)
* `PrivateSubnet1Cidr`, `PrivateSubnet2Cidr` (String; CIDR defaults)
* `Az1`, `Az2` (String; allow override to keep the template region-portable)
* `BastionInstanceType` (String; default `t3.micro`)
* `AppInstanceType` (String; default `t3.micro`)
* `KeyPairName` (String; optional; EC2 key pair name for bastion)
* `KmsKeyArn` (String; optional; if blank, create a CMK for S3/EBS/RDS)
* `S3DataBucketName` (String; optional; if blank, create one)
* `RdsEngineVersion` (String; default `15.4`)
* `RdsInstanceClass` (String; default `db.t4g.micro`)
* `RdsAllocatedStorage` (Number; default `20`)
* `RdsUsername` (String; NoEcho true; min length 1)
* `RdsPassword` (String; NoEcho true; min length 8; use `AllowedPattern` for strong password)
* `AllowedBastionSshCidr` (String; default your office IP/CIDR; for SSH to bastion only)
* `DynamoDbReadOnlyTableArns` (CommaDelimitedList; list of table ARNs the read-only policy will allow)
* `SnsEmailForAlarms` (String; optional; email subscription for notifications)

> All ARNs in policies must be **parameterized** or **built via `Fn::Sub`**—**no hard-coded ARNs**.

---

# Mappings (optional but recommended)

* `RegionMap`: maps region → partition (`aws`, `aws-us-gov`, `aws-cn`) and common service principals (to avoid hard-coding partitioned principals for KMS/CloudTrail/EC2/etc.).
* `EnvConfig`: environment-specific toggles (e.g., RDS deletion protection true for `stg/prod`, false for `dev`).

---

# Conditions

* `CreateKmsKey` — when `KmsKeyArn` is empty, create a **KMS CMK** used by S3/EBS/RDS.
* `CreateDataBucket` — when `S3DataBucketName` is empty.
* `EmailSubscriptionEnabled` — when `SnsEmailForAlarms` is not empty.

---

# Resources (define ALL in JSON)

## 1) Networking

* **VPC** with DNS support/hostnames enabled; name `${ProjectPrefix}-vpc`.
* **Subnets**: 2 **public** and 2 **private** across `Az1` and `Az2`; public subnets set `MapPublicIpOnLaunch=true`.
* **Internet Gateway** + **VPCGatewayAttachment**.
* **NAT Gateway** in **PublicSubnet1** with **Elastic IP**; Private route tables point default route to NAT.
* **Route Tables** + **SubnetRouteTableAssociation** for each subnet.
* (Optional but good practice) **VPC Endpoints**: S3 Gateway endpoint; Interface endpoints for CloudWatch Logs and CloudTrail (improves security/egress).

## 2) Security Groups

* `SgBastion`: Inbound allow **22/tcp** from `AllowedBastionSshCidr`; egress `0.0.0.0/0`.
* `SgAppPrivate`: For private EC2 instances; inbound **22/tcp** only **from `SgBastion`**; egress to `0.0.0.0/0` (or least-privileged as needed).
* `SgRds`: Inbound **5432/tcp** from `SgAppPrivate` only; no public access.
* (If endpoints used) `SgVpce`: Allow VPC internal access as needed.

## 3) IAM (least privilege, roles only)

* **Managed via roles (no users)**; attach to EC2 instances via **Instance Profiles**.
* **Custom DynamoDB Read-Only Policy** resource:

  * Actions (minimal): `dynamodb:DescribeTable`, `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:BatchGetItem` (and `List*` where strictly required).
  * **Resource**: the list provided by `DynamoDbReadOnlyTableArns` (compose via `Fn::Split` or pass directly).
* **EC2 App Instance Role** + **Instance Profile**:

  * Minimal permissions:

    * **CloudWatch Logs/PutMetricData** for app logging/metrics.
    * **S3** access **scoped to the data bucket only** (list/get/put on bucket + objects).
    * **DynamoDB read-only**: attach the custom policy above.
* **Bastion Role** (optional) with minimal SSM permissions if you choose to enable Session Manager.
* **KMS** permissions for EC2/RDS/S3 **only** to the specific key (created or provided) — **no wildcards**.

## 4) Compute

* **Bastion EC2** in a **public subnet** (e.g., PublicSubnet1), `BastionInstanceType`, `KeyPairName`, `SgBastion`.
* **Private EC2 (App) Instance(s)** in **private subnets**; `AppInstanceType`, `SgAppPrivate`.
* **Detailed Monitoring** enabled for all EC2 instances (`Monitoring: true`).
* **EBS volumes encrypted** (use created/provided `KmsKeyArn`).
* Use **LaunchTemplate** (preferred) or `AWS::EC2::Instance`. If ASG is used, keep min=1 for tests.

## 5) Storage

* **S3 Data Bucket**:

  * Created when `CreateDataBucket` is true; otherwise reference provided name.
  * **Block Public Access** (all 4 flags = true).
  * **Versioning** enabled (recommended).
  * **Default encryption** via **KMS** (created/provided key).
  * **Bucket policy**: deny insecure transport (`aws:SecureTransport=false`) and deny non-TLS; **restrict access** to **specific IAM roles** (the roles defined in this stack) using bucket and object ARNs; **no public principals**.

## 6) Database

* **RDS PostgreSQL**:

  * Engine version from `RdsEngineVersion`, instance class `RdsInstanceClass`.
  * **Subnets**: Private (use `DBSubnetGroup` referencing the two private subnets).
  * **Security Group**: `SgRds` (allow from `SgAppPrivate` only).
  * **PubliclyAccessible**: `false`.
  * **StorageEncrypted**: `true` with **KMS key** (created/provided).
  * **MasterUsername/Password** from parameters (NoEcho).
  * **Backup** retention via mapping (e.g., 7 days in dev, 14+ in stg/prod).
  * **DeletionProtection** true in stg/prod via `EnvConfig` mapping and `Fn::If`.

## 7) KMS

* **KMS CMK** (when `CreateKmsKey`): Key policy limited to the account root and specific service principals (EC2, RDS, S3, CloudTrail), using **partition-aware service principals** from `RegionMap`.
* Export the **KeyArn** output whether created or provided.

## 8) Logging & Monitoring

* **CloudTrail**:

  * **Multi-region trail** (or region trail if your tests expect regional);
  * Log to the S3 data bucket (or create a dedicated logging bucket—if so, ensure it’s private and encrypted).
  * **Log file validation** enabled.
  * **KMS encryption** for CloudTrail at rest (use the same KMS key where acceptable).
* **CloudWatch Alarms** (publish to SNS topic below):

  * **EC2**: `CPUUtilization` high (e.g., ≥ 80% for 5 min), `StatusCheckFailed` > 0.
  * **RDS**: `CPUUtilization` ≥ 80% (10 min), `FreeStorageSpace` low.
  * (Optional) S3 4xx/5xx using request metrics if enabled; otherwise skip if tests don’t require.

## 9) Notifications

* **SNS Topic** `${ProjectPrefix}-ops-topic` for alarms and administrative notifications.
* If `SnsEmailForAlarms` is set, create **`AWS::SNS::Subscription`** (Protocol `email`) to that address.
* Allow CloudWatch Alarms to publish (topic policy with least privilege).

---

# Outputs (export for cross-stack use)

Export the following with `Export` names prefixed by `${ProjectPrefix}-${Environment}-...`:

* `VpcId`, `PublicSubnetIds`, `PrivateSubnetIds`
* `BastionSecurityGroupId`, `AppSecurityGroupId`, `RdsSecurityGroupId`
* `DataBucketName`, `DataBucketArn`
* `KmsKeyArn`
* `DbSubnetGroupName`, `RdsEndpointAddress`, `RdsInstanceIdentifier`
* `OpsSnsTopicArn`

---

# Security & Compliance Guardrails

* **Principle of Least Privilege** in all IAM Policies. Avoid `Action: "*"`, `Resource: "*"`.
* **No public S3**; enforce `aws:SecureTransport` and **explicit deny** to `Principal: "*"`.
* **No public RDS**; allow only from app SG.
* **Root account is never referenced** except where CloudFormation/KMS key policy requires account root in a controlled manner.
* **KMS everywhere** for S3, EBS, RDS, and CloudTrail logs at rest.
* **All EC2 in private subnets** except the **bastion**.
* **SSH** only to the **bastion** from `AllowedBastionSshCidr`.
* Prefer **SSM Session Manager** (optional) for bastion/app; if enabled, add minimal SSM permissions.

---

# Validation Expectations (test hints)

Your JSON template should satisfy tests that assert:

* **Resources exist:** VPC, 4 subnets (2 public, 2 private), IGW, NAT, routes, SGs, EC2 bastion in public, EC2 app in private, S3 bucket (private+encrypted), KMS key (or provided), RDS (encrypted, private), CloudTrail, SNS topic, CloudWatch alarms, IAM roles/policies/profiles.
* **Properties:**

  * EC2 instances have `Monitoring: true` and encrypted EBS.
  * S3 bucket has **BlockPublicAccess (all true)**, **BucketPolicy** denies insecure transport and restricts to specific roles, and **SSE-KMS** enabled.
  * RDS `PubliclyAccessible=false`, `StorageEncrypted=true`, KMS key set, SG inbound 5432 only from app SG.
  * IAM policy for **DynamoDB read-only** grants only the minimal read actions to **parameterized table ARNs**.
  * CloudTrail has log validation & encryption.
  * SNS topic policy allows CloudWatch alarms to publish.
* **No hard-coded ARNs**: built via parameters/`Fn::Sub`.
* **Outputs** exported for downstream stacks.

---

# Deliverables

* **`main-template.json`** only (valid CloudFormation JSON).
* Concise comments (as JSON `Metadata` blocks where helpful).
* Names and Tags consistently prefixed with `${ProjectPrefix}` and include `Environment`.

---
