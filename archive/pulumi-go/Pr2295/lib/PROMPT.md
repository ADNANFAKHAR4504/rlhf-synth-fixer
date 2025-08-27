Design and implement secure infrastructure using Pulumi with Go that meets strict HIPAA compliance requirements. Can you create single tap_stack.go file as per below requirements -
1. There is requirement to have resources deployed in single regions us-east-1 So Please create proper VPC in this region with  specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16. 
2. VPCs should have  private and  public subnets in VPC. Configure other required resources for network configuration as required. 
3. Create EC2 instance in private subnet.
4. Create RDS in private subnet and only EC2 cidr should be accessing the the RDS via security group.
5. Implement IAM role for EC2 and RDS.
6. Create S3 bucket for logging with versioning enabled.
7. Ensure all resources have the tag 'Environment=Development'.

