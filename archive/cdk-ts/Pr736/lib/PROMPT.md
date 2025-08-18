I need help setting up a cloud environment on AWS using CDK TypeScript. Here are my requirements:

Create a VPC with one public subnet and one private subnet. The public subnet should connect to the internet through an internet gateway, and the private subnet should access the internet via a NAT gateway.

Deploy a t2.micro EC2 instance in the public subnet with SSH access restricted to specific IP ranges (use security group).

Set up an AWS Lambda function using the latest Python runtime that gets triggered when files are uploaded to an S3 bucket.

When the Lambda function executes, it should publish a message to an SNS topic.

Create an IAM role with the necessary permissions for the Lambda function to access S3 and SNS.

Tag all resources with Environment: Production.

Use resource naming with the prefix "cf-task-" followed by the resource type.

Also, please consider using the new AWS Network Firewall with active threat defense feature for enhanced VPC security and VPC Block Public Access for additional network controls.

Please provide the complete infrastructure code with one code block per file.