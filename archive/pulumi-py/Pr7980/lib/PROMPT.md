# RDS MySQL Optimization Infrastructure

## Background
A fintech company's payment processing system uses RDS MySQL instances that are experiencing performance bottlenecks during peak hours. The current Pulumi infrastructure code creates database instances without proper optimization, leading to high costs and slow query response times.

## Environment
AWS infrastructure deployed in us-east-1 region with RDS MySQL 8.0 instances in private subnets across 3 availability zones. The environment includes VPC with CIDR 10.0.0.0/16, private subnet IDs subnet-0abc123, subnet-0def456, subnet-0ghi789. Existing security group sg-db-mysql-prod allows MySQL traffic from application subnets. Requires Pulumi 3.x with Python 3.9+, AWS provider v6.x configured. CloudWatch monitoring enabled for all database metrics with SNS topic arn:aws:sns:us-east-1:123456789012:db-alerts for alarm notifications.

## Task
Create a Pulumi Python program to optimize an existing RDS MySQL infrastructure by fixing performance and cost issues.

## Requirements

The configuration must:

1. Create an RDS MySQL 8.0 instance with instance class db.t4g.large
2. Configure GP3 storage with 100GB initial size, 3000 IOPS, and 125 MB/s throughput
3. Create a custom parameter group with performance_schema=ON and slow_query_log=ON
4. Enable automated backups with 7-day retention and preferred window 03:00-04:00 UTC
5. Configure Multi-AZ deployment based on an input parameter 'is_production' (boolean)
6. Create CloudWatch alarms for CPU utilization > 80% and free storage < 10GB
7. Enable deletion protection only when is_production is true
8. Use existing subnet group 'db-subnet-group-prod' for database placement
9. Apply tags Environment=production, CostCenter=payments, and OptimizedBy=pulumi
10. Export the database endpoint, port, and resource ID for application configuration

## Mandatory Constraints
- CloudWatch alarms must monitor CPU and storage metrics
- Database subnet group must use existing private subnets
- Database instance class must be cost-optimized (t3 or t4g series)

## Optional Constraints
- Enable deletion protection for production instances
- Enable automated backups with 7-day retention period
- Storage must use GP3 with minimum 3000 IOPS
- Parameter group must include performance schema enabled
- Multi-AZ must be configurable via input parameter
- Must use RDS MySQL 8.0 engine version

## Expected Output
The program should create an optimized RDS instance with improved performance settings, cost-effective instance sizing, and proper monitoring. All CloudWatch alarms should send notifications to the existing SNS topic for operational alerts.