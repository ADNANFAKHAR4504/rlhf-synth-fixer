# model_failure

# Likely failure modes

* Explicit physical names specified for S3 buckets, DynamoDB tables, or Lambda functions cause early-validation “resource already exists” failures
* Use of deprecated Lambda runtimes triggers linter errors or deploy-time rejections
* API Gateway resource policies referencing the RestApi ARN directly cause circular dependencies and changeset failures
* Missing or non-attachable IAM managed policies for Application Auto Scaling roles result in NotFound errors
* Security Group rules omit required fields for ICMP, producing linter errors
* Parameters left without defaults block non-interactive pipeline deployments

# Mitigations applied

* Omitted explicit physical names so CloudFormation can generate unique, collision-free names
* Upgraded runtime to Python 3.13 and adjusted template to satisfy current lint rules
* Used a wildcard execute-api ARN in the resource policy to prevent circular references while still enforcing CIDR restrictions
* Leveraged the AWS service-linked role for DynamoDB Application Auto Scaling, removing reliance on external managed policy ARNs
* Added FromPort and ToPort with icmp to satisfy schema requirements
* Provided defaults for every parameter required by the template

# Additional hardening practices

* Restrict IAM statements to specific ARNs for the created resources and avoid wildcard actions except where AWS requires them
* Use parameterized CORS origins and IP CIDRs to prevent accidental open access
* Maintain conservative cache TTL and sensible DynamoDB autoscaling targets to balance cost and performance
* Keep log retention finite and lifecycle rules enabled to control storage costs

# Validation checklist before deploy

* cfn-lint runs clean with no blocking errors
* Changeset creation passes early validation
* All outputs render correctly for invoke URL, API key id, and ARNs
* A sample request to the REST endpoint returns a successful response
* CloudWatch alarms enter OK state after initial metrics publishing

# Post-deploy verifications

* Confirm Secrets Manager access by the Lambda function through a test invocation
* Verify API key requirement and IP allowlist behavior by testing both allowed and disallowed source IPs
* Inspect S3 bucket policies for TLS enforcement and public access block
* Observe autoscaling policies attached to the DynamoDB table and validate metric targets are active
