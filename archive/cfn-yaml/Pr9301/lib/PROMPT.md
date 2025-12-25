# Cloud Environment Setup - CloudFormation YAML

## Task Overview
Design a CloudFormation template for setting up a cloud environment that includes network and compute resources.

## Requirements

### Infrastructure Components
1. **VPC Configuration**
   - Create a new VPC with a CIDR block of 10.0.0.0/16
   - Deploy in the us-east-1 region

2. **Subnets**
   - Two public subnets in separate availability zones:
     - 10.0.1.0/24
     - 10.0.2.0/24
   - Two private subnets in separate availability zones:
     - 10.0.3.0/24
     - 10.0.4.0/24

3. **Network Configuration**
   - Create an Internet Gateway and attach it to the VPC
   - Create a NAT Gateway in one of the public subnets to allow outbound internet traffic from the private subnets
   - Ensure all subnets have the appropriate route tables associated with them

4. **Compute Infrastructure**
   - Deploy an EC2 instance in each private subnet using the latest Amazon Linux 2 AMI
   - The EC2 instances must use an IAM role with S3 read-only access scoped to specific buckets within the same account

5. **Security**
   - Set up a security group allowing SSH access to the EC2 instances only from a specific IP range
   - Configure appropriate IAM roles with least privilege principles

6. **Monitoring & Alerting**
   - Monitor the EC2 instances using CloudWatch
   - Set up an alarm for CPU usage exceeding 80%

7. **Tagging and Organization**
   - Ensure there are appropriate tags on all resources for cost management and resource identification

## Constraints
1. Ensure all AWS resources are created in the us-east-1 region
2. Create a new VPC with a CIDR block of 10.0.0.0/16
3. Create two public subnets in separate availability zones with CIDR blocks of 10.0.1.0/24 and 10.0.2.0/24
4. Create two private subnets in separate availability zones with CIDR blocks of 10.0.3.0/24 and 10.0.4.0/24
5. Create an Internet Gateway and attach it to the VPC
6. Create a NAT Gateway in one of the public subnets to allow outbound internet traffic from the private subnets
7. Ensure all subnets have the appropriate route tables associated with them
8. Deploy an EC2 instance in each private subnet using the latest Amazon Linux 2 AMI
9. The EC2 instances must use an IAM role with S3 read-only access scoped to specific buckets within the same account
10. Set up a security group allowing SSH access to the EC2 instances only from a specific IP range
11. Monitor the EC2 instances using CloudWatch and set up an alarm for CPU usage exceeding 80%
12. Ensure there are appropriate tags on all resources for cost management and resource identification

## Expected Output
A complete CloudFormation YAML template that:
- Meets all the above requirements and constraints
- Is ready for deployment
- Passes all necessary validations and JSON schema checks
- Can be successfully deployed in an AWS environment

## Environment Context
- Target Region: us-east-1
- VPC CIDR: 10.0.0.0/16
- Availability Zones: Use at least 2 AZs for redundancy
- NAT Gateway: For private subnet internet access
- Security: Implement AWS best practices for network and security configurations