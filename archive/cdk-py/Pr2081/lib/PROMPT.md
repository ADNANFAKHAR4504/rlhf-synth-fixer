# Production-Ready AWS Infrastructure Setup

I need to set up a comprehensive production-ready AWS environment using CDK with Python. The infrastructure should support a scalable web application with proper security, monitoring, and high availability features.

## Core Requirements

1. **Region Deployment**: Deploy all resources in the 'us-east-1' region
2. **Naming Convention**: Use 'prod-' as a prefix for all resource names, followed by the respective service name
3. **Security**: Implement IAM roles following the least privilege principle
4. **Network Architecture**: Design a VPC with at least two public and two private subnets spread across multiple availability zones
5. **Storage & Logging**: Configure S3 bucket with access logging enabled
6. **Database**: Set up an RDS database using db.t3.micro instance class for cost efficiency
7. **Load Balancing**: Configure an Application Load Balancer (ALB) with SSL certificate from AWS Certificate Manager (ACM)
8. **Monitoring**: Implement CloudWatch alarm to detect any 5xx errors in the application
9. **Auto Scaling**: Enable automated scaling based on CPU utilization metrics

## Additional Features to Include

Please incorporate these modern AWS features:
- **AWS AppRunner** for containerized application deployment (launched 2021, good for production workloads)
- **Amazon VPC Lattice** for service-to-service networking (launched 2022, enhances microservices communication)

## Technical Specifications

- Use CDK with Python
- Ensure all resources follow AWS best practices for production environments
- Configure proper backup and disaster recovery where applicable
- Set up appropriate security groups with minimal required access
- Enable encryption at rest and in transit where supported
- Configure proper tagging strategy for resource management

## Deliverables

Provide the complete CDK Python infrastructure code with:
- VPC and networking setup
- RDS database configuration
- Application Load Balancer with SSL
- Auto Scaling groups and policies
- CloudWatch alarms and monitoring
- S3 buckets with logging
- IAM roles and policies
- Integration with modern AWS services mentioned above

The solution should be production-ready and deployable immediately after implementation.