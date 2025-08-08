I need to set up a cloud environment on AWS with basic resources. Can you help me create infrastructure code that includes:

1. An S3 bucket with versioning enabled 
2. An EC2 instance using t2.micro type in the us-west-2 region
3. An Elastic IP attached to the EC2 instance
4. A security group that allows SSH access from my IP address only
5. An IAM role for the EC2 instance with S3 bucket access permissions

I want to make sure everything is properly tagged for organization. Also, I heard about some new AWS features like Amazon ElastiCache Serverless and the new storage optimized EC2 I8g instances - could you mention those in comments as potential future enhancements?

Please provide the infrastructure code with one code block per file. Make sure the solution can be deployed and destroyed without issues.