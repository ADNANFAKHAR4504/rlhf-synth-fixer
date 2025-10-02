Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-1 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .Capture VPC Flow Logs
2. VPCs should have 2 private and 2 public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create EC2 instances with latest amazon linux-2 ami. Isolate this EC2 instances within a VPC using private subnets.
4. Configure the EC2 instances with IAM roles that allow secure access to S3 buckets in the same region.
5. Write IAM policies adhering to the principle of least privilege. 
6. Create non public facing s3 bucket, Use AWS KMS to encrypt data in S3 buckets, and ensure S3 buckets have versioning and server access logging enabled.
7. Set up CloudWatch to monitor EC2 instances.
8. Apply appropriate tagging to all resources, which includes 'Environment: Production'.
9. Give Byte size 4 suffix with each resource so that stack dont get error of "resource already exists".
10 .Ensure proper security measures, including the configuration of IAM Roles for EC2 instances, Security Groups, and S3 bucket policies for static content.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
