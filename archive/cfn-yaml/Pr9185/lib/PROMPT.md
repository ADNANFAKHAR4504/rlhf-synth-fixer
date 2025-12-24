I need help writing a CloudFormation template in YAML for a secure baseline VPC stack.

The stack should create a VPC with two public subnets and two private subnets across two Availability Zones.

Network connectivity requirements

1. Public subnets must route outbound traffic to the internet through an Internet Gateway attached to the VPC.
2. Private subnets must route outbound traffic through a NAT Gateway deployed in a public subnet so instances in private subnets can reach the internet without being directly reachable.

Logging and monitoring requirements

3. Enable VPC Flow Logs and send the flow log data to a CloudWatch Logs log group via an IAM role.
4. Create an encrypted S3 bucket for application artifacts and configure it to write access logs to a separate logging bucket.

Security requirements

5. Define a security group that allows inbound SSH only from 192.168.1.0/24 and blocks other inbound traffic.

Expected output

A CloudFormation YAML template that provisions the resources above and clearly wires the relationships between them so the connectivity and logging flows are explicit.
