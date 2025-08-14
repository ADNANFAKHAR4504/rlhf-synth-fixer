I need to deploy a highly available web application on AWS using infrastructure as code. Here are the requirements:

I want to set up an auto-scaling web application stack that can handle varying traffic loads. The application should use EC2 instances spread across two availability zones for high availability. I need a PostgreSQL database with multi-AZ setup for data persistence.

For static content, I want to use S3 with versioning enabled so I can track changes to assets. All resources should be deployed in the us-east-1 region.

The infrastructure should include proper SSL termination using an Application Load Balancer. I also need CloudWatch logging configured with 30 days retention for monitoring and debugging.

For security, please set up IAM roles so EC2 instances can securely access other AWS services without hardcoded credentials.

Since this is for production use, I want to leverage some newer AWS capabilities. Please include Amazon ElastiCache Serverless for caching to improve application performance, and use the latest EC2 I8g instances if suitable for the workload.

All resources need to be properly tagged for cost tracking and resource management. The code should be modular and well-organized.

Please provide the infrastructure code with one code block per file needed.