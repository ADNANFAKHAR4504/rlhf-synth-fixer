Functional scope (build everything new):
Design and produce a complete `TapStack.yml` CloudFormation template that provisions a **brand-new**, production-ready AWS environment in `us-east-1` based on the following Python+Boto3 requirements, but implemented entirely as infrastructure-as-code in YAML (no JSON, no Python code in this file). The template must define **all resources from scratch** (no references to existing VPCs, subnets, security groups, roles, KMS keys, buckets, or databases), and must include all necessary parameters, conditions, mappings (if needed), resources, and outputs.

Reinterpret the original problem as a single CloudFormation stack that creates and wires the full environment below:

1. **Global conventions and parameters**

   * Define a parameter `EnvironmentSuffix` of type `String` that is used to distinguish multiple deployments of this stack.

     * Do **not** use `AllowedValues` for `EnvironmentSuffix`.
     * Enforce a **safe naming regex** using `AllowedPattern` and `ConstraintDescription` instead (e.g., lowercase letters, digits, and hyphens only, reasonable length).
   * Every **named resource** created by this template must include `${EnvironmentSuffix}` in its `BucketName`, `DBInstanceIdentifier`, `TableName`, `LogGroupName`, `TopicName`, `FunctionName`, `SecurityGroupName`, `ClusterIdentifier`, etc., to avoid conflicts between multiple deployments.
   * Include additional parameters as needed for:

     * Project/stack name (e.g., `ProjectName`)
     * VPC CIDR
     * Public and private subnet CIDR blocks
     * Bastion host allowed SSH CIDR
     * EC2 instance type(s)
     * RDS instance class, engine version, allocated storage
     * DynamoDB read/write capacity baselines
     * KMS key alias names
   * Use **YAML syntax only** (no embedded JSON payloads, no `{"Key": "Value"}` inline maps).

2. **VPC, networking, and bastion host**

   * Create a new **VPC** in `us-east-1` with:

     * At least two public subnets (in different AZs).
     * At least two private subnets (in different AZs).
     * An Internet Gateway and route tables for public subnets.
     * NAT Gateway(s) or equivalent routing setup for private subnets to reach the internet where needed.
   * All subnet, VPC, and route table resource names/IDs must incorporate `${EnvironmentSuffix}` where a Name tag or identifier is used.
   * Create a **bastion host EC2 instance** in a public subnet:

     * Minimal instance type (e.g., t3.micro) to keep costs low.
     * Security group that allows SSH only from a parameterized CIDR (e.g., `BastionAllowedCidr`).
     * Use IAM roles with least privilege access where required.
   * Optionally enable **VPC Flow Logs** to CloudWatch Logs or S3, using KMS encryption to support auditing and debugging.

3. **S3, lifecycle policies, and eventing**

   * Create a **new S3 bucket** dedicated to this stack with:

     * Versioning enabled.
     * Server-side encryption enabled using a **KMS CMK** (defined in this template).
     * Lifecycle policies to transition older object versions to cheaper storage classes and eventually expire them, while balancing cost optimization and retention.
     * All S3 logging (such as access logs) should be enabled where practical, with logs stored in an encrypted logging bucket (can be a separate bucket in this template, also suffixed with `${EnvironmentSuffix}`).
   * Configure an **S3 event notification** that triggers a Lambda function whenever a relevant event occurs (e.g., `s3:ObjectCreated:*` on a specific prefix).

4. **Lambda function and API Gateway integration**

   * Define a **Lambda function** resource:

     * Name includes `${EnvironmentSuffix}`.
     * Execution role created in this template with the **least privileges** required:

       * Read from the S3 bucket that triggers it.
       * Write logs to CloudWatch Logs.
       * Publish to SNS, access DynamoDB, or KMS decrypt/encrypt as needed by design.
     * Use environment variables (where needed) with encryption using KMS.
     * Configure a log group for the Lambda function with retention and KMS encryption.
   * Create an **API Gateway (HTTP or REST) API** integrated with the Lambda function:

     * Set up at least one method and resource path (e.g., `GET /status` or similar).
     * Use appropriate IAM roles/lambda permissions to allow invocation.
     * Enable access logging and execution logging through CloudWatch Logs, encrypted with KMS.

5. **DynamoDB with auto-scaling and KMS encryption**

   * Create one or more **DynamoDB tables**:

     * Table name(s) must include `${EnvironmentSuffix}`.
     * Enable **server-side encryption** using a KMS CMK defined in this template (or AWS-managed KMS where appropriate, but prefer CMK for control).
     * Configure **auto-scaling** for read and write capacity using Application Auto Scaling:

       * Target tracking scaling policies with sensible min/max capacity bounds for cost control.
   * IAM roles for Lambda, EC2 or other services must grant least-privilege access to these tables.

6. **RDS with Multi-AZ and encryption**

   * Provision an **RDS instance** (for example, MySQL or PostgreSQL) with:

     * Multi-AZ deployment enabled.
     * Allocated storage and instance class parameters chosen with cost in mind.
     * Storage encrypted with a **KMS CMK** defined in this template.
     * Placed in private subnets only (no public access).
     * Security group(s) that only allow inbound traffic from the application tier (e.g., EC2 instances or Lambda functions via VPC endpoints, depending on design).
   * Store the database credentials in **AWS Secrets Manager** or **SSM Parameter Store (SecureString)** created in this template, encrypted with KMS, and reference them from application roles (Lambda/EC2) with least privilege.

7. **EC2 application instance, IAM role, and security groups**

   * Launch an **EC2 instance** (separate from the bastion if needed) as an application host:

     * Instance type parameterized and cost-conscious (e.g., t3.micro/t3.small).
     * IAM instance role with a minimal permissions policy:

       * Access to specific S3 buckets, DynamoDB tables, SNS topics, or SSM parameters required by the app.
       * CloudWatch Logs/metrics permissions for publishing logs/metrics.
     * Attach a **security group** that:

       * Allows inbound HTTP (port 80) from appropriate CIDR ranges (e.g., 0.0.0.0/0 for demo or a parameter).
       * Allows inbound SSH (port 22) only from a restricted CIDR (e.g., same `BastionAllowedCidr` or a separate parameter).
       * Denies all other inbound ports.
   * Apply tags on the EC2 instance and related resources for cost allocation (Environment, Project, Owner, CostCenter, etc.).

8. **SNS topic for notifications**

   * Create an **SNS topic** with `${EnvironmentSuffix}` in its name.
   * Enable KMS encryption for the SNS topic using a CMK from this template.
   * Configure appropriate IAM policies to allow Lambda or other services to publish notifications.
   * Optionally allow email subscription endpoints via a parameter.

9. **KMS keys and encryption strategy**

   * Define one or more **KMS CMKs** in this template for:

     * S3 bucket encryption.
     * DynamoDB table encryption (if not using AWS-managed).
     * RDS storage.
     * SNS topic and CloudWatch Logs where applicable.
   * Configure key policies following best practices:

     * Allow the account root and a small set of IAM roles (defined in this template) to use and administer the keys.
     * Keep policies least-privilege and avoid wildcards wherever possible.

10. **Monitoring, logging, and auditing**

    * Enable **CloudWatch metrics and alarms** for key resources, such as:

      * EC2 instance CPU or status check failures.
      * RDS CPU/storage/connection health.
      * DynamoDB throttling rates.
      * Lambda errors and throttles.
    * Create **CloudWatch Log Groups** for:

      * Lambda functions.
      * API Gateway access/execution logs.
      * VPC Flow Logs (if enabled).
      * Any application logs from EC2 (assume CloudWatch agent or similar).
      * Ensure all log groups use KMS encryption and have sensible retention.
    * Deploy **AWS CloudTrail**:

      * Multi-AZ or multi-region best practice configuration where reasonable but at least covering `us-east-1`.
      * Store CloudTrail logs in an encrypted S3 bucket (can be dedicated logging bucket in this template).
      * Optionally configure CloudWatch Logs integration for CloudTrail.
    * Where possible, set up alarms on **unauthorized API calls** or security-relevant events using CloudWatch.

11. **Cost optimization and tagging**

    * Choose cost-effective default instance sizes and capacity settings while still realistic for a small production-like environment.
    * Apply **consistent tags** to all taggable resources:

      * `Environment`, `Project`, `Owner`, `CostCenter`, `Application`, and any others useful for cost allocation and governance.
    * Prefer auto-scaling and managed services defaults that avoid over-provisioning.

12. **IAM and security posture**

    * All IAM roles, instance profiles, and policies must be defined within this template:

      * Lambda execution roles.
      * EC2 instance roles (bastion and application).
      * Any roles used by CloudWatch, CloudTrail, or other services created here.
    * Follow **least-privilege** rigorously:

      * Scope permissions to specific resources created in this stack where possible.
      * Avoid overly broad actions (`*`) unless genuinely required for a managed service integration.
    * Where using AWS managed policies is suitable and realistic, you may attach them, but avoid overbroad combinations.

13. **Region and resiliency**

    * Assume the stack is deployed in `us-east-1`.

      * You may use a `Condition` to assert that `AWS::Region` must be `us-east-1` and fail or adjust resources if not.
    * Use AZ-aware constructs for subnets, RDS Multi-AZ, and (if applicable) Lambda and Auto Scaling groups to enhance availability.

Deliverable:
A single, self-contained **CloudFormation template file named `TapStack.yml`**, written **only in valid YAML**, that:

* Implements all the infrastructure and wiring described above without referencing any pre-existing infrastructure components.
* Defines all required **Parameters**, **Conditions**, **Mappings** (if used), **Resources**, and **Outputs**, including:

  * Outputs for key resource identifiers (VPC ID, subnet IDs, security group IDs, S3 bucket names, DynamoDB table names, RDS endpoint, API Gateway endpoint URL, SNS topic ARN, KMS key ARNs, etc.).
* Uses `EnvironmentSuffix` everywhere necessary to keep deployments isolated and avoid naming collisions.
* Reflects AWS and security best practices regarding encryption, least privilege, network isolation, monitoring, tagging, and cost optimization.
* Is syntactically correct YAML (no JSON blocks) and suitable for deployment as a new stack in `us-east-1` via CloudFormation or a Boto3-based deployment pipeline.
