Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Aslo  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.
3. Create auto scaling group using launch template to manage the instances across these two regions for high availability. Minimum 2 instance in each region and maximum 4 instances in each region
4. Also create ELB for to distribute traffic among the instances.
5. EC2 instances should use latest amazon linux2 ami. Also Implement security groups to allow only HTTPS and SSH connections from specific CIDRs only.
6.Implement Individual RDS in each region but with multiple AZ support for respective regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively.
7. Create Specific security groups  for RDS allowing traffic only from EC2 instances.
8. Utilize Amazon S3 for storing static content, enabling cross-region replication to ensure data resilience also with versioning and lifecycle policy setup for archiving logs to Glacier. 
9. Follow IAM best practices, ensuring all policies are based on the principle of least privilege.
10. Integrate Amazon CloudWatch to monitor the health of the services with predefined alarms for CPU, memory, and disk I/O metrics.
11. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
12 . Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
13. Add proper depends on condition to the resources which are dependent on other resources for creation to avoid conflicts.
14. Define provider block with each resource to avoid region conflicts
15.Configure AWS Config to track all infrastructure changes.
