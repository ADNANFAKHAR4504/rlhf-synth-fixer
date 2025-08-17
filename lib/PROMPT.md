I need to build a secure AWS infrastructure using Pulumi with TypeScript. The setup must be production-ready, deployed in the 'ap-south-1' region, and adhere to strict security and IAM best practices. Here are the components I need:

1. Create a VPC with the CIDR block '10.0.0.0/16'.
2. Create two public subnets in separate Availability Zones, using CIDRs '10.0.1.0/24' and '10.0.2.0/24'.
3. Define security groups that allow inbound traffic on:
   - Port 22 from the internet.
   - Port 80 (HTTP) from the internet.
4. Implement an IAM role that allows only the EC2 actions necessary for application deployment, strictly adhering to the principle of least privilege.
5. Enable AWS CloudTrail to log all account activity.
6. Store CloudTrail logs in an S3 bucket encrypted using AWS KMS.
7. Provision a DynamoDB table with **provisioned (warm) throughput mode**, specifying read and write capacity units to handle predictable workloads.
8. Apply KMS encryption at rest to the DynamoDB table as well.
9. Ensure all resources are tagged according to standard conventions (e.g., `Environment`, `Project`).
10. Write commented infrastructure code that reflects Pulumi best practices for maintainability and clarity.
11. The code should make use of provider to deploy the code in the ap-south-1 region

Please provide the Pulumi TypeScript code to implement this setup. The code must be region-specific (`ap-south-1`), production-ready, and focused on secure defaults. Do not include boilerplate or scaffolding — focus only on the infrastructure logic.
