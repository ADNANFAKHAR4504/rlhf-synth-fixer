Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfils the following security and infrastructure requirements:
so please create the resources according to this with provider block in each resource to get rid of resource conflicts.

Please create the resources as per below requirements -
1. There is requirement to have resources deployed in two different regions eu-west-1 and eu-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make eu-west-1 primary and eu-west-2 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. VPCs should have flow logs enabled for security analysis. 
3. Create EC2 resource in each region and EC2 specific security group that allows SSH access only from a specific IP address from the CIDR.
4. Create s3 bucket in each region  Ensure all S3 buckets are encrypted using Amazon S3-managed keys (SSE-S3).
5. . IAM roles should not have wildcard permissions to prevent privilege escalation.
6. Create RDS in each region with RDS specific security groups. Create security group specific for RDS. and use random username and random password for RDS.
7. Encrypt all EBS volumes and sensitive data at rest using AWS KMS with an AWS-managed key.
8. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
