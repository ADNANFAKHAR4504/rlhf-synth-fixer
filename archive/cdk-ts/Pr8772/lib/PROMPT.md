# Prompt

Build a secure web server infrastructure where an EC2 instance connects to an RDS MySQL database for data persistence and uses an IAM role to store backups in S3. The EC2 instance should serve HTTP traffic through security groups that allow port 80 access while restricting database access to only the application server.

Create a VPC with CIDR block '10.0.0.0/16' distributed across availability zones 'us-east-1a' and 'us-east-1b'. Deploy the EC2 instance in a public subnet so it can receive HTTP traffic, while isolating the RDS instance in private subnets across both availability zones for high availability and security.

Configure security groups so the EC2 instance can communicate with the RDS database on port 3306, but prevent direct external access to the database. The web server should be able to read from and write to an S3 bucket for application data and backup storage through an attached IAM role rather than using hardcoded credentials.

Set up the EC2 instance with Amazon Linux 2 and initialize it with user-data that starts a simple HTTP server on launch. Attach an Elastic IP so the web server maintains a consistent public address. Enable S3 bucket versioning and block public access for secure backup storage that only the EC2 instance can access through its IAM role.

The infrastructure should be deployed in us-east-1 using AWS CDK, with all resources tagged with 'Environment: Dev' for easy identification and management.
