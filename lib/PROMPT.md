Create infrastructure code using AWS CDK with TypeScript for a secure RDS Aurora MySQL database deployment in us-west-2.

Requirements:
- Deploy RDS Aurora MySQL Serverless v2 cluster in a VPC with private subnets using CIDR blocks 10.30.10.0/24 and 10.30.20.0/24
- Configure Security Groups to allow MySQL traffic on port 3306 only within the VPC
- Enable KMS encryption for database at rest
- Set up CloudWatch monitoring with key metrics like ServerlessDatabaseCapacity and ACUUtilization
- Configure automated backups with 5-day retention period stored in S3
- Use Aurora Serverless v2 scaling capacity between 0.5 and 2 ACUs for cost optimization
- Enable Performance Insights with 7 days retention for database performance monitoring
- The database should support 1,500 daily user sessions

Please provide the complete CDK TypeScript code including:
1. VPC configuration with private subnets
2. RDS Aurora MySQL Serverless v2 cluster setup
3. Security group configurations
4. KMS encryption key
5. CloudWatch alarms for monitoring
6. Backup configuration

Provide each file as a separate code block with the filename clearly indicated.