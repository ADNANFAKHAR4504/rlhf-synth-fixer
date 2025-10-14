Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-west-2 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3. Create non public S3 bucket with required security.
4. Create ec2 instance with latest amazon linux 2 ami and enabled detailed CloudWatch monitoring for the ec2 instance.
5. IAM roles must have trust policies properly configured.
6. Implement Individual RDS in each region but with multiple AZ support. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Encrypt data at rest in the RDS instance.
7. Apply AWS Config checks for compliance rule
8. Ensure Lambda functions run on a secure, supported runtime version.  But dont rely on any zip file infact use the basic code in the tap_stack.tf file itself for this lambda.
9. Set up CloudWatch alarms for unauthorized API access detection. 
10. Use tags 'Project,' 'Environment,' and 'Owner' for all resources.
11. Ensure compliance with all security constraints including least privilege IAM roles, a configured WAF, and restricted SSH access.
12. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
