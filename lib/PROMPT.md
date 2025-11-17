# Multi-Region Infrastructure Migration

Hey team,

We've got an exciting but challenging project on our hands. Our fintech startup has been growing like crazy, and we've hit the point where our single-region setup in us-east-1 just isn't cutting it anymore. We need to migrate to a multi-region architecture that spans both us-east-1 and us-east-2, and we need to do it right.

The business has been clear about their requirements. We're in the financial services space, so compliance and reliability are non-negotiable. They want us-east-2 as a secondary region with the full infrastructure replicated there, but with some region-specific tweaks for compliance. Things like stricter latency monitoring in us-east-2 and different WAF rules per region based on where traffic is coming from.

The architecture needs to handle everything from database replication to cross-region S3 syncing for user uploads. We're talking RDS PostgreSQL instances, DynamoDB global tables for sessions, Lambda functions processing payment events, and Application Load Balancers with regional WAF protections. Plus, we need VPC peering between the regions so our services can talk to each other privately.

I've been asked to build this using **AWS CDK with TypeScript**. The team wants this to be production-ready with proper error handling, security best practices, and most importantly, completely testable and destroyable infrastructure. No retention policies that will bite us during testing.

## What we need to build

Create a multi-region infrastructure migration solution using **AWS CDK with TypeScript** that migrates existing infrastructure from us-east-1 to a dual-region setup including both us-east-1 and us-east-2.

### Core Requirements

1. **Reusable Regional Infrastructure**
   - Define a reusable CDK construct that can deploy infrastructure to any specified region
   - Create a main orchestration stack that manages regional stacks
   - Use CDK best practices including proper separation of concerns and type safety
   - Leverage CDK context variables to manage region-specific configurations

2. **Database Layer**
   - Deploy RDS PostgreSQL instances in both us-east-1 and us-east-2
   - Enable encryption at rest using customer-managed KMS keys (region-specific)
   - Configure DynamoDB global tables for user sessions spanning both regions
   - Ensure database instances are in private subnets across 3 availability zones

3. **Application Load Balancers and WAF**
   - Set up Application Load Balancers in both regions
   - Implement region-specific WAF rules that block requests from specific countries based on region
   - WAF rules must meet region-specific compliance requirements for fintech operations
   - ALBs should be in public subnets with proper security group configurations

4. **Storage and Replication**
   - Configure S3 buckets for user uploads with encryption enabled
   - Set up cross-region replication from us-east-1 to us-east-2
   - Ensure proper IAM roles and policies for replication
   - Implement versioning and lifecycle policies

5. **Serverless Processing**
   - Deploy Lambda functions to process payment events in both regions
   - Configure region-specific environment variables for API endpoint configurations
   - Set up proper IAM roles with least-privilege access
   - Use Systems Manager Parameter Store for configuration management

6. **Container Workloads**
   - Deploy ECS clusters using Fargate in both regions
   - Configure proper task definitions with appropriate CPU and memory
   - Implement service discovery and load balancer integration
   - Ensure containers run in private subnets

7. **Network Infrastructure**
   - Create VPCs in both us-east-1 and us-east-2 with public and private subnets across 3 availability zones
   - Establish VPC peering between regions with custom routing tables for private communication
   - Configure NAT Gateways for outbound internet access from private subnets
   - Set up security groups and NACLs for proper network segmentation

8. **Monitoring and Alarms**
   - Implement CloudWatch alarms with region-specific thresholds
   - us-east-2 requires stricter latency monitoring than us-east-1
   - Monitor RDS, Lambda, ALB, and DynamoDB metrics
   - Set up SNS topics for alarm notifications

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **RDS** for PostgreSQL database instances with encryption
- Use **DynamoDB** for global tables spanning both regions
- Use **Lambda** for payment event processing
- Use **S3** with cross-region replication for user uploads
- Use **ALB** with region-specific **WAF** rules
- Use **ECS** with **Fargate** for container workloads
- Use **KMS** for customer-managed encryption keys in each region
- Use **CloudWatch** for monitoring with region-specific alarm thresholds
- Use **Systems Manager Parameter Store** for configuration management
- Use **VPC** infrastructure with peering between regions
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-environment-suffix` or similar consistent pattern
- Deploy primary region to **us-east-1** and secondary to **us-east-2**

### Constraints

- All resources must be fully destroyable with no Retain deletion policies
- No DeletionProtection on databases or load balancers
- All encryption must use customer-managed KMS keys specific to each region
- RDS instances must be in private subnets with no public access
- Lambda functions must have timeout and memory configurations appropriate for payment processing
- DynamoDB tables must be configured as global tables with replication to both regions
- VPC peering must enable private communication between regions without traversing the internet
- All resources must be tagged with Environment, Region, and CostCenter tags
- CloudWatch alarm thresholds must be configurable per region via CDK context
- WAF rules must be different per region to meet regional compliance requirements
- S3 replication must be unidirectional from us-east-1 to us-east-2
- Infrastructure must support clean teardown for testing purposes

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter for deployment uniqueness
- Resources MUST NOT use RemovalPolicy.RETAIN - all must be DESTROY for testing
- RDS instances MUST have deletionProtection set to false
- Load Balancers MUST have deletion_protection disabled
- S3 buckets MUST use RemovalPolicy.DESTROY with autoDeleteObjects: true
- KMS keys MUST have pendingWindow set to minimum (7 days) for faster cleanup
- Lambda functions Node.js 18+ must use AWS SDK v3 (not packaged)
- VPC peering connections must be properly cleaned up on stack deletion

## Success Criteria

- **Functionality**: Infrastructure successfully deploys to both us-east-1 and us-east-2 with all components operational
- **Multi-Region**: VPC peering established, DynamoDB global tables replicating, S3 cross-region replication working
- **Security**: Customer-managed KMS encryption in place, WAF rules active, resources in appropriate subnets
- **Monitoring**: CloudWatch alarms configured with region-specific thresholds, proper notification setup
- **Compliance**: Region-specific WAF rules enforced, encryption at rest enabled, private network communication
- **Resource Naming**: All resources include environmentSuffix in their names for uniqueness
- **Destroyability**: All resources can be cleanly deleted without manual intervention
- **Code Quality**: TypeScript with strong typing, well-tested with infrastructure tests, documented
- **Reusability**: Constructs are modular and can be reused for additional regions
- **Performance**: us-east-2 meets stricter latency requirements, Lambda functions process payment events efficiently

## What to deliver

- Complete AWS CDK TypeScript implementation with main orchestration stack and regional stacks
- Reusable CDK constructs for regional infrastructure components
- RDS PostgreSQL instances with KMS encryption in both regions
- DynamoDB global tables for user sessions
- S3 buckets with cross-region replication configuration
- Application Load Balancers with region-specific WAF rules
- Lambda functions with region-specific environment variables
- ECS Fargate services in both regions
- VPC infrastructure with peering and custom routing
- CloudWatch alarms with region-specific thresholds
- Systems Manager Parameter Store integration
- Comprehensive unit tests for all CDK constructs
- Integration tests validating cross-region functionality
- Clear documentation including deployment instructions and architecture decisions
- CDK context configuration for region-specific settings
