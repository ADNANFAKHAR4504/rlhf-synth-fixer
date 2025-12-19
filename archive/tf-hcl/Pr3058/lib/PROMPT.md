Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements in  us-west-1 region -
1. There is requirement to have resources deployed in region  us-west-1 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .
2. VPCs should have 2 private and 2 public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Configure an Elastic Load Balancer to manage incoming traffic across multiple instances.
4. Implement Auto Scaling policies to handle changing load conditions for EC2 instances. Use amazon linux 2 latest AMI to create these ec2 instances
5.  Set up a Multi-AZ RDS database to ensure database availability and failover capability. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
6. Use CloudWatch alarms to notify about critical issues.
7. Incorporate best practices for securing IAM roles and tracking account activities. For least privileged access to DB.
8.  Implement Route 53 with health checks to monitor endpoints of Load balancer.  Create route 53 domain as tapstacknew.com.
9. Include inline comment for clarity.
10. Give Byte size 4 suffix with each resource so that stack dont get error of "resource already exists".
11 .Ensure proper security measures, including the configuration of IAM Roles for EC2 instances, Security Groups, and S3 bucket policies for static content.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
