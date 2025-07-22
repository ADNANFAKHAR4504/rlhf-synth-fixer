The CloudFormation template must create a VPC with a CIDR block of 10.0.0.0/16.
 
 A single public subnet within the VPC must be created, with a CIDR block of 10.0.1.0/24.
 
 Attach an Internet Gateway to the VPC to allow public access to instances.
 
 Create a route table associated with the public subnet that routes 0.0.0.0/0 traffic to the Internet Gateway.
 
 Ensure the security group allows inbound HTTP (port 80) traffic from anywhere and SSH (port 22) only from a specific IP block (e.g., 203.0.113.0/24).

The CloudFormation stack will be deployed in the us-east-1 region. All resources should be tagged with the key 'Environment' and the value 'Production'.