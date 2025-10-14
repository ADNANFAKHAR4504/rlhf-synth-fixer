
Create an AWS CloudFormation template in JSON for a highly available web environment in the us-west-2 region.

Here are the requirements for the setup:

VPC and Networking:
 Create a VPC with the CIDR block 10.0.0.0/16.
 Set up public and private subnets across three Availability Zones.
 Include an Internet Gateway for the VPC and NAT Gateways in the public subnets to give private instances outbound internet access.

EC2 Instances:
 Launch EC2 instances in the private subnets using the latest Amazon Linux 2 AMI.
 These instances in the private subnets should not have public IPs.

Security:
 Configure Security Groups to allow HTTP and HTTPS traffic.
 Limit SSH access to a specific IP address (you can use a placeholder like 192.168.1.1/32).

IAM & Monitoring:
 The EC2 instances need an IAM role so they can send logs and metrics to CloudWatch and access S3.
 Create an S3 bucket with server access logging enabled.
 Set up a CloudWatch alarm to monitor the CPU usage of the EC2 instances.

Template Features:
 Use parameters for configurable values like instance types and AMI IDs.
 Add an Outputs section to the template to display important resource IDs like the VPC ID, subnet IDs, and NAT gateway IDs after deployment.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.