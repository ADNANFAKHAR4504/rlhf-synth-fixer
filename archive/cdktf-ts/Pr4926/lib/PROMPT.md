# Healthcare Database Infrastructure Setup

I need help setting up database infrastructure for a patient portal application that needs to be HIPAA compliant. The system will handle sensitive patient data and needs to be highly available.

## Requirements

I need the following AWS resources configured:

1. A MySQL database using RDS that:
   - Uses encryption at rest with KMS
   - Has automated backups enabled
   - Is deployed in a private subnet
   - Has multi-AZ enabled for high availability
   - Uses a db.t3.micro instance class
   - Has performance insights enabled

2. A Redis cache using ElastiCache Serverless that:
   - Provides session management and caching
   - Has encryption at rest and in transit enabled
   - Is highly available across multiple AZs
   - Has automatic snapshots configured

3. Database credentials stored in AWS Secrets Manager with:
   - Automatic password generation
   - Encryption using KMS
   - Proper rotation configuration

4. Network infrastructure including:
   - VPC with CIDR 10.0.0.0/16
   - Public and private subnets across two availability zones
   - Internet gateway for public access
   - NAT gateway for private subnet internet access
   - Appropriate route tables

5. Security groups that:
   - Allow MySQL traffic only from within the VPC
   - Allow Redis traffic only from within the VPC
   - Follow principle of least privilege

6. KMS keys for encryption of:
   - RDS database
   - ElastiCache cluster
   - Secrets Manager secrets

All resource names should use an environment suffix to avoid conflicts when deploying multiple environments.

Can you provide the infrastructure code to implement this? Please include one code block per file so I can easily copy and use each file.
