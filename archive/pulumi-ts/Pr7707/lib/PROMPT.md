Hey team,

We need to optimize our existing RDS PostgreSQL deployment for the user-api service. The current setup is running on a db.t3.medium instance, and we're seeing performance bottlenecks during peak hours. The platform team has asked me to implement comprehensive improvements using **Pulumi with TypeScript** to enhance performance, reliability, and monitoring capabilities.

The database currently supports our user authentication and profile management system, which is critical for the entire platform. We're experiencing slower query response times and occasional connection timeouts during high traffic periods. The operations team needs better visibility into database performance metrics and wants automated alerting for potential issues before they impact users.

This is a production database, so we need to ensure all changes maintain high availability and don't cause any downtime. The upgrade path needs to be carefully planned with proper backup retention and monitoring in place.

## What we need to build

Optimize the existing RDS PostgreSQL deployment using **Pulumi with TypeScript** to improve performance, reliability, and observability for the user-api production database.

### Core Requirements

1. **Instance Performance Upgrade**
   - Upgrade from db.t3.medium to db.r6g.large with Graviton processors
   - Provides better price-performance ratio for memory-intensive workloads
   - Maintains PostgreSQL compatibility while improving CPU and memory capacity

2. **Performance Monitoring and Insights**
   - Enable Performance Insights with 7-day retention period
   - Allows identification of slow queries and performance bottlenecks
   - Enable Enhanced Monitoring with 60-second granularity for detailed metrics

3. **Backup and Disaster Recovery**
   - Configure automated backups with 35-day retention period
   - Set daily backup window between 3-4 AM UTC to minimize impact
   - Ensure backup settings support compliance requirements

4. **High Availability Configuration**
   - Implement Multi-AZ deployment for automatic failover capability
   - Ensures zero downtime during maintenance and hardware failures
   - Synchronous replication to standby instance in different availability zone

5. **Database Parameter Optimization**
   - Create custom parameter group with optimized PostgreSQL settings
   - Set shared_buffers to 25% of instance memory for query caching
   - Set effective_cache_size to 75% of instance memory for query planning optimization
   - Tune parameters based on r6g.large instance specifications

6. **CloudWatch Monitoring and Alerting**
   - Create alarm for CPU utilization with 80% threshold
   - Create alarm for database connections at 80% of max_connections
   - Create alarm for read latency exceeding 200ms
   - Create alarm for write latency exceeding 200ms
   - All alarms should trigger when threshold breached for 2 consecutive evaluation periods

7. **SNS Notification Setup**
   - Create SNS topic for database alerts
   - Configure topic for ops team email notifications
   - Connect all CloudWatch alarms to SNS topic for centralized alerting

8. **Network Security Configuration**
   - Configure security group allowing connections only from application subnets
   - Implement principle of least privilege for database access
   - Restrict traffic to PostgreSQL port 5432 from authorized sources only

9. **Resource Tagging and Cost Tracking**
   - Apply consistent tags: Environment=production, Team=platform, Service=user-api
   - Enable cost allocation tracking for database resources
   - Support financial reporting and cost optimization efforts

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS RDS service for PostgreSQL database management
- Use CloudWatch for metrics, alarms, and monitoring
- Use SNS for notification delivery
- Resource names must include **environmentSuffix** for multi-environment support
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)
- Use Pulumi's ComponentResource pattern with TapStack structure
- Include proper error handling and type safety

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names MUST include environmentSuffix parameter for uniqueness across environments
- **Destroyability**: All resources MUST be fully destroyable with no DeletionPolicy Retain or RemovalPolicy RETAIN
- **Multi-AZ**: RDS instance must have multiAz set to true for high availability
- **Security Groups**: Must be properly configured to allow database access only from application tier
- **Parameter Group**: Must be custom (not default) to allow optimization tuning
- **Monitoring**: Both Performance Insights and Enhanced Monitoring must be enabled
- **Alarms**: All CloudWatch alarms must have proper threshold values and SNS topic association

### Constraints

- Maintain production database availability during optimization implementation
- Use PostgreSQL-compatible instance classes and parameter settings
- CloudWatch alarm thresholds must be realistic for production workloads
- SNS topic must support email protocol for ops team notifications
- Security group rules must not expose database to public internet
- Backup window should be during low-traffic hours (3-4 AM UTC)
- Parameter group settings must be validated against PostgreSQL best practices
- All configuration changes must support zero-downtime deployment

## Success Criteria

- **Performance**: RDS instance upgraded to db.r6g.large with optimized parameters
- **Monitoring**: Performance Insights and Enhanced Monitoring enabled and collecting metrics
- **Reliability**: Multi-AZ deployment configured for automatic failover
- **Alerting**: CloudWatch alarms configured and connected to SNS topic
- **Security**: Security group restricts access to application subnets only
- **Backup**: Automated backups configured with 35-day retention
- **Tagging**: All resources tagged for cost tracking and environment identification
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript code with proper types, error handling, and documentation

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- RDS PostgreSQL instance with optimized configuration (db.r6g.large)
- Custom DB parameter group with memory and cache optimization
- Security group with restricted access rules
- CloudWatch alarms for CPU, connections, and latency metrics
- SNS topic for alarm notifications
- Performance Insights and Enhanced Monitoring enabled
- Multi-AZ deployment for high availability
- Comprehensive documentation in README.md
- Unit tests validating resource configuration
- Clear deployment instructions and prerequisites
