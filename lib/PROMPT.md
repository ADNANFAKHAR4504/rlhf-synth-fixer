Create a comprehensive Pulumi Go program that sets up a secure cloud environment in AWS in the us-east-1 region.

Here are the requirements for the setup:

VPC Configuration: Create a VPC with CIDR block 10.0.0.0/16. Enable DNS hostnames and DNS resolution. Add proper resource tags with Environment: Production.

Subnet Architecture: Create Subnet A with 10.0.1.0/24 in us-east-1a and Subnet B with 10.0.2.0/24 in us-east-1b. Both subnets should be able to route to the internet.

Compute Resources: Deploy an EC2 instance with type t3.medium in subnet A (10.0.1.0/24). The instance should have internet connectivity. Use the latest Amazon Linux 2 AMI.

Storage Requirements: Create an S3 bucket with versioning enabled. The bucket should follow naming best practices. Enable server-side encryption.

Security Configuration: Configure a security group allowing SSH (port 22) access only from IP range 203.0.113.0/24. No other inbound traffic should be allowed. All outbound traffic should be allowed. The security group should be attached to the EC2 instance.

IAM Configuration: Create an IAM role for the EC2 instance. Follow the least privilege principle. Allow the instance to read from the S3 bucket. Attach the role to the EC2 instance via instance profile.

Internet Connectivity: Include an Internet Gateway for public internet access. Configure appropriate route table. Ensure EC2 instance can reach the internet.

Resource Dependencies: Implement proper resource dependencies to ensure correct creation order. VPC should be created before Subnets, Security Groups, and EC2 Instance. IAM Role should be created before Instance Profile and EC2 Instance.

Output Requirements: The program must export the VPC ID, Subnet IDs, EC2 Instance ID and Public IP, S3 Bucket Name, Security Group ID, and IAM Role ARN.

Constraints: Use only Pulumi's native Go SDK for AWS. All resources must be tagged with Environment: Production. Implement proper Go error handling. Code must be production-ready with appropriate resource dependencies. Follow Go best practices for code organization.

Please ensure the final Go code is valid and would pass standard Pulumi validation tests.
