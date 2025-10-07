Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in  regions us-east-2 .So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have  3 private and  3 public subnets in three different Availability zones  Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans.Use NAT Gateways to allow internet access for resources in private subnets. 
3. Launch EC2 instances using the latest Amazon Linux 2 AMI.
4.  Create an S3 bucket with server-side encryption using an AWS KMS key
5. Set up an IAM role for EC2 that allows writing access to CloudWatch Logs. 
6.  Implement Individual RDS in  with multiple AZ support. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. RDS should have automated backup enabled.
7. Set up security groups to restrict SSH access to a specified CIDR.
8. Enable detailed monitoring on all EC2 instances. 
9.Create a DynamoDB table with read/write auto-scaling.
 10. Define a CloudWatch alarm on the RDS instance to trigger alerts if CPU utilization exceeds 80%.
