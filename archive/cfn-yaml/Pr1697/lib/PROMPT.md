I need a CloudFormation YAML template that sets up a scalable and secure web application in the us-east-1 region. The infrastructure should follow AWS best practices for high availability and security.

Here’s what I want included in the stack:

A new VPC with two public subnets and two private subnets, spread across at least two availability zones.

An Application Load Balancer (ALB) deployed in the public subnets, listening on HTTPS (port 443).

An Auto Scaling Group for the app servers, running the latest Amazon Linux 2 AMI, with a minimum of 2 and a maximum of 5 instances.

A Multi-AZ RDS database that has encryption at rest enabled. The database credentials should be stored securely in AWS Secrets Manager, and the application servers must be able to fetch them using an IAM role.

A CloudWatch alarm that triggers when EC2 CPU usage goes above 70%, so it can be used for scaling actions.

An S3 bucket for static content, with versioning enabled.

Every resource in the stack should be tagged with Environment: Production.

Please make sure the whole setup is defined in a single CloudFormation stack targeting us-east-1. At the end of the template, output the DNS name of the ALB so I can easily access the application once everything is deployed.

The output should be a valid CloudFormation YAML template that I can deploy directly.
