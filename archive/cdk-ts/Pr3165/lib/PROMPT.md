I need a CDK project in TypeScript to set up a secure foundation for a new web application in the us-east-1 region.

Let's start with the network. Define a new VPC with the CIDR block 10.0.0.0/16. Inside it, create three subnets, each with a /24 netmask: two public and one private. The setup should include an Internet Gateway with routes for the public subnets.

For the application servers, let's place the EC2 instances in the private subnets for better security. Instead of using a bastion host or opening SSH ports from the internet, set up an EC2 Instance Connect Endpoint. This will be our modern, secure way to connect to the private instances for maintenance.

Next, for the database, set up an RDS instance in the private subnet. It's critical to enable Multi-AZ for high availability. To make future database updates safer with near-zero downtime.

The most important part is the secure connection between the application and the database. The RDS instance's security group must be configured to only allow inbound traffic on its database port from the EC2 security group.

Also, please ensure CloudWatch monitoring is enabled for any EC2 instances launched, and attach a basic, least-privilege IAM role to them. For management, please make sure all resources created by the stack are tagged systematically by iac-rlhf-amazon tag.

Please provide the complete CDK TypeScript infrastructure code. Provide each file in its own code block with the file path clearly indicated.
