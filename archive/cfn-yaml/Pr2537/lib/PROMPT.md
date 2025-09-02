Develop a production-ready CloudFormation template in YAML named networking_setup.yaml that provisions a robust network infrastructure in the us-west-2 region. The template must consistently pass AWS CloudFormation validation and adhere to security best practices.

Requirements:

VPC Setup

Create a VPC with CIDR block 10.0.0.0/16.

Deploy resources in us-west-2.

Subnets

Two public subnets, each in a different Availability Zone.

Two private subnets, each in a different Availability Zone.

Assign distinct CIDR blocks to each subnet.

Internet Access & Routing

Internet Gateway attached to the VPC.

Route tables configured:

Public subnets route outbound traffic via Internet Gateway.

Private subnets route outbound traffic via a NAT Gateway.

No direct Internet Gateway route for private subnets.

NAT Gateway

Deploy a NAT Gateway in one of the public subnets.

Associate an Elastic IP with the NAT Gateway.

EC2 Instances

Launch one t2.micro instance in each private subnet.

Configure a security group allowing SSH access only from 203.0.113.0/24.

Auto Scaling Group (ASG)

Create a Launch Configuration referencing a specific AMI.

Deploy an ASG spreading instances across both private subnets.

Configure scaling policies based on CloudWatch alarms (e.g., CPU utilization).

IAM & Security

Define IAM roles and instance profiles allowing EC2 instances to read/write to a designated S3 bucket.

Ensure all S3 buckets used have encryption enabled (data at rest).

Monitoring

Configure CloudWatch Alarms to monitor CPU usage.

Scaling actions should trigger automatically when thresholds are breached.