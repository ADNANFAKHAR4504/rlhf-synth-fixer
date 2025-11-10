Consolidate three Lambda functions into one optimized Lambda and apply a set of cost, reliability, and monitoring improvements so the infrastructure maintains performance

Required deliverables (single-file TypeScript CDK app)
• A single cdk TypeScript file (one file only) that declares all resources below and is runnable with CDK v2.
• Inline comments that explain design decisions and where to edit values (memory sizing, concurrency, table names).
• Outputs that include the HTTP API endpoint and main CloudFormation stack name.
• A final comment block describing deployment/validation steps (how to test, where to check CloudWatch Insights, and how rollback is triggered).

Functional requirements (implement these exactly)

    1.	Single consolidated Lambda

    •	Replace three separate Lambdas with one function that exposes the same handler endpoints internally (preserve backward-compatible API paths).
    •	Use ARM-based Graviton2 (Architecture.ARM_64) for cost efficiency.
    •	Package shared libs into a Lambda Layer and attach it to the function.
    •	Set the function runtime and handler clearly (TypeScript/Node.js).
    •	Add environment variables and IAM role with least privilege for DynamoDB, S3, CloudWatch, and API Gateway.

    2.	Right-size memory automatically

    •	Configure the function memory setting based on a parameter that the deployer can set to the 95th percentile memory usage reported by CloudWatch Insights (document how to obtain this metric). Provide a safe default that is reasonable for a 10M txn/day workload.
    •	Include commented code showing where to plug the computed 95th percentile value.

    3.	DynamoDB — on-demand & partitioning

    •	Create or migrate DynamoDB tables to PAY_PER_REQUEST (on-demand) billing where applicable.
    •	Choose a partition key design described in comments that avoids hot partitions for transaction workloads (include suggestions: composite key, hashed prefix, time-based suffix).
    •	Ensure read/write capacity characteristics are preserved (i.e., switch to on-demand while documenting expected throttles and how to verify parity).

    4.	Single HTTP API

    •	Replace multiple REST APIs with a single API Gateway HTTP API using the $default stage and explicit routes to preserve compatibility with existing clients.
    •	Provide base-path mappings or stages as needed to serve legacy clients during migration.
    •	Secure the API with IAM roles or JWT authorizers as appropriate (document how to enable existing auth without breaking clients).

    5.	Reserved concurrency & cold-start smoothing

    •	Configure reserved concurrent executions for the Lambda to limit cold-start spikes, with values computed from expected peak concurrency and budget constraints.
    •	Add comments showing how to compute reserved concurrency from CloudWatch concurrency metrics.

    6.	CloudWatch log retention

    •	Set log groups for Lambda, API Gateway, and DynamoDB to 7 days retention to reduce storage costs.

    7.	S3 lifecycle for transaction archives

    •	Add an S3 bucket for transaction archives and a lifecycle rule to move objects to Glacier after 90 days and expire after a reasonable retention period (document the retention).
    •	Ensure bucket encryption and access logging are enabled.

    8.	Lambda Layers

    •	Create a Lambda Layer for shared dependencies and attach to function(s). Show how to update the layer without redeploying business logic.

    9.	DynamoDB PITR

    •	Enable Point-In-Time Recovery (PITR) only for tables flagged or tagged as environment: production. For non-production tables, PITR must be off.

    10.	Cost allocation tags

    •	Tag every resource with cost allocation tags: Project, Service, Environment, Team, and any other necessary tags. Make tags configurable via stack parameters.

    11.	CloudWatch alarms + dashboards

    •	Add CloudWatch alarms for:
    •	Lambda throttles (alarm when throttles > threshold in 5-minute window).
    •	DynamoDB consumed capacity / throttling.
    •	Alarm actions should notify a placeholder SNS topic (create the topic). Include instructions in comments to subscribe real recipients.
    •	Create a minimal CloudWatch dashboard (or output instructions) to validate performance and cost metrics.

    12.	Automated rollback

    •	Implement an automated rollback mechanism: use AWS Lambda + CloudWatch alarms + CloudFormation/CodeDeploy deployment preferences or CloudFormation hooks such that if errors or latency increase beyond 10% of baseline post-deploy, traffic is shifted back and stack changes are rolled back. Document the exact mechanism and how to trigger/observe rollback.
    •	Provide an easy-to-run test plan and thresholds that count as a failure.

    13.	Security & Best practices

    •	Use IAM roles (no access keys).
    •	Ensure encryption at rest for S3 and DynamoDB.
    •	Ensure least-privilege IAM policies.
    •	Ensure environment variables avoid storing secrets (document using Secrets Manager if needed).

    14.	Outputs & documentation

    •	CDK outputs: HTTP API endpoint, S3 bucket name, DynamoDB table names, CloudWatch dashboard URL (if created), and SNS topic ARN.
    •	Include a short README-style comment at the top/bottom explaining how to deploy safely and validate the 40% cost reduction target (what to measure, where to look in Billing console, and a quick sanity check).

Constraints (must be enforced)

    •	Lambda memory must be right-sized from CloudWatch Insights 95th percentile memory usage (document how to obtain the metric and where to plug it into the template).
    •	DynamoDB tables must maintain same logical read/write capability but switch to on-demand where applicable.
    •	API Gateway must remain backward-compatible during migration; preserve existing endpoints and routing patterns.
    •	Total monthly AWS costs after optimization must be projected to ≤ $3,000 (include a short comment describing how the template contributes to this — e.g., Arm Graviton2 savings, on-demand DynamoDB reductions, consolidated Lambda, log retention, S3 Glacier lifecycle).
    •	All Lambda functions must use ARM-based Graviton2 (arm_64).
    •	Deployment must include automated rollback if performance degrades >10%.
