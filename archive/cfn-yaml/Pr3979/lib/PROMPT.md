Create a complete, validated, and deployable YAML CloudFormation template that establishes a foundational, secure AWS environment for a sensitive workload (e.g., in finance or healthcare) with end-to-end functional integration.

## Primary Objectives

### 1. Web Application Delivery
- Deploy a web server (EC2) in private subnets that serves content via Nginx
- Configure an Application Load Balancer (ALB) to distribute traffic to the web server
- Ensure the ALB can successfully serve web content from the EC2 instance
- Implement proper health checks and target group configuration

### 2. API-Driven Data Operations
- Create a REST API via API Gateway that integrates with Lambda functions
- Implement Lambda functions that can perform S3 operations (read/write)
- Enable end-to-end data flow: API Gateway → Lambda → S3
- Support both PUT and GET operations for data persistence and retrieval

### 3. Secure Data Storage and Access
- Deploy encrypted RDS database in private subnets with Multi-AZ configuration
- Store database credentials securely in AWS Secrets Manager
- Implement proper security groups to restrict database access to application tier only
- Enable automated backups with appropriate retention policies

### 4. Comprehensive Monitoring and Security
- Enable CloudWatch alarms for critical infrastructure metrics (EC2, RDS, ALB)
- Implement GuardDuty for threat detection across the environment
- Configure VPC Flow Logs for network traffic monitoring
- Enable API Gateway execution logging and ALB access logging

## Security Requirements (16 Mandates)

1. **Least Privilege IAM**: All IAM Roles must have minimum necessary permissions
2. **Managed Policies**: Prefer AWS Managed Policies over custom inline policies
3. **EC2 in VPC**: All EC2 instances deployed within VPC and private subnets
4. **EBS Encryption**: All EBS volumes must be encrypted
5. **RDS High Availability**: RDS instances in Multi-AZ configuration
6. **S3 Default Encryption**: All S3 buckets with default encryption enabled
7. **TLS for In-Transit**: Services configured for TLS 1.2+ where supported
8. **CloudWatch Alarms**: Meaningful alarms for critical resources
9. **S3 Versioning**: Versioning enabled on all S3 buckets
10. **ELB Access Logging**: Access logging configured for load balancers
11. **Lambda in VPC**: Lambda functions configured to execute within VPC
12. **RDS Public Access**: RDS instances explicitly not publicly accessible
13. **Minimal Security Groups**: Most restrictive security group rules
14. **GuardDuty**: Amazon GuardDuty enabled for threat detection
15. **RDS Backups**: Automatic backups with reasonable retention (7 days)
16. **API Gateway Logging**: Full execution logging for API Gateway requests

## Technical Specifications

- **Filename**: SecureEnv.yaml
- **Resource Naming**: All resources use "SecureEnv" prefix
- **Region**: us-east-1 (configurable via parameters)
- **Validation**: Must pass `aws cloudformation validate-template` check

## End-to-End Integration Requirements

The template must create a functional system where:
1. Users can access a website through the ALB that serves content from EC2
2. API endpoints can store and retrieve data via Lambda functions writing to S3
3. All components are properly secured, monitored, and follow AWS best practices
4. The infrastructure supports real-world workloads with proper failover and backup capabilities

## Deliverable

Provide the complete, self-contained YAML code for the SecureEnv.yaml CloudFormation template that creates a cohesive, functional environment demonstrating real integration between ALB+EC2+Web Content and API Gateway+Lambda+S3 data operations, while implementing all security constraints listed above.