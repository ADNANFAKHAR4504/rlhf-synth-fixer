Create a CloudFormation YAML template for a VPC-based infrastructure in us-west-2 where EC2 instances connect to S3 through IAM roles for read-only access.

The VPC should have public and private subnets deployed in different Availability Zones. Public subnets connect to the internet through an Internet Gateway, while private subnets route outbound traffic through a NAT Gateway for secure internet access.

Deploy t3.micro EC2 instances in the public subnet with an attached IAM instance profile. The IAM role grants S3 read-only permissions, allowing the instances to retrieve objects from S3 buckets.

Create an S3 bucket that receives CloudWatch Logs exports. The bucket policy should allow the CloudWatch Logs service to write log data to the bucket.

Configure route tables that direct traffic appropriately - public route table connects to the Internet Gateway, and private route table routes through the NAT Gateway.

Tag all resources with Name and Environment keys for identification and cost tracking.

Output a single YAML CloudFormation template that validates with cfn-lint and deploys without modification.
