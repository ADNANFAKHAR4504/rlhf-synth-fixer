Hey team,

We've been having issues with configuration drift between our development, staging, and production trading platform environments. Last month we had a critical deployment failure because staging wasn't properly synchronized with production, which caused a trading disruption that cost us significantly. The leadership team wants us to implement a robust infrastructure-as-code solution that ensures consistency across all three environments while still allowing appropriate sizing and redundancy differences.

We're a financial services company running identical trading platforms across three environments in different AWS regions. Each environment needs to maintain the same network topology, security configurations, and service definitions, but with environment-appropriate resource sizing. Development runs in us-east-2 with minimal redundancy, staging mirrors production configuration in us-east-1 but with moderate sizing, and production runs in us-east-1 with full high-availability setup.

The infrastructure team has been manually managing these environments, which has led to subtle differences that only show up during deployment. We need to codify the entire infrastructure using **Pulumi with TypeScript** and implement automated drift detection so we can catch configuration inconsistencies before they cause problems.

## What we need to build

Create a multi-environment infrastructure management system using **Pulumi with TypeScript** that maintains consistency across development, staging, and production environments while allowing environment-specific sizing and redundancy variations.

### Core Requirements

1. **Base Infrastructure Template**
   - Define reusable infrastructure components including VPC with 3 availability zones
   - Include subnets (public and private across all AZs)
   - Security groups with appropriate ingress/egress rules
   - ECS Fargate cluster for containerized applications
   - RDS Aurora PostgreSQL cluster with appropriate instance counts
   - Application Load Balancers for traffic distribution

2. **Environment-Specific Configurations**
   - Development: t3.medium instances, 1 database instance, minimal redundancy in us-east-2
   - Staging: m5.large instances, 2 database instances, moderate redundancy in us-east-1
   - Production: m5.xlarge instances, 3 database instances, full HA in us-east-1
   - Each environment must inherit from base template while overriding size parameters

3. **Cross-Stack References and Synchronization**
   - Use Pulumi stack references to share outputs between environments
   - Ensure network configurations are synchronized across all environments
   - Implement VPC peering connections for secure inter-environment communication

4. **Configuration Management**
   - Create AWS Systems Manager Parameter Store hierarchies for each environment
   - Implement shared parameters that apply to all environments
   - Define environment-specific parameters with proper namespacing
   - Use Pulumi configuration system for environment-specific values

5. **Container Image Management**
   - ECS task definitions that automatically select correct container images by environment
   - Development uses :latest tags
   - Staging uses :staging-* tags
   - Production uses :v*.*.* semantic version tags

6. **Database Configuration**
   - RDS Aurora PostgreSQL clusters with environment-appropriate instance counts
   - Development: 1 instance with 7-day backup retention
   - Staging: 2 instances with 14-day backup retention
   - Production: 3 instances with 30-day backup retention
   - Implement automated backups and point-in-time recovery

7. **Monitoring and Alerting**
   - CloudWatch dashboards that aggregate metrics across all three environments
   - Enable comparison views to identify configuration drift
   - SNS topics for drift detection alerts when environments diverge from expected state
   - Automated notifications when critical configuration parameters differ

8. **Reusable Components**
   - Implement Pulumi ComponentResource pattern for shared infrastructure
   - Create custom components for VPC, ECS cluster, RDS setup, and monitoring
   - Enable component reuse across all three stacks with parameter overrides

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** with 3 availability zones per environment
- Use **ECS Fargate** for containerized application hosting
- Use **RDS Aurora PostgreSQL** for database layer
- Use **Application Load Balancers** for traffic distribution
- Use **S3** for data storage and backups
- Use **CloudWatch** for monitoring and metrics
- Use **SNS** for alerting and notifications
- Use **AWS Systems Manager Parameter Store** for configuration
- Use **VPC Peering** for inter-environment connectivity
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environmentSuffix`
- Deploy primary production to **us-east-1** region
- Deploy development to **us-east-2** region
- Pulumi CLI 3.x with Node.js 18+
- AWS CLI configured with cross-region permissions

### Constraints

- All resources must be fully destroyable for CI/CD pipelines (no Retain policies)
- Implement encryption at rest and in transit for all data storage
- Follow principle of least privilege for all IAM roles and policies
- Secrets must be fetched from existing AWS Secrets Manager (not created by this stack)
- Enable comprehensive logging and monitoring for compliance
- Each environment must maintain isolated VPCs with controlled peering
- Implement automated drift detection between environments
- Environment-specific parameter validation using TypeScript interfaces
- Reusable components using Pulumi ComponentResource pattern
- Stack references to share outputs between environments
- Rollback capabilities using Pulumi's state management

### Success Criteria

- Functionality: Three complete stacks deployed across different regions with identical topology
- Consistency: Base infrastructure template successfully shared across all environments
- Flexibility: Environment-specific sizing properly applied (t3.medium/m5.large/m5.xlarge)
- Reliability: Appropriate redundancy levels (1/2/3 database instances)
- Security: Encryption enabled, least privilege IAM, secrets managed properly
- Monitoring: CloudWatch dashboards showing cross-environment comparison
- Alerting: SNS notifications functional for drift detection
- Resource Naming: All resources include environmentSuffix
- Code Quality: TypeScript, well-tested, documented, reusable components
- Drift Detection: Automated detection of configuration inconsistencies

## What to deliver

- Complete Pulumi TypeScript implementation with three stack configurations
- Reusable ComponentResource implementations for VPC, ECS, RDS, and monitoring
- Stack reference integration for cross-environment output sharing
- VPC with subnets, security groups, and peering connections
- ECS Fargate cluster with environment-specific task definitions
- RDS Aurora PostgreSQL clusters with proper sizing and backup policies
- Application Load Balancers configured for each environment
- S3 buckets for data storage
- CloudWatch dashboards with cross-environment metrics
- SNS topics and subscription endpoints for alerting
- AWS Systems Manager Parameter Store hierarchies
- TypeScript interfaces for environment validation
- Unit tests for all components
- Documentation covering deployment and drift detection procedures