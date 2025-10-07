# Project Management Platform Infrastructure

Generate Terraform HCL infrastructure code for a project management platform to be deployed in us-east-1 region.

## Requirements

Create infrastructure code that provisions:

1. **Networking**
   - VPC with CIDR block 172.26.0.0/16
   - Public and private subnets across multiple availability zones
   - Internet Gateway and NAT Gateways for outbound connectivity
   - Route tables for public and private subnets

2. **Application Load Balancer**
   - Application Load Balancer in public subnets
   - Path-based routing configuration
   - Target group for EC2 instances
   - Health check configuration

3. **Compute**
   - EC2 Auto Scaling Group with t3.medium instances
   - Minimum 3, maximum 8 instances
   - Launch template with appropriate user data
   - Target tracking scaling policy based on CPU utilization

4. **Database**
   - Aurora PostgreSQL serverless v2 cluster for faster deployment
   - 2 read replica instances for reporting workloads
   - Subnet group in private subnets
   - Enable automated backups

5. **Caching**
   - ElastiCache Redis cluster for real-time updates
   - Enable Redis Pub/Sub for real-time notifications
   - Subnet group in private subnets
   - Use cache.t3.micro for cost optimization

6. **Storage**
   - S3 bucket for file attachments
   - Enable versioning and server-side encryption
   - Configure lifecycle policies for cost optimization

7. **WebSocket API**
   - API Gateway WebSocket API for live updates
   - Configure 10-minute idle timeout (600 seconds)
   - Integration with Lambda for WebSocket handling
   - Lambda function for connection management

8. **Security**
   - Security groups for multi-tier architecture:
     - ALB security group (allow HTTP/HTTPS from internet)
     - EC2 security group (allow traffic from ALB)
     - RDS security group (allow PostgreSQL from EC2)
     - ElastiCache security group (allow Redis from EC2)
     - Lambda security group (allow outbound to RDS and ElastiCache)

9. **Monitoring**
   - CloudWatch dashboard for usage metrics
   - Alarms for Auto Scaling triggers
   - Log groups for application logs

10. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Automatic rotation configuration for enhanced security
   - Secrets for Redis authentication token
   - IAM policies for secure secret access from EC2 and Lambda

11. **Scheduled Tasks**
   - EventBridge Scheduler for automated task execution
   - Schedule groups for organizing different types of schedules
   - Daily project status reports schedule
   - Weekly deadline reminder notifications
   - Hourly task assignment checks with flexible time windows
   - Lambda function for processing scheduled tasks
   - SNS topic for sending notifications
   - DynamoDB table for tracking scheduled task executions

## Additional Considerations

- Use AWS Provider version ~> 5.0 to leverage latest features like Aurora Serverless v2 and enhanced WebSocket API capabilities
- Implement proper tagging strategy with Environment and Project tags
- Use data sources where appropriate for AMI selection
- Configure all resources to use private subnets except ALB and NAT Gateways

Provide the complete Terraform HCL infrastructure code in a single main.tf file that can be deployed directly. Include all necessary resource definitions, variables with defaults, and outputs for important resource identifiers.