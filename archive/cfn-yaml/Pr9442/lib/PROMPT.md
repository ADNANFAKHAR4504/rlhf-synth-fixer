I need a CloudFormation YAML template for deploying a secure web application infrastructure to AWS.

The infrastructure should include an Application Load Balancer that routes traffic to EC2 instances running in an Auto Scaling group. The ALB needs to redirect HTTP requests to HTTPS for security. The EC2 instances connect to an RDS MySQL database that stores application data, and the database access should be restricted by CIDR range through security group rules.

For storage, create an S3 bucket with server-side encryption enabled that the application uses for static files. The EC2 instances need IAM instance profiles with least-privilege policies that allow them to access only the specific S3 bucket and other required AWS resources.

All sensitive data at rest must be encrypted using KMS, including the RDS database and CloudTrail logs. Security groups should allow only necessary traffic and must not expose port 22 publicly.

For compliance and monitoring, enable CloudTrail to log all API activity and set up AWS Config for resource compliance tracking. Both services should integrate with KMS encryption.

Tag all resources with Environment and Owner tags for cost management. The template should be parameterized so I can deploy to different regions without hardcoding values. Make sure it passes CloudFormation validation and cfn-lint checks.
