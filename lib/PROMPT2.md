You are an expert AWS CloudFormation architect.

## Goal

Generate **one** CloudFormation **YAML** template that satisfies all requirements below **and** the following linter constraints (no warnings/errors listed at the end).
**Output rule:** Print **exactly one** fenced code block that starts with \`\`\`yaml and contains **only** the YAML template. **No prose or extra blocks.**

---

## Region & Standards

* All resources must deploy to **us-east-1**.
* Use supported, up‑to‑date properties across EC2, S3, RDS, Lambda, CloudTrail, Config, CloudWatch, KMS, and IAM.
* Apply **least privilege**; **no wildcards** in `Action` or `Resource`.

---

## Linter Fixes (must be reflected in the template)

1. **Availability Zones — Fix W3010**

   * **Do not hardcode** AZs like `us-east-1a/us-east-1b`.
   * Use `!GetAZs ''` + `!Select` to derive AZs dynamically.

2. **Remove unnecessary Fn::Sub — Fix W1020**

   * If a string has **no variables**, use a plain string (no `!Sub`/`Fn::Sub`).

3. **RDS Engine Version — Fix E3691**

   * Use **MySQL** with `EngineVersion` set to a **valid allowed value**.
   * Implement a **Parameter** `DBEngineVersion` with **AllowedValues** exactly from this list and a safe default (pick one from the list, e.g., `8.0.43`):

     ```
     5.7.44-rds.20240408, 5.7.44-rds.20240529, 5.7.44-rds.20240808, 5.7.44-rds.20250103, 5.7.44-rds.20250213, 5.7.44-rds.20250508, 8.0.37, 8.0.39, 8.0.40, 8.0.41, 8.0.42, 8.0.43, 8.4.3, 8.4.4, 8.4.5, 8.4.6
     ```
   * The template **must** reference this parameter for the DB instance.

4. **Secrets via Dynamic References — Fix W1011 and Deployment error**

   * **Do not use a `DBPassword` parameter.**
   * Create an `AWS::SecretsManager::Secret` resource (`DbSecret`) that **generates** a password (use `GenerateSecretString` with `SecretStringTemplate` containing a username key and `GenerateStringKey: password`).
   * Supply the DB password to RDS using a **dynamic reference** to that secret, e.g.:

     * `MasterUserPassword: !Sub "{{resolve:secretsmanager:${DbSecret}::password}}"`
   * If a username is also secret, pull it from the same secret JSON (`::username`). Otherwise parameterize a non‑secret username.

5. **CloudTrail IsLogging — Fix E3003**

   * For `AWS::CloudTrail::Trail`, explicitly set `IsMultiRegionTrail: true` **and** `IsLogging: true`.
   * Enable **LogFileValidation** and deliver to a **KMS‑encrypted S3 bucket**.
   * Configure CloudWatch Logs integration (LogGroup + Role) to support metric filters/alarms.

6. **Tags only where supported — Fix E3002**

   * Apply `Tags` only to resources that **support** them (e.g., VPC, Subnet, SecurityGroup, EC2 Instance, RDS DBInstance/DBSubnetGroup, S3 Bucket, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, KMS Key).
   * **Do not** put `Tags` on resources that **don’t support** them (e.g., `AWS::Logs::MetricFilter`).

---

## Functional Requirements (unchanged from your spec)

1. **S3 with KMS**: S3 bucket(s) with **SSE‑KMS** via **customer‑managed KMS key**, public access block, bucket policy requiring KMS encryption/denying unencrypted PUTs.
2. **EC2 Role for S3**: EC2 instance(s) launched with an **instance profile** whose role grants **least‑privilege** access to the target S3 bucket/prefix.
3. **SG SSH‑only**: Security Groups allow **inbound TCP/22** only from parameter `AllowedSshCidr`. Include **descriptive names and `GroupDescription`**.
4. **RDS KMS**: RDS instance encrypted at rest with **KMS key**, in **private subnets** only.
5. **Lambda Logs**: Lambda has an explicit **CloudWatch Logs LogGroup** (with retention). Lambda role limited to `logs:CreateLogStream`/`logs:PutLogEvents` on **that** log group ARN.
6. **VPC private‑only**: **No** Internet Gateway, **no** public subnets; subnets `MapPublicIpOnLaunch: false`.
7. **Tagging**: Tag **every supported resource** with `Environment` and `Owner`.
8. **IAM**: **No wildcards** anywhere; precisely scope ARNs.
9. **EC2 termination protection**: Set `DisableApiTermination: true` on critical EC2 instances.
10. **CloudTrail**: **Multi‑region** + **LogFileValidation**, KMS‑encrypted S3 delivery + CloudWatch Logs.
11. **CloudWatch Alarms**: MetricFilter on CloudTrail logs for `UnauthorizedOperation` / `AccessDenied*` and an Alarm (SNS topic parameterized).
12. **AWS Config**: Recorder + DeliveryChannel + RecorderStatus and a managed rule monitoring Security Group posture/changes (restrict open ports; only 22 allowed).

---

## Parameters (minimum)

* `Environment` (String), `Owner` (String), `AllowedSshCidr` (String CIDR).
* `DBEngineVersion` (String) with **AllowedValues** list above and default set to a value from that list (e.g., `8.0.43`).
* Optionally: `DbUsername` (String, non‑secret), `NotificationEmail`, `S3BucketName`, `TrailBucketName`.

---

## AMI Resolution (latest without hardcoding)

* **Do not hardcode AMI IDs.**
* Use SSM Parameter Store dynamic resolution for the latest Amazon Linux 2 AMI in `us-east-1`, e.g.:

  * Parameter type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` with default `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`.

---

## Self‑Check (must be true before printing)

* AZs are derived via `!GetAZs`/`!Select` (no hardcoded strings like `us-east-1a`).
* No `Fn::Sub` where not needed.
* RDS `EngineVersion` comes from `DBEngineVersion` param constrained to the allowed set.
* No `DBPassword` parameter; RDS pulls password via **Secrets Manager dynamic reference**.
* `AWS::CloudTrail::Trail` includes `IsLogging: true`, multi‑region, and `LogFileValidationEnabled: true`.
* `Tags` appear **only** on resources that support them.
* IAM policies contain **no wildcards** and are least‑privilege.
* VPC has **only private subnets** and **no IGW**.
* All original functional requirements are satisfied.
* YAML is valid CloudFormation and deployment‑ready.

---

## What to Print

* **Exactly one** fenced code block that starts with \`\`\`yaml and contains **only** the CloudFormation template.
* **No** additional text before/after.