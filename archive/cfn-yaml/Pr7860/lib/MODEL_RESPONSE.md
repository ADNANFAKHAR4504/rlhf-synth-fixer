### model_response

# Functional scope (build everything new):

Implement a complete, reproducible CloudFormation solution that builds a fresh VPC, subnets, routing, security groups, IAM roles/profiles, ALB, Target Group, Listeners, Launch Template, Auto Scaling Group, CloudWatch logs and alarms, optional VPC Flow Logs, and an S3 logs bucket—fully parameterized and initialized for non-interactive pipeline deployments.

# Deliverable:

A single **TapStack.yml** that:

* Uses YAML (not JSON) with clear Metadata parameter groups and labels.
* Initializes all Parameters with sensible defaults so CI/CD does not need to pass values.
* Enforces **us-east-1**.
* Avoids explicit physical names (e.g., BucketName, RoleName, FunctionName, AutoScalingGroupName) to pass early validation.
* Includes Conditions to toggle TLS and logging features safely.
* Emits complete, human-useful Outputs.

## What the template contains

* **Parameters**: `ProjectName`, `EnvironmentSuffix` (regex-guarded), `Owner`, VPC and subnet CIDRs, `AlbAccessCidr`, SSM-based AMI, instance type, root volume size/type, scaling bounds, CPU target, `AppPort`, optional `ParameterNamespace`, TLS toggle and certificate ARN, logging/flow-logs toggles, retention days.
* **Rules**: Single rule asserting deployment in `us-east-1`.
* **Networking**: VPC, IGW + attachment, public/private subnets (two AZs), route tables and associations, NAT EIP and NAT Gateway, default routes.
* **Security**: ALB SG (HTTP/optional HTTPS from CIDR; egress all), App SG (only ALB to `${AppPort}`; egress all).
* **IAM**: Instance role with `AmazonSSMManagedInstanceCore` and a scoped inline policy for Parameter Store reads, plus an instance profile.
* **Compute**: Launch Template with SSM-resolved AMI, private networking, encrypted `gp3`, metadata hardening, and UserData that runs a minimal HTTP service returning `200` on `/health`.
* **Load balancing**: ALB (with optional access logging), `/health` target group, HTTP listener, optional HTTPS listener.
* **Auto scaling**: ASG in private subnets, TargetTracking on CPU, `DefaultInstanceWarmup` and a long `HealthCheckGracePeriod` to prevent premature scale-in.
* **Observability**: System/application log groups with retention, optional VPC Flow Logs (role + log group), CloudWatch alarms for CPU, ALB 5XX, and unhealthy hosts.
* **S3 logs bucket**: Versioning, encryption, public access blocks, ownership controls, TLS-only policy, and ALB log-delivery permissions targeted to the account path; ALB depends on the bucket policy.
* **SSM parameters**: Namespace auto-generated when blank; parameters for `APP_PORT`, `LOG_LEVEL`, and `ENVIRONMENT`.

## Verification outcomes

* Successful creation with stable **InService** targets.
* ASG does not oscillate between creating and updating capacity.
* ALB access logs write to the bucket when enabled.
* All outputs present and accurate.

