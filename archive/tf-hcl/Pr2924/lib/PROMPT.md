Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .Capture VPC Flow Logs
2. VPCs should have 2 private and 2 public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create EC2 instances within an Auto Scaling group behind an Application Load Balancer in private subnets. Security groups allowing only HTTP/HTTPS traffic from authorized CIDR blocks.
4. Create  IAM roles with the principle of least privilege access.
5. Create static S3 buckets with versioning and logging enabled.
6. Create A DynamoDB table with server-side encryption by default.
7. Implementation of AWS WAF for web application protection.
8.  CloudTrail and CloudWatch configurations for logging and monitoring of the EC2 instances.
9. Also setup SNS notification system for alerts for the alarm triggers
10.  Implement Individual RDS with automatic backups in a private subnet . Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Integration with AWS Backup to manage RDS backups.
11. Give Byte size 4 suffix with each resource so that stack dont get error of "resource already exists".
12 .Ensure proper security measures, including the configuration of IAM Roles for EC2 instances, Security Groups, and S3 bucket policies for static content.
