Hey team,

We need to orchestrate a phased migration from our legacy infrastructure to modern AWS architecture. The business wants a gradual cutover approach that minimizes risk and allows us to shift traffic incrementally between the old and new environments. I've been asked to create this using **Terraform with HCL** for the ap-southeast-1 region.

The core challenge here is managing two parallel environments during the migration period. We have legacy EC2 instances running our application and database, and we need to move to a modern setup with RDS Aurora and Auto Scaling. But we can't just flip a switch - operations needs the ability to gradually shift traffic from 0% to 100% while monitoring performance and having a quick rollback path if anything goes wrong.

The other critical piece is the database migration. We're moving from a PostgreSQL database running on EC2 to RDS Aurora, and we need AWS DMS to handle the replication so we can keep both databases in sync during the cutover period. The networking has to be bulletproof too - VPC peering between the legacy and production environments, proper subnet design, and all the routing configured correctly.

## What we need to build

Create a complete migration orchestration system using **Terraform with HCL** that manages two parallel AWS environments with controlled traffic shifting and database replication capabilities.

### Core Requirements

1. **Workspace Management**
   - Define two Terraform workspaces: 'legacy' and 'production'
   - Use workspace-specific variables for CIDR blocks, instance types, and resource naming
   - Resource names must include environmentSuffix for uniqueness across workspaces
   - Follow naming convention: resource-type-environment-suffix

2. **Network Infrastructure**
   - Create legacy VPC with CIDR 10.0.0.0/16
   - Create production VPC with CIDR 10.1.0.0/16
   - Establish VPC peering connection between legacy and production VPCs
   - Configure route tables to enable communication across the peering connection
   - Create at least two public subnets in different availability zones per workspace for ALB requirements
   - Create private subnets for EC2 instances and database resources
   - Add NAT Gateway in public subnet for private subnet internet access
   - Enable VPC Flow Logs to CloudWatch with 7 day retention minimum

3. **Database Migration Setup**
   - Deploy AWS DMS replication instance in appropriate subnet
   - Configure DMS source endpoint for PostgreSQL on EC2 (legacy environment)
   - Configure DMS target endpoint for RDS Aurora (production environment)
   - Create DMS replication task for continuous data sync
   - Task should support full load and ongoing replication

4. **Load Balancing and Traffic Distribution**
   - Deploy Application Load Balancer with target groups for legacy EC2 instances
   - Deploy Application Load Balancer with target groups for production Auto Scaling Group
   - Configure ALB health checks for application endpoints
   - Enable ALB access logging to S3 with encryption
   - Create S3 bucket with proper policies for ALB logs

5. **DNS and Traffic Routing**
   - Create Route 53 hosted zone for the application domain
   - Configure weighted routing policy pointing to both ALBs
   - Support weight values from 0 to 100 for gradual traffic shifting
   - Provide mechanism to adjust weights without full redeployment

6. **Auto Scaling Infrastructure**
   - Create launch template for production application instances
   - Define Auto Scaling Group with desired capacity, min, and max settings
   - Deploy ASG instances in private subnets across multiple availability zones
   - Configure ASG to register instances with production ALB target group
   - Include proper IAM roles for instance access to AWS services

7. **Configuration Management**
   - Store database endpoints in Systems Manager Parameter Store
   - Store application URLs in Parameter Store
   - Store migration status flags in Parameter Store
   - Use workspace-based naming for all parameters: /workspace-name/parameter-type/key

8. **Monitoring and Observability**
   - Create CloudWatch dashboard showing DMS replication lag metrics
   - Include ALB request count and target response times
   - Show Auto Scaling Group instance health status
   - Add custom metrics for migration progress tracking
   - Configure CloudWatch alarms for replication lag thresholds and ALB unhealthy targets

9. **Migration Guidance**
   - Output Terraform commands for workspace selection and switching
   - Provide database migration start/stop commands
   - Generate traffic shifting instructions with example weight updates
   - Include rollback procedures in outputs

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS DMS for database migration and replication
- Use Application Load Balancer for traffic distribution
- Use Route 53 for DNS-based traffic routing
- Use Auto Scaling Group for production environment elasticity
- Use Systems Manager Parameter Store for configuration
- Use CloudWatch for monitoring and dashboards
- Resource names must include environmentSuffix for uniqueness
- Deploy to ap-southeast-1 region
- Modular structure with reusable components where appropriate

### Constraints

- All resources must be destroyable - no Retain deletion policies
- Private subnets must have internet access via NAT Gateway
- ALB must have minimum two subnets in different availability zones
- Backend configuration must not use variable interpolation
- VPC peering must allow bidirectional communication
- DMS replication must support both full load and CDC
- Route 53 weights must be adjustable for gradual cutover
- All sensitive data encrypted at rest and in transit

## Success Criteria

- Functionality: Two workspaces deploy separate but connected environments
- Migration: DMS successfully replicates PostgreSQL data with minimal lag
- Traffic Control: Route 53 weighted routing allows 0-100% traffic distribution
- Networking: VPC peering enables communication, NAT provides internet access
- Monitoring: CloudWatch dashboard shows all critical migration metrics
- Security: VPC Flow Logs enabled, ALB access logs to S3, encryption enabled
- Resource Naming: All resources include environmentSuffix
- Code Quality: Modular Terraform HCL, well-tested, documented
- Destroyability: All resources can be cleanly destroyed

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Backend configuration without variable interpolation
- VPC module with peering, subnets, NAT, and Flow Logs
- DMS module for replication setup
- ALB module with access logging
- ASG module with launch template
- Route 53 weighted routing configuration
- CloudWatch dashboard and alarms
- Parameter Store configuration
- Comprehensive integration tests achieving 100% pass rate
- Migration runbook and traffic shifting instructions as outputs
