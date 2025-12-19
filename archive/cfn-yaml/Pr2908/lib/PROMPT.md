Create **one** CloudFormation template named **TapStack.yml** (YAML, not JSON) that provisions a brand-new, secure web-app environment in **us-east-1**. Return **only** the YAML file content (no explanations, no markdown fences).

What I need in the template (must-haves):

1. Global requirements

* Use Parameters, Mappings (if needed), Conditions, Resources, and Outputs.
* Include sensible **default values** so I can deploy as-is in us-east-1.
* Enforce this naming convention everywhere names are required: `[Service]-[ResourceName]-[Environment]`. Use `Fn::Sub` so tags/names stay consistent.
* Tag **every taggable resource** with:

  * `Owner` (from parameter)
  * `Environment` (from parameter)
* Principle of least privilege across IAM. No wildcards except where AWS requires them (e.g., CloudWatch Logs actions).
* No references to pre-existing resources—this stack must create everything it needs.
* Passes `cfn-lint` and `aws cloudformation validate-template` for **us-east-1**.

2. Networking (VPC & Subnets)

* A VPC named `ProdVPC` with CIDR parameter (default `10.0.0.0/16`).
* **Three public** and **three private** subnets across **us-east-1a, us-east-1b, us-east-1c**. Expose these AZs via parameters with defaults set to those letters.
* 1 Internet Gateway + public route table with default route to IGW.
* **Three** NAT Gateways (one per AZ) + **three** private route tables with 0.0.0.0/0 via the AZ’s NAT.
* Security groups:

  * `ALBSG`: allow inbound 80 from 0.0.0.0/0 (HTTP), all egress.
  * `AppSG`: allow inbound 80 from `ALBSG` only, all egress.

3. Load balancing (to attach WAF)

* An **Application Load Balancer** in the **public subnets**, attached to `ALBSG`.
* A Target Group (HTTP on port 80). No targets are required; create the TG so the ALB is valid.
* An HTTP listener (port 80) forwarding to the TG. (Keep it HTTP to avoid ACM complexity.)

4. AWS WAF v2 (Regional) + association

* A **WebACL** (scope `REGIONAL`) with:

  * Default action `ALLOW`.
  * At least these AWS managed rule groups:

    * `AWSManagedRulesCommonRuleSet`
    * `AWSManagedRulesKnownBadInputsRuleSet`
    * `AWSManagedRulesAmazonIpReputationList`
  * Reasonable priorities and visibility config.
* A **WebACLAssociation** binding the WebACL to the **ALB ARN**.

5. WAF logging to **KMS-encrypted S3**

* An S3 bucket dedicated to WAF logs with:

  * **SSE-KMS** using a **customer-managed KMS key** in this stack.
  * Bucket policy that:

    * Enforces TLS (`aws:SecureTransport`).
    * **Restricts read access** (`s3:GetObject`, `s3:ListBucket`) to exactly **one role created in this stack** (see “LogsReadRole”).
  * S3 Block Public Access enabled.
* A **KMS Key** + **Alias** dedicated to this logging bucket with a key policy that:

  * Lets the account root administer the key.
  * Allows S3 to use the key for SSE-KMS on this bucket only (use encryption context condition for the bucket ARN).
  * Allows the **Lambda** and **LogsReadRole** to `kms:Decrypt` on the log objects.
* A **WAFv2 LoggingConfiguration** that sends WebACL logs **directly to the S3 bucket** (supported). Do not add Firehose unless absolutely necessary.

6. Threat monitoring Lambda + SNS alerts

* An **SNS Topic** with **SSE-KMS** using the same KMS key (or a separate one if required by best practices—feel free to create a second key if you prefer).
* Optional: an email subscription parameter (if provided, create `AWS::SNS::Subscription` with protocol `email`).
* A **Lambda function** (Python 3.12) with inline `ZipFile` that:

  * Is **triggered by S3 ObjectCreated** events from the WAF logs bucket.
  * Reads each new object (newline-delimited JSON).
  * Looks for obvious threat signals (e.g., `action:"BLOCK"`, label names containing known bad bots, SQLi/XSS rule matches).
  * If matches found, publishes a concise alert to SNS with counts, top offending IPs, and rule names.
* Place Lambda **inside the VPC** (private subnets) with a dedicated security group (egress only).
* IAM for Lambda (least privilege):

  * Read the WAF logs bucket/prefix only.
  * `kms:Decrypt` on the logs key and topic key (if using a separate key).
  * `sns:Publish` to the topic.
  * CloudWatch Logs permissions for function logging.
* Add `AWS::Lambda::Permission` to allow the bucket to invoke the function.
* Configure the bucket’s `NotificationConfiguration` for the Lambda trigger.

7. IAM role restricting log access

* Create a dedicated `LogsReadRole` intended for analysts (assumable within the account; basic trust policy to `root` of the account is fine).
* Attach a policy granting **read-only** access to the WAF logs bucket/prefix and `kms:Decrypt` on the logs key.
* The **bucket policy** must explicitly allow **only** this role to read objects and list the bucket (besides any statements WAF may add for writes).

8. Parameters (with sane defaults)

* `Environment` (default `prod`), `Owner` (default `PlatformTeam`).
* VPC CIDR and six subnet CIDRs (three public, three private).
* AZ letters (`AzA`, `AzB`, `AzC`) defaulting to `us-east-1a/b/c`.
* Optional `AlertEmail` for SNS subscription (can be empty).
* Any additional booleans/strings you need to keep things clean and configurable.

9. Outputs (non-empty, helpful)

* `VPCId`, `PublicSubnetIds`, `PrivateSubnetIds`.
* `LoadBalancerArn`, `LoadBalancerDNSName`, `TargetGroupArn`.
* `WebACLArn`.
* `WafLogsBucketName`, `WafLogsBucketArn`.
* `LogsKmsKeyArn`.
* `SnsTopicArn`.
* `ThreatLambdaArn`.
* Anything else that’s useful for downstream stacks.

10. Quality & linting rules

* Use correct resource types that exist in `us-east-1` (e.g., `AWS::Logs::LogGroup`, not `AWS::CloudWatch::LogGroup`).
* Use `SecurityGroupIds` (not `VpcSecurityGroupIds`) where appropriate.
* Avoid circular dependencies on the S3 → Lambda notification (create `LambdaPermission` and ensure proper `DependsOn` where needed).
* No public S3 access; enforce TLS on the bucket policy.
* Avoid broad IAM—scope to resource ARNs and prefixes.
* Keep the template readable and logically ordered.

Return format & style (very important):

* Output **only the YAML** for **TapStack.yml**.
* No comments, no extra prose, no code fences.
* Ensure it validates with CloudFormation and follows best practices above.

If anything is ambiguous, choose the secure option by default (e.g., three NAT Gateways for HA, deny-by-default IAM, TLS-enforced S3 policy).