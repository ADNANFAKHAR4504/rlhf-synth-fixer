I need to set up a complete multi-tier AWS infrastructure for a web application. The traffic should flow through a Load Balancer to EC2 instances, which then connect to an RDS database for data storage.

Here's how the pieces need to connect:

Start with traffic hitting the Load Balancer, which routes it to EC2 instances in an Auto Scaling group across two availability zones. These EC2 instances live in a VPC with public subnets. They need to talk to an RDS database sitting in private subnets - only the EC2 instances should be able to reach the database through security group rules, and all that traffic should be encrypted with KMS.

The EC2 instances should log everything to CloudWatch, and I need alarms set up to watch for high CPU or memory usage. The Load Balancer should also send its access logs to S3, then automatically move them to GLACIER after 30 days to save on storage costs.

For the static content, set up CloudFront to serve files from the S3 bucket with a 24-hour cache.

On the security side, don't put any access keys on the EC2 instances. Instead use IAM roles with instance profiles that let them read from S3, write to CloudWatch, and access the database. Give each role only the permissions it actually needs.

Build this in us-west-2 using CloudFormation. Make sure everything's encrypted where it matters (EBS volumes, RDS data), tag everything with Environment=Production so we can track costs, and the template needs to pass CloudFormation validation.
