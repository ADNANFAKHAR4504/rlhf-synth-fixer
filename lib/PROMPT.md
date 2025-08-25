Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-1 and us-west-2 So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-1 primary and us-west-2 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Configure other required resources as well network configuration as required. Utilize Elastic IPs for NAT gateways within each region. Also the VPC peering must be enabled among the VPCs.
3. Create 3 EC2 instances usign amazon linux 2 latest AMI in each region running behind auto scaling group and elastic load balancer.
4. Also create S3 bucket in each region with versioning enabled and the content of these buckets distirbuted using Cloud front. 
5. Deploy an RDS PostgreSQL database in the primary region with a read replica in the secondary region; ensure database placement in a private subnet. Use master random username in plain text with 8 characters and master random pasword including special characters keep length 16.
6. Utilize IAM roles for EC2 instances to adhere to the principle of least privilege.
7.  Assign 'Environment: Production' tag to all resources
8. Set up Route 53 DNS with region failover capability. 
9.  Implement CloudWatch logging for monitoring activities across all services deployed in this stack.
10. Create AWS managed KMS key and use that to encrypt S3 storage.
11. Use provider block with each resource to avoid conflicts as below
provider = aws.us_east_1 for primary region
provider = aws.us_west_2 for secondary region

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
