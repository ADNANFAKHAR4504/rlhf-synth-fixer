Could you please help me to give single tap_stack.tf file for the complete below requirments terraform code , which don't need provider block as that would be taken care of in my another provider.tf file. But all the variables, locals, resources, outputs etc should be in my tap_stack.tf file only. I don't need modular approach for my below requirements. Now my requirements are as follows - 

1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2.. VPCs should have 2 private and 2 public subnets in each VPC for each region.
3. Also need to establish VPC peering between these two VPCs which are in two different regions, so that resources in these two regions can communicate with each other.
4.. And create a S3 bucket as well with cross region capability between us-east-2 and us-west-1.
5.  Also create EC2 in both the regions without key pair in appropriate subnets so that they can communicate with each other via VPC peering.
6. Can you make sure to use proper IAM roles and Policies for proper security configurations.
7. Can you create proper security groups and don't make them open to 0.0.0.0/0 instead use subnet or vpc CIDRs wherever needed.
8. Also ensure data at rest and data in transit is encrypted for EBS attached to EC2 , for S3 and other resources as well.
9.. Also can you enable cloud watch monitoring for the EC2 instance in both the regions for better monitoring.
10. Also could you set DNS management with a failover policy using route 53 from primary region ec2 to secondar region ec2 in case of failure.

Can you define below Variables -
Define input variables for environment-specific configurations such as VPC CIDR blocks, subnet sizes, and instance types etc
Can you Make sure the aws_region variable is used in accordance with the existing provider.tf file.

Please print below Outputs but don't print any sensitive information-

Provide outputs for essential resources such as:
VPC IDs
Subnet IDs
EC2 instance IDs and public/private IPs
VPC peering ID
Route53 entry


Make sure Stack Design should adhere with  -
All infrastructure should be created from scratch using Terraform modules defined inside the tap_stack.tf file.
Do not reference any existing modules or resources.

Mandatorily use below Best Practices
Use proper resource naming conventions for clarity.
Include comments explaining key sections of the code.
Ensure the Terraform configuration is fully deployable, maintainable, and adheres to standard security and cost practices.

