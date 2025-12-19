Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 2  private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Set up an Internet Gateway for public subnets and NAT Gateway for private subnets.  Also enabled VPC Flow Logs
3. Create t3.micro EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only. Run instance  on latest Amazon linux 2 AMI. Also with the encrypted EBS volumes using AWS KMS keys.
4. Attach security group allowing traffic from subnet CIDRs only in inbound.
5. Create non public s3 bucket with versioning enabled to prevent data loss and server side encryption enabled. And data encryption at rest and in transit.
6. enable MFA via  IAM user MFA enforcement.
7. GuardDuty threat detection enabled
8. Also AWS WAF protection from common exploits should be enabled
9. Implement Individual MySql RDS with version 8.0 or later but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled.  Use 8.0.43 DB Version.
10.  AWS Config rules to monitor security.
11. CloudTrail logging and monitoring of API activity.
12. AWS Shield for DDoS protection on critical applications.
13.  Lifecycle policies for S3 moving objects to Glacier.
14. Set up security groups to control network access.
15. Restrict access through IAM roles and policies to only necessary services
16. Include all the outputs in outputs section for all the resources being created.
17. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
18. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
