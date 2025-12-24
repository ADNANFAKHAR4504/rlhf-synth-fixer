Need a CloudFormation template for us-west-2. Basic setup - S3, EC2, DynamoDB.

Here's what I'm looking for:

S3 bucket with versioning. Bucket name needs to be a param.

EC2 instance. Needs VPC ID and subnet ID as params, also instance type. We'll provide those when we deploy.

IAM role for EC2 - ONLY s3:ListBucket permission. Last time someone gave it s3:* and we got flagged in the security audit.

Security group for SSH - just our office IP (203.0.113.0/32 placeholder, make it a param though). Not opening SSH to 0.0.0.0/0.

CloudWatch alarm for CPU > 70%. Instances keep spiking and nobody notices until things break.

DynamoDB table. Table name as param, primary key name as param, set read capacity to 5.

Tag everything Project: CloudSetup. Finance wants to track what this costs.

Call it TapStack.yml. Don't need docs, just the template.  
