# Prompt: Generate TapStack.yml (staging + production)

I need a single CloudFormation **YAML** template named **TapStack.yml** that I can deploy as two separate stacks—one in **us-east-1** (production) and one in **us-west-2** (staging). The template must be **self-contained** (brand-new infra: do not reference any pre-existing resources) and include **all parameters, mappings, conditions, resources, and outputs** in the same file.

## Architecture & requirements (apply to both stacks)

* **VPC & subnets**

  * One VPC with CIDR `10.0.0.0/16`.
  * Exactly **two subnets**:

    * Public subnet CIDR `10.0.1.0/24`.
    * Private subnet CIDR `10.0.2.0/24`.
  * Internet Gateway + public route table with `0.0.0.0/0` route to IGW.
  * **No NAT Gateway** and no default route to the internet from the private subnet (i.e., outbound internet must be available **only** from public subnets).
  * Add **VPC endpoints** so private resources remain functional without public egress:

    * **Gateway**: S3.
    * **Interface**: SSM, SSMMessages, EC2Messages, CloudWatch Logs.
* **Compute & ALB**

  * Application Load Balancer in the **public** subnet, HTTP only (port **80**). **No SSL/certificates** anywhere in the template.
  * Target group (HTTP, health check on `/`).
  * Auto Scaling Group (in **private** subnet) using a Launch Template:

    * **Min 2, Max 5**, Desired 2.
    * **Latest Amazon Linux 2 AMI** via SSM public parameter (e.g., `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` or gp3).
    * Instance type parameter with a sane default (e.g., `t3.micro`).
    * UserData should:

      * Install and start the **CloudWatch Agent** for **CPU & memory** metrics.
      * Create a simple HTTP app on port 80 (e.g., small nginx/httpd or a minimal bash-hosted response) listening on the instance, so ALB health checks pass.
  * Security Groups:

    * ALB SG: inbound **80** from `0.0.0.0/0`, egress all.
    * App SG: inbound **80** only from the ALB SG, egress **restricted** to required VPC endpoints (normal default egress is okay since there is **no** route to the Internet from the private subnet).
* **Data layer**

  * **DynamoDB** table (provisioned mode) with **5 RCU / 5 WCU**, server-side encryption enabled, and point-in-time recovery enabled.
  * **RDS** (PostgreSQL) in **Multi-AZ** with encryption at rest enabled; deploy into the **private** subnet:

    * Use a parameter for EngineVersion with a default that is widely available in both regions (e.g., a stable **PostgreSQL 14.x**). **Do not pick a version that might be unavailable**—choose one known to be broadly supported.
    * InstanceClass parameter with a small default (e.g., `db.t3.micro` or `db.t4g.micro`—pick x86\_64-compatible if you used x86\_64 AMI).
    * Create a dedicated **DB subnet group**, security group (ingress only from the App SG on the DB port), and a parameter for DB name/username; store the **DB password as a SecureString in SSM Parameter Store** and reference it at runtime (do **not** hardcode secrets in the template).
* **S3 & logging**

  * An **S3 logs bucket** per environment with **encryption at rest** and **Block Public Access = true**.
  * Enable **access logging on all S3 buckets** to a dedicated **access-logs bucket** (you can create a small companion “access-logs” bucket per environment as the target; don’t log a bucket to itself).
  * Enable **ALB access logs** to the logs bucket with the proper bucket policy that allows ALB to write.
* **IAM**

  * Instance Role/Instance Profile with least-privilege policies that allow:

    * Read from SSM Parameter Store for app config and DB password (SecureString).
    * Put metrics/logs to CloudWatch (for CloudWatch Agent).
    * Read/Write to the environment’s S3 logs/app bucket as appropriate (be conservative).
    * Read/Write to the environment’s DynamoDB table as the app layer.
* **Monitoring**

  * **CloudWatch LogGroup** for application/system logs with encryption at rest (KMS or AWS-managed OK).
  * **CloudWatch Dashboard** with widgets for:

    * EC2 AutoScaling group average **CPUUtilization** and **memory** (from CloudWatch Agent namespace).
    * ALB **HTTP 5xx**, **TargetResponseTime**, and **RequestCount**.
    * RDS **CPUUtilization**, **FreeableMemory**, **DatabaseConnections**.
* **Parameter Store**

  * Create **namespaced parameters** for environment-specific config (e.g., `/tapstack/${Environment}/app/config/*`) using **SecureString** where sensitive; back with a KMS key or AWS managed key.
* **Tagging**

  * All resources must be tagged with:

    * `Project: TapStack`
    * `Owner: DevOps`
    * `Environment: Production` **or** `Environment: Staging` (driven by a parameter/condition)
    * `CostCenter: App`
* **Encryption**

  * S3: SSE (SSE-S3 or KMS).
  * DynamoDB: SSE enabled.
  * RDS: Storage encryption enabled (use a KMS key or AWS-managed key).
  * CloudWatch Logs: encryption enabled.

## Template structure & authoring rules

* **Single file**: everything in **TapStack.yml** (parameters, conditions, mappings, resources, outputs).
* Use **Parameters** for:

  * `EnvironmentName` (AllowedValues: `Production`, `Staging`).
  * `AppInstanceType` (default `t3.micro`).
  * `DBInstanceClass` (default a small class).
  * `DBEngineVersion` (default a stable PostgreSQL 14.x that is region-portable).
  * `DBName`, `DBUsername`, `DBPasswordParameter` (SSM path).
* Use **Conditions** to switch any small environment differences if needed, but keep infra identical across envs.
* Use **Mappings** only if actually helpful (e.g., per-region ALB log delivery account IDs if you include strict bucket policies).
* Fetch the **latest AL2 AMI** via SSM public parameter (no hardcoded AMI IDs).
* **No placeholders** like literal account IDs—use pseudo-parameters and intrinsic functions.
* **Do not add any SSL/TLS certificate or HTTPS listener**—this is intentionally **HTTP-only** on port 80.
* Keep policies **least-privilege**; avoid wildcards where practical.
* **No external modules** or nested stacks—this is a single, deployable template that creates all resources.

## Outputs (must be explicit and well-named)

Provide clear outputs for:

* `VpcId`, `PublicSubnetId`, `PrivateSubnetId`.
* `AlbArn`, `AlbDnsName`, `AlbSecurityGroupId`, `TargetGroupArn`, `HttpListenerArn`.
* `AutoScalingGroupName`, `LaunchTemplateId`, `InstanceRoleArn`, `InstanceProfileArn`.
* `AppSecurityGroupId`.
* `RdsEndpoint`, `RdsPort`, `DbSubnetGroupName`, `RdsSecurityGroupId`.
* `DynamoTableName`, `DynamoTableArn`.
* `S3LogsBucketName`, `S3LogsBucketArn`, `S3AccessLogsBucketName`, `S3AccessLogsBucketArn`.
* `CloudWatchDashboardName`, `LogGroupName`.
* `SsmParameterPathPrefix` (root path for the env’s config).

## Validation

* The YAML must be **valid CloudFormation** (passes `cfn-lint`), with correct property names per resource type.
* All dependencies and references (`Ref`, `GetAtt`, `Sub`) must resolve.
* The template must successfully create stacks in both **us-east-1** and **us-west-2** when deployed with:

  * `EnvironmentName=Production` (us-east-1) and
  * `EnvironmentName=Staging` (us-west-2).

Please output only the **TapStack.yml** content (no extra commentary).