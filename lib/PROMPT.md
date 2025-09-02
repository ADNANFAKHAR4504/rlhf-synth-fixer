Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed  region us-east-2  So Please create proper VPC in  region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the vpc.
2. VPCs should have  2 private and 2  public subnets in VPC . Aslo  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Private subnets must route internet-bound traffic via the NAT gateway. Each subnet should span across different avaibitliy zones for high avaibility. 
3.  Deploy a pair of EC2 instances (t2.micro type) in each private subnet with latest amazon linux 2 ami.
4. Tag all resources with 'Cost Center', 'Environment', and 'Project' keys for easy tracking.
5. Define provider block with each resource to avoid region conflicts
