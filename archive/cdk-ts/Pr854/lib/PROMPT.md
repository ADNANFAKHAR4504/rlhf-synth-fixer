I need to build a secure web application infrastructure on AWS using CDK TypeScript. The setup needs to be production-ready with all security best practices. Here are the components I need:

1. A VPC with at least two public subnets and one private subnet, spread across multiple Availability Zones.
2. An Auto Scaling group running EC2 instances in the private subnet, fronted by an Application Load Balancer in the public subnet.
3. The ASG should use Amazon Linux 2023 AMI.
4. Security groups should restrict access to EC2 instances to specific IP ranges, and SSH access must be disabled in favor of SSM Session Manager.
5. AWS WAFv2 attached to the ALB.
6. s3 bucket just to store data related to EC2 instance
7. Use KMS with automatic key rotation to manage encryption keys for S3.

The infrastructure should be deployed in us-west-2 region. All resources must be prefixed with 'tf-' and tagged with 'Environment: Production'. All the resources names should be suffixed with environment, take this value as a parameter from the main stack

Please provide the CDK TypeScript code with proper security configurations and monitoring setup.
