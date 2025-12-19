# Multi-Component AWS Infrastructure: 

Set up a CloudFormation stack for a multi-component application using AWS CDK and TypeScript. The stack should run in AWS account 123456789012, "primarily in 'us-east-1' (with support for 'us-east-2')." Follow these requirements and constraints exactly as provided.

**Requirements:**

- Create a VPC named `prod-app-vpc` (CIDR: 10.0.0.0/16) with two public and two private subnets.
- Deploy a Lambda function (Node.js 14.x) managed by an API Gateway that uses IAM authentication. The Lambda should run across at least two availability zones for high availability.
- Provision an Amazon RDS (PostgreSQL) instance, db.m4.large or larger. Credentials must be stored in AWS Secrets Manager.
- Set up S3 buckets for static file storage, with versioning enabled.
- Add an Amazon CloudFront distribution for global content delivery.
- Use Amazon Route 53 for DNS.
- Create IAM roles for least privilege access—apply the principle of least privilege across all resources.
- Add an Amazon SQS standard queue for asynchronous processing.
- Enable logging and monitoring with AWS CloudWatch for all services.
- Use string suffixes in all resource names to avoid collisions (e.g., `prod-ec2-web-<unique>`).
- All resources must use the specified naming convention and constraints.

**Constraints:**

- TypeScript and AWS CDK must be used for all resource definitions.
- All resources should be deployed to 'us-east-1', with multi-region awareness for 'us-east-2'.
- Lambda must be highly available (multi-AZ).
- API Gateway must enforce IAM authentication.
- IAM roles must be least privilege.
- S3 must use versioning.
- RDS instance: db.m4.large minimum.
- All resource names must include a string suffix for uniqueness.
- Do not change or omit any requirements.

**Deliverables:**

- A deployable TypeScript CDK app that creates all specified resources, following the naming conventions.
- Outputs showing key resource identifiers (e.g., ARNs, endpoints).
- Documentation or comments explaining deployment and stack outputs.

**How to succeed:**  
- Make sure every requirement above is implemented as described.
- Resource names must always include a string suffix.
- The solution should be ready to deploy and validate with AWS CDK.