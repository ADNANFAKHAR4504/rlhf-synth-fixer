Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 3  private and 3 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only.
4.  Implement Individual Postgres RDS but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled. 
5. Create non public S3 bucket with versioning enabled to store static objects
6.  Logging and monitoring setups using CloudWatch and CloudTrail. 
7. Necessary security configurations, including IAM roles, security groups, and SSL/TLS certification.
8. DNS management using Route 53 for fault tolerance with dns entry tasknewtestlive.com
9. Include all the outputs in outputs section for all the resources being created.
10. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
11. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements providing full coverage

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
