I need to create AWS infrastructure code for a secure and highly available web application environment. The architecture should demonstrate proper service integration and connectivity patterns.

## Architecture Overview

Create a multi-tier architecture where:

1. **VPC with Network Segmentation**: Set up a VPC with public subnets for the Application Load Balancer, private subnets for EC2 web servers, and isolated subnets for the RDS database. Include NAT Gateways to allow private instances to access the internet for updates.

2. **Load Balanced Web Tier**: Deploy an Application Load Balancer in public subnets that routes incoming HTTP/HTTPS traffic to an Auto Scaling Group of EC2 instances running in private subnets. The ALB should perform health checks on the EC2 instances and distribute traffic evenly.

3. **EC2 to RDS Connectivity**: The EC2 web servers should connect to a MySQL RDS database instance in the isolated subnets. Security groups should be configured so that only the web server security group can access RDS on port 3306.

4. **EC2 to S3 Integration**: EC2 instances should have IAM roles that grant them read/write access to an S3 application bucket for storing user uploads and application assets. Use VPC Gateway Endpoints for S3 to keep traffic within the AWS network.

5. **Monitoring and Alerting Pipeline**: CloudWatch should collect metrics from EC2 instances (CPU, memory) and RDS (connections, CPU). Configure CloudWatch Alarms that trigger SNS notifications when thresholds are breached (e.g., CPU > 80%, high response times).

## Security Requirements

- All data at rest encrypted using KMS keys (S3 buckets and RDS storage)
- Security groups following least-privilege: ALB accepts 80/443, web servers only accept traffic from ALB, database only accepts traffic from web servers
- IAM roles for EC2 instances instead of access keys
- S3 buckets with block public access and SSL-only policies
- RDS with automated backups and encryption enabled

## High Availability

- Resources deployed across 2 Availability Zones
- Auto Scaling Group with min 2 instances for redundancy
- RDS with automated backups for recovery

The infrastructure should be cost-effective using t3.micro instances and avoid long-running deployment resources. Please provide infrastructure code with one code block per file.
