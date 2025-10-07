Create CloudFormation infrastructure code in JSON format for an e-learning platform database setup with the following requirements:

Set up a MySQL database using Amazon RDS to handle 2,000 daily student records. The database needs to be configured with db.t3.micro instance type in private subnets with CIDR blocks 10.7.10.0/24 and 10.7.20.0/24.

Configure security groups to allow MySQL traffic on port 3306. Enable KMS encryption for data at rest. Set up CloudWatch monitoring with Database Insights Standard mode for performance tracking. Configure automated backups to S3 with 7-day retention period.

The infrastructure should include:
- VPC with two private subnets in different availability zones
- RDS MySQL database instance with Multi-AZ deployment disabled to reduce deployment time
- DB subnet group spanning both private subnets
- Security group for database access on port 3306
- KMS key for encryption with proper key policy
- S3 bucket for database backups with lifecycle policy
- CloudWatch alarms for high CPU utilization and low storage space
- Enable Enhanced Monitoring with 60-second granularity
- Configure automated backups with 7-day retention

Generate the complete CloudFormation template in JSON format as a single code block that can be directly deployed in us-east-1 region.