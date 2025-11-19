# Multi-Tier Web Application with Blue-Green Deployment

Hey team,

We need to build a production infrastructure for a financial services trading dashboard. The application is built with Django and processes real-time market data, so reliability and performance are critical. I've been asked to create this infrastructure using **Terraform with HCL**. The business needs a complete blue-green deployment setup to enable zero-downtime releases while meeting strict regulatory compliance requirements.

The application will serve traders during market hours with highly variable traffic patterns. We need to ensure sub-second response times even during peak loads, and the system must maintain strict data consistency for compliance. The deployment needs to span multiple availability zones in us-east-1 for high availability.

This is an expert-level implementation that requires careful orchestration of multiple AWS services including ECS Fargate for containerized workloads, Aurora PostgreSQL for the database tier, and sophisticated load balancing with blue-green deployment capabilities.

## What we need to build

Create a multi-tier web application infrastructure using **Terraform with HCL** for automated blue-green deployments.

### Core Requirements

1. **Container Orchestration**
   - Deploy ECS Fargate service running Django application containers
   - Implement rolling update deployment strategy
   - Use awsvpc network mode with private IP assignment only
   - Store container images in ECR with vulnerability scanning enabled

2. **Database Layer**
   - Configure RDS Aurora PostgreSQL cluster with Multi-AZ deployment
   - Enable encrypted storage at rest
   - Set up automated backups with point-in-time recovery
   - Enforce SSL connections and IAM authentication
   - Deploy in private subnets across multiple availability zones

3. **Load Balancing and Traffic Management**
   - Set up Application Load Balancer with path-based routing
   - Configure comprehensive health checks for service monitoring
   - Implement blue-green deployment using separate target groups
   - Configure weighted routing to enable gradual traffic shifts
   - Deploy ALB in public subnets with proper security groups

4. **Blue-Green Deployment Infrastructure**
   - Create separate task definitions for blue and green environments
   - Configure target groups for independent blue/green testing
   - Enable weighted routing for controlled traffic migration
   - Implement automated rollback capabilities

5. **Auto Scaling Configuration**
   - Configure auto-scaling policies based on CPU utilization
   - Configure auto-scaling policies based on memory utilization
   - Set appropriate scaling thresholds for market hours traffic
   - Define minimum and maximum task counts

6. **Monitoring and Alerting**
   - Set up CloudWatch alarms for ECS service health
   - Monitor database performance metrics
   - Create alarms for load balancer health
   - Configure notification channels for critical alerts

7. **Network Architecture**
   - Implement proper VPC configuration spanning 3 availability zones
   - Create public subnets for ALB deployment
   - Create private subnets for ECS tasks and RDS instances
   - Deploy NAT Gateways in each AZ for outbound connectivity
   - Configure route tables and network ACLs

8. **Secrets Management**
   - Use Secrets Manager for database credentials
   - Implement automatic credential rotation
   - Grant ECS tasks proper IAM permissions for secret access
   - Encrypt secrets at rest and in transit

9. **Web Application Firewall**
   - Configure WAF rules to protect against SQL injection attacks
   - Configure WAF rules to protect against XSS attacks
   - Attach WAF web ACL to Application Load Balancer
   - Set appropriate rule actions and monitoring

10. **Security Groups and Access Control**
    - Define security groups with explicit port ranges (no -1 rules)
    - Implement least privilege access between tiers
    - Allow ALB to ECS communication on application port
    - Allow ECS to RDS communication on PostgreSQL port
    - Configure outbound rules for required connectivity

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon ECS Fargate** for container orchestration
- Use **RDS Aurora PostgreSQL** for database with Multi-AZ
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon ECR** for container image registry
- Use **AWS Secrets Manager** for credential management
- Use **Amazon VPC** with NAT Gateways for network isolation
- Use **AWS WAF** for application security
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **Auto Scaling** for dynamic capacity management
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Terraform state configured with S3 backend and DynamoDB locking

### Constraints

- All resources must use consistent tagging with Environment, Project, and Owner tags
- Database must enforce SSL connections and use IAM authentication
- ECS tasks must use awsvpc network mode with no public IP assignment
- Terraform state must be configured with S3 backend and DynamoDB locking
- All security group rules must explicitly specify port ranges without using -1
- All resources must be destroyable (no Retain deletion policies)
- Container images must have vulnerability scanning enabled
- VPC must span 3 availability zones
- Include proper error handling and validation

## Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix for uniqueness
- Resources MUST be fully destroyable (no RETAIN policies allowed)
- Security groups must have explicit port ranges (never use -1 for all ports/protocols)
- State backend must be configured before infrastructure deployment
- All resources must support cleanup without manual intervention

## Success Criteria

- **Functionality**: Complete blue-green deployment capability with automated traffic shifting
- **Performance**: Sub-second response times during peak market hours
- **Reliability**: Multi-AZ deployment with automated failover for database and compute
- **Security**: All network traffic encrypted, credentials rotated, WAF protecting against common attacks
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Compliance**: Proper tagging, audit logging, and access controls for regulatory requirements
- **Code Quality**: Well-structured HCL modules, comprehensive testing, clear documentation

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC module with multi-AZ networking, NAT gateways, and route tables
- ECS module with Fargate service, task definitions, and auto-scaling
- RDS module with Aurora PostgreSQL cluster and security configuration
- ALB module with target groups for blue-green deployment
- WAF module with SQL injection and XSS protection rules
- CloudWatch alarms for comprehensive monitoring
- Secrets Manager configuration for credential management
- Backend configuration for S3 state and DynamoDB locking
- Unit tests for all modules
- Integration tests for deployment scenarios
- Documentation including architecture diagrams and deployment instructions
