We need to set up a serverless web application on AWS using Terraform.

The solution should be defined in one Terraform file (main.tf), with no external modules. It must meet the following requirements:

Backend: Implement backend logic with AWS Lambda.

API: Expose the Lambda using Amazon API Gateway so it’s publicly accessible.

Frontend: Host static assets for the web application in an S3 bucket with website hosting enabled.

Region: All resources must be deployed in us-east-1.

Best practices:

Use random suffixes to resource names to prevent naming conflicts.

Apply least-privilege IAM roles and policies.

Ensure secure defaults (block public S3 bucket ACLs, only expose necessary endpoints).

Add tags for tracking (e.g., Environment = "Production").

Outputs: Provide useful outputs for CI/CD or testing, such as the API Gateway URL and the S3 static site URL.