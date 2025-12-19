Develop an AWS CDK application in TypeScript that provisions a secure, production-ready infrastructure in a single stack file. The solution should follow AWS best practices and meet the requirements below:

Requirements

1. Deployment & Networking
   • All resources must be deployed in the us-west-2 region.
   • Use a custom VPC configuration with both public and private subnets (avoid the default VPC).

2. IAM & Security
   • Define IAM roles and policies strictly following the principle of least privilege.
   • Configure security groups to allow inbound traffic only from trusted IP ranges.
   • Ensure all EC2 instances use IMDSv2 exclusively.
   • Deploy Lambda functions that run without requiring public internet access (use private subnets in the VPC).

3. Storage & Databases
   • Create S3 buckets with AES-256 server-side encryption enabled.
   • Deploy RDS instances with Multi-AZ enabled for high availability.
   • Encrypt all RDS data at rest with AWS KMS.

4. Monitoring & Compliance
   • Enable AWS CloudTrail logging to audit all API requests across services.
   • Configure CloudWatch Alarms to monitor CPU utilization for all EC2 instances.

5. Tagging
   • Apply the tags Environment and Owner to every resource for cost tracking and auditing.

6. Project Structure
   • The entire infrastructure should be implemented in a single stack file (for example, secure-infra-stack.ts).

Expected Output: A single TypeScript CDK stack file that provisions the complete infrastructure, deployable with cdk deploy.
