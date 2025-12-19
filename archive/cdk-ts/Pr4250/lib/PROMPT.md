# Healthcare Patient Data Processing System - Disaster Recovery Implementation

I need help setting up a disaster recovery solution for our patient records management system. We run our primary operations in Singapore (ap-southeast-1) and need a DR site in Sydney (ap-southeast-2).

## What we need:

Our system processes sensitive patient data through containerized applications. We need infrastructure that ensures we can recover quickly if something happens to our primary region while staying compliant with healthcare regulations.

### Database Setup
- Primary database in Singapore with Multi-AZ for local redundancy
- A read replica in Sydney that stays synchronized with minimal lag (under 15 minutes)
- Use Aurora Serverless v2 for cost-efficient scaling
- Database credentials should be stored securely and rotated automatically every 30 days
- Enable automated backups with cross-region replication

### Application Infrastructure
- ECS Fargate clusters in both Singapore and Sydney regions
- The containerized applications should have identical configurations in both regions
- Use a simple web application container (nginx) for the ECS tasks
- Session data needs to be cached using ElastiCache Redis in both regions
- File storage using EFS that can be accessed by the ECS tasks

### Security Requirements
- All sensitive data must be encrypted both when stored and during transmission
- Use KMS keys for encryption with automatic rotation enabled
- Database credentials must be managed through Secrets Manager
- Ensure proper IAM roles and security groups restrict access appropriately

### Network Setup
- VPCs in both regions with private and public subnets across multiple availability zones
- Application Load Balancers to distribute traffic to ECS tasks
- VPC peering or transit gateway is not required - each region operates independently

## Important Notes:

Please provide the infrastructure code that creates all these resources. Our goal is to achieve recovery within 1 hour if the primary region fails, and we cannot lose more than 15 minutes of data.

Make sure to use AWS best practices for multi-region deployments and include proper tagging for resource management. Structure the code in a modular way with separate constructs or stacks for different components.

Please provide complete, production-ready code with one code block per file.