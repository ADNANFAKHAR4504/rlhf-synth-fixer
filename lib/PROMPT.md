You are a senior Terraform engineer. Generate a COMPLETE, production‑grade Terraform configuration in a SINGLE FILE named `main.tf` for the following use case. Follow every requirement precisely.

-------------------------------------
Context I already have
-------------------------------------
- I already have a `provider.tf` file that configures the AWS provider as:
  provider "aws" {
    region = var.aws_region
  }
- Therefore, you MUST declare `variable "aws_region"` in `main.tf` with a sane default ("us-west-2") and do NOT re-declare the provider block in `main.tf`.

-------------------------------------
Global Requirements
-------------------------------------
- Cloud: **AWS** only. Region: **us-west-2** (multi‑AZ).
- Single file only: **Everything must be in `main.tf`** including:
  - All variable declarations (with sensible defaults)
  - All local values
  - All resources and logic
  - All IAM roles/policies
  - Any data sources
  - All outputs
- Do NOT reference external or registry modules. Build resources directly in `main.tf`.
- Organize the file with clear section headers (comments) for readability (e.g., Inputs, Locals, VPC, Security Groups, IAM, Launch Template, ASG, ALB, RDS, SSM Parameters, CloudWatch, Outputs).
- Use best practices, least privilege IAM, and sane defaults that allow `terraform init && terraform plan && terraform apply` to succeed in a fresh account without extra prerequisites.
- **Tag everything** (all taggable resources) with at least:
  - `project` (default: "iac-nova-model-breaking")
  - `environment` (default: "dev")
- Enforce naming: `project-env-resource` (via a `local.name_prefix`).
- No placeholders or TODOs. Provide working defaults.
- Keep resource counts minimal but compliant (cost-aware), while meeting constraints.

-------------------------------------
Functional Requirements
-------------------------------------
1) **VPC & Networking**
   - Create a new VPC with DNS support/hostnames enabled.
   - Create at least **2 public** subnets and **2 private** subnets across **at least two AZs** in us-west-2.
   - Create an Internet Gateway and attach to the VPC.
   - Create **NAT Gateways** to provide outbound internet from private subnets (1 per AZ is preferred; cost-aware OK).
   - Route tables:
     - Public subnets route 0.0.0.0/0 to the IGW.
     - Private subnets route 0.0.0.0/0 to their respective NAT Gateway.
   - Use `data "aws_availability_zones"` to pick two AZs.

2) **Load Balancing & Compute**
   - Application **ALB (Application Load Balancer)** in public subnets.
   - Target group (HTTP) with health checks.
   - Listener on port **80** (HTTP) forwarding to the target group.
   - Security groups must allow **HTTPS (443)** inbound to ALB (even if listener is HTTP by default) and HTTP (80). Outbound should be open or scoped appropriately.
   - **Auto Scaling Group** (ASG) across **private subnets** using a **Launch Template**:
     - AMI: latest Amazon Linux 2023 (SSM parameter recommended).
     - User data must:
       - Install and start **nginx** serving a simple index page that includes the instance ID.
       - Install and start **CloudWatch Agent** with a config that ships system logs (`/var/log/messages` or `/var/log/syslog`) and nginx access/error logs to CloudWatch Logs.
       - (Optional but preferred) Fetch the CloudWatch agent JSON config from SSM Parameter Store path defined below.
     - Min capacity = 2, Desired capacity = 2, Max capacity = 4.
     - Enable instance refresh on launch template changes.
     - Attach the ASG to the ALB target group.

3) **Database (RDS Postgres)**
   - Create a subnet group using **private subnets** only.
   - Create a **PostgreSQL RDS instance**:
     - Multi‑AZ = true
     - Engine version: a stable recent Postgres 14 or 15
     - Storage encrypted (AWS-managed key is fine)
     - Backup retention >= 7 days, preferred 7–14; enable auto minor version upgrades
     - CloudWatch logs exports for `postgresql` (and `upgrade` if supported)
     - Instance class: a small burstable (e.g., `db.t4g.micro` if supported)
     - Deletion protection = true
   - DB Security group: allow inbound 5432 **only** from the EC2/ASG instances’ security group.

4) **Security / IAM**
   - Create an **instance role** and **instance profile** for the EC2 instances with:
     - AWS managed policies:
       - `AmazonSSMManagedInstanceCore` (for SSM Session Manager)
       - `CloudWatchAgentServerPolicy` (for the CloudWatch Agent)
     - A **custom inline policy** granting least-privilege read access to SSM Parameter Store parameters under a prefix (e.g., `/app/${local.name_prefix}/`) and **kms:Decrypt** for the KMS key used by SecureString parameters.
   - Use `data "aws_kms_key" { key_id = "alias/aws/ssm" }` and include that ARN in the inline policy for `kms:Decrypt`.

5) **Application Configuration in SSM Parameter Store**
   - Create a small set of parameters under a consistent path, e.g.:
     - `/app/${local.name_prefix}/app/config_json` (String, example JSON with app settings)
     - `/app/${local.name_prefix}/db/username` (String)
     - `/app/${local.name_prefix}/db/password` (SecureString)
   - Generate `db/password` using `random_password` and use that for both SSM and the RDS master password (no secrets hardcoded).
   - Ensure the instance role policy can read these parameters with decryption.

6) **CloudWatch Logging**
   - Create dedicated **CloudWatch Log Groups** for:
     - The app/EC2 logs (e.g., `/app/${local.name_prefix}/web`)
     - RDS exported logs if needed (RDS can create its own groups, but you can pre-create to set retention).
   - Set log group **retention** (e.g., 30 days).
   - Ensure the CloudWatch agent config (JSON) is stored in SSM and referenced by user data, or write JSON directly in user data—either is acceptable, but prefer SSM.

7) **Security Groups**
   - ALB SG: allow inbound 80 and 443 from 0.0.0.0/0; egress open or scoped.
   - EC2/App SG: allow inbound 80 only from ALB SG; egress open or scoped.
   - RDS SG: allow inbound 5432 only from EC2/App SG.

8) **Scalability & IAM Access Control**
   - ASG properly spans at least two AZs.
   - IAM role/policies should strictly scope SSM parameter access to the defined path.
   - Use variables for desired/min/max capacity, instance type, DB size/class.

9) **Tagging**
   - Apply `project` and `environment` tags to **all** supported resources.
   - Also set `Name` tag using `local.name_prefix` and a short suffix indicating the resource (e.g., `-vpc`, `-alb`, `-asg`, `-rds`).

10) **Outputs**
    Provide clear outputs for:
    - VPC ID
    - Public and Private Subnet IDs (lists)
    - ALB DNS name
    - ASG name
    - RDS endpoint address
    - SSM Parameter ARNs (or names) created
    - Security Group IDs (ALB, App, RDS)

-------------------------------------
Variables & Locals (Guidance)
-------------------------------------
- Variables (with sensible defaults):
  - `aws_region` (default "us-west-2")  <-- required (provider.tf uses it)
  - `project` (default "iac-nova-model-breaking")
  - `environment` (default "dev")
  - `vpc_cidr` (default "10.0.0.0/16")
  - `public_subnet_cidrs` (list, two /24 CIDRs)
  - `private_subnet_cidrs` (list, two /24 CIDRs)
  - `instance_type` (default "t3.micro" or "t4g.micro" if using arm64)
  - `asg_min_size` (2), `asg_desired_capacity` (2), `asg_max_size` (4)
  - `db_instance_class` (e.g., "db.t4g.micro"), `db_name` (e.g., "appdb"), `db_username` (e.g., "appuser")
  - `log_retention_days` (e.g., 30)
- Locals:
  - `name_prefix = "${var.project}-${var.environment}"`
  - `common_tags = { project = var.project, environment = var.environment }`

-------------------------------------
Implementation Notes
-------------------------------------
- Use `aws_ssm_parameter` for all parameters; use `random_password` for DB password.
- Use `aws_launch_template` + ASG with `user_data` (cloud-init or bash) to:
  - Install nginx
  - Write a simple index.html including instance ID (can retrieve via instance metadata)
  - Install & start CloudWatch Agent; config either fetched from SSM path or written inline (heredoc)
- Use `data "aws_ssm_parameter"` to pull latest Amazon Linux 2023 AMI (`/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64` or arm64 if using t4g).
- Set `enabled_cloudwatch_logs_exports = ["postgresql"]` on RDS.
- Use least-privilege inline IAM policy with actions:
  - `ssm:GetParameter`, `ssm:GetParameters`, `ssm:GetParametersByPath`
  - `kms:Decrypt` on the `alias/aws/ssm` key (use data source to get ARN).
- Ensure dependencies and ordering are correct (e.g., NAT EIPs before NAT GW, routes after gateways).

-------------------------------------
Output Format
-------------------------------------
- Return ONLY a single Terraform file inside one fenced code block:
  - Start with: ```hcl
  - End with: ```
- Do NOT include explanations outside the code block.
- The file must be VALID HCL and pass `terraform fmt` without changes.

Now, generate the full `main.tf` accordingly.