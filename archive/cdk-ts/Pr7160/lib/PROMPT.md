You are an expert in AWS Cloud Development Kit (CDK) with TypeScript. Your task is to generate a TypeScript file that defines a complete AWS CDK stack, meeting the following multi-environment and multi-region requirements and constraints. **All provided configuration data must remain unchanged.** Where resource names require a suffix, ensure a String suffix is appended. Use the naming convention `[environment]-[region]-[service][Suffix]`.

**Problem Statement:**  
Create an AWS multi-environment infrastructure using the CloudFormation API with TypeScript. The infrastructure must adhere to the following requirements:

1. Deploy separate VPCs in each specified AWS region, ensuring CIDR blocks do not overlap.
2. Deploy AWS Lambda functions that are triggered by S3 events, operational in all environments.
3. Set up PostgreSQL RDS instances equipped with encrypted storage in each region.
4. Configure Security Groups to admit inbound traffic only on port 443, specifically for load balancers.
5. Implement DNS management and failover capabilities using Route 53.
6. Establish AWS IAM Roles to facilitate cross-account access between environments.
7. Employ Terraform input variables (simulated as custom parameters) to control EC2 instance counts per region, defaulting to 3.
8. Configure environment-specific CloudWatch Alarms to monitor EC2 CPU utilization.
9. Ensure all S3 buckets are versioned and accessible only through HTTPS.
10. Define a CloudFront distribution to manage request routing smoothly across AWS regions.
11. Use AWS Secrets Manager for database credential management.
12. Implement cross-environment SNS topics to handle application error notifications.
13. Monitor compliance with AWS Config rules for tagging and encryption standards.
14. Set Elastic Load Balancer auto-scaling policies based on real-time traffic demands.
15. Utilize AWS Auto Scaling Groups to ensure a minimum of two instances are running consistently per environment.

**Environment:**  
You will be implementing a multi-environment AWS infrastructure using CloudFormation. This setup includes multiple AWS regions and different AWS services such as Lambda, RDS, S3, and Route 53. Each region should maintain consistency in terms of service configurations, ensuring that each environment can act as a backup for others during failover situations. Naming conventions follow the pattern `[environment]-[region]-[service][Suffix]`.

**Constraints:**  
- Each AWS region must have a dedicated VPC with non-overlapping CIDR blocks.
- An AWS Lambda function must be created that is invoked by AWS S3 events in all environments.
- All environments must have an RDS instance configured for PostgreSQL, using encrypted storage.
- Security Groups must allow inbound traffic only on port 443 for load balancers.
- Route 53 must manage DNS across environments with domain failover capabilities.
- Each environment should utilize AWS IAM Roles for cross-account access between environments.
- Terraform input variables must be utilized to control the number of EC2 instances per region, defaulting to 3 (simulate with CDK custom parameters).
- Environment-specific CloudWatch Alarms must be configured for EC2 instance CPU utilization.
- S3 buckets must have versioning enabled and enforce HTTPS-only access.
- Define a common Amazon CloudFront distribution for routing requests to the closest AWS region.
- Use AWS Secrets Manager to store and retrieve database credentials programmatically.
- Implement an SNS topic for application error notifications across environments.
- Utilize AWS Config rules to monitor compliance with tagging and encryption standards.
- Elastic Load Balancer must be configured to auto-scale based on demand.
- AWS Auto Scaling Groups must maintain a minimum of two running instances per environment.
- **Ensure String suffix is appended to resource names where needed.**

**Instructions:**  
- Generate a single, complete TypeScript file for the AWS CDK stack, strictly adhering to the above requirements and constraints.
- Do not change or reinterpret any provided data or configuration details.
- Explicitly append a String suffix to resource names wherever required, following the `[environment]-[region]-[service][Suffix]` convention.
- All AWS resources must be fully deployable and verifiable by AWS solution tests.

---

**Expected Output:**  
A deployable TypeScript file containing the AWS CDK stack definition that implements all the above requirements and constraints.

```
