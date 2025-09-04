Create AWS infrastructure using Terraform HCL to set up a cloud environment with the following components:

1. S3 bucket with versioning enabled for storing project files. Configure the bucket with appropriate security settings and use the new S3 default data integrity protections.

2. RDS PostgreSQL database with Multi-AZ deployment for high availability. Use the latest Graviton2-based instances for better performance and cost optimization.

3. EC2 instance using t2.micro instance type for development activities.

All resources should be deployed in the us-east-1 region. Include proper tagging for resource management and ensure security best practices are followed.

Generate the complete Terraform configuration files needed for this infrastructure setup.