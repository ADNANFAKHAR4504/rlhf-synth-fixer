Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .Capture VPC Flow Logs
2. VPCs should have 2 private and 2 public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create S3 bucket  Enable AES 256 server-side encryption for all S3 buckets.
4. Implement IAM roles with appropriate permissions for EC2 instances, avoiding direct use of access keys.
5. Ensure VPC flow logs are enabled for traffic monitoring.
6.  Implement Individual RDS with automatic backups in a private subnet . Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
7. Create Secure Lambda functions for RDS backup management  by using encrypted environment variables.
8. Create ElastiCache clusters and enable  backups and should not be public accessible. 
9.  Enable CloudTrail to audit AWS account activity.
10 . Enforce security group rules that adhere to least privilege within CIDRs.
