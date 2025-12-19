Generate a production-ready AWS CDKTF TypeScript project that provisions a serverless e-commerce backend in us-east-1. 
Output ONLY TWO files: lib/tap-stack.ts and lib/modules.ts.

CONTEXT
- Target region: us-east-1 (single AWS account).
- Serverless architecture for an e-commerce application: API Gateway + Lambda + DynamoDB + CloudWatch + SSM Parameter Store.
- All environment variables must be stored/read from AWS Systems Manager Parameter Store (SSM). Do not use Secrets Manager.
- Lambda inline code only: include the TypeScript handler source as inline asset strings in the two files (no separate files or zip uploads).
- Use CDKTF TypeScript idioms and provider @cdktf/provider-aws.

REQUIREMENTS
1. Lambda:
   - Use AWS Lambda functions implemented in TypeScript (inline source).
   - Each Lambda has a CloudWatch Log Group and appropriate retention.
   - Attach an IAM role per Lambda with least-privilege policies (only permissions needed for its operations).
2. API Gateway:
   - Create a REST API (API Gateway v1) exposing endpoints for typical e-commerce operations (example endpoints: /products, /orders).
   - Enable CORS for the API.
   - Integrate API Gateway routes with corresponding Lambdas.
3. DynamoDB:
   - Create required DynamoDB tables (e.g., Products, Orders) using on-demand (PAY_PER_REQUEST) capacity.
   - Define primary keys and at least one GSI if needed (document choices in code comments).
4. Parameter Store:
   - Store environment variables (e.g., DB table names, stage) in SSM Parameter Store.
   - Lambdas must read required variables from SSM (show code snippets or environment wiring).
5. Tagging & Region:
   - Tag all resources with: project, environment (default production), owner.
   - Deploy everything to us-east-1.
6. Security & Best Practices:
   - Do not give Lambdas excessive IAM permissions. Grant only DynamoDB GetItem, PutItem, Query, UpdateItem for the appropriate table ARNs.
   - Ensure API Gateway does not allow open/unrestricted admin actions.
   - Enable CloudWatch logging and set retention periods (parameterizable).
   - Validate required input variables at stack instantiation (fail early with clear messages, e.g., missing projectName).
7. Outputs:
   - Export Terraform outputs for: API endpoint URL, Lambda ARNs, DynamoDB table names, SSM parameter names, CloudWatch log group names.
8. Parameterization:
   - Expose variables with sensible defaults: projectName, environment (default production), region (default us-east-1), logRetentionDays (default 30), lambdaMemoryMb (default 512), lambdaTimeoutSec (default 10).
9. Constraints:
   - ONLY two files under lib/ are allowed. All code, inline Lambda sources, constructs, variables, and outputs must live within them.
   - Do NOT create any secrets or Secrets Manager resources.
   - cdktf synth, cdktf diff, and cdktf deploy must succeed assuming a correct external CDKTF scaffold exists.
   - Keep code idiomatic, modular, and well-commented explaining design choices.
