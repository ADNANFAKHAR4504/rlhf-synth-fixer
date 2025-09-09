Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. EC2 instances should use latest amazon linux2 ami in private subnets in each region. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.
4.  Implement an Auto Scaling Group in us-east-2. 
5 . Incorporate a Load Balancer for the Auto Scaling Group.
6 . Establish a Route 53 health check for the Load Balancer, route53 with DNS name taplivestack.com
7.Set up an S3 bucket in each region with cross-region replication between them, ensuring versioning and KMS encryption using AWS managed KMS key.
8.  Implement IAM roles restricting EC2 instance access to necessary actions only.
9. Apply CloudWatch monitoring across all EC2s, and trigger SNS notifications for specific CloudWatch alarms.
10.  Tag all resources with 'Environment:Production'
