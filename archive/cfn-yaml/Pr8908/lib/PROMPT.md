Design a secure AWS cloud environment using CloudFormation where API Gateway connects to Lambda functions, S3 stores application data with encryption, and WAF protects the API endpoints.

Requirements:

1. API Gateway logs all access to CloudWatch Logs with retention settings and connects through VPC endpoints for secure communication.

2. S3 Buckets have AES-256 encryption enabled, block public access, and connect to VPC endpoints for private access from application resources.

3. IAM Roles follow least privilege, granting Lambda functions specific permissions to read from S3 and write logs to CloudWatch.

4. AWS WAF attaches to API Gateway to block SQL injection and XSS attacks before requests reach backend services.

5. All resources deploy in us-east-1 region.

6. VPC contains all networking components where private subnets host Lambda functions that access S3 through VPC endpoints, and security groups control traffic between API Gateway and Lambda.

7. Template passes cfn-lint validation and deploys in a fresh AWS account.

Output format:

Provide a single YAML CloudFormation template with Parameters, Resources, and Outputs sections that includes comments describing how each service connects to others.
