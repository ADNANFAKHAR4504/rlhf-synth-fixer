# AWS Migration Infrastructure - Pulumi Python Implementation

## Overview

This solution implements a comprehensive AWS migration infrastructure using **Pulumi with Python**. It enables phased migration of a Java API service and PostgreSQL database from on-premises to AWS, with support for gradual traffic cutover and continuous data consistency.

## Architecture Components

### 1. Network Infrastructure
- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 2 AZs (us-east-1a, us-east-1b) for ALB
- **Private Subnets**: 2 AZs for ECS and RDS
- **NAT Gateway**: Single NAT for cost optimization
- **Security Groups**: Least privilege access control

### 2. Database Migration
- **DMS Replication Instance**: t3.medium with 100GB storage
- **Source Endpoint**: On-premises PostgreSQL configuration
- **Target Endpoint**: RDS PostgreSQL
- **Replication Task**: Full load + CDC (Change Data Capture)
- **Table Mappings**: All public schema tables

### 3. Target Database
- **RDS PostgreSQL 15.4**: db.t3.medium
- **Multi-AZ**: High availability configuration
- **Storage**: 100GB gp3 with encryption
- **Backup**: 7-day retention
- **Logs**: PostgreSQL and upgrade logs to CloudWatch

### 4. Application Infrastructure
- **ECS Fargate Cluster**: Container Insights enabled
- **Task Definition**: Java API (Tomcat 9 JDK 17)
- **Service**: 2 tasks for high availability
- **Resources**: 1vCPU, 2GB RAM per task
- **Networking**: awsvpc mode in private subnets

### 5. Load Balancing
- **Application Load Balancer**: Internet-facing
- **Target Group**: IP target type on port 8080
- **Health Checks**: Path "/" with 30s interval
- **Listener**: HTTP port 80 forwarding to target group

### 6. Traffic Management
- **Route 53 Health Check**: ALB endpoint monitoring
- **Weighted Routing**: Supports gradual traffic cutover (configured separately)
- **Failover Support**: Health check integration

### 7. Monitoring & Alarms
- **ECS Alarms**: CPU >80%, Memory >80%
- **RDS Alarm**: CPU >80%
- **DMS Alarm**: Replication lag >5 minutes
- **CloudWatch Logs**: ECS task logs with 7-day retention

## Implementation Files

The complete implementation consists of:

1. **tap_stack.py** - Main infrastructure stack (created)
2. **__init__.py** - Package initialization (created)
3. **README.md** - Documentation (see below)

All files follow Pulumi Python best practices and include proper resource naming with environmentSuffix.

## Key Features

### Resource Naming
All resources include `environment_suffix` for unique identification:
- VPC: `migration-vpc-{suffix}`
- RDS: `migration-postgres-{suffix}`
- ECS Cluster: `migration-cluster-{suffix}`
- ALB: `migration-alb-{suffix}`

### Security Best Practices
- **Encryption**: RDS storage encrypted, HTTPS ready
- **Network Isolation**: Private subnets for data tier
- **Least Privilege**: Security groups restrict traffic to required ports
- **IAM Roles**: Service-specific roles for DMS and ECS
- **No Public Access**: RDS not publicly accessible

### High Availability
- **Multi-AZ RDS**: Automatic failover
- **ECS**: 2 tasks across 2 AZs
- **ALB**: Distributes traffic across AZs
- **Health Checks**: Automatic unhealthy target removal

### Migration Process
1. **Infrastructure Deployment**: Deploy all AWS resources
2. **DMS Configuration**: Verify endpoint connectivity
3. **Initial Load**: Full database replication
4. **CDC Replication**: Continuous change capture
5. **Application Deployment**: ECS tasks start
6. **Traffic Cutover**: Gradual shift using Route 53 weights
7. **Monitoring**: CloudWatch alarms track migration health

### Cost Optimization
- **Serverless Compute**: ECS Fargate (pay per use)
- **Right-sized Instances**: t3.medium for RDS and DMS
- **Single NAT Gateway**: Reduced egress costs
- **7-day Log Retention**: Balanced observability and cost
- **gp3 Storage**: Better price/performance than gp2

## Configuration Requirements

Required Pulumi configuration values:

```bash
pulumi config set environmentSuffix <unique-value>
pulumi config set --secret dbPassword <strong-password>
pulumi config set onpremDbEndpoint <ip-address>  # Optional, defaults to 10.0.0.100
```

## Outputs

The stack exports the following outputs:

- `vpc_id`: VPC identifier
- `alb_dns_name`: ALB DNS name
- `alb_url`: Complete ALB HTTP URL
- `rds_endpoint`: RDS endpoint (host:port)
- `rds_address`: RDS hostname
- `ecs_cluster_name`: ECS cluster name
- `ecs_service_name`: ECS service name
- `dms_replication_instance_arn`: DMS instance ARN
- `dms_replication_task_arn`: DMS task ARN
- `health_check_id`: Route 53 health check ID

## Testing Strategy

### Unit Tests
- VPC and subnet configuration validation
- Security group rule verification
- IAM role and policy attachment checks
- Resource naming with environmentSuffix
- Tag presence and format

### Integration Tests
- ALB health check response
- ECS task connectivity to RDS
- DMS endpoint connectivity
- CloudWatch log group creation
- Resource cleanup capability

## Deployment Considerations

### Pre-Deployment
- Ensure on-premises firewall allows DMS connectivity
- Configure on-premises PostgreSQL for replication
- Set up VPN or Direct Connect if needed
- Validate IAM permissions

### During Deployment
- Monitor DMS replication progress
- Watch CloudWatch logs for errors
- Verify ECS task health
- Check ALB target health

### Post-Deployment
- Test application functionality
- Validate data consistency
- Configure Route 53 weighted routing
- Set up additional CloudWatch dashboards
- Configure backup and disaster recovery

## Limitations and Considerations

1. **DMS Replication**: Requires network connectivity to on-premises database
2. **Java Application**: Uses generic Tomcat image - replace with actual application image
3. **Single NAT Gateway**: Single point of failure for private subnet internet access
4. **HTTP Only**: HTTPS requires ACM certificate configuration
5. **Database Password**: Stored in Pulumi config - consider AWS Secrets Manager for production

## Next Steps

1. Replace Tomcat image with actual Java application
2. Configure HTTPS with ACM certificate
3. Set up Route 53 weighted routing records
4. Implement additional monitoring dashboards
5. Configure backup retention policies
6. Set up disaster recovery procedures
7. Implement automated scaling policies
8. Add AWS WAF for application protection

## Compliance

The infrastructure follows AWS best practices for:
- Security (encryption, isolation, least privilege)
- Reliability (Multi-AZ, health checks, monitoring)
- Performance (right-sized instances, load balancing)
- Cost Optimization (Fargate, gp3, appropriate retention)
- Operational Excellence (CloudWatch, alarms, logs)
