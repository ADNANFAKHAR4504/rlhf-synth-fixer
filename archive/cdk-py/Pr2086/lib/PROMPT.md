# AWS CDK Infrastructure for Highly Available Web Application

I need to create a highly available and scalable web application infrastructure using AWS CDK with Python. The architecture should follow AWS Well-Architected Framework principles and include the following requirements:

## Infrastructure Requirements

1. **VPC and Networking**
   - Create a new VPC with CIDR 10.0.0.0/16 in us-east-1 region
   - Configure 2 public subnets and 2 private subnets across two availability zones
   - Include Internet Gateway, NAT Gateways, and proper routing tables

2. **Application Tier**
   - Deploy EC2 instances in an Auto Scaling Group across public subnets
   - Use Application Load Balancer to distribute traffic
   - Configure health checks and scaling policies

3. **Database Tier**
   - Use RDS MySQL database in private subnets with Multi-AZ deployment
   - Implement proper security groups for database access
   - Configure automated backups and monitoring

4. **Static Assets**
   - Create S3 bucket for static assets with public read access
   - Configure bucket policies for web hosting

5. **Security and IAM**
   - Create necessary IAM roles and policies following least privilege principle
   - Configure security groups with minimal required access
   - Use AWS Systems Manager for instance management

6. **Monitoring and Alerting**
   - Set up CloudWatch monitoring for all resources
   - Create alarms for CPU utilization, database connections, and load balancer health
   - Use AWS CloudWatch Insights for log aggregation

7. **Latest AWS Features**
   - Implement Amazon S3 Tables for analytics data storage using Apache Iceberg format
   - Use CloudFormation optimistic stabilization for faster deployments

## Naming Convention
All resources should follow the pattern: `prod-<resource_name>`

## Output Requirements
Please provide the complete CDK Python code with one code block per file. Include proper error handling, resource tagging, and comprehensive documentation. The solution should be production-ready and follow security best practices.