Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .Capture VPC Flow Logs
2. VPCs should have 2 private and 2 public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create 3 ec2 instance with latest amazon linux 2 ami in different availability zones within this VPC Ensure all instances are in a private subnet
4.   Create an Auto Scaling Group (ASG) for EC2 instances to maintain the desired count and perform automatic scaling based on load.
5.  Use an Elastic Load Balancer (ELB) to distribute incoming application traffic across multiple instances in the ASG.
6.  Implement Individual RDS with automatic backups in a private subnet . Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
7. . Implement AWS CloudWatch Alarms to monitor EC2 instances and send notifications on critical health changes. 
8. Set up AWS Backup for automated backup and recovery solutions for database and instances.
9.  Configure Amazon Route 53 to manage domain name resolution for the application with doamin name - NewTestlive.com
10 .Ensure proper security measures, including the configuration of IAM Roles for EC2 instances, Security Groups, and S3 bucket policies for static content.
11. Enable audit and compliance checks by configuring CloudTrail to capture API logs and use AWS Trusted Advisor for insights.

12. Implement AWS Systems Manager Document to automate routine maintenance tasks, including patching and updates.v
