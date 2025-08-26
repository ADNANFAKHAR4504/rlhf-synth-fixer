Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfils the following security and infrastructure requirements:
1. There is requirement to have resources deployed in single regions us-west-2 So Please create proper VPC in this region with specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16. Also enable VPC flow logs for better monitoring.
VPCs should have private and public subnets in VPC. Configure other required resources as well network configuration as required. Utilize Elastic IPs for NAT gateways within each .
2. Create AWS RDS in private subnet and non publically accessible and create specific security group allowing access from the EC2 instance only. Also Create KMS key to encrypt data at rest. Also use random master user name of 8 characters without special characters and use random master password with special characters.
3. Create EC2 instance with latest amazon linux 2 AMI in private subnet and create specific security group for ec2. Encrypt the data at rest for the EBS attached to this EC2.
4. Create a S3 buckets which is private. and configure CloudFront for this S3 bucket and to use HTTPs connections only. And attach AWS WAF to secure this CloudFront distribution.
5. Create required IAM roles with least privileged access.
6. Enforce MFA for all the IAM users.
7. Implement AWS CloudTrail to log all the API call activities being made among the resources created in this stack.
8. Also Use elastic cache for the better performance of the database.
9..Ensure all the resources are tagged with 'Environment: Production'.
10.Generate outputs for all the resources.
