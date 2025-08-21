Could you please help me to give single tap_stack.tf file , which don't need provider block as that would be taken care of in my another provider.tf file. But all the variables, locals, resources, outputs etc should be in my tap_stack.tf file only. I don't need modular approach for my below requirements. Now my requirements are as follows - 

1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2.. VPCs should have 2 private and 2 public subnets in each VPC for each region.
3. Deploy RDS in each regions in private subnet and separate RDS security group. Also setup data backup retention for 7 days. also Please ensure that data at rest and data in transit is encrypted and secure.
4. Set up AWS IAM to manage user and service permissions and ensure multi-factor authentication for all users
5. Secure the complete environment by configuring alerts for unauthorized access attempts 
6. Setup cloud watch logging for all the resources being created in this stack eg RDS, IAM etc  and monitoring for all resources
7. Please create proper security groups and don't make them open to 0.0.0.0/0 instead use subnet or vpc CIDRs wherever needed.

Please define below Variables -
1. Define input variables for environment-specific configurations such as VPC CIDR blocks, subnet sizes, and instance types etc
2. Make sure the aws_region variable is used in accordance with the existing provider.tf file.

Please print below Outputs but don't print any sensitive information-
Provide outputs for essential resources such as:
1. VPC IDs
2. Subnet IDs
3. RDS Details
4. MFA details

Stack Design should be -
1. All infrastructure should be created from scratch using Terraform modules defined inside the tap_stack.tf file.
2. Do not reference any existing modules or resources.

Please use below Best Practices
1. Use proper resource naming conventions for clarity.
2. Include comments explaining key sections of the code.
3. Ensure the Terraform configuration is fully deployable, maintainable, and adheres to standard security and cost practices.
