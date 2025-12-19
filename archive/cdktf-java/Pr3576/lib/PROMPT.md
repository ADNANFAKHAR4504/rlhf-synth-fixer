Build a Java-based CDK for Terraform project that deploys a secure, scalable web application infrastructure in AWS us-east-1.

- The solution must follow a modular design, placing all resources as constructs under a dedicated constructs package.

- Create a VPC with one public and one private subnet, providing internet access for private resources via a NAT Gateway with an Elastic IP.

- Deploy an Application Load Balancer to securely route traffic to EC2 instances in an Auto Scaling group (min 2, max 5) with rolling updates and detailed monitoring enabled.

- Provision an RDS MySQL database with Multi-AZ, automated backups, and KMS encryption, storing credentials in AWS Secrets Manager.

- Apply least-privilege IAM roles, restrict SSH to a specific IP range, and log all network traffic with VPC Flow Logs.

- Set up CloudWatch alarms for CPU utilization above 70% for five minutes, and include an SSM document for automated instance patching.

- Deploy the application using Elastic Beanstalk, enable versioning on S3 buckets for assets, and ensure all data at rest is encrypted.

- Emphasize automation, high availability, and compliance with AWS security best practices, avoid hardcoded values and use modern Java records to manage configuration settings cleanly and type-safely 