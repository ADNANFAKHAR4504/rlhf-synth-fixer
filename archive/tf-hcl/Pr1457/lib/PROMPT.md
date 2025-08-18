Could you please help me to give single tap_stack.tf file , which don't need provider block as that would be taken care of in my another provider.tf file. But all the variables, locals, resources, outputs etc should be in my tap_stack.tf file only. I don't need modular approach for my below requirements. Now my requirements are as follows - 

1. Create two different environments staging and production in their own VPC  with appropriately sized CIDR blocks 
2. VPCs should have 2 private and 2 public subnets in each VPC for each environment.
3. Use appropriate IAM roles and IAM policies as and when needed.
4. Also please implement VPC peering between these two environments (two VPCs) for effective communication among resources. 
5. Please configure EC2s and ELBs with HTTPS security group configuration only and opens traffic to VPC CIDRs only as per the requirement.
6. Please set up postgres RDS as well keeping all the security consideration and a separate security group for RDS.
7. All the resources are required to be tagged properly including keys as  environment, owner, purpose
8. Also please create cloud watch alarms and cloud watch logging as well for all the resources being created in both the environments.
9. So basically both the environments are identical with the above requirements and  communication setup  , and please create all the resources in us-west-2 region keeping multiple AZs into consideration wherever needed. 

Please define below Variables -
1. Define input variables for environment-specific configurations such as VPC CIDR blocks, subnet sizes, and instance types etc
2. Make sure the aws_region variable is used in accordance with the existing provider.tf file.

Please print below Outputs but don't print any sensitive information-

1. Provide outputs for essential resources such as:
2. VPC IDs
3. Subnet IDs
4. EC2 instance IDs and public/private IPs
5. VPC peering ID

Stack Design should be -
1. All infrastructure should be created from scratch using Terraform modules defined inside the tap_stack.tf file.
2. Do not reference any existing modules or resources.

Please use below Best Practices
1. Use proper resource naming conventions for clarity.
2. Include comments explaining key sections of the code.
3. Ensure the Terraform configuration is fully deployable, maintainable, and adheres to standard security and cost practices.
