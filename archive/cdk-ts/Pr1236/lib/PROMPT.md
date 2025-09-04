# Secure and Scalable AWS Environment with CDK & TypeScript

## Requirements

- Use AWS as the cloud provider.
- All resources should be defined in a single CDK TypeScript module for simplicity and maintainability.
- The setup must be region-independent, so it can be deployed to any AWS region.
- Networking:
   - Create a VPC with both public and private subnets.
   - Each subnet should support at least 256 IP addresses.
- Application Layer:
   - Deploy an Application Load Balancer (ALB) spanning all availability zones in the chosen region.
   - Set up an Auto Scaling Group (ASG) with a minimum of two EC2 instances, placed in private subnets.
- Database:
   - Use Amazon RDS with Multi-AZ enabled for high availability.
- Storage & Logging:
   - Create an S3 bucket with versioning and access logging enabled.
   - Enable CloudWatch for logging and monitoring.
- Security:
   - Encrypt all data in transit and at rest using AWS KMS.
   - Implement IAM roles for EC2 instances to interact with S3 and RDS (no hardcoded credentials).
   - Security groups should only allow inbound web traffic on ports 80 and 443.
   - Use CDK's high-level constructs or Cfn classes as appropriate.
   - Do not create SSL certificates in this setup.

## How to write unit test

- Write unit tests to verify:
   - VPC and subnet configurations meet the IP address requirements.
   - Security group rules only allow traffic on ports 80 and 443.
   - ASG has the correct minimum instance count.
   - IAM role policies follow least privilege.
   - S3 bucket is configured with versioning and access logging.
- Write integration tests to deploy the stack and validate security and availability in a live AWS environment.
- 100% code coverage across unit and integration tests.

## Output

   - Provision a Multi-AZ Amazon RDS instance in the private subnets.
   - Create an S3 bucket with versioning and server access logging enabled.
   - Configure CloudWatch to capture logs and metrics for the deployed resources.
   - Ensure all resources are defined using CDK's Cfn classes or high-level constructs.
   - Do not create an SSL certificate.

## **Testing Requirements**

- **Unit Tests:** Implement unit tests for the CDK program to verify the correct configuration of resources. This includes:
  - Testing the VPC and subnet configurations to ensure they meet the IP address count requirement.
  - Verifying that the Security Group rules only permit traffic on ports 80 and 443\.
  - Confirming that the ASG has the correct minimum instance count.
  - Checking that the IAM role policies adhere to the principle of least privilege.
  - Validating that the S3 bucket is configured with versioning and access logging.
- **Integration Tests:** Write integration tests to deploy the stack and validate that the deployed infrastructure meets all security and availability requirements in a live AWS environment.
- **Code Coverage:** Both unit and integration tests must achieve **100% code coverage** for the TypeScript CDK.
