Below are my requirements to create resources in AWS in two different regions. I need a single tap_stack.tf file as I already have a provider.tf file.But all the variables, locals, resources, outputs etc should be in my tap_stack.tf file only.My requirements are as- 
One is to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary. VPCs should have 2 private and 2 public subnets in each VPC for each region. Also need to establish VPC peering between these two VPCs which are in two different regions, so that resources in these two regions can communicate with each other. This is my netwroking requirement.
My other resources requirements are - create a S3 bucket as well with cross region capability between us-east-2 and us-west-1.create EC2 in both the regions without key pair in appropriate subnets so that they can communicate with each other via VPC peering.
My security requirmenrts are - make sure to use proper IAM roles and Policies for proper security configurations. and create proper security groups and don't make them open to 0.0.0.0/0 instead use subnet or vpc CIDRs wherever needed. also ensure data at rest and data in transit is encrypted for EBS attached to EC2 , for S3 and other resources as well.
For moitoring enable cloud watch monitoring for the EC2 instance in both the regions for better monitoring.
and for DNS failover, set DNS management with a failover policy using route 53 from primary region ec2 to secondar region ec2 in case of failure.

Variables should be like -Define input variables for environment-specific configurations such as VPC CIDR blocks, subnet sizes, and instance types etc. and  Make sure the aws_region variable is used in accordance with the existing provider.tf file.

print below Outputs but don't print any sensitive information- VPC IDs,Subnet IDs,EC2 instance IDs and public/private IPs,VPC peering ID,Route53 entry

Make sure Stack Design should adhere with-All infrastructure should be created from scratch using Terraform modules defined inside the tap_stack.tf file.Do not reference any existing modules or resources.

Mandatorily use below Best Practices - Use proper resource naming conventions for clarity.Include comments explaining key sections of the code.Ensure the Terraform configuration is fully deployable, maintainable, and adheres to standard security and cost practices.
