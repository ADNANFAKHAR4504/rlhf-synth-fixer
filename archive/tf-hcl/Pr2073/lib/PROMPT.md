Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-1 and us-west-12 So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Configure other required resources as well network configuration as required.
3. Setup EC2 instance in each region in private subnet with their respective security group just allowing HTTPS traffic from within the VPC CIDR.
4. Configure identical S3 bucket in each region and keep the configuration for cross region  replication among the buckets in each region.
5. Ensure all the resources are tagged with  'Environment: Production'
6. Create necessary IAM role with the least privileged access.
7. Use provider block with each resource to avoid conflicts as below
provider = aws.us_east_1 for primary region
provider = aws.us_west_2 for secondary region
8.Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
