I need to build a reusable, multi-region application infrastructure on AWS using Pulumi with TypeScript. The setup must follow best practices for scalability, maintainability, and security. All resources should be designed to support consistent deployments across at least two AWS regions using parameterized inputs. Here are the components I need:

1. Define a reusable Pulumi stack that can be deployed in different AWS regions by passing region-specific configurations via Pulumi config or stack files (e.g., AMI IDs, instance types, subnet CIDRs).
2. Create a VPC with at least two public subnets and two private subnets, each placed in separate availability zones for high availability.
3. Provision an RDS instance within the private subnet:
   - Enable encryption at rest.
   - Ensure automated backups are configured.
4. Create an S3 bucket to store application logs:
   - Apply server-side encryption at rest.
   - Configure lifecycle policies to transition or expire log objects over time.
5. Define IAM roles and policies that follow the principle of least privilege:
   - Restrict access to only necessary AWS services and resources.
   - Avoid use of overly permissive wildcards.
6. Ensure all storage components (S3 and RDS) use encryption at rest, preferably using AWS-managed or customer-managed KMS keys.
7. Design the codebase to be scalable and maintainable, using component abstractions or Pulumi Component Resources where appropriate.
8. Explicitly associate all AWS resources with a region-specific Pulumi provider object to control deployments per region and support isolated environment setups.
9. Ensure to use provider configuration that is for different region to control the infra

Please provide the Pulumi TypeScript code implementing this infrastructure. The code must be modular, reusable across regions, and production-ready. Avoid boilerplate or scaffolding — focus only on the core infrastructure logic that aligns with AWS security and availability best practices.
