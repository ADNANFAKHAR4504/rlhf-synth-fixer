Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfils the following security and infrastructure requirements:
1. There is requirement to have resources deployed in single regions us-west-2 So Please create proper VPC in this region with  specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16. Also enable VPC flow logs for better monitoring.
2. VPCs should have  private and  public subnets in VPC. Configure other required resources as well network configuration as required. Utilize Elastic IPs for NAT gateways within each .
3. Create AWS RDS in private subnet and non publically accessible and create specific security group allowing access from the EC2 instance only. Also Create KMS key to encrypt data at rest. Also use random master user name of 8 characters without special characters and use random master password with special characters.
4. Create EC2 instance with latest amazon linux 2 AMI in private subnet and create specific security group for ec2. Encrypt the data at rest for the EBS attached to this EC2.
5. Create a S3 buckets which is private. and configure CloudFront for this S3 bucket and to use HTTPs connections only. And attach AWS WAF toted in us-east-1 to  secure this CloudFront distribution. 
6. Create required IAM roles with least privileged access. 
7. Enforce MFA for all the IAM users.
8. Implement AWS CloudTrail to log all the API call activities being made among the resources created in this stack.
9. Also Use elastic cache for the better performance of the database.
10.Ensure all the resources are tagged with  'Environment: Production'.
11.Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.

