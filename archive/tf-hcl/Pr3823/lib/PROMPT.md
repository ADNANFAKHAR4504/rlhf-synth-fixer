Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in  regions eu-west-1 .So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have  2 private and  2 public subnets in three different Availability zones  Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans.Use NAT Gateways to allow internet access for resources in private subnets. 
3. Create non public S3 bucket and Encrypt S3 buckets using default AWS Managed key
4. Enable versioning for S3 buckets
5.  IAM roles must have policies following least privilege principle.
6. Log all account activities across all regions using AWS CloudTrail.
7.  Ensure all AWS Lambda environment variables are encrypted. But an actual lambda function is not needed from deployment point of view. So dont create any lambda funcction.
8. Implement Individual RDS in  with multiple AZ support. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. RDS should have automated backup enabled.
9. Configure RDS instances with the 'removeData' option to ensure no customer data exists after deletion.
10.  Ensure that all IAM roles have Multi-Factor Authentication (MFA) enabled for console access.
11.  Limit the maximum allowed AWS Lambda execution time to 10 seconds. But dont create any lambda fucntion as that is not needed.
12.  Ensure that all security groups do not allow unrestricted access (0.0.0.0/0) to ports other than 80 and 443 to VPC specific CIDRs only.
13. Use security groups, IAM roles, and instance profiles for all EC2 instances. Also use amazon linux2 latest AMI fir this ec2 instance.
14.  Enable logging for RDS instances.
15. Ensure that all resources are tagged with 'Environment' and 'Project'.
16. Establish VPC peering for inter-account communication. Though we dont have any other account as of now. So create the resources accordningly.
17. Set up an AWS Config rule for compliance monitoring.
