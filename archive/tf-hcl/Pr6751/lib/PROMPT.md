# Highly Available Transaction Processing System

Hey team,

We need to build a production-grade transaction processing system for a financial services company that absolutely cannot go down. The business requirement is clear: even if an entire AWS availability zone fails, our system must keep processing transactions without data loss or service interruption. I've been asked to create this infrastructure using **Terraform with HCL** for the us-east-1 region.

The challenge here is building true high availability across multiple failure domains. We're talking about a system that needs to handle complete AZ failures gracefully, with automatic failover mechanisms that kick in within 60 seconds. The architecture needs to span three availability zones with proper load distribution, data replication, and health monitoring at every layer.

This is a financial services workload, so data consistency is paramount. We need point-in-time recovery capabilities and the ability to backtrack up to 24 hours if we detect data corruption or application errors. The system must maintain an RPO under 5 minutes and provide automated backup mechanisms that don't interfere with production operations.

## What we need to build

Create a highly available transaction processing infrastructure using **Terraform with HCL** that spans three availability zones in us-east-1. The system must automatically failover when AZ failures occur while maintaining zero data loss.

### Core Infrastructure Requirements

1. **Multi-AZ Network Architecture**
   - VPC spanning 3 availability zones in us-east-1
   - Public subnets in each AZ for Application Load Balancer
   - Private subnets in each AZ for compute and data layers
   - NAT Gateway deployed in each AZ for outbound connectivity
   - Proper route tables and network ACLs for tier isolation

2. **Database Layer with Automatic Failover**
   - Aurora PostgreSQL cluster deployed across 3 AZs
   - Multi-AZ configuration with automated failover enabled
   - Point-in-time recovery enabled for all databases
   - Aurora backtrack window configured for 24 hours
   - Automated backups running every 6 hours
   - Cross-AZ data replication with RPO under 5 minutes

3. **Containerized Application Layer**
   - ECS Fargate service running containerized application
   - Tasks distributed evenly across 3 availability zones
   - Minimum 2 tasks per AZ during normal operations
   - Auto Scaling policies maintaining desired capacity
   - Service discovery and inter-service communication
   - Container health checks and automatic replacement

4. **Load Balancing and Traffic Distribution**
   - Application Load Balancer in public subnets
   - Cross-zone load balancing enabled
   - Connection draining configured for graceful shutdowns
   - Health checks configured with appropriate thresholds
   - Target groups for each service with proper routing
   - SSL/TLS termination at the load balancer

5. **Session Management and Caching**
   - ElastiCache Redis cluster running in cluster mode
   - Distributed across 3 availability zones
   - Automatic failover enabled for cluster nodes
   - Session replication across nodes
   - Proper security group rules for cache access

6. **DNS-Based Failover and Recovery**
   - Route 53 hosted zone configuration
   - Health checks monitoring service availability
   - Failover routing policy for automatic DNS updates
   - Health check intervals triggering within 60 seconds
   - Multi-region failover routing if needed

7. **Monitoring and Alerting**
   - CloudWatch alarms for AZ failure detection
   - SNS topics for critical notifications
   - Metrics for CPU, memory, connection counts, and replication lag
   - Alarms for database failover events
   - Alarms for container health check failures
   - Dashboard showing multi-AZ health status

8. **Auto Scaling Configuration**
   - ECS Service Auto Scaling policies
   - Minimum 2 tasks per AZ (total 6 tasks minimum)
   - Scale-out policies based on CPU and memory thresholds
   - Scale-in policies with appropriate cooldown periods
   - Target tracking scaling for consistent performance

9. **Security Configuration**
   - Security groups implementing least privilege access
   - ALB security group allowing inbound HTTP/HTTPS
   - ECS security group allowing traffic only from ALB
   - RDS security group allowing traffic only from ECS
   - ElastiCache security group allowing traffic only from ECS
   - No public access to database or cache layers

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to **us-east-1** region across 3 availability zones
- Use **Aurora PostgreSQL** for primary database with Multi-AZ
- Use **ECS Fargate** for containerized application workloads
- Use **Application Load Balancer** for traffic distribution
- Use **Route 53** for DNS-based failover
- Use **ElastiCache Redis** cluster mode for session management
- Use **NAT Gateway** in each AZ for outbound connectivity
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${var.environment_suffix}`
- All resources must be destroyable (no Retain deletion policies)
- Terraform version 1.5+ with AWS provider 5.x
- Include proper error handling and validation
- Use data sources for AZ lookups to ensure availability

### Constraints and Requirements

- RDS instances must use Multi-AZ deployments with automated backups every 6 hours
- All compute resources must span at least 3 availability zones with auto-scaling
- Health checks must trigger failover within 60 seconds of detection
- Use only AWS-managed services with built-in HA capabilities
- Implement cross-AZ data replication with RPO under 5 minutes
- Aurora backtrack window must be set to 24 hours (86400 seconds)
- ECS tasks must maintain minimum 2 instances per AZ
- All resources tagged with Environment=production and DisasterRecovery=enabled
- Security groups must allow only necessary traffic between tiers
- Connection draining period of at least 30 seconds on load balancers

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix variable for deployment uniqueness
- All resources MUST be fully destroyable (no RemovalPolicy: RETAIN equivalent)
- Use variable for environment suffix with proper validation
- Implement proper dependency management between resources
- Include lifecycle rules for ordered resource creation and destruction
- GuardDuty should NOT be created (account-level limitation, one detector per account)
- AWS Config recorder should use 'service-role/AWS_ConfigRole' IAM policy if implemented

## Success Criteria

- **Functionality**: System continues processing transactions during complete AZ failure
- **Data Integrity**: Zero data loss during failover events with point-in-time recovery
- **Performance**: Failover detection and DNS updates complete within 60 seconds
- **Reliability**: Automated recovery without manual intervention required
- **Security**: All network tiers properly isolated with security groups
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be destroyed via terraform destroy
- **Scalability**: Auto Scaling maintains minimum capacity across all AZs
- **Monitoring**: CloudWatch alarms detect and notify on AZ failures
- **Code Quality**: Clean HCL code following Terraform best practices with proper documentation

## What to deliver

- Complete Terraform configuration using HCL
- Main infrastructure file (main.tf or tap_stack.tf)
- Variables file with proper validation and defaults
- Provider configuration with required AWS provider
- Aurora PostgreSQL Multi-AZ cluster configuration
- ECS Fargate service spanning 3 AZs
- Application Load Balancer with health checks
- ElastiCache Redis cluster mode configuration
- Route 53 health checks and failover routing
- CloudWatch alarms and SNS topics
- VPC with public and private subnets across 3 AZs
- NAT Gateways for each availability zone
- Security groups with proper ingress/egress rules
- Auto Scaling policies for ECS service
- Proper tagging for all resources
- Documentation with deployment instructions
