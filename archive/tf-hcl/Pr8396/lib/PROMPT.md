We need a Terraform configuration in a single file (`main.tf`) that deploys a fully serverless application on AWS.  
The stack should include:
1. An AWS Lambda function (Python runtime) that can read/write to a DynamoDB table.  
2. A DynamoDB table configured with on-demand capacity mode.  
3. An API Gateway that exposes the Lambda via a public HTTP endpoint.  
4. Proper CORS settings on the API Gateway (allow requests from any origin).  
5. CloudWatch logging enabled for the Lambda.  
6. Explicit IAM roles and permissions for both Lambda and API Gateway.  
7. The configuration should be region-independent and work in any AWS region.  

Everything must be inside a single `main.tf` file (no modules or provider blocks here—assume provider.tf exists).  
Please generate the full Terraform HCL for this setup.