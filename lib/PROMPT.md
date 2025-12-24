We need a single CloudFormation template that sets up a secure, production-ready app environment in AWS. This doc is the spec the template must follow.

## Folder structure (must adhere)

```
└── lib/
    └── tapstack.yaml  # Main stack definition (CloudFormation YAML)
```

## Inputs — use verbatim (do **not** alter any text below)

**Environment:**
Develop a CloudFormation YAML template to set up a secure, production-ready application environment within AWS. The environment must adhere to the following requirements: 1) Deploy all resources in the us-east-1 region; 2) Use an existing VPC identified by VPC ID vpc-12345abcde; 3) EC2 instances must run on the latest Amazon Linux 2 AMI; 4) Configure security groups to only allow inbound SSH and HTTPS traffic; 5) All resources must be tagged with 'Environment\:Production'; 6) Any S3 Buckets created must have server-side encryption enabled; 7) Use YAML formatting for CloudFormation templates. Expected output is a YAML file that passes validation and successfully creates the desired infrastructure in AWS.

**Constraints Items:**
Use AWS CloudFormation YAML templates. | Deploy resources in the us-east-1 region. | Resources must be tagged with Environment\:Production. | Use an existing VPC identified by VPC ID vpc-12345abcde. | Security groups should allow inbound SSH and HTTPS traffic only. | S3 Bucket must have server-side encryption enabled. | Use latest Amazon Linux 2 AMI for EC2 instances.

**Proposed Statement:**
The goal is to deploy an application environment in AWS using CloudFormation. This should be done entirely with YAML templates, within the us-east-1 region, using an existing VPC and properly configured security groups, EC2 instances, and S3 buckets.

> **Important:** The three blocks above are provided data. Do **not** change, rephrase, or omit any part of them. You may reference them, but they must remain intact.

---

## What to build (minimum viable, production-ready)

Implement resources that satisfy the inputs:

### Security Group (in VPC `vpc-12345abcde`)

* Inbound: TCP **22 (SSH)** and **443 (HTTPS)** only (default from `0.0.0.0/0`; allow narrowing via parameters).
* Outbound: allow all.
* Tag: `Environment: Production`.

### EC2 Instance

* Region: **us-east-1**.
* AMI: **latest Amazon Linux 2** via **SSM public parameter** (no hardcoded AMI ID).
* Security: associate to the SG above.
* Networking: launch in a **subnet that belongs to `vpc-12345abcde`** (accept `SubnetId` as a parameter).
* Tag: `Environment: Production`.

### S3 Bucket (assets/logs, etc.)

* **Server-side encryption** enabled (SSE-S3 at minimum).
* Block public access recommended (you can include).
* Tag: `Environment: Production`.

---

## Template requirements

* **Format:** Valid **CloudFormation YAML** only (no JSON, no prose).
* **Sections:** `AWSTemplateFormatVersion`, `Description`, `Parameters`, `Mappings` (if needed), `Conditions` (if needed), `Resources`, `Outputs`.
* **Region:** Must be compatible with **us-east-1**.

### Parameters (recommended)

* `VpcId` — **Default:** `vpc-12345abcde`. Add a constraint description that it must be the existing VPC.
* `SubnetId` (String) — state that it must belong to `vpc-12345abcde`.
* `InstanceType` — default like `t3.micro`.
* `IngressCidrSsh` and `IngressCidrHttps` — defaults `0.0.0.0/0`; enforce that only ports **22** and **443** are used.
* **Latest Amazon Linux 2 AMI:** resolve via SSM parameter type
  `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` referencing
  `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`.

### Tags

* Add `Environment: Production` to **every taggable resource**.

### Security

* Only **SSH (22)** and **HTTPS (443)** inbound; **no other inbound** rules.

### S3 encryption

* Use bucket-level `BucketEncryption` with **AES256**.

---

## Outputs (at least)

* `SecurityGroupId`
* `InstanceId`
* `InstancePublicIp` (if applicable)
* `BucketName`

---

## Acceptance checks (internal)

* Template validates with `aws cloudformation validate-template`.
* Deployable and idempotent in **us-east-1**.
* No inbound rules beyond **22** and **443**.
* All resources tagged `Environment: Production`.
* AMI lookup via **SSM parameter** (no hardcoded AMI).
* S3 bucket has **server-side encryption**.
* Uses the existing VPC **`vpc-12345abcde`**.

---

## Output format (strict)

Return **only** the final CloudFormation YAML for `lib/tapstack.yaml` in **one fenced code block**:

* Triple backticks with `yaml`.
* **No** explanations or extra text before/after the code block.
* YAML must be complete and ready to deploy.