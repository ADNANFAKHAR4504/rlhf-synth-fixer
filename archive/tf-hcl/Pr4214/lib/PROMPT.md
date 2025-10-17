Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-east-1 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3. Create ec2 instance using amazon linux2 latest AMI. The requirement is to have three different enviornments - dev, staging and prod. But all these resources are required in the same VPC but with respective naming and tagging conventions to separate them easily.
4. Create separate non public S3 bucket for each environment with specific naming and tagging. usage of encryption mechanisms to encrypt data at rest.
5. created required IAM roles with least privileges access to access s3 bcuekt from ec2.
6. Enabled CloudTrail for detailed monitoring of each environemnt.
7. Setup cloudwatch monitoring and SNS alerts  across all environments as specified.
8. . Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists". Also use small characters only for this suffix. keep these suffic environemnt specifics as well to create differentiation.
9. GIve 'Environemnt' tag to each resoruce to differentiate.
10. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
