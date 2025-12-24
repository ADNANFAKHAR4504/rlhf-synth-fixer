I need a CloudFormation template in YAML for a production ready web application environment.

Build a VPC with public and private subnets across two Availability Zones.

Service connectivity and data flow

1.  An internet facing load balancer should sit in the public subnets and forward traffic to EC2 instances behind it.
2.  The EC2 instances should run in an Auto Scaling Group in private subnets and reach the internet for updates through a NAT Gateway.
3.  The NAT Gateway must be in a public subnet and route outbound traffic through an Internet Gateway attached to the VPC.
4.  The EC2 instances need an IAM role that allows them to read from and write to an encrypted S3 bucket for application assets.
5.  Enable CloudTrail and deliver audit logs to S3.
6.  Create CloudWatch alarms for high CPU that publish to an SNS topic for notifications.

Security requirements

7.  Security groups must only allow inbound HTTP and HTTPS to the load balancer and only allow the load balancer to reach the instances.
8.  Do not open SSH to the internet.

Requirements

9. Use us east 1.
10. Add parameters for environment name and department tags.

Deliverable

Produce the CloudFormation YAML template that implements the above and keeps the relationships between the services explicit.
