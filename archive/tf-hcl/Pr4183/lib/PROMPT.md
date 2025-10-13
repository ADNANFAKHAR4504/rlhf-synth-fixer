Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-east-1 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3.  Implement Individual RDS in each region but with multiple AZ support. Add read replica for the DB. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Encrypt data at rest in the RDS instance. Store RDS username and password in AWS system manager parameter store insecure string using AWS managed KMS key.
4.  Configure a private S3 bucket with a Lambda function for data processing on upload events. But dont rely on any zip file infact use the basic code in the tap_stack.tf file itself for this lambda. But please ensure that  I dont need zip file for the lambda function just create it with inline code. so please create tap_stack.tf file accordingly
5.Setup cloud Watch Alarms and  Incorporate a notification system using Amazon SNS for failures in EC2 instances.
6. Create ec2 instances using amazon linux2 latest AMI and  Use an Auto Scaling policy based on CPU usage. 
7. Log all activity with AWS CloudTrail. 
8.  Deliver content with Amazon CloudFront for S3 bcuket.
9. Enforce AWS IAM role policies for security with least privileged access.
10. Encrypt all data in S3 with AWS KMS keys
11.  Only permit HTTP/HTTPS inbound traffic im security group from VPC cpecific CIDRs only
12. Ensure RDS is inaccessible from the internet.
13. Monitor with AWS Config. 
14. Use AWS WAF to guard against web attacks. 
 15.Ensure compliance with all security constraints including least privilege IAM roles, a configured WAF, and restricted SSH access.
16. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
