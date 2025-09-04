Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Aslo  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create auto scaling group using launch template to manage the instances across these two regions for high availability. Minimum 2 instance in each region and maximum 4 instances in each region
4. Also create ELB for to distribute traffic among the instances.
5. EC2 instances should use latest amazon linux2 ami. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.
6.Implement Individual RDS in each region but with multiple AZ support for respective regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.
7. Create Specific security groups  for RDS allowing traffic only from EC2 instances.
8. Utilize Amazon S3 for storing static content, enabling cross-region replication to ensure data resilience.
9. Follow IAM best practices, ensuring all policies are based on the principle of least privilege.
10 Configure Amazon Route 53 for DNS management that is capable of automatic failover using health checks. Keep the hosted zone as 'taskloadnew.com' as default.
11. Include AWS Lambda functions for orchestrating backup operations in each region for RDS.
12. Integrate Amazon CloudWatch to monitor the health of the services with predefined alarms for CPU, memory, and disk I/O metrics.
13. Set up Amazon SNS to send notifications to the operations team in case of a failover or other critical events.
14. Tag all resources with 'Environment:Production' .
15 . Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
16. Define provider block with each resource to avoid region conflicts
