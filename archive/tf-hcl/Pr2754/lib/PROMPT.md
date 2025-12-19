Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements: -
1. There is requirement to have resources deployed in region  us-east-2 . So Please create proper VPC in this region and set specific CIDR for the VPC as 10.0.0.0/16 .Capture VPC Flow Logs
2. VPCs should have private and public subnets . Also crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create 3 ec2 instance with latest amazon linux 2 ami in three different availability zones within this VPC Ensure all instances are in a private subnet
4.  Use an Auto Scaling group to maintain and scale the number of EC2 instances
5. Assign an IAM role to the EC2 instances, granting access to S3 and CloudWatch
6. Set up Route 53 to manage DNS for the instances with the dns name tapstacknewtest.com
7. also  Implement an Application Load Balancer to distribute incoming traffic.
8. Provide internet access to instances using a NAT gateway.
9. Set up CloudWatch metrics for the Auto Scaling group.
10. Implement Individual with automatic backups in a private subnet . Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password. Ensure that all RDS instances are set to not be publicly accessible.Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
11. . Use Security Groups to control the traffic for the EC2 and RDS instances.
12. Enable detailed cloud watch monitoring for the instances.
13. Tag all resources with 'Environment:Production'.

