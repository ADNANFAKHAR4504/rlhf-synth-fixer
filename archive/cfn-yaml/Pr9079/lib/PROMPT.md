Need a CloudFormation template for us-west-2. Setting up a small environment where EC2 talks to S3, with DynamoDB for metadata storage.

Here's the setup:

S3 bucket with versioning. Bucket name as param. The EC2 instance will need to list contents of this bucket.

EC2 instance deployed in a VPC/subnet - both should be params. Instance type also parameterized. This instance uses an IAM role to access the S3 bucket - ONLY s3:ListBucket permission, nothing more. Last time someone gave it s3:* and we got flagged in the security audit.

Security group protecting the EC2 instance - SSH access restricted to just our office IP. Use 203.0.113.0/32 as placeholder, make it param. Not opening to 0.0.0.0/0.

CloudWatch alarm monitoring the EC2 instance - trigger when CPU exceeds 70%. Our instances keep spiking and nobody notices until things break. Alarm should watch the EC2's CPU metrics.

DynamoDB table for storing config metadata. Table name as param, primary key name as param, read capacity 5. The EC2 will write config data here.

Tag everything Project: CloudSetup. Finance wants to track what this environment costs.

Call it TapStack.yml. Just need the template, no docs.  
