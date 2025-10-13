# AWS CDK TypeScript Infrastructure Development Prompt

## Context & Objective
You are an expert AWS Solutions Architect tasked with building a production-ready, enterprise-grade infrastructure solution using AWS CDK and TypeScript. Your goal is to create a comprehensive, well-architected system that follows AWS best practices and industry standards.

## Task Overview
**Build a Multi-Region Disaster Recovery Infrastructure with Automated Failover**

Design and implement a cross-region disaster recovery solution for a critical financial application using AWS CDK and TypeScript. The solution must handle approximately 10,000 transactions per hour with strict compliance requirements.

## Requirements

### Business Requirements
- **Primary Region**: us-east-1
- **DR Region**: us-west-2
- **Transaction Volume**: 10,000 transactions/hour
- **RPO (Recovery Point Objective)**: 15 minutes
- **RTO (Recovery Time Objective)**: 30 minutes
- **Compliance**: Financial industry standards

### Technical Requirements

#### 1. Multi-AZ Infrastructure
- Deploy identical infrastructure in both regions
- Ensure high availability within each region
- Use multiple Availability Zones for fault tolerance

#### 2. Database Layer
- **Aurora Global Database** for cross-region data replication
- Automated backup and point-in-time recovery
- Read replicas in DR region for read scaling
- Encryption at rest and in transit using KMS

#### 3. Application Layer
- **Application Load Balancers** with health checks
- **Auto Scaling Groups** with target tracking policies
- Containerized applications (ECS Fargate or EKS)
- Session management with DynamoDB Global Tables

#### 4. Networking & Security
- VPC with public/private subnets in each region
- Security groups with least privilege access
- KMS customer-managed keys for encryption
- AWS Secrets Manager for credential management

#### 5. Monitoring & Automation
- **CloudWatch** metrics, logs, and alarms
- **Route 53** health checks and DNS failover
- **Lambda functions** for failover orchestration
- **EventBridge** for event-driven automation

#### 6. Data Replication
- Real-time data synchronization between regions
- Conflict resolution strategies
- Data consistency validation

## CDK Implementation Guidelines

### Project Structure
```
src/
├── lib/
│   ├── stacks/
│   │   ├── tap-stack.ts          # Main infrastructure stack
│   │   ├── database-stack.ts
│   │   ├── compute-stack.ts
│   │   ├── networking-stack.ts
│   │   ├── monitoring-stack.ts
│   │   └── disaster-recovery-stack.ts
│   ├── constructs/
│   │   ├── aurora-global-database.ts
│   │   ├── auto-scaling-group.ts
│   │   ├── load-balancer.ts
│   │   └── failover-lambda.ts
│   └── app.ts
├── bin/
│   └── main.ts                   # CDK application entry point
└── test/
    └── stacks/
```

### Key Implementation Requirements

#### 1. Core Files Structure

**`bin/main.ts` - CDK Application Entry Point**
- Initialize the CDK app with proper configuration
- Set up environment-specific parameters
- Instantiate the main `TapStack` for both regions
- Configure CDK context and feature flags
- Handle cross-region deployment orchestration

**`lib/stacks/tap-stack.ts` - Main Infrastructure Stack**
- Primary stack containing all infrastructure components
- Orchestrate resource creation and dependencies
- Implement cross-region resource connections
- Handle parameter passing between stacks
- Manage resource tagging and naming conventions

#### 2. Infrastructure as Code Best Practices
- Use CDK constructs and patterns
- Implement proper resource tagging
- Create reusable constructs for common patterns
- Use CDK aspects for cross-cutting concerns
- Implement proper error handling and rollback strategies

#### 2. Security Implementation
- Encrypt all data at rest and in transit
- Use IAM roles with least privilege
- Implement network segmentation
- Store secrets in AWS Secrets Manager
- Enable CloudTrail for audit logging

#### 3. Monitoring & Observability
- Create comprehensive CloudWatch dashboards
- Implement custom metrics for business KPIs
- Set up proactive alerting
- Use AWS X-Ray for distributed tracing
- Implement log aggregation and analysis

#### 4. Disaster Recovery Automation
- Create Lambda functions for failover orchestration
- Implement health check automation
- Use EventBridge for event-driven failover
- Create runbooks for manual intervention scenarios
- Implement automated testing of DR procedures

#### 5. Cost Optimization
- Use appropriate instance types and sizes
- Implement auto-scaling policies
- Use Spot instances where appropriate
- Implement resource scheduling
- Monitor and optimize costs continuously

## Expected Deliverables

### 1. CDK Application Structure
- **`bin/main.ts`**: CDK application entry point with cross-region deployment orchestration
- **`lib/stacks/tap-stack.ts`**: Main infrastructure stack with all core components
- Complete TypeScript CDK application with proper organization
- Configuration management for different environments
- Comprehensive unit and integration tests

### 2. Infrastructure Components
- **NetworkingStack**: VPC, subnets, security groups, NAT gateways
- **DatabaseStack**: Aurora Global Database, KMS keys, Secrets Manager
- **ComputeStack**: ECS/EKS clusters, ALBs, Auto Scaling Groups
- **MonitoringStack**: CloudWatch dashboards, alarms, logs
- **DisasterRecoveryStack**: Lambda functions, EventBridge rules, Route 53

### 3. Automation & Orchestration
- Failover Lambda functions with proper error handling
- Health check automation
- Data replication monitoring
- Automated testing procedures

### 4. Documentation
- Architecture diagrams (ASCII or Mermaid)
- Deployment instructions
- Operational runbooks
- Troubleshooting guides
- Cost analysis and optimization recommendations

## Success Criteria

### Functional Requirements
- ✅ Automated failover completes within 30 minutes
- ✅ RPO of 15 minutes maintained
- ✅ RTO of 30 minutes achieved
- ✅ Zero data loss during failover
- ✅ Application remains available during failover

### Non-Functional Requirements
- ✅ Infrastructure is fully automated and reproducible
- ✅ All resources are properly tagged and monitored
- ✅ Security best practices implemented
- ✅ Cost-optimized for production workloads
- ✅ Comprehensive testing and validation

### Quality Assurance
- ✅ Code follows TypeScript best practices
- ✅ CDK constructs are reusable and well-documented
- ✅ Infrastructure is tested and validated
- ✅ Deployment is automated and reliable
- ✅ Monitoring and alerting are comprehensive

## Additional Considerations

### Compliance & Governance
- Implement proper access controls and audit trails
- Ensure data residency requirements are met
- Implement backup and recovery procedures
- Create compliance documentation and reports

### Performance & Scalability
- Design for horizontal scaling
- Implement caching strategies
- Optimize database performance
- Plan for future growth and scaling

### Operational Excellence
- Create comprehensive monitoring and alerting
- Implement automated testing and validation
- Create operational runbooks and procedures
- Establish incident response procedures

## Getting Started

1. **Initialize CDK Project**: Set up the basic CDK TypeScript project structure
2. **Create `bin/main.ts`**: Set up the CDK application entry point with cross-region configuration
3. **Create `lib/stacks/tap-stack.ts`**: Build the main infrastructure stack with all core components
4. **Define Additional Stacks**: Create supporting infrastructure stacks (database, compute, etc.)
5. **Implement Constructs**: Build reusable CDK constructs
6. **Add Monitoring**: Implement comprehensive monitoring and alerting
7. **Create Automation**: Build failover and orchestration logic
8. **Test & Validate**: Implement testing and validation procedures
9. **Document**: Create comprehensive documentation and runbooks

## Notes
- Focus on connecting resources properly with appropriate dependencies
- Ensure all resources are properly configured for cross-region replication
- Implement proper error handling and rollback strategies
- Use CDK best practices for resource management and lifecycle
- Consider cost optimization while maintaining high availability and performance

---

**Remember**: This is a production system handling financial transactions. Every component must be designed for reliability, security, and compliance. Prioritize automation, monitoring, and operational excellence throughout the implementation.