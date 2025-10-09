ROLE: You are a senior Terraform engineer.

TOOLING: Generate Terraform (HCL) for AWS.

CONTEXT:
We need a serverless API for user registrations and profiles (≈5,000 DAUs). Priorities: secure, cost-efficient, rapid to deploy, with basic usage metrics.

REQUIREMENTS (BUILD EXACTLY THIS):

API: API Gateway REST API with resources and methods for basic CRUD on /users (e.g., POST /users, GET /users/{id}, PUT /users/{id}, DELETE /users/{id}), integrated with Lambda proxy.

Compute: AWS Lambda functions (runtime python3.9) for CRUD handlers; deploy with minimal env vars and sensible timeouts/memory.

Data: DynamoDB table users (on-demand / PAY_PER_REQUEST) with pk = user_id (string).

Config: Use SSM Parameter Store for app secrets/config (e.g., /<env>/api/APP_NAME), read-only from Lambdas.

IAM: Least-privilege roles/policies so:

API Gateway can invoke Lambdas.

Lambdas can GetParameter(s) (SSM) and CRUD on the DynamoDB table only.

CloudWatch logging for API/Lambda enabled.

Observability: CloudWatch logs for API Gateway & Lambda; a couple of basic CloudWatch metrics/alarms (e.g., 5XX rate on API, Lambda errors).

Region & Tags: Default region us-east-1; apply a common tags map to all resources.

Outputs: API invoke URL / execution ARN, DynamoDB table name, function names.

ASSUMPTIONS & DEFAULTS:

Use a single stage (e.g., dev) with stage-level access logs.

Keep costs low: no authorizers/WAF for now; focus on least-privilege IAM and private data in DynamoDB/SSM.

Use Lambda proxy integration and return proper JSON responses.

CODE ORGANIZATION (MANDATORY):

Provide exactly three files:

providers.tf – AWS provider (region via variable), required versions; backend (if shown) must have placeholder values only.

variables.tf – variables for region, tags (map), table name, stage name, and SSM parameter paths; sensible defaults.

main.tf – all resources in a single file: API Gateway (rest api, resources, methods, integrations, deployment, stage), Lambdas (CRUD), IAM roles/policies/attachments, DynamoDB table, SSM parameter data sources (or example parameters), CloudWatch logs & basic alarms, outputs.

Add inline comments that explain key resources and permissions.

OUTPUT FORMAT (IMPORTANT):
Return three fenced code blocks, each starting with a filename comment, e.g.:

# providers.tf
...

# variables.tf
...

# main.tf
...


VALIDATION NOTES:

Methods correctly wired to Lambdas via AWS_PROXY integration.

Lambdas limited to only required DynamoDB and SSM actions on the specific resources.

CloudWatch logging enabled for API stage and Lambda.

terraform fmt-ready.

Please generate the complete Terraform now following the above.