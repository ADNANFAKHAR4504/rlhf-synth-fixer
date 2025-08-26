There is requirement to have resources deployed in single regions us-west-2 So Please create proper VPC in this region with specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16. Also enable VPC flow logs for better monitoring.
VPCs should have private and public subnets in VPC. Configure other required resources as well network configuration as required. Utilize Elastic IPs for NAT gateways within each .                                                                                                                                                                                  Create AWS RDS in private subnet and non publically accessible and create specific security group allowing access from the EC2 instance only. Also Create KMS key to encrypt data at rest. Also use random master user name of 8 characters without special characters and use random master password with special characters.
Create EC2 instance with latest amazon linux 2 AMI in private subnet and create specific security group for ec2. Encrypt the data at rest for the EBS attached to this EC2.
Create a S3 buckets which is private. and configure CloudFront for this S3 bucket and to use HTTPs connections only. And attach AWS WAF , create this WAF in us-east-1 region to secure this CloudFront distribution.
Create required IAM roles with least privileged access.
Enforce MFA for all the IAM users.
Implement AWS CloudTrail to log all the API call activities being made among the resources created in this stack.
Also Use elastic cache for the better performance of the database.
10.Ensure all the resources are tagged with 'Environment: Production'.
11.Generate outputs for all resources.             
