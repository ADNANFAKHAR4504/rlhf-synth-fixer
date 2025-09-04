Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-1 and us-west-2 So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-1 primary and us-west-2 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Configure other required resources as well network configuration as required. Utilize Elastic IPs for NAT gateways within each region
3. Utilize at least three Availability Zones in each of the regions for high availability.
4. Deploy EC2 instance in each region with t3.medium instance type and create specific security group for Ec2 instances. Also The application deployed would be a web application so put the ec2 in right subnet accordingly.
5. Create Application load balancer as well for above EC2 to manage the traffic effectively. Implement Auto Scaling to manage EC2 instances according to traffic needs. with minimum 1 instance and maximum 3 instances
6. security measures allowing only HTTP and HTTPS traffic from specific CIDRs only.
7. Create RDS in each region and create it own specific security groups allowing traffic only from the EC2 in its VPC. Also ensure the data at rest is encrypted using AWS managed KMS key. SO create KMS key as well.
8. Ensure RDS master username and master password is created randomly.
9. Create S3 bucket in primary region only. And create Amazon CloudFront to with this S3 bucket as origin to distribute content effective.
10. Store all the logs in cloud watch for better monitoring, so create the resources accordingly. 
11. Apply IAM roles to EC2 instances to strictly control access to necessary services with least privilege.
12.  Ensure all the resources are tagged with  'Environment: Production'.
13.Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
14. Use provider block with each resource to avoid conflicts as below
provider = aws.us_east_1 for primary region
provider = aws.us_west_2 for secondary region

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.

