Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfils the following security and infrastructure requirements:
1. There is requirement to have resources deployed in single region us-west-2. So Please create proper VPC in this region. set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for this region.
2. VPCs should have 2 private and 2 public subnets in VPC.
3. Implement a NAT gateway to permit outbound internet access from private subnet and also create  required resources for this setup.
4. Deploy an EC2 instance in one of the public subnets configured with a Security Group permitting SSH access strictly from a specified IP address from the CIDR block of the VPC only.
5.  Deploy an RDS instance within a private subnet, ensuring it is appropriately configured to deny public access. So basically RDS should have its own security group. Use random  username and password for the database.
6.  Include at least two IAM roles, each with unique policies adhering to the principle of least privilege. One IAM role for RDS access and another IAM role from user perspective with least privileged policies on the basis of the resources being created in this stack. 
7. Create non public facing S3 bucket and Utilize AWS managed KMS keys for server-side encryption of S3 buckets.
8. Enable CloudTrail to log all API activities across your all the AWS resources being created in this stack.
9.  Safeguard sensitive information using AWS Systems Manager Parameter Store. RDS random username and random password could be saved in SSM parameter.
10. Tag all the resources  for efficient cost-tracking purposes.
11.  Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

I have provider block defined as in different provider.tf file already -

provider "aws" {
  region = var.aws_region
}

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements. 

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
