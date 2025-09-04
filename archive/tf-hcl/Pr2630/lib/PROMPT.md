Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Implement Individual RDS in each region but with multiple AZ support for respective regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively.Ensure that all RDS instances are set to not be publicly accessible.Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
4.Utilize Amazon S3 for storing static content, enabling cross-region replication to ensure data resilience .All S3 buckets must be encrypted using AES256 for data protection.Enable versioning on all S3 buckets to prevent accidental data deletion or loss.
5. Use IAM policies instead of root account privileges for all administrative actions.
7. EC2 instances should use latest amazon linux2 ami. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.Enable snapshot capabilities for all EBS volumes to ensure backup.
8. Create Lambda function to manage backup of RDS. Use IAM roles to restrict and control access to all Lambda functions. Ensure all Lambda functions have permissions following the least privilege principle.
9. Set up CloudWatch alarms to monitor CPU usage across services and trigger notifications accordingly.
10. Setup CloudFront distribution for the S3 bucket.  Use the latest TLS protocol version for all CloudFront distributions.
11. Create Dynamo DB table in each region. Implement backup and restore features for all DynamoDB tables.
12. Secure all API Gateway methods with IAM Authentication mechanisms.
13.  Set up CloudWatch alarms to monitor CPU usage across services and trigger notifications accordingly.
14. Enable CloudTrail logging for all account activities for audit purposes.
15. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
