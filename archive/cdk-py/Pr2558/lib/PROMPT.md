Hey there! I need your help designing a secure and scalable AWS cloud environment using AWS CDK with Python. The setup should include a bunch of AWS services working together seamlessly. Here's what I'm looking for:

First, I want to deploy a Lambda function that processes incoming data streams. This Lambda should be triggered by an API Gateway, so we’ll need to set that up too. For storage, I need an S3 bucket with server-side encryption enabled and versioning turned on. 

We’ll also need a DynamoDB table with a primary key and a sort key for storing structured data. And for sensitive configuration data, let’s use Parameter Store to manage it securely.

On the networking side, I want a VPC with both public and private subnets. The private subnets should have Internet access via a NAT Gateway. Inside the private subnet, we’ll deploy an RDS instance for data management. For compute, let’s set up an Application Load Balancer to distribute traffic to a group of EC2 instances.

Security is super important here. All IAM roles and users should follow the principle of least privilege, and we’ll define inline policies for everything. Also, make sure CloudWatch logging is enabled for all the services we’re using. 

Finally, I’d like to set up an SNS topic to send notifications whenever there are changes to resource configurations. And don’t forget to tag all resources with `Environment: EnvirontmentSuffix`. Everything should be deployed in the `us-west-2` region.

Can you help me build this setup using AWS CDK and Python?