Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 
2. VPCs should have private and public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Implement Individual RDS in private subnet . Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible.Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
4. EC2 instances should use latest amazon linux2 ami. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.
5. Create Lambda function to manage backup of RDS. Use IAM roles to restrict and control access to all Lambda functions. Ensure all Lambda functions have permissions following the least privilege principle.
6. .Utilize Amazon S3 for storing static content and public access should be completely blocked. All S3 buckets must be encrypted using AES256 for data protection .Enable versioning on  S3 buckets to prevent accidental data deletion or loss.
7. Set up an Amazon CloudWatch Logs group to centralize logging from all deployed resources.
8. Use IAM roles for authentication between AWS services rather than embedding access keys in your applications.
9.  Enable AWS Config to track and audit AWS resource configurations
10. Tag all resources with 'Environment:Production'.
11. Create and Employ VPC endpoints for improved security when accessing AWS services S3 and Lambda.
12.  Enable AWS CloudTrail for full visibility into API activity throughout your AWS account.
13. Enforce MFA for all IAM users as an additional security measure
14. Use IAM policies instead of root account privileges for all administrative actions.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
