Functional scope (build everything new):

* Provision a production-grade ECS Fargate stack in **us-east-1** for three microservices: **payment-service**, **fraud-service**, **reporting-service**.
* Build all dependencies from scratch: **VPC (3 AZ)**, **public subnets for ALB**, **private subnets for ECS tasks**, **NAT gateways**, **Internet/NAT route tables**, **ECR repositories**, **ECS cluster (container insights on)**, **Cloud Map namespace**, **Application Load Balancer**, **target groups**, **listeners + path rules**, **CloudWatch log groups**, **IAM roles/policies**, **security groups**, **autoscaling policies**, and **CloudFormation outputs**.
* Enforce strict tagging and naming: **all resource names must include `${EnvironmentSuffix}`** to avoid cross-deployment conflicts.

Guiding principles and constraints:

* **Serverless only**: all tasks are Fargate with `awsvpc` networking, **no EC2**.
* **Private networking**: services run in private subnets; outbound egress via **NAT gateways**; ALB sits in public subnets.
* **Service discovery first-class**: use **Cloud Map** namespace; all inter-service calls resolve via **service discovery**, not hardcoded hostnames.
* **Security groups are least-privilege**: ALB ingress from the internet (80/443) only; services only accept traffic from ALB SG or explicitly allowed peer SGs; no `0.0.0.0/0` on task SGs.
* **Observability**: one **log group per service** with 7-day retention; container insights enabled on the cluster.
* **Scalability**: each service autoscaling target policy at **70% CPU**, **min 2 tasks**.
* **Operability**: **Execute Command** enabled across all task definitions (include required KMS/permissions if needed).
* **Compliance**: all resources tagged with `Environment=Production` and `ManagedBy=CloudFormation`.
* **YAML only**: the template must be **pure CloudFormation YAML** (not JSON), **no YAML anchors/aliases**.
* **Resilient parameterization**: **do not hardcode allowed values** for `EnvironmentSuffix`; instead enforce a **safe naming regex** (e.g., `^[a-z0-9-]{3,20}$`) via `AllowedPattern`. Keep the parameter flexible (examples like `prod-us`, `production`, `qa` should pass).

Inputs (CloudFormation Parameters) — required:

* `EnvironmentSuffix` (String): safe naming **AllowedPattern** like `^[a-z0-9-]{3,20}$`; **Description** explains examples (`prod-us`, `production`, `qa`).
* `VpcCidr` (String): default such as `10.20.0.0/16`.
* `PublicSubnetCidrsAz1/2/3` and `PrivateSubnetCidrsAz1/2/3` (String): /24 ranges within the VPC.
* `AcmCertificateArn` (String): ACM cert for the ALB HTTPS listener.
* `PaymentImageUri`, `FraudImageUri`, `ReportingImageUri` (String): **private ECR** image URIs (`<account>.dkr.ecr.us-east-1.amazonaws.com/repo:tag`).
* `DesiredCount` (Number): default `2` and used as the **minimum** for all services.
* Optional knobs with sensible defaults: `LogRetentionDays` (default `7`), `TargetCpuPercent` (default `70`).

Mandatory architecture & sizing:

* **ECS Cluster**: container insights **enabled**.
* **Task sizing**:

  * `payment-service`: **1 vCPU / 2 GB**
  * `fraud-service`: **1 vCPU / 2 GB**
  * `reporting-service`: **0.5 vCPU / 1 GB**
* **ALB**:

  * HTTPS listener (443) using `AcmCertificateArn`.
  * HTTP listener (80) **redirects** to HTTPS.
  * **Path-based routing**: `/payment/*` → payment target group, `/fraud/*` → fraud target group, `/reporting/*` → reporting target group.
  * One target group per service with **health checks** and tuned thresholds/intervals.
* **Cloud Map**:

  * Private DNS namespace in the VPC.
  * Register each ECS service into Cloud Map for discovery (`payment.${namespace}`, `fraud.${namespace}`, `reporting.${namespace}`).
* **Auto Scaling** (per service):

  * Application Auto Scaling target tracking on **CPU 70%**, min tasks = `DesiredCount` (>=2), reasonable max (e.g., 10).
* **Security groups**:

  * `AlbSecurityGroup-${EnvironmentSuffix}`: ingress 80/443 from internet; egress to tasks.
  * `EcsServiceSecurityGroup-${EnvironmentSuffix}` (per service or a shared tasks SG + per-service SGs):

    * Ingress only from ALB SG on the container port.
    * Egress to VPC and necessary AWS endpoints (ECR, CloudWatch, Cloud Map, etc.).
  * Inter-service communication is **only** via Cloud Map and permitted SG rules as needed.
* **IAM roles/policies**:

  * Task execution role with ECR pull, CloudWatch Logs, ExecuteCommand, and X-Ray (optional) permissions.
  * Task role scoped least-privilege (extendable by the application later).
* **CloudWatch Logs**:

  * Three dedicated log groups (payment, fraud, reporting) with **7-day retention** parameterized.
* **Execute Command**:

  * Enabled on services and task definitions; include required configuration (SSM permissions via execution role).
* **Tags**: every resource includes `Environment=Production` and `ManagedBy=CloudFormation` **plus** `Name` incorporating `${EnvironmentSuffix}`.

Non-goals / exclusions:

* No external, pre-existing VPCs, ALBs, or clusters referenced; **everything is created in this stack**.
* No hardcoded ARNs (except through parameters) and no environment-specific magic values.

Acceptance criteria:

* Single **TapStack.yml** renders a deployable stack that passes **cfn-lint** and CloudFormation validation.
* All logical/resource names, ALB TG names, log groups, SGs, ECS services, etc. **include `${EnvironmentSuffix}`**.
* **Path rules** route correctly to each service; **health checks** stabilize services.
* Each service can scale from 2→N tasks based on CPU.
* Service discovery records resolve inside the VPC.
* `aws ecs execute-command` works against running tasks (given operator IAM).

Deliverable:

* Provide **one file** named **`TapStack.yml`** containing the **complete CloudFormation YAML template** with:

  1. **Metadata**: brief description, template version.
  2. **Parameters**: as listed, with defaults where appropriate and `AllowedPattern` for `EnvironmentSuffix` (no hard `AllowedValues`).
  3. **Conditions** (if any).
  4. **Mappings** (only if truly needed; avoid unnecessary complexity).
  5. **Resources** (end-to-end creation of: VPC + subnets + routing + IGW + NATs; security groups; ECR repos; ECS cluster; Cloud Map namespace; ALB/TGs/listeners/rules; IAM roles/policies; CloudWatch log groups; task definitions; ECS services; autoscaling).
  6. **Outputs**: export ARNs/IDs/hostnames such as:

     * `VpcId`, `PrivateSubnetIds`, `PublicSubnetIds`
     * `AlbDnsName`, `AlbArn`
     * `ClusterName`
     * `CloudMapNamespaceId`, `CloudMapNamespaceName`
     * `PaymentServiceName`, `FraudServiceName`, `ReportingServiceName`
     * `PaymentServiceDiscoveryName`, `FraudServiceDiscoveryName`, `ReportingServiceDiscoveryName`
     * `PaymentTargetGroupArn`, `FraudTargetGroupArn`, `ReportingTargetGroupArn`
     * `LogGroupPayment`, `LogGroupFraud`, `LogGroupReporting`

Authoring requirements (style & correctness):

* Output must be **YAML CloudFormation**, not JSON; **no YAML anchors/aliases**.
* Use clear, deterministic **`!Sub`** name patterns that append `-${EnvironmentSuffix}`.
* Include explicit **`DependsOn`** where resource ordering matters (e.g., listeners/rules after target groups; services after cluster/log groups/IAM).
* **Health checks**: set sensible `IntervalSeconds`, `HealthyThresholdCount`, `UnhealthyThresholdCount`, and `Matcher` (e.g., `200-399`); define `HealthCheckPath` per service (`/health` or parameterized).
* **Ports**: use distinct container names/ports per service (parameterize ports as needed).
* Ensure **Auto Scaling** resources reference the correct service ARN and scalable dimension.
* Keep policies **least-privilege** while including ECR pulls, logs, ExecuteCommand, and service discovery requirements.
* Tag every resource with both mandated tags and a meaningful `Name` that embeds `${EnvironmentSuffix}`.

Output format:

* Return a **single fenced code block** containing the full **TapStack.yml** content in **YAML** (use a standard `yaml` code fence). Do **not** return any additional commentary outside the code block.
