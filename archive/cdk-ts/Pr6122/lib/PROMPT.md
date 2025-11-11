You are an expert AWS CDK (TypeScript) engineer. Generate a production‑ready CDK TypeScript application (CDK v2) that produces deployable CloudFormation stacks and satisfies the exact requirements below. Do NOT change, remove, or reinterpret any of the provided data — keep every requirement, constraint, environment detail, and naming rule intact. Where resource names require uniqueness or a suffix, append a configurable String suffix to the resource name and document where to change that suffix. Use the naming convention [environment]-[region]-[service][Suffix] for resources that need a suffix.

Summary of required outputs
- A CDK TypeScript application with:
  - Separate stacks for primary and DR regions for the multi‑region disaster recovery solution (any region primary, any region DR), with shared reusable constructs for common resources.
  - A stack or stacks implementing the single‑region application described in the second problem (target region any region).
- A deployment/validation script that exercises cross‑region connectivity and replication checks before completing deployment.
- Clear README/comments explaining how to configure the suffix, regions, and deploy per stack.
- Unit/smoke test examples (jest or simple Node/Python scripts) to verify synthesized templates and basic runtime behavior (e.g., Lambda invocation, replication status).

Problem A — Multi‑region disaster recovery (TRADING PLATFORM) — implement exactly:
1. Set up DynamoDB global tables with on‑demand billing and point‑in‑time recovery enabled.  
2. Deploy identical Lambda functions in both us‑east‑1 and us‑west‑2 for order processing.  
3. Configure S3 buckets with cross‑region replication rules and lifecycle policies.  
4. Implement Route53 hosted zone with weighted routing policies and health checks.  
5. Create SNS topics in both regions with cross‑region subscriptions for alerts.  
6. Deploy Step Functions state machines to orchestrate DR testing procedures.  
7. Configure CloudWatch dashboards that aggregate metrics from both regions.  
8. Set up Systems Manager Parameter Store with secure string parameters replicated across regions.  
9. Implement dead letter queues for failed Lambda invocations.  
10. Create CloudWatch alarms for monitoring replication lag and failover events.

Expected output for Problem A: A TypeScript CDK application with separate stacks for primary and DR regions, shared constructs for common resources, and a deployment script that validates cross‑region connectivity and replication status before completing.

Problem B — Single‑region CDK application (us‑east‑1) — implement exactly:
1. An AWS Lambda function written in Node.js 14.x runtime managed by an API Gateway with IAM authentication.  
2. An Amazon RDS instance running PostgreSQL with the db.m4.large instance type.  
3. Amazon S3 buckets with versioning enabled for static files.  
4. A Virtual Private Cloud (VPC) with two public and two private subnets.  
5. High availability for the Lambda function across multiple availability zones in the us‑east‑1 region.  
6. Amazon CloudFront distribution for global content delivery.  
7. Utilization of Amazon Route 53 for DNS management.  
8. Least privilege IAM roles must be applied to provision and configure the infrastructure securely.  
9. An Amazon SQS queue for asynchronous task processing.  
10. Comprehensive logging and monitoring with AWS CloudWatch.  
11. Management of database credentials through AWS Secrets Manager.

Expected output for Problem B: A TypeScript program that passes CDK synth validations and deploys successfully with high availability and security best practices adhered to the listed requirements.

Global constraints (must be followed verbatim)
- Use TypeScript to manage AWS CloudFormation stacks.  
- Ensure the configuration targets the AWS us‑east‑1 region for Problem B and us‑east‑1 (primary) + us‑west‑2 (DR) for Problem A.  
- Utilize AWS Lambda with Node.js runtime version 14.x where specified.  
- Implement Amazon RDS for PostgreSQL with at least db.m4.large as instance class.  
- Use Amazon S3 for static file storage with versioning enabled.  
- Implement VPCs with two public and two private subnets (per VPC/stack as required).  
- Ensure high availability for Lambda across two availability zones (as required).  
- Secure API Gateway with AWS IAM authentication (where specified).  
- Establish an Amazon CloudFront distribution for content delivery (where specified).  
- Integrate Amazon Route 53 for DNS management and health checks.  
- Ensure infrastructure is provisioned using least privilege IAM roles.  
- Deploy an Amazon SQS standard queue for asynchronous processing (where specified).  
- Implement AWS CloudWatch for logging and monitoring of all services and create alarms as listed.  
- Utilize Secrets Manager for storing database credentials securely.  
- DynamoDB global tables must use on‑demand billing and have point‑in‑time recovery enabled.  
- S3 buckets must be configured with cross‑region replication and lifecycle policies (as specified).  
- SNS topics must have cross‑region subscriptions for alerts.  
- Step Functions must orchestrate DR testing procedures.  
- Systems Manager Parameter Store secure string parameters must be replicated across regions.  
- Dead letter queues (SQS) must be provided for failed Lambda invocations.  
- CloudWatch dashboards must aggregate metrics from both regions (use CloudWatch cross‑region dashboards or an aggregator pattern).  
- The application Lambda runtime for Problem B must be Node.js 14.x.  
- RDS for Problem B must be PostgreSQL and use db.m4.large.  
- All resource names that require uniqueness must append a configurable String suffix — document default value and how to change it.  
- Keep secrets out of source code; reference Secrets Manager / Parameter Store for sensitive values.  
- CDK code must be compatible with CDK v2 and synthesize cleanly.

Deliverables and operational expectations
- Provide a single human‑readable prompt (the content above) and, when used by a code generation model, produce:
  - A CDK TypeScript repository structure or single app with clearly separated stacks: primary-region stack, dr-region stack, and shared constructs module.  
  - A top‑level configuration area (context/params) where the list of regions, account, environment names, and the String nameSuffix are defined; defaults must match the provided values.  
  - A deployment/validation script (Node.js or shell) that: deploys stacks in correct order, runs replication/connectivity checks (DynamoDB global table replication status, S3 replication status, Parameter Store replication, SNS subscription health), and fails the deployment if critical replication/health checks do not pass.  
  - CloudFormation outputs for critical ARNs and endpoints: API Gateway endpoint, CloudFront domain, RDS endpoint, DynamoDB table ARNs, S3 bucket names, SNS topic ARNs, Step Function ARNs, and parameter names.  
  - Inline code comments and a README detailing how to set the suffix, run synth/deploy, run validation tests, and tear down.  
  - Example unit tests (jest) asserting synthesized templates include key properties (e.g., DynamoDB global table replication regions, S3 replication configuration, Lambda DLQ configuration, RDS engine/class).  
  - A small post‑deployment smoke test script that checks: Lambda invocation (upload to S3 if relevant), DynamoDB replication status, S3 replication object presence, and Route53 weighted failover behavior/health checks.

Important operational notes to include in generated code/README
- Explain any cross‑region limitations (e.g., KMS keys are regional; ensure KMS configuration for replicated/encrypted resources).  
- Document IAM cross‑account or cross‑region considerations for SNS and Parameter Store replication.  
- Provide guidance on eventual consistency windows for replication and how the validation script accounts for that (polling/exponential backoff).  
- Clearly state where to change the String suffix and region list and how that affects resource names.

Testing & validation requirements
- Include jest or similar unit tests for CDK synth assertions.  
- Provide an integration/smoke test script (Node or Python) that can be run after deployment to validate cross‑region replication and connectivity (examples: write item to DynamoDB and verify in DR region, upload object to S3 and verify replication, publish to SNS and verify cross‑region receipt).  
- The deployment/validation script must implement retries with exponential backoff for replication checks and fail if replication does not reach steady state within a sensible timeout (document the timeout and how to change it).

Final enforcement (MUST be obeyed)
- Do NOT modify or omit any of the requirements, constraints, or environment values supplied above.  
- Ensure a configurable String suffix is appended to resource names where needed and document how to change it.  
- Produce CDK TypeScript code only (no Terraform, Pulumi, or other IaC formats).  
- The produced CDK program must synthesize cleanly (cdk synth) and be deployable (cdk deploy) assuming valid AWS credentials and permissions.

Now produce the CDK TypeScript application, stacks, constructs, deployment/validation script, and test examples described above.