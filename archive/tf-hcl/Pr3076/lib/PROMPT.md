Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-west-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .
2. VPCs should have 3 private and 3 public subnets for high availability and disaster recovery Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3.  Configure the EC2 instances with IAM roles that allow secure access to S3 buckets in the same region. Also create security group to RDS with very limited CIDR and restrictive way.
4. Write IAM policies adhering to the principle of least privilege. 
5. Create non public facing s3 bucket, Use AWS KMS to encrypt data in S3 buckets, and ensure S3 buckets have versioning and server access logging enabled.
6. Set up CloudWatch to monitor EC2 instances.
7.  Set up a Multi-AZ RDS database to ensure database availability and failover capability. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
8. Create CloudFront to optimize for performance and cost. 
9. Apply appropriate tagging to all resources, which includes 'Environment: Production'.
10. Give Byte size 4 suffix with each resource so that stack dont get error of "resource already exists".
