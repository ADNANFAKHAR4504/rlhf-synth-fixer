Generate AWS CDK TypeScript infrastructure code for a production-grade RDS MySQL database deployment with advanced connection management and backup capabilities.

Create a database solution for a startup that needs to store 1,200 daily customer profiles with secure access, connection pooling, centralized backup management, and comprehensive monitoring.

Infrastructure requirements:

1. VPC Configuration
   - Create a VPC with private subnets using CIDR 10.4.10.0/24
   - Implement at least 2 private subnets across different availability zones
   - Configure NAT gateway for outbound internet access from private subnets

2. RDS MySQL Database
   - Deploy MySQL 8.0 instance using db.t3.micro instance type
   - Place database in private subnets only
   - Enable multi-AZ deployment for high availability
   - Configure automated backups with 7-day retention period
   - Enable deletion protection for production safety
   - Set up automated minor version upgrades

3. RDS Proxy for Connection Management
   - Deploy RDS Proxy for connection pooling and multiplexing
   - Configure proxy with IAM authentication support
   - Set connection pool size appropriate for workload
   - Enable TLS enforcement for all proxy connections
   - Configure proxy timeout settings for optimal performance
   - Integrate with AWS Secrets Manager for credential rotation

4. AWS Backup Service Integration
   - Create centralized backup plan with AWS Backup service
   - Configure daily backup schedule with 30-day retention
   - Set up cross-region backup copies for disaster recovery
   - Define backup vault with encryption using KMS
   - Configure backup lifecycle policies for cost optimization
   - Enable continuous backup for point-in-time recovery

5. Security Configuration
   - Create security group allowing MySQL traffic on port 3306
   - Restrict access to specific application security groups only
   - Enable KMS encryption for data at rest using AWS managed keys
   - Enable encryption in transit
   - Configure IAM database authentication for secure access
   - Enable Blue/Green deployments capability for safe updates

6. Monitoring and Observability
   - Set up CloudWatch monitoring with standard metrics
   - Configure CloudWatch alarms for CPU utilization and storage space
   - Enable Enhanced Monitoring with 60-second granularity
   - Create CloudWatch dashboard for database metrics visualization
   - Enable IAM authentication metrics logging
   - Monitor RDS Proxy metrics for connection pool utilization

7. Performance and Optimization
   - Configure appropriate parameter group for MySQL 8.0
   - Set up read replica in a different AZ if needed
   - Enable Performance Insights with 7-day retention

Implementation notes:
- Use AWS CDK best practices with separate constructs for each component
- Implement proper tagging for resource management
- Use environment variables for sensitive configuration
- Ensure all resources are deployed in us-west-1 region
- Create outputs for important resource identifiers

Provide complete CDK TypeScript code implementing all these requirements in properly structured files.