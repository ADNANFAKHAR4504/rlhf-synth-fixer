Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
 1. There is requirement to have resources deployed in single region us-west-2. So Please create proper VPC in this region. set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for this region.
2. VPCs should have 2 private and 2 public subnets in VPC.
3. Create non public facing S3 bucket and Utilize AWS managed KMS keys for server-side encryption of S3 buckets. So create AWS managed KMS key as well.
4. Also  Configure all S3 buckets to deny public access explicitly.
5. Create EC2 in the private subnet and ensure security group allows tariffc only on port 443 over HTTPS from the specific CIDR of the VPC.
6. IAM roles should be configured per best practices of least privilege.
7. Enable AWS CloudTrail for logging activities and logging API calls across all the AWS resources being created in this stack.
8. Implement VPC Endpoints for private connectivity to AWS S3 services from within the VPC.
8.  Mandatory Implement and require multi-factor authentication (MFA) on login for IAM users. 
9. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
