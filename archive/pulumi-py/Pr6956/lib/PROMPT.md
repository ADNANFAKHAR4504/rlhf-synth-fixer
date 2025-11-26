# Infrastructure Migration: Legacy Three-Tier to Modern Containerized Architecture

Hey team,

We've got a big infrastructure migration project on our hands. TechVault Inc. is running a legacy three-tier web application in us-east-1 with the classic setup - EC2 instances handling the app tier, RDS MySQL for the database, and an old ELB Classic for load balancing. The business has decided it's time to modernize this stack and move it to us-west-2, using containerized infrastructure. The catch? We need zero downtime during the migration. No service interruptions allowed.

This migration needs to be done carefully. We're talking about moving from traditional EC2-based architecture to a fully containerized ECS Fargate setup, upgrading from MySQL RDS to Aurora MySQL, and switching from Classic ELB to a modern Application Load Balancer. On top of that, we need to replicate the database in real-time using AWS DMS, set up gradual traffic shifting with Route 53, and make sure we have full visibility into the migration progress through CloudWatch dashboards and alarms.

The infrastructure team wants this built using **Pulumi with Python** so we can manage everything as code and have full programmatic control over the deployment. We need to provision the entire new infrastructure in us-west-2 in parallel with the existing setup, establish database replication, and then gradually shift traffic once everything is validated and running smoothly.

## What we need to build

Create a complete infrastructure migration solution using **Pulumi with Python** that provisions modern containerized infrastructure in us-west-2 and orchestrates a zero-downtime migration from the legacy EC2-based stack in us-east-1.

### Core Requirements

1. **Source Database Configuration**
   - Define source RDS endpoint as a Pulumi configuration variable for DMS replication setup
   - Enable DMS to connect to the legacy RDS MySQL instance in us-east-1

2. **Target Aurora MySQL Cluster**
   - Create Aurora MySQL cluster in private subnets across multiple AZs
   - Deploy 2 Aurora reader instances for read scalability
   - Configure in private subnets only (no public access)

3. **ECS Fargate Service**
   - Deploy ECS Fargate service with 4 initial tasks
   - Distribute tasks across multiple availability zones for high availability
   - Use awsvpc network mode with private IP addresses only

4. **Application Load Balancer**
   - Configure ALB with sticky sessions enabled (60-second duration)
   - Deploy in public subnets with internet-facing access
   - Use HTTP health checks on /health endpoint

5. **Database Migration Service (DMS)**
   - Set up DMS replication instance in appropriate subnet
   - Create replication tasks with CDC (Change Data Capture) enabled
   - Configure error logging to CloudWatch for troubleshooting

6. **Migration Monitoring**
   - Implement CloudWatch dashboards showing migration progress metrics
   - Track replication lag, task health, and throughput
   - Provide visibility into the migration status

7. **Traffic Shifting with Route 53**
   - Create Route 53 weighted routing policies for gradual traffic migration
   - Set initial weight to 0% for new infrastructure (legacy gets 100%)
   - Enable manual traffic shift control

8. **Auto-scaling Configuration**
   - Configure ECS service auto-scaling (minimum: 4, maximum: 12 tasks)
   - Set target CPU utilization to 70%
   - Enable automatic scale-out and scale-in

9. **DMS Lag Monitoring**
   - Set up CloudWatch alarms for DMS replication lag exceeding 60 seconds
   - Alert when replication falls behind to prevent data inconsistency

10. **Rollback Support**
    - Export critical resource ARNs as Pulumi stack outputs
    - Include database endpoints, load balancer DNS, ECS cluster ARN
    - Enable quick rollback procedures if issues arise

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** spanning 3 availability zones in us-west-2
- Use **EC2 NAT Gateways** for outbound internet access from private subnets
- Use **ECS Fargate** for containerized application workloads
- Use **ECR** (Elastic Container Registry) for private container image storage
- Use **Aurora MySQL** for the target database with multi-AZ deployment
- Use **DMS** (Database Migration Service) for live database replication
- Use **Application Load Balancer** for modern load balancing
- Use **Route 53** for DNS-based traffic shifting
- Use **CloudWatch** for dashboards, metrics, and alarms
- Use **Secrets Manager** for storing database credentials
- Use **IAM** roles and policies for service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-west-2** region (configured in lib/AWS_REGION)

### Constraints

- Database migration must use DMS with CDC enabled for real-time replication
- Container images must be stored in private ECR repositories with scan-on-push enabled
- ALB health checks must use HTTP path /health with 30-second intervals
- All resources must have Cost Allocation Tags: Environment, Owner, Project
- ECS tasks must use awsvpc network mode with assignPublicIp disabled
- Secrets must be stored in AWS Secrets Manager with automatic rotation disabled
- Stack must support parallel deployment alongside existing infrastructure
- All resources must be destroyable (no Retain policies, no deletion protection)
- Backup retention periods set to minimum (1 day for Aurora)
- Include proper error handling and logging throughout

### Deployment Requirements (CRITICAL)

**Resource Naming**: ALL resources MUST include environmentSuffix parameter for uniqueness. This is critical for parallel deployments and testing. Examples:
- VPC: `migration-vpc-{environmentSuffix}`
- ALB: `migration-alb-{environmentSuffix}`
- ECS Cluster: `migration-cluster-{environmentSuffix}`

**Destroyability**: All resources MUST be fully destroyable without manual intervention:
- Aurora: Set deletion_protection=False, skip_final_snapshot=True, backup_retention_period=1
- DMS: Set deletion_protection=False
- No RemovalPolicy.RETAIN on any resources
- This is MANDATORY for automated testing and cleanup

**Network Architecture**: The infrastructure must span 3 availability zones with:
- Public subnets for ALB (internet-facing)
- Private subnets for ECS Fargate tasks
- Private subnets for Aurora database
- NAT Gateways in public subnets for outbound access

**Service-Specific Requirements**:
- ECR repositories must have image scanning enabled on push
- ECS tasks must NOT have public IPs (assignPublicIp: False)
- Aurora must have 1 writer + 2 reader instances
- DMS replication instance should be appropriately sized (e.g., dms.t3.medium)
- Secrets Manager secrets should have automatic rotation disabled for this migration scenario

## Success Criteria

- **Functionality**: Complete parallel infrastructure in us-west-2 with database replication active
- **Performance**: ECS auto-scaling responds to CPU load, maintaining 70% target utilization
- **Reliability**: Multi-AZ deployment ensures high availability, DMS CDC provides real-time sync
- **Security**: Private subnets for compute/database, ECR image scanning, Secrets Manager for credentials
- **Resource Naming**: All resources include environmentSuffix for parallel deployment support
- **Monitoring**: CloudWatch dashboards show migration progress, alarms trigger on replication lag
- **Code Quality**: Clean Pulumi Python code, well-structured, properly documented

## What to deliver

- Complete Pulumi Python implementation with __main__.py entry point
- Pulumi stack class in lib/tap_stack.py
- VPC with 3 AZs (public and private subnets, NAT Gateways, Internet Gateway)
- ECR repository with scan-on-push enabled
- ECS Fargate cluster and service with 4 tasks, auto-scaling configured
- Aurora MySQL cluster with 1 writer and 2 reader instances
- DMS replication instance and replication task with CDC enabled
- Application Load Balancer with sticky sessions and health checks
- Route 53 weighted routing policy (0% initial weight to new stack)
- CloudWatch dashboard for migration metrics
- CloudWatch alarms for DMS replication lag
- Secrets Manager secret for database credentials
- IAM roles and policies for ECS tasks, DMS, and other services
- Stack outputs exporting critical resource ARNs and endpoints
- All resources with proper Cost Allocation Tags (Environment, Owner, Project)
- Documentation in README.md covering deployment and migration steps
