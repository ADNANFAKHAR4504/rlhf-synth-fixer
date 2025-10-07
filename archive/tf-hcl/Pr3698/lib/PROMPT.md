Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-west-2 and eu-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-west-2 primary and eu-west-1 as secondary.
2. VPCs should have 2 private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3. Utilize Amazon CloudFront to distribute content as a Content Delivery Network (CDN).
4. Ensure the application is deployed in at least two AWS regions to maintain redundancy.
5. Configure all Amazon S3 buckets to have versioning enabled.
6. Implement Individual RDS in each region but with multiple AZ support for respective regions. Use random master user name of length 8 without special characters and it should start with alphabet. and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS. Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. Encrypt data at rest in the RDS instance.
7.  Implement a policy of least privilege for IAM roles accessing the S3 buckets. 
8.  Integrate AWS WAF with the CloudFront distribution to secure the application. 8
9.Set up an SSL/TLS certificate through AWS Certificate Manager for application security. 
10. Ensure the application can auto-scale between 2 to 5 EC2 instances based on load. So setup an auto scaling for ec2 instances using latest amazon linux 2 ami.
11. Activate detailed cloud watch monitoring on all EC2 instances for better insights.
12. Store database credentials securely using AWS Systems Manager Parameter Store. 
13. Utilize Amazon Route 53 for DNS management, employing a failover routing policy. Use DNS multiregiontask.com
14. Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists".
