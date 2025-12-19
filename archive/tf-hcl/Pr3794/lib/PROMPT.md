Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in  regions us-west-2 .So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have  2 private and  2 public subnets in three different Availability zones  Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans.Use NAT Gateways to allow internet access for resources in private subnets. 
3. Create non public S3 bucket and Encrypt S3 buckets using AES-256.
4. Enable versioning for S3 buckets
5.  IAM roles must have policies following least privilege principle.
6. Log all account activities across all regions using AWS CloudTrail.
7.  Ensure all AWS Lambda environment variables are encrypted. But an actual lambda function is not needed from deployment point of view. So dont create any lambda funcction.
8. Implement Individual RDS in  with multiple AZ support. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. RDS should have automated backup enabled.
9. Security groups must not allow SSH access from 0.0.0.0/0.. And Should allow from specific CIDRs only.
10.  Require MFA for IAM user access. 
11. Monitor compliance with AWS Config using relevant rules.
