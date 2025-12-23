Need to set up a secure production environment in AWS using CloudFormation. We're deploying a multi-tier web app with load balancing and auto scaling.

Start with VPC spanning two availability zones with public and private subnets. NAT gateways in public subnets route outbound traffic from private subnets while blocking inbound. Internet gateway attached to VPC for public subnet internet access.

Application Load Balancer in public subnets forwards HTTP traffic to target group. Auto Scaling Group launches EC2 instances in private subnets across both AZs with minimum 2 instances. Security groups restrict traffic so ALB only accepts HTTP/HTTPS from internet, and instances only accept traffic from ALB on port 80.

For compliance and auditing, enable CloudTrail logging all API calls to encrypted S3 bucket. KMS key encrypts CloudTrail logs. AWS Config tracks resource configuration changes and delivers findings to S3 bucket every 24 hours.

IAM role for EC2 instances grants permissions to write CloudWatch logs and read SSM parameters. Separate IAM role for AWS Config allows it to access resources and write to S3.

Lambda function handles S3 bucket cleanup on stack deletion. Function needs IAM role with permissions to delete S3 objects and manage CloudWatch logs.

All resources tagged with Environment Production and Project IaC - AWS Nova Model Breaking. Use prod- prefix for resource names. Region is us-west-2.
