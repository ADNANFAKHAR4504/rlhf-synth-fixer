Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-east-1 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3.  Implement Individual RDS in each region but with multiple AZ support. Add read replica for the DB. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Encrypt data at rest in the RDS instance. Store RDS username and password in AWS system manager parameter store insecure string using AWS managed KMS key.Apply at-rest encryption on all RDS instances using KMS.
4. . Create ec2 instances using amazon linux2 latest AMI and attach IAM role to it for accessing S3 buckets.
5.  Set up security groups to only permit HTTP (port 80) and HTTPS (port 443) ingress traffic with VPC specific CIDRs only.
6.Create non-public s3 bucket and Encrypt data at rest in S3 buckets using AWS KMS-managed keys. Enable versioning on S3 buckets to safeguard against accidental deletion
7. Define and attach IAM policies that restrict unauthorized access to sensitive data
8. Ensure EC2 instances are deployed in VPC with subnets distributed across at least two availability zones.
9.  Set a Network ACL that blocks unwanted IP address ranges.
10.  Implement AWS WAF to filter and monitor HTTP requests.
11. Create CloudWatch alarms for unauthorized access attempts.
12. Implement Config rules for mandatory tagging of resources.
13. Secure all IAM user accounts with mandatory MFA.
14. There is no need of cost optimisation.
15. There is now need of cross regions for DR featiures.
16. There is no need of ec2 auto scaling.
17. . Include AWS Shield for additional DDoS protection
18. There is no requirement VPC flow logs, Guard duty, security hub or any observability.
18. Produce a security audit using AWS Trusted Advisor to identify ongoing issues.
19.Ensure compliance with all security constraints including least privilege IAM roles, a configured WAF, and restricted SSH access.20. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
21. Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists". Also use small characters only for this suffix. 
22. There is no need of VPC flow logs, Cloudtrail log encryption with KMS key , S3 lifecycle policies and cloud watch logs groups as per the task requirements.
