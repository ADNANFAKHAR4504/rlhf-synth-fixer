Could you please help me to give single tap_stack.tf file , which don't need provider block as that would be taken care of in my another provider.tf file. But all the variables, locals, resources, outputs etc should be in my tap_stack.tf file only. I don't need modular approach for my below requirements. Now my requirements are as follows - 

1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2.. VPCs should have 2 private and 2 public subnets in each VPC for each region.
3. Also Please establish VPC peering between these two VPCs which are in two different regions, so that resources in these two regions can communicate with each other.
4.. Please create a S3 bucket as well with cross region capability between us-east-2 and us-west-1.
5.  Also create EC2 in both the regions without key pair in appropriate subnets so that they can communicate with each other via VPC peering.
6. Please make sure to use proper IAM roles and Policies for proper security configurations.
7. Please create proper security groups and don't make them open to 0.0.0.0/0 instead use subnet or vpc CIDRs wherever needed.
8. Also ensure data at rest and data in transit is encrypted for EBS attached to EC2 , for S3 and other resources as well.
9.. Also Please enable cloud watch monitoring for the EC2 instance in both the regions for better monitoring.
10. Also Please set DNS management with a failover policy using route 53 from primary region ec2 to secondar region ec2 in case of failure.

Please define below Variables -
1. Define input variables for environment-specific configurations such as VPC CIDR blocks, subnet sizes, and instance types etc
2. Make sure the aws_region variable is used in accordance with the existing provider.tf file.

Please print below Outputs but don't print any sensitive information-

1. Provide outputs for essential resources such as:
2. VPC IDs
3. Subnet IDs
4. EC2 instance IDs and public/private IPs
5. VPC peering ID
6. Route53 entry


Stack Design should be -
1. All infrastructure should be created from scratch using Terraform modules defined inside the tap_stack.tf file.
2. Do not reference any existing modules or resources.

Please use below Best Practices
1. Use proper resource naming conventions for clarity.
2. Include comments explaining key sections of the code.
3. Ensure the Terraform configuration is fully deployable, maintainable, and adheres to standard security and cost practices.

PLEASE generate full code response in one Go, Please dont keep extra blank lines just add proper comments for better understading, so that complete response can be generated in one GO.
