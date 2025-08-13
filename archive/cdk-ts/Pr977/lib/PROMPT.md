I need to create a secure AWS infrastructure environment using CDK TypeScript. The setup needs to include the following components:

Create S3 buckets with versioning enabled to ensure data durability and recovery from accidental overwrites or deletions. The buckets should have proper security configurations and block public access by default.

Set up IAM roles without wildcard permissions following the principle of least privilege. The roles should have specific permissions for the resources they need to access.

Build a VPC with a NAT gateway configured for private subnets to enable secure internet access for resources within those subnets. The VPC should have proper subnet configurations across multiple availability zones.

Include IAM Access Analyzer to help verify which principals have access to critical resources like S3 buckets and provide security findings through automated policy evaluation.

Use VPC Endpoints for S3 to enable private connectivity between the VPC and S3 service without requiring internet gateways, providing additional security for data access.

The infrastructure should be deployed in the us-east-1 region and follow AWS security best practices. All resources should be properly tagged and configured for a production-ready secure environment.

Please provide the complete infrastructure code with one code block per file that I can copy and deploy directly.