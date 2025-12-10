Functional scope (build everything new):
Produce a single CloudFormation template file named **TapStack.yml** that provisions a brand-new, secure, and scalable web-application stack **entirely in `us-east-1`**, without referencing or importing any pre-existing resources. The template must define all **Parameters**, **Mappings** (if needed), **Conditions** (if needed), **Resources**, and **Outputs** required to stand up the environment from scratch, following AWS best practices for security, availability, and cost awareness.

Constraints & non-negotiables:

* Region is **hard-set to `us-east-1`** (e.g., via `Metadata` note and by not parameterizing Region for resources that must reside there).
* Include a **parameterized AMI ID** (e.g., `AmiId`) used by launch templates/EC2. Allow passing a specific AMI while keeping sensible validation.
* **All resource names** (logical and runtime where applicable) must embed `EnvironmentSuffix` (e.g., `${ProjectName}-${EnvironmentSuffix}-…`) to avoid cross-deployment collisions.
* **Do not use hard AllowedValues** for `EnvironmentSuffix`. Enforce a **safe naming regex** using `AllowedPattern` (e.g., `^[a-z0-9-]{3,32}$`) and provide a helpful `ConstraintDescription`. Include a default value (e.g., `prod-us`) that conforms to the regex.
* YAML only (no JSON sections), cleanly formatted, linter-friendly, and free of deprecated properties.

Architecture components to include (all created new):

* **VPC** with at least **2 AZs**, **public and private subnets**, **NAT Gateway** for private egress, route tables, and **VPC Flow Logs** to an **S3 log bucket** (server-side encrypted) and/or **CloudWatch Logs**.
* **Security Groups** that **default to no inbound rules**; explicitly allow only the traffic required (e.g., ALB → EC2 on app port). No `0.0.0.0/0` inbound except ALB listener (HTTPS/HTTP as applicable).
* **KMS CMK** (AWS-managed where appropriate, or use AWS-managed keys where best practice dictates) ensuring **EBS volume encryption**. Launch Template must enforce EBS encryption via KMS.
* **IAM roles** and **instance profile** with least privilege:

  * EC2 instance role: SSM access (Parameter Store/CloudWatch Agent), read-only to Parameter Store path, permission to publish metrics/logs, and to read from the logs/config S3 bucket if required. Avoid wildcards; scope to resources and actions.
  * Roles for VPC Flow Logs/CloudTrail→CloudWatch if applicable.
* **Auto Scaling** using a Launch Template: health checks via **ALB**, scaling policies based on **CPUUtilization** (target tracking), minimum 2 instances across AZs.
* **Elastic Load Balancer (ALB)**: Internet-facing, spans at least two public subnets; target group (instance or IP/ALB target type), listeners (80 and optionally 443 with ACM parameter if desired; if TLS omitted, document rationale).
* **CloudWatch** for logs/metrics:

  * Log groups for application and system, with retention (e.g., 30–90 days).
  * Install and configure **CloudWatch Agent** via UserData or SSM to ship app/system logs and basic metrics.
  * Useful dashboards/alarms (CPU high, unhealthy hosts, 5XX on ALB).
* **Systems Manager Parameter Store** for environment config:

  * Namespace parameters under `/${ProjectName}/${EnvironmentSuffix}/…` (e.g., `AppConfig`, `DBEndpoint` placeholder if needed, `LogLevel`, `AppPort`).
  * EC2 policy must be scoped to these paths.
* **S3 log bucket** (unique name with suffix), **SSE-S3** enabled (or SSE-KMS with managed key), **block public access**, **versioning**, **lifecycle** to transition/access logs if applicable.
* (Optional but recommended) **CloudTrail** multi-region trail writing to the logs bucket with correct bucket policy; if included, ensure KMS/Log policies are correct and do not cause early validation failures.

Implementation details for TapStack.yml:

* **Parameters**: `ProjectName` (default like `tapstack` with regex), `EnvironmentSuffix` (regex only, no AllowedValues), `AmiId`, `InstanceType` (constrained to a safe set via regex), `DesiredCapacity`, `MinSize`, `MaxSize`, `AppPort`, `VpcCidr`, `PublicSubnetCidrA/B`, `PrivateSubnetCidrA/B`, optional `AlbAccessCidr` (default `0.0.0.0/0` only for HTTP/S to ALB), `LogRetentionDays`, `ParameterNamespace` (default to `/${ProjectName}/${EnvironmentSuffix}`), and `EnableTls`/`AcmCertificateArn` if you choose to implement TLS listener.
* **Naming & tagging**: Every resource tagged with `Project`, `Environment`, `Owner` (parameterized), and `Name` = `${ProjectName}-${EnvironmentSuffix}-…`.
* **Security groups**: No default inbound. Explicitly add **only**:

  * ALB SG: inbound 80 (and 443 if enabled) from `AlbAccessCidr`; egress ephemeral.
  * App/EC2 SG: inbound `AppPort` from ALB SG only; no public inbound; egress ephemeral.
* **Launch Template**:

  * Uses `AmiId` parameter, `InstanceType`, `IamInstanceProfile`.
  * **BlockDeviceMappings**: root EBS with encryption via KMS; size and type parameterized; delete on termination true.
  * **UserData**: installs CloudWatch Agent, enables SSM, sets up app process (placeholder), writes environment from Parameter Store (using `aws ssm get-parameters-by-path` on boot or SSM agent).
* **Auto Scaling Group**:

  * Spans private subnets in at least two AZs.
  * TargetGroup binding for ALB health checks.
  * Target tracking policy on `CPUUtilization` (e.g., 50–60%).
* **ALB**:

  * Public subnets, listener(s), target group health checks on `AppPort`.
  * Access logs (optional) to S3 logs bucket (if enabled, ensure bucket policy grants delivery).
* **CloudWatch**:

  * LogGroup names include `${ProjectName}-${EnvironmentSuffix}`.
  * Alarms: High CPU on ASG, ALB 5XX, UnhealthyHostCount > 0.
* **S3 logs bucket**:

  * `SSEAlgorithm: AES256` (or parameterize KMS key).
  * **BlockPublicAccess**, **Versioning**, lifecycle (e.g., transition to IA/Glacier and expiration).
  * Bucket policy denies non-TLS and public access.
* **SSM Parameter Store**:

  * Create sample parameters (e.g., `/…/APP_PORT`, `/…/LOG_LEVEL`, `/…/ENV`).
  * Output the base namespace and example keys.

Quality & formatting expectations:

* Valid **YAML** with comments explaining sensitive sections (policies, conditions, security groups).
* Use **DependsOn** only where necessary; otherwise rely on implicit references.
* Avoid wildcard `"*"` in IAM where possible; scope actions and resources tightly.
* Include **Metadata.AWS::CloudFormation::Interface** grouping for Parameters.
* Passes `cfn-lint` and avoids early validation errors (e.g., correct ALB access log bucket policy if enabled).

Outputs:

* Export (no cross-stack export) but **Outputs** must include:

  * `VpcId`, `PublicSubnetIds`, `PrivateSubnetIds`
  * `AlbArn`, `AlbDnsName`, `AlbSecurityGroupId`
  * `AsgName`, `LaunchTemplateId`
  * `InstanceRoleArn`, `InstanceProfileName`
  * `LogsBucketName`
  * `ParameterNamespace`
  * `AppSecurityGroupId`
  * Any created KMS Key Arn (if applicable)

Functional test expectations (implicit, for your implementation):

* Stack creates successfully in `us-east-1`.
* ALB DNS serves health check (or returns expected 200 on `/health` if user data sets it).
* ASG reaches desired capacity across 2+ AZs; scaling policy registered.
* EC2 instances have encrypted EBS, correct IAM role, can read Parameter Store namespace, and publish CloudWatch logs/metrics.
* Security groups have no unintended public inbound paths (only ALB listener from the internet; app only from ALB).
* S3 logs bucket enforces SSE and blocks public access.

Deliverable:

* A single, production-ready **TapStack.yml** that implements everything above using AWS-managed services only, embeds `EnvironmentSuffix` in all names, uses a **regex `AllowedPattern`** (not `AllowedValues`) for `EnvironmentSuffix`, and includes complete **Parameters**, **Resources**, and **Outputs** required to deploy a fresh, secure, highly-available stack in `us-east-1`.
