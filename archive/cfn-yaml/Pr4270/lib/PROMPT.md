Create a CloudFormation YAML template that deploys a highly available and secure web application in the eu-central-1 region. The infrastructure should be designed with scalability, fault tolerance, and security in mind, following AWS best practices.

The stack should define a VPC with both public and private subnets across at least two availability zones to support high availability. An Application Load Balancer should handle incoming traffic over HTTPS, distributing it evenly across EC2 instances running on t3.micro type with the latest Amazon Linux 2 AMI. Enable auto scaling for these instances based on CPU utilization to ensure consistent performance under load.

Deploy a multi-AZ RDS instance (db.t3.micro) for the database layer, ensuring automated backups with a 7-day retention period. All data at rest, including that in S3 buckets, must be encrypted with AES-256, and SSL must be enforced for all data in transit. Configure a dedicated S3 logging bucket with lifecycle policies for automatic archiving of logs.

Integrate a CloudFront distribution to serve cached web content for 24 hours, with logging enabled to the logging S3 bucket. Ensure IAM roles are created with the principle of least privilege, granting only necessary permissions such as cloudwatch:PutMetricData. Security groups must restrict inbound traffic to ports 80 and 443 only.

The stack should include a CodePipeline and CodeBuild setup to automate CI/CD for deploying the web application. All resources must be tagged with 'Environment: Production', adhere to CloudFormation naming conventions, and be deployed exclusively in eu-central-1.

The final output should be a fully functional CloudFormation YAML template that validates successfully and can be deployed without manual intervention, implementing all security, scalability, and compliance measures as described.