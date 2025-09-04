You are an AWS Solutions Architect. Generate a single **CloudFormation YAML** template named **TapStack.yml** that I can deploy as a brand-new stack in either **us-west-2** or **eu-central-1** with zero pre-existing resources. The template must include **all parameters, defaults, mappings, resources, policies, user data, and outputs in one file**—no external files. Follow AWS best practices and the exact constraints below.

# Goal
Provision a minimal, secure, multi-environment setup that works unchanged in BOTH regions (us-west-2, eu-central-1): VPC, subnets, routing, an EC2 instance, an RDS database, and an S3 bucket—fully tagged and instrumented. All resources must be new (no lookups of existing items).

# Hard Requirements (Acceptance Criteria)
1) Tags & Organization
   - Apply CloudFormation resource "Tags" everywhere tags are supported (VPC, subnets, NAT, EC2, RDS, S3, security groups, log groups, etc.).
   - REQUIRED tag key/value: Project=MultiEnvDemo (include Environment, StackName as extra tags).
2) VPC & Networking (create NEW)
   - One VPC (CIDR via Parameter; sensible default).
   - Two AZ design minimum; create **two public** and **two private** subnets spread across distinct AZs.
   - Internet Gateway attached; public route tables for public subnets.
   - One NAT Gateway (cost-conscious, single-AZ) and private route tables routing via NAT.
3) EC2 (create NEW)
   - Instance type: **t3.small** (parameter with default t3.small).
   - AMI: use the **SSM public parameter** for Amazon Linux 2023 (no hard-coded AMI IDs).
   - Attach an **Instance Profile/Role** granting **read-only access to the stack’s S3 bucket only** (resource-scoped to that bucket ARN and its objects, not global S3).
   - **UserData** must:
       a) install Apache HTTP Server (httpd) and enable on boot,
       b) install & configure the CloudWatch Agent to send /var/log/messages and Apache access/error logs to a stack-specific CloudWatch Log Group,
       c) write a simple index.html that confirms region and instance metadata.
   - Security Group for EC2:
       - **Restrict inbound SSH (22)** to **203.0.113.0/24** only.
       - Allow outbound 0.0.0.0/0 as needed for updates/agent (egress).
       - (Optional) Allow HTTP(80) from 0.0.0.0/0 for demo access (implement but can be disabled by parameter).
4) S3 Bucket (create NEW)
   - Globally unique name constructed from StackName + Region + a random suffix (use CloudFormation Fn::Select/Fn::Join approach).
   - **Versioning: Enabled**.
   - **Lifecycle**: transition **noncurrent versions** to **GLACIER** after **30 days**.
   - **Default encryption** SSE-S3 enabled.
   - Output the **BucketName**.
5) RDS (create NEW)
   - Engine: MySQL 8.0 (engine family **mysql8.0**).
   - Instance class: **db.t3.micro** (parameter with default).
   - Storage: gp3 minimal sensible default; backup window parameters included.
   - **NOT publicly accessible**; in private subnets only.
   - **DB Subnet Group** using the private subnets you created.
   - Security Group: only allow DB port (3306) **from the EC2 SG**, not from the internet.
   - **Parameter Group** (mysql8.0) with **max_connections=150**.
   - Master username via Parameter with default; **master password must be a dynamic reference to SSM Parameter Store** (e.g., {{resolve:ssm-secure:/tapstack/${Environment}/db/master_password:1}}). Do NOT hardcode secrets.
   - Output the **DBEndpointAddress** and **DBPort**.
6) Systems Manager Parameter Store (reference)
   - Use at least one **SSM secure string parameter** reference for the DB master password as described.
   - Also accept an optional secure app secret (e.g., /tapstack/${Environment}/app/secret) and pass it to EC2 via user data/instance metadata file for demonstration (do not print secret in logs).
7) CloudWatch & Monitoring
   - Create a **CloudWatch Log Group** for app/instance logs with 30-day retention; grant instance IAM permissions: logs:CreateLogStream, logs:PutLogEvents, logs:DescribeLogStreams on that group.
   - Create a **CloudWatch Alarm** on the EC2 instance for **CPUUtilization >= 70% for 2 out of 5 minutes**.
   - Include an **SNS Topic** for the alarm; take a Parameter for email (optional); if provided, create a subscription.
8) Security Groups (recap)
   - EC2 SG: SSH 22 from **203.0.113.0/24 only** (required). (HTTP 80 world-open controlled by parameter).
   - RDS SG: 3306 allowed **only** from EC2 SG.
9) Cross-Region Compatibility
   - Template must deploy **unchanged** in both **us-west-2** and **eu-central-1**.
   - Avoid region-locked features and hardcoded AZ names; discover AZs via Fn::GetAZs and select 0/1.
10) Outputs (explicit)
   - BucketName
   - DBEndpointAddress
   - DBPort
   - InstanceId
   - InstancePublicDnsName
   - VpcId
11) Parameters (examples & defaults)
   - Environment: { AllowedValues: [dev, staging, prod], Default: dev }
   - VpcCidr: default 10.0.0.0/16
   - InstanceType: default t3.small (constraint to t3.small)
   - DBInstanceClass: default db.t3.micro (constraint to db.t3.micro)
   - DBName, DBUsername (safe defaults), DBPasswordSSMParam (no default, documented)
   - AllowHttpFromWorld: default true|false (bool)
   - AlarmEmail: optional string
12) Best Practices & Quality Gates
   - Use intrinsic functions (Fn::Sub, Fn::Join, Fn::Select, Fn::GetAZs) instead of hardcoding.
   - Use dynamic references for ALL secrets.
   - Follow least-privilege for the EC2 role policy: scope S3 access to the created bucket only.
   - No deprecated property names; validate with cfn-lint.
   - Include **Metadata** or **Description** sections documenting parameters and how to deploy in either region.

# Deliverable
Return ONLY the full contents of **TapStack.yml** in a single fenced YAML code block. It must be a complete, deployable CloudFormation template that creates all required resources from scratch, with all parameters, mappings (if any), conditions, resources, policies, and outputs included. Do not include explanations outside the YAML.

(Important: ensure the template compiles as YAML, not JSON; do not reference external files, and do not omit any resource that is required by the acceptance criteria.)