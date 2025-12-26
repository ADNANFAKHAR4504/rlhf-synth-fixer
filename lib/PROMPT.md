We need to build a CDKTF infrastructure that deploys a web application across three isolated AWS environments: development, staging, and production. Each environment should have EC2 instances running in dedicated VPCs with proper network isolation and security.

Here's how the services should connect:

Create VPC networks for each environment with public subnets across multiple availability zones. EC2 instances deployed in these subnets should have security groups controlling inbound HTTP traffic on port 80 and outbound internet access through an Internet Gateway. The instances need IAM instance profiles attached that grant permissions to write logs to CloudWatch, ensuring they can send application and system logs without hardcoded credentials.

For security and monitoring, use KMS keys to encrypt each EC2 instance's root volume, and configure CloudWatch log groups to receive logs from the instances through the CloudWatch agent. The KMS keys need policies granting the AWS account root administrative access and the CloudWatch Logs service specific permissions for Encrypt, Decrypt, ReEncrypt, GenerateDataKey, and DescribeKey actions on that key. IAM roles attached to EC2 instances should follow least privilege, granting only CreateLogStream and PutLogEvents permissions scoped to the specific log group for that environment.

Each environment needs its own isolated stack in CDKTF with environment-specific parameters for instance types, VPC CIDR blocks, and subnet allocation. Tag all resources with environment and project identifiers so we can track costs and manage resources per environment. The solution should be written in TypeScript with CDKTF, synthesize without errors, and deploy successfully to us-east-1.

The end result should give us three parallel environments where EC2 web servers connect to VPCs for networking, use IAM roles to securely access CloudWatch for logging, and rely on KMS for encryption, with all connections following AWS security best practices.
