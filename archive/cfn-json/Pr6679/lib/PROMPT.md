Create an AWS CloudFormation template in JSON for a scalable web application environment in the us-west-1 region.

Here are the requirements for the setup:

VPC and Networking: Create a VPC with public and private subnets spanning at least two Availability Zones. Include an Internet Gateway for the VPC. Internet access must be restricted to public subnets and private subnets should not have direct internet access.

IAM Strategy: Define an IAM strategy including user roles for 'admin', 'developer', and 'read-only'. Ensure all IAM roles have policies attached that follow the principle of least privilege.

S3 and CloudFront: Establish an S3 bucket with versioning enabled for backups. Set up a CloudFront distribution for the S3 bucket with caching behaviors that optimize static content delivery.

RDS Database: Deploy an RDS instance with Multi-AZ support and configure an automatic backup policy set to retain backups for 7 days.

ECS Deployment: Utilize Amazon ECS to deploy a containerized web application, ensuring autoscaling is configured with a minimum of 2 and maximum of 10 instances.

Security: Include a Bastion Host in a public subnet to manage resources in private subnets using SSH. Encrypt all data at rest using KMS keys for S3 and RDS resources.

Monitoring and Alerts: Implement CloudWatch for monitoring ECS tasks and RDS metrics and set up alerts for CPU utilization over 80%. Define an SNS topic to send notifications for any CloudWatch alarms triggered.

Tagging: All resources must have corresponding tags for 'Environment':'Production' and 'Project':'WebApp'.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.
