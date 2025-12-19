You need to build a secure and scalable AWS setup using Python and AWS CDK (Cloud Development Kit).
Your goal is to automate the setup of important AWS resources with CloudFormation.

Here’s what you need to do:

Create a highly available architecture using EC2, RDS, and an Elastic Load Balancer.

Add IAM roles with least-privilege access, including one role with read-only EC2 permissions.

Set up an S3 bucket with versioning and proper security.

Use the AWS SDK (boto3) to create resources programmatically and a Lambda function for monitoring.

Configure security groups with minimal exposure, and make sure everything is well-tagged and logged.

Output:
Write a Python CDK script that defines and deploys this setup.
It should show stack verification results, follow security best practices, and include clear logs of all actions.
