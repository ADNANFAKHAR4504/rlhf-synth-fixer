# Payment Processing Migration Infrastructure

Hey team,

We need to build infrastructure for a fintech startup that's migrating their payment processing system from their on-premises datacenter to AWS. I've been asked to create this in Python using CDKTF. The business wants a phased migration approach that minimizes downtime and allows quick rollback if issues arise.

The current setup uses dedicated database servers, application clusters, and load balancers in their legacy datacenter. They need this replicated in AWS while keeping the on-premises system running during the migration window. The key challenge is maintaining data consistency and gradually shifting traffic without disrupting payment processing.

This is a critical migration - payments can't go down. We need solid monitoring, automated health checks, and the ability to roll back quickly if something goes wrong. The infrastructure needs to support running both environments in parallel with gradual traffic shifting.

## What we need to build

Create a migration infrastructure using **CDKTF with Python** for a payment processing system moving from on-premises to AWS.

### Core Requirements

1. **Multi-Environment Setup**
   - Define separate Terraform workspaces for 'legacy-sync' and 'aws-production' environments
   - Support parallel running of both environments during migration

2. **Network Infrastructure**
   - Create a VPC with 3 private subnets and 3 public subnets across different availability zones
   - Reference existing VPN connection to on-premises network using data sources
   - Deploy NAT gateways for private subnet internet access

3. **Database Tier**
   - Deploy an RDS Aurora MySQL cluster with one writer and two reader instances
   - Enable encryption at rest using AWS KMS
   - Configure for high availability across multiple AZs

4. **Application Tier**
   - Set up an Auto Scaling group with minimum 3 and maximum 9 EC2 instances
   - Deploy Application Load Balancer in front of the Auto Scaling group
   - Configure health checks and automated scaling policies

5. **Data Migration**
   - Configure AWS Database Migration Service replication instance
   - Set up DMS tasks for continuous data replication from on-premises to Aurora
   - Monitor replication lag and status

6. **Traffic Management**
   - Implement Route 53 weighted routing policies for gradual traffic migration
   - Support shifting traffic percentages between legacy and AWS environments
   - Enable quick rollback capability

7. **Monitoring and Observability**
   - Create CloudWatch dashboards showing migration metrics
   - Display replication lag, application health, and traffic distribution
   - Set up automated health checks for both environments

8. **Outputs and Integration**
   - Output the ALB DNS name for application access
   - Output RDS cluster endpoint for database connections
   - Output DMS replication status for monitoring

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS Aurora MySQL** for the database tier
- Use **EC2 Auto Scaling** with **Application Load Balancer** for compute
- Use **AWS DMS** for database replication
- Use **Route 53** for DNS and traffic management
- Use **CloudWatch** for monitoring and dashboards
- Reference existing **VPN connection** via data sources (don't create new VPN)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region

### Constraints

- Minimize downtime during migration window
- Support quick rollback if issues arise
- Enable encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow principle of least privilege for IAM roles
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately
- All resources must be destroyable (no Retain policies)
- Secrets should be fetched from existing Secrets Manager entries, not created
- Include proper error handling and logging

## Success Criteria

- Functionality: All 9 requirements implemented and working
- Migration Support: Phased migration with parallel environments
- Rollback: Quick rollback capability if issues detected
- Monitoring: Comprehensive dashboards showing migration progress
- Security: Encryption at rest and in transit, least privilege IAM
- Reliability: High availability across multiple AZs
- Resource Naming: All resources include environmentSuffix
- Code Quality: Python, well-tested, documented

## What to deliver

- Complete CDKTF Python implementation
- VPC with public/private subnets across 3 AZs
- RDS Aurora MySQL cluster (1 writer, 2 readers)
- Auto Scaling group (3-9 instances) with ALB
- AWS DMS replication instance and tasks
- Route 53 weighted routing for traffic shifting
- CloudWatch dashboards for migration monitoring
- Data source reference to existing VPN connection
- Unit tests for all components
- Integration tests validating end-to-end workflows
- Documentation and deployment instructions
