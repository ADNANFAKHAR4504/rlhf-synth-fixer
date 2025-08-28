Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. Create S3 bucket in each of these regions  us-east-1, eu-west-1 and ap-southeast-1 and and enable cross region replication among these buckets.
2. Create IAM role so that any lambda functions in these regions can access these three buckets in these three regions.
3. Use the Tag 'Environment:Production for all the resources being created in this stack.
4. Use the provider block with each resource being created to avoid region conflcits. Eg- provider               = aws.us_east_1, provider               = aws.eu_west_1, provider               = aws.ap_southeast_1
5. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

My provider.tf looks like this
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
