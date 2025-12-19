Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in  regions eu-west-1 .So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have  2 private and  2 public subnets in three different Availability zones  Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans.Use NAT Gateways to allow internet access for resources in private subnets. 
3.  Utilize IAM roles and policies to ensure least privilege access across resources.
4. Configure S3 buckets to enforce encryption in transit and at rest. Create non public S3 bucket and Encrypt S3 buckets using default AWS Managed key.
5. Setup EC2 instances to leverage IAM roles and avoid storing credentials in AMIs. Use amazon linux2 latest AMI.
6. Implement VPC flow logs for network visibility and troubleshooting.
7.  Enable CloudTrail logging for auditing all infrastructure changes.
8. Apply Multi-Factor Authentication (MFA) for all user accesses.
9 .Design security groups and NACLs for secure network configurations.
10. Enable data encryption for EBS volumes attached to EC2 instances.
11. Use AWS Config for monitoring resource changes and compliance.
12. Employ CloudWatch Alarms to alert the security team through SNS on non-compliance and security incidents.
13.Implement Individual RDS in  with multiple AZ support. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. RDS should have automated backup enabled.
14. mplement SASL for RDS to ensure its security.
15. Implement AWS KMS for encryption management.
16. Utilize AWS WAF to safeguard web applications.
17 .Setup and enforce compliance checks using AWS Security Hub.
