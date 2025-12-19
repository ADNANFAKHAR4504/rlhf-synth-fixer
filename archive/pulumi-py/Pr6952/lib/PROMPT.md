Hey team,

We've got an interesting challenge from a financial services company. They're ready to move their on-premises application to AWS, but this isn't a simple lift-and-shift. They have a monolithic Java-based API service backed by PostgreSQL, and they need a careful, phased approach to migration.

The key here is that we can't just flip a switch. This needs to be gradual. They want the ability to slowly cutover traffic while maintaining data consistency throughout the migration. Think about it - this is financial data, so we need rock-solid reliability during the entire process.

I've been asked to build this using **Pulumi with Python** to handle all the infrastructure. The business is particularly concerned about maintaining service availability and data integrity during the transition period.

## What we need to build

Create a comprehensive migration infrastructure using **Pulumi with Python** that enables phased migration of a Java API service and PostgreSQL database from on-premises to AWS.

### Core Migration Requirements

1. **Server Migration Infrastructure**
   - Set up AWS Application Migration Service (MGN) for the Java API service
   - Configure replication settings and staging area
   - Enable testing capabilities before cutover

2. **Database Migration Infrastructure**
   - Implement AWS Database Migration Service (DMS) for PostgreSQL
   - Set up continuous replication to maintain data consistency
   - Configure source and target endpoints
   - Create replication instances with appropriate sizing

3. **Target Infrastructure**
   - VPC with proper network segmentation (public and private subnets across multiple AZs)
   - Security groups with least privilege access
   - RDS PostgreSQL instance as migration target (Multi-AZ for high availability)
   - EC2 or ECS infrastructure for the Java API service
   - Application Load Balancer for traffic distribution

4. **Traffic Management and Gradual Cutover**
   - Route 53 weighted routing policies or similar mechanism
   - Ability to gradually shift traffic percentages
   - Health checks and monitoring during cutover
   - Support for rollback scenarios

5. **Monitoring and Observability**
   - CloudWatch Logs for all services
   - CloudWatch Metrics and alarms for migration health
   - Monitoring for replication lag and data consistency
   - Alerts for migration failures or issues

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Application Migration Service (MGN)** for server migration
- Use **AWS Database Migration Service (DMS)** for PostgreSQL migration
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across multiple deployments
- Follow naming convention: `resource-type-{environmentSuffix}`
- All resources must be destroyable (no Retain policies or deletion protection)
- Implement security best practices for financial services workloads
- Enable encryption at rest and in transit where applicable

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL named resources must include environmentSuffix to prevent naming conflicts in CI/CD
- **Destroyability**: All resources must support clean deletion - no RemovalPolicy.RETAIN or deletion_protection=True
- **IAM Permissions**: DMS and MGN require specific IAM roles and policies - ensure service-linked roles are properly configured
- **Network Connectivity**: DMS replication instances must be able to reach both source and target databases
- **Migration Timing**: DMS full load followed by CDC (Change Data Capture) requires careful orchestration

### Constraints

- High availability required - use Multi-AZ deployments where applicable
- Security compliance for financial services - encryption, audit logging, least privilege IAM
- Cost optimization - use appropriate instance sizes, no over-provisioning
- Network isolation - proper security group rules, private subnets for databases
- Data consistency is paramount - implement proper replication monitoring
- All resources must be testable and deployable in isolated environments
- Include proper error handling and validation

## Success Criteria

- **Functionality**: Complete migration infrastructure that supports phased cutover
- **Data Consistency**: DMS replication with minimal lag, data validation capabilities
- **High Availability**: Multi-AZ RDS, load-balanced application tier
- **Security**: Encrypted storage and transit, proper IAM roles, security groups following least privilege
- **Observability**: Comprehensive CloudWatch monitoring, alarms for critical metrics
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Code Quality**: Clean Python code, well-structured Pulumi resources, comprehensive documentation

## What to deliver

- Complete Pulumi Python implementation in tap_stack.py
- VPC with multi-AZ networking (subnets, route tables, internet gateway, NAT gateway if needed)
- RDS PostgreSQL target instance with proper configuration
- DMS replication instance, endpoints, and replication tasks
- Application infrastructure (ECS Fargate or EC2 Auto Scaling Group) for Java API
- Application Load Balancer with target groups
- Route 53 weighted routing for traffic management
- CloudWatch alarms and monitoring dashboards
- Security groups with documented rules
- IAM roles and policies for DMS, MGN, and application services
- Unit tests for all infrastructure components
- Clear documentation and deployment instructions
