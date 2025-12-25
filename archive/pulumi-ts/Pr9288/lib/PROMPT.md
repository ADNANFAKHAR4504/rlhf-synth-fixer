I need to deploy a highly available web application on AWS where all components work together. Here's how the architecture should connect:

Start with an Application Load Balancer that handles incoming traffic and distributes it across EC2 instances in two availability zones. The ALB should terminate SSL and forward requests to the web servers.

The EC2 instances run the application and need to connect to three backend services. First, they access an RDS PostgreSQL database with multi-AZ replication for data persistence. Second, they pull static assets from an S3 bucket with versioning enabled. Third, they use ElastiCache Serverless for caching frequently accessed data to reduce database load.

For security, set up IAM roles that allow EC2 instances to authenticate with S3 and ElastiCache without hardcoded credentials. Grant the instances access to write logs to CloudWatch.

Configure CloudWatch to collect logs from the EC2 instances with 30 day retention. The application logs should flow from EC2 to CloudWatch Logs for monitoring and debugging.

The auto-scaling group should monitor CloudWatch metrics and automatically add or remove EC2 instances based on CPU utilization. Use I8g instances if they fit the workload profile.

Deploy everything in us-east-1 with proper VPC configuration. Tag all resources for cost tracking.

Please provide the complete Pulumi TypeScript infrastructure code with one code block per file.