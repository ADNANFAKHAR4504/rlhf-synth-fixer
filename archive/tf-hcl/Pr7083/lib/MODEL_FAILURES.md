```markdown
# Model failures (only "Why it's a failure" statements)

1) Region hard-coded / assumed
-- Why it's a failure: The model made an assumption about the deployment region when the prompt didn't provide one and said not to change provided data. This could violate the instruction to keep provided configuration unchanged and may be improper for environments that require a different region.

2) Lambda environment variables referencing SSM Parameter Store incorrectly
-- Why it's a failure: The model did not use data sources to fetch SSM parameter values, and storing only the path string in the environment does not satisfy the prompt requirement (the environment variable still contains a plaintext path and no secure reference).

3) CloudWatch alarms: incorrect metric for "errors exceeding 1%"
-- Why it's a failure: The `Errors` metric is a count of errors, not an error percentage. A threshold of 1 is a raw count, not 1% of invocations; this does not meet the requirement to alert on error rate percentage.

4) CloudWatch alarm configuration issues (types/values)
-- Why it's a failure: Several alarm attributes were provided as strings when numeric values are expected, and semantics like `statistic = "Average"` for an Errors count are incorrect; these type/semantic mismatches cause validation or runtime issues.

5) API Gateway invoke URL output is invalid
-- Why it's a failure: The configuration referenced a non-existent attribute for the stage invoke URL which will cause Terraform to fail and prevents consumers from getting a valid endpoint URL.

6) Lambda: SSM vs placeholder code and deployment artifact issues
-- Why it's a failure: Using a single inlined placeholder zip for multiple, non-trivial Lambdas and not providing build/packaging instructions makes the configuration non-deployable for real functions.

7) DynamoDB server-side encryption not explicitly set to AWS-managed CMK
-- Why it's a failure: The configuration is ambiguous about which KMS key will be used (AWS-owned vs AWS-managed CMK), and it does not explicitly enforce the AWS-managed CMK required by the prompt.

8) Tagging incomplete / inconsistent
-- Why it's a failure: Partial tagging breaks inventory, cost allocation, and violates the explicit requirement to tag all taggable resources consistently.

9) Usage plan throttle semantics versus "per API key"
-- Why it's a failure: The example only shows a single usage plan/key and doesn't demonstrate per-key throttling customization; it may not meet requirements where different keys need distinct throttle/quota settings.

10) Invalid or non-existent Terraform resource references
-- Why it's a failure: The response used resource names and attributes that may not exist in the provider (for example `aws_sqs_queue_redrive_allow_policy` and `aws_api_gateway_stage.invoke_url`), which will cause Terraform errors and a non-deployable configuration.

11) Minor HCL typing and style issues that break `terraform validate`
-- Why it's a failure: Type mismatches (strings used where numbers are expected) and other HCL issues will cause `terraform validate` and `terraform plan` to fail.

12) Incomplete separation of artifacts and build instructions (modularity/deployability)
-- Why it's a failure: Lack of module/file separation and missing build scripts/artifacts for Lambdas make the deliverable non-reproducible and non-deployable.
