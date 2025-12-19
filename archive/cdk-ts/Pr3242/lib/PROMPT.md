# Infrastructure Requirements for Retail Database System

Build infrastructure code to support a retail business database system that processes 1,500 daily orders. The system needs secure data storage with proper encryption and performance monitoring.

## Technical Requirements

Create AWS infrastructure with:
- RDS PostgreSQL database using db.t3.micro instance
- VPC with two private subnets (10.2.10.0/24 and 10.2.20.0/24)
- Security group configuration allowing PostgreSQL traffic on port 5432 only from within VPC CIDR 10.2.0.0/16
- KMS customer managed key for database encryption at rest
- CloudWatch monitoring for database performance metrics
- S3 bucket for automated database backups with lifecycle policies
- Database backup retention period of 7 days
- Deploy to us-east-2 region

## Enhanced Features

Include support for:
- CloudWatch Database Insights in Standard mode for monitoring database fleet performance with pre-built dashboards
- Enable Performance Insights with 7-day retention for detailed SQL-level performance metrics

## Implementation Notes

Generate production-ready infrastructure code with:
- All resources properly tagged with Environment, Application, and ManagedBy tags
- Least privilege IAM policies for all service interactions
- Appropriate error handling and resource dependencies
- Security group rules following principle of least privilege
- Enable deletion protection on the RDS instance
- Multi-AZ deployment disabled to minimize costs for this small business use case
- Database subnet group spanning both private subnets
- VPC endpoints for S3 to ensure private connectivity for backups

Provide the complete infrastructure code implementation.