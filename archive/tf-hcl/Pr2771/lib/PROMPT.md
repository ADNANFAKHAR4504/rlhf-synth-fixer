Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region.
3.  Implement Individual RDS in each region but with multiple AZ support for respective regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
4.Utilize Amazon S3 for storing static content, enabling cross-region replication to ensure data resilience .All S3 buckets must be encrypted using AES256 for data protection.Enable versioning on all S3 buckets to prevent accidental data deletion or loss.
5. EC2 instances in multiple availability zones should use latest amazon linux2 ami. 
6.An Elastic Load Balancer to handle web traffic across multiple instances. 
7. EC2 instances in an Auto Scaling group to manage load dynamically.
8.  Secure IAM roles, policies, and a Bastion Host for management access.
9. Use of AWS Secrets Manager for sensitive information. 
10. Setup CloudWatch for monitoring and alerting.
11. Proper Route 53 configurations for DNS management and the DNS name should be tapstacktestlive.com
12. The solution must meet high availability, security, and performance norms while adhering to cost-efficient practices.
13. Tag all resources with 'Environment:Production'
