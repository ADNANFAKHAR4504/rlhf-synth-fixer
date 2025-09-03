Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfils the following security and infrastructure requirements:
1. There is requirement to have resources deployed in single region us-west-2. So Please create proper VPC in this region. set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for this region.
2. VPCs should have 2 private and 2 public subnets in VPC.
3. Create an EC2 instance using the amazon linux2 latest ami. keep the instance type as t2.micro.
4. Security Group attached to this EC2 allowing access only from specific CIDR.
5. Implement an Elastic Load Balancer (ELB) to distribute traffic across instances.
6. Utilize Auto Scaling using launch template with latest amazon Linux 2 ami to automatically adjust the number of instances and keep minimum 2 and maximum 5 instances.
7. Define an IAM Role and an Instance Profile to be associated with the EC2 instances for access to required AWS services.
8. Useamazon managed kms key to encrypt data at rest.
9. Configure a CloudFront distribution with secure HTTPS mappings.
10. Monitor and log activities using AWS CloudWatch and CloudTrail for all the reosurces being created in this stack.
11. Create S3 bucket if required for the logging part.
12. Use GuardDuty for security analysis. 
13. Automatically take snapshots and backups as needed.
14. Tag all resources with 'Environment:Production' 
15 . Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

I have provider block defined as in different provider.tf file already -

provider "aws" {
  region = var.aws_region
}

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements. 

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources

