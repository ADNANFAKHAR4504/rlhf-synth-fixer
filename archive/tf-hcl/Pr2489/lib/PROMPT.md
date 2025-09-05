Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Aslo  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create auto scaling group using launch template to manage the instances across these two regions for high availability. Minimum 2 instance in each region and maximum 4 instances in each region
4. Also create ELB for to distribute traffic among the instances.
5. EC2 instances should use latest amazon linux2 ami. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.
6.Implement cross-region RDS read replicas for the application's database in the above regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not sure use any special characters which aws doesn't allow for RDS. Also Use encryption for both primary and secondary database.  Also snapshot or deletion protection is not needed for RDS.
7. Create Specific security groups  for RDS allowing traffic only from EC2 instances.
8.  Setup CloudFront distribution for S3 bucket, Create S3 bucket as well with encryption for data at rest with AWS managed key. 
9. CloudWatch monitoring to maintain healthy service levels and efficient resource utilization.
10. Tag all resources with 'Environment:Production' .
11 . Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
12. Define provider block with each resource to avoid region conflicts
Eg
provider      = aws.us_east_2
provider      = aws.us_west_1

My provider.tf looks like this

provider "aws" {
  alias  = "us_east_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_1"
  region = var.secondary_region
}

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
