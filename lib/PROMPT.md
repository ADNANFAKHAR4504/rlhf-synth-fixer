You are an expert AWS CloudFormation architect.

## Goal

Generate a **single CloudFormation YAML template** that implements all requirements below.
**Output rules:** print **one** fenced code block starting with \`\`\`yaml and containing only the YAML template. **No prose, no comments, no extra blocks.**

---

## Region & Conventions

- Deploy everything in **us-east-1**.
- Use supported, up‑to‑date resource properties (RDS, Lambda, CloudTrail, Config, EC2, KMS, CloudWatch, S3, IAM).
- Apply **least privilege**; **no wildcards** (`*`) in **Action** or **Resource** anywhere.

---

## Pre‑Flight Validations (must be satisfied in the template)

1. **Latest Amazon Linux 2 AMI (us-east-1)**
   - Do **not** hardcode an AMI ID.
   - Resolve the latest AL2 AMI via **SSM Parameter Store** (e.g., parameter type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` with default `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` or an equivalent dynamic reference).

2. **IAM policies**
   - No `Action: "*"`, no `Resource: "*"`.
   - Precisely scope ARNs for S3 objects/prefixes, Log Groups, KMS keys, etc.

---

## Functional Requirements

1. **S3 (KMS encryption)**
   - Create an S3 bucket with **SSE-KMS** using a **customer-managed KMS key (CMK)**.
   - Block public access.
   - Bucket policy must require KMS encryption and deny unencrypted PUTs.

2. **EC2 with specific S3 access role**
   - Create an IAM role + instance profile for EC2, granting **only** required S3 actions to the specific bucket/prefix.
   - Launch EC2 using the **latest AL2 AMI via SSM**.
   - Mark critical EC2 instances with **`DisableApiTermination: true`**.

3. **Security Groups (SSH‑only)**
   - Allow inbound **SSH (22)** only from a parameterized **`AllowedSshCidr`**.
   - Provide **descriptive names and `GroupDescription`** explaining purpose.

4. **RDS (KMS encrypted)**
   - RDS instance with **KMS encryption at rest**.
   - Place in **private subnets**.

5. **Lambda + CloudWatch Logs**
   - Explicit **LogGroup** with retention.
   - Lambda execution role limited to **`logs:CreateLogStream`** and **`logs:PutLogEvents`** on that LogGroup ARN.

6. **VPC: only private subnets**
   - **No public subnets** and **no Internet Gateway**.
   - Subnets must set `MapPublicIpOnLaunch: false`.
   - Do not add a public NAT/IGW path. (Private‑only network.)

7. **Tagging**
   - Tag **every resource** with **`Environment`** and **`Owner`** (use parameters).

8. **CloudTrail (multi‑region + LFV)**
   - Single **multi‑region** trail with **log file validation** enabled.
   - Deliver to a **KMS‑encrypted S3 bucket** (may be dedicated).
   - Send to CloudWatch Logs (tie into alarms below).

9. **CloudWatch unauthorized access alarms**
   - Create a **MetricFilter** on CloudTrail logs for `UnauthorizedOperation` / `AccessDenied*`.
   - Create a **CloudWatch Alarm** on that metric (SNS topic parameterized).

10. **AWS Config for SG changes**

- Enable AWS Config (`ConfigurationRecorder`, `DeliveryChannel`, `ConfigurationRecorderStatus`).
- Add a **managed rule** monitoring Security Group posture/changes (e.g., restrict openings to authorized ports; include parameters to allow only 22 where applicable).

---

## Parameters (at minimum)

- `Environment` (String)
- `Owner` (String)
- `AllowedSshCidr` (String, e.g., `203.0.113.0/24`)
- Optionally: `S3BucketName`, `TrailBucketName`, `NotificationEmail`, etc.

---

## Implementation Notes

- Use **customer‑managed KMS keys** for S3, RDS, and (if used) CloudTrail log encryption; write key policies scoped to account/services (no wildcards).
- Enforce S3 encryption via bucket policy conditions on `x-amz-server-side-encryption` = `aws:kms`.
- Provide **Outputs** (e.g., VPC ID, Subnet IDs, SG IDs, Bucket names).

---

## Self‑Check (must be true before printing)

- AL2 AMI is **via SSM**, not hardcoded.
- **All** IAM policies have **no wildcards** and are least‑privilege with exact ARNs.
- SGs: **only** SSH from `AllowedSshCidr`; all SGs have clear descriptions.
- S3, RDS, CloudTrail are **KMS‑encrypted**; CloudTrail is **multi‑region** with **log file validation**.
- Lambda has an explicit LogGroup and minimally scoped logs permissions.
- VPC has only **private** subnets and **no** IGW/public subnets.
- AWS Config enabled with SG monitoring rule(s).
- **Every resource** has `Environment` and `Owner` tags.
- YAML is valid **CloudFormation** and deployment‑ready.

---

## What to Print

- **Exactly one** fenced code block that starts with \`\`\`yaml and contains **only** the CloudFormation template.
- **No** prose or extra code blocks before/after.
