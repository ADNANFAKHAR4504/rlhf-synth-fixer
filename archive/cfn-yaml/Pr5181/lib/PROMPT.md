# PROMPT

Hey team — quick brief for a one-shot CloudFormation build I’m about to run in a brand-new AWS account.

I need a single **TapStack.yml** that I can deploy as-is. Keep it human-friendly, secure by default, and production-ready. No extra files, no references to existing resources, just create everything fresh.

## What to ship

* **One YAML file named `TapStack.yml` only.**
  Please output **just the YAML** (no code fences, no commentary).
* Deploy target is **us-east-1**.
* Use **`prod-`** as a naming/tagging prefix across resources.
* VPC’s **Name tag should be `ProdVPC`**.

## Scope (the stack should create all of this)

### 1 Networking

* A VPC (`ProdVPC`) with CIDR **10.0.0.0/16**, DNS support/hostnames enabled.
* **Two public subnets** in different AZs (index 0 and 1 from `Fn::GetAZs`), each with `MapPublicIpOnLaunch: true`.
* An **Internet Gateway** attached to the VPC.
* A **public route table** with **0.0.0.0/0** via the IGW and **associations** for both public subnets.

### 2 Compute & Access

* **Two Amazon Linux 2 EC2 instances**, one in each public subnet.
* Use the SSM public parameter for the AMI:
  `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
  (Type: `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`).
* A **Security Group** that allows inbound **HTTP (80)** from anywhere and **SSH (22)** from a parameterized CIDR.
* **Elastic IP** attached to **Instance 1** (make it conditional via a parameter).
* **IAM Role + Instance Profile** for EC2 with:

  * Managed policy: `AmazonSSMManagedInstanceCore`
  * Inline policy that grants **read-only S3** (`s3:GetObject`, `s3:ListBucket`) **only** to the S3 bucket created by this stack.

### 3 Auto Scaling & Metrics

* An **EC2 Launch Template** that mirrors the standalone instance config (AMI, SG, optional KeyName, InstanceProfile, and user-data to serve a simple page on port 80).
* An **Auto Scaling Group** spanning the two public subnets, **min=2, max=4, desired=2**.
* **Two CloudWatch alarms** + **SimpleScaling policies** driven by **Average CPUUtilization**:

  * **Scale out** when > **60%** for **2×60s**
  * **Scale in** when < **30%** for **2×60s**

### 4 Storage, Logging, Encryption

* One **S3 bucket** named like `prod-tapstack-${AWS::AccountId}-${AWS::Region}` with:

  * **Versioning: Enabled**
  * **SSE-KMS** using a **customer CMK** created in this stack
  * **BlockPublicAccess**: all four flags true
* A **KMS key** + **alias** (e.g., `alias/prod-tapstack-s3`) used by the bucket and CloudTrail.
* **CloudTrail** (single-region is fine) that writes to the bucket using SSE-KMS:

  * **Bucket policy**: allow `cloudtrail.amazonaws.com` `s3:GetBucketAcl` and `s3:PutObject` with `s3:x-amz-acl = bucket-owner-full-control`
  * **KMS key policy**: allow CloudTrail `kms:Encrypt/Decrypt/ReEncrypt*/GenerateDataKey*/DescribeKey` with the usual encryption-context condition.

### 5 Patching (SSM)

* Make sure instances are SSM-managed (role above covers that).
* Create an **SSM Association** that runs `AWS-RunPatchBaseline` daily at **03:00** (`cron(0 3 * * ? *)`) with `Operation=Install`, targeting the instances (tag-based is fine).

## Parameters, Conditions, Tags, Metadata, Outputs

* **Parameters**

  * `KeyName` (**optional**) — empty default; if empty, **omit** the property with `AWS::NoValue`.
  * `SSHLocation` — default `0.0.0.0/0`.
  * `CreateEIP` — AllowedValues `true|false`, default `true`.
  * `LatestAmiId` — SSM parameter type above, defaulting to the AL2 path.
* **Conditions**

  * `UseKeyName` (true when `KeyName` is non-empty).
  * `CreateEIPCondition` (true when `CreateEIP` is `true`).
* **Metadata**

  * Add a concise `AWS::CloudFormation::Interface` grouping/labeling parameters.
  * On major resources, add a tiny `Metadata` map (e.g., `Owner`, `Environment`, `Module`).
* **Tags**

  * On taggable resources: `Name` (with `prod-` prefix), `Environment=prod`, `Project=TapStack`.
* **Outputs** (at least)

  * `VpcId`
  * `PublicSubnetIds` (comma-joined)
  * `Instance1PublicIp` (EIP if used, else instance public IP)
  * `Instance2PublicIp`
  * `AsgName`
  * `S3BucketName`
  * `CloudTrailName`
  * `KmsKeyId`

## Quality bar (so this goes smoothly)

* Single YAML document, clean and lintable.
* Uses `Fn::GetAZs` for AZ selection.
* Least-privilege IAM (S3 read-only scoped to the created bucket).
* EBS root volumes **gp3**, **encrypted**, **delete on termination**.
* Alarm actions point to the **ScalingPolicy ARNs**.
* Prefer clear names we’ll recognize in ops:
  Role **`prod-ec2-role`**, Instance Profile **`prod-ec2-instance-profile`**, SG **`prod-web-sg`**, Launch Template **`prod-launch-template`**, ASG **`prod-asg`**.
* Again: **output only the YAML for `TapStack.yml`**, nothing else.
