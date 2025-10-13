# Failures

- **S3 public-access block used incorrectly**  
  The `aws.s3.Bucket` calls include `block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets` as bucket args. These belong in a `BucketPublicAccessBlock` resource (or the provider-specific API), not as direct `Bucket` constructor args — this will be ignored or error in Pulumi.

- **API Gateway → Lambda integration URI is incorrect / fragile**  
  The integration uses `uri=lambda_function.invoke_arn`. For REST API Lambda proxy integrations you must use the service integration ARN pattern (or ensure the exact format Pulumi expects). Relying on `invoke_arn` directly is likely invalid or brittle.

- **Lambda permission `source_arn` uses `method.execution_arn` (invalid)**  
  The code supplies `source_arn=method.execution_arn`; `Method` resources do not reliably provide `execution_arn` for use this way — the correct source ARN should be constructed from the execute-api ARN pattern including account, restApi id, stage and method, or derived from the deployment/stage resource.

- **API resource policy / RestApiPolicy resource usage is dubious**  
  The code creates a separate `aws.apigateway.RestApiPolicy` resource and/or sets `rest_api.policy` inconsistently. Pulumi/AWS typically accepts a `policy` JSON directly on the RestApi or expects a specific resource — this inconsistent approach will likely fail or be a no-op.

- **Step Function state `Resource` invalid for Lambda invocation**  
  Step Function definition sets the `Task` state's `Resource` to the Lambda function ARN directly. Proper service integration for Step Functions calling Lambda generally uses the Lambda service integration pattern (e.g., `arn:aws:states:::lambda:invoke`) with proper `Parameters`. Using the raw Lambda ARN here is incorrect and will make the state machine invalid.

- **AWS Config rule identifier / input parameters unverified**  
  The code uses `source_identifier="IAM_ROLE_MANAGED_POLICY_CHECK"` and passes `input_parameters` as a string of policy ARNs. It's unclear that this is a valid managed rule identifier / parameter format — the implementation lacks validation and may not produce the intended compliance check.

- **IAM least-privilege claim not demonstrated**  
  The role attaches managed policies like `AWSLambdaBasicExecutionRole` and the custom Dynamo policy allows broad read operations (including `Scan`) and indexes. The response does not show tightened, minimal resource ARNs (e.g., specific DynamoDB index ARNs or prefix-restricted S3 access) so the "least privilege" requirement is not convincingly met.

- **No explicit CloudWatch LogGroup/retention or full logging setup shown for Lambda**  
  The design relies on the basic execution role but does not create or configure explicit LogGroups/retention for Lambda (or for API Gateway execution logs) before creating alarms — missing concrete log configuration.

- **Alarm export/usage may reference wrong values**  
  The `create_cloudwatch_alarm` accepts a Lambda _name_, but in orchestration the function resource object is passed inconsistently; there are multiple places where the code assumes string properties exist when the module returns resources (possible type/shape mismatches that break deployment).

- **API endpoint export/value mismatch**  
  `__main__.py` attempts to export `api_gateway.api_endpoint`, but the `create_api_gateway` implementation returns the RestApi resource only (no `api_endpoint` attribute). The exported property will not exist as written.

- **WAF association resource ARN construction is brittle**  
  `WebAclAssociation` uses a manually built resource ARN `arn:aws:apigateway:us-west-2::/restapis/{id}/stages/v1`. This stringly-constructed ARN is brittle and may be incorrect for the actual deployed stage name/format—risking failed association.

- **S3 / DynamoDB encryption semantics unclear**  
  DynamoDB `server_side_encryption` is enabled but no explicit KMS key is specified; the response claims "AWS-managed keys" without explicitly showing use of the AWS-managed CMK (ambiguous). S3 uses AES256 (S3-managed) while prompt requested AWS-managed keys for some resources — inconsistent.

- **Packaging and Lambda assets assumption ambiguous**  
  `pulumi.AssetArchive` points at `./lambda_code` but there is no CI/build guidance to produce deterministic artifacts (e.g., for native dependencies or reproducible builds).

- **Multiple places rely on hardcoded example IP ranges / placeholders**  
  IP restrictions use example CIDRs (`192.0.2.0/24`, `198.51.100.0/24`) instead of accepting configurable, validated IP lists — not production-ready.

- **Claims of meeting all specs are overstated**  
  Several promised features (proper API <-> Lambda integration URIs, validated AWS Config rule, Step Functions service integration, strict least-privilege proof, explicit log groups/retention, and deterministic packaging) are either incorrect, incomplete, or unvalidated in the provided code.
