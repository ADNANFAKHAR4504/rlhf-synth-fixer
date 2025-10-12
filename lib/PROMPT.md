Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-east-1 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3.  Implement Individual RDS in each region but with multiple AZ support. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Encrypt data at rest in the RDS instance.
4. . Use Elastic Beanstalk for the web application deployment. 
5.Institute auto-scaling with a minimum of 2 and maximum of 10 instances. Use amazon linux2 latest ami for the EC2 instance.
6.  Configure Route 53 and AWS Certificate Manager for DNS and SSL/TLS. Use route53 domain as - latesttest.com
7. Implement logging, monitoring, and alerting using CloudWatch and SNS. Set cloudwatch for RDS and EC2 instance.
8.Utilize a Blue/Green deployment strategy and CloudFront for content delivery.
9. Ensure compliance with all security constraints including least privilege IAM roles, a configured WAF, and restricted SSH access.
10. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

