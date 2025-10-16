# Freelancer Marketplace Platform - AWS CDK Implementation Prompt

## Role

You are an expert AWS Solutions Architect and CDK developer specializing in TypeScript infrastructure-as-code. You excel at designing production-ready, scalable cloud architectures with a focus on security, performance, and maintainability. Your expertise includes multi-tier application architectures, serverless patterns, and best practices for resource interconnection.

## Task Context

Build a production-ready freelancer marketplace platform using AWS CDK in TypeScript. This platform connects 8,000 professionals with clients and requires robust profile management, project bidding capabilities, milestone-based payment processing, and real-time messaging functionality. The infrastructure must support high concurrency, efficient data querying, and secure multi-tenant authentication with role separation.

## Project Specifications

- **Platform Type:** Freelancer marketplace
- **User Base:** 8,000 professionals + clients
- **Core Features:** Profile management, project bidding, milestone-based payments, real-time messaging
- **Deployment Region:** us-east-2 (Ohio)
- **Environment:** dev
- **Programming Language:** TypeScript
- **IaC Tool:** AWS CDK
- **Expected Scale:** High concurrency, efficient message querying (< 100ms), global content delivery

## Infrastructure Requirements

### Networking Layer
- VPC with CIDR block 10.36.0.0/16
- Multi-AZ deployment with public and private subnets
- NAT Gateways for private subnet internet access
- VPC Flow Logs for network monitoring

### Compute & Application Layer
- Application Load Balancer (ALB) for traffic distribution with health checks
- ECS Fargate cluster for containerized web application
- Auto-scaling configuration based on CPU/memory metrics
- Target groups with sticky sessions

### Data Storage Layer

#### Aurora MySQL
Cluster for user profiles, projects, bidding data, and transactional records
- Multi-AZ deployment for high availability
- Read replicas for query offloading
- Automated backups and point-in-time recovery

#### DynamoDB
Table for real-time messaging
- Partition key: conversationId
- Sort key: timestamp
- GSI-1: userId (PK) + timestamp (SK) for sender/receiver queries
- GSI-2: receiverId (PK) + timestamp (SK) for inbox queries
- Point-in-time recovery enabled
- On-demand or provisioned billing mode

#### S3
Bucket for portfolio uploads (resumes, work samples, images, videos)
- Versioning enabled
- Lifecycle policies for cost optimization
- Server-side encryption
- CORS configuration for web uploads


### Content Delivery
- CloudFront distribution for S3 portfolio content
- Origin Access Identity (OAI) for secure S3 access
- Custom domain with SSL/TLS certificate
- Cache behaviors optimized for static content
- Geo-restriction if needed

### Authentication & Authorization
**Two separate Cognito User Pools:**
1. **Freelancer Pool:** Attributes include skills, hourly rate, portfolio links, experience level
2. **Client Pool:** Attributes include company name, industry, budget preferences

Additional requirements:
- Password policies with MFA support
- Email verification workflows
- App clients configured for each pool
- Custom attributes for role-based access

### Serverless & Orchestration

#### Lambda Function
Node.js 18 runtime for payment webhook processing
- Environment variables for configuration
- VPC attachment for database access
- Dead Letter Queue (DLQ) for failed invocations
- X-Ray tracing enabled

#### Step Functions
State machine for project lifecycle workflow
- **States:** ProjectCreated → BiddingOpen → FreelancerSelected → MilestonesDefined → WorkInProgress → MilestoneApproval → PaymentProcessed → ProjectCompleted
- Error handling and retry logic
- Choice states for conditional routing
- Integration with Lambda, SES, SNS

### Notifications & Communication

#### SES
Transactional emails for project updates, milestone completions, account notifications
- Verified domain and email addresses
- Configuration sets for tracking
- Templates for common email types

#### SNS
Topics for real-time bid notifications
- Topic for new bids
- Topic for milestone approvals
- Topic for payment confirmations
- Email and SMS subscription options

### Monitoring & Observability
- CloudWatch Dashboards for platform metrics
- Custom metrics for business KPIs (active projects, bid rate, conversion)
- CloudWatch Alarms for critical thresholds (ALB 5xx errors, Aurora connections, DynamoDB throttles)
- Log Groups for application, Lambda, and VPC Flow Logs
- CloudWatch Insights queries for troubleshooting

### Security
- IAM roles with least-privilege access for all services
- Service-specific roles for ECS tasks, Lambda functions, Step Functions
- Security groups with explicit ingress/egress rules
- Secrets Manager for database credentials and API keys
- KMS keys for encryption at rest
- WAF rules for ALB (optional but recommended)

## Tenant Isolation Requirements

### User Pool Separation
- Freelancers and clients must use completely separate Cognito User Pools
- No cross-pool authentication allowed
- Different JWT token structures with custom claims for role identification
- Pool-specific password policies and security settings

### Data Isolation
- Database tables must include userId/userType columns for query filtering
- DynamoDB access patterns must enforce user-level isolation
- S3 bucket policies must restrict portfolio access to owner and authorized viewers
- Lambda functions must validate user identity before data operations

### API Gateway (if implemented)
- Separate authorizers for freelancer and client pools
- Resource policies restricting endpoint access by user type
- Request validation to prevent cross-tenant data leakage

## Resource Connection Focus

### Critical Integration Points

#### ALB → ECS Fargate
- Target group registration with health check path
- Security group rules allowing ALB to reach ECS on container port
- ECS task definition referencing target group ARN
- Container port mapping configuration

#### ECS → Aurora MySQL
- Security group rules allowing ECS tasks to reach Aurora on port 3306
- Secrets Manager integration for database credentials
- Connection string environment variables in task definition
- VPC subnet placement (ECS in private, Aurora in private data subnets)

#### ECS → DynamoDB
- IAM task role with dynamodb:GetItem, PutItem, Query, Scan permissions
- DynamoDB table ARN as environment variable
- SDK configuration in application code


#### Lambda → Aurora MySQL
- VPC attachment to same subnets as Aurora
- Security group rules allowing Lambda to reach Aurora
- Secrets Manager access for credentials
- Database connection handling in Lambda code

#### Lambda → SNS
- IAM execution role with sns:Publish permission
- SNS topic ARNs as environment variables
- Error handling for failed notifications

#### Step Functions → Lambda, SES, SNS
- IAM role with states:StartExecution permission
- Task states invoking Lambda functions with proper input/output
- Direct SDK integration for SES and SNS actions
- Error handling and retry policies

#### S3 → CloudFront
- Origin Access Identity (OAI) created and granted S3 read permissions
- S3 bucket policy allowing only CloudFront OAI access
- CloudFront distribution configured with S3 as origin
- Cache behaviors for different content types

#### Cognito → ECS
- User pool IDs and client IDs as environment variables
- JWT verification middleware in application
- Pool-specific endpoints for authentication flows

#### CloudWatch → All Services
- Metric filters for custom metrics
- Alarms triggering SNS notifications
- Log group subscriptions for centralized logging
- Dashboard widgets for each service

## File Constraints

You must modify and output code ONLY for these three files:

### 1. lib/tap-stack.ts
- Main CDK stack implementation
- All resource definitions and configurations
- Logical grouping by layer (networking, compute, data, etc.)
- Proper dependency management between resources
- CfnOutput for important values (endpoints, ARNs, URLs)

### 2. tests/tap-stack.unit.test.ts
- Unit tests using AWS CDK assertions library
- Test resource counts and types
- Verify IAM policies and permission boundaries
- Check security group rules and CIDR blocks
- Validate resource properties (encryption, versioning, etc.)
- Test CloudFormation template synthesis

### 3. tests/tap-stack.int.test.ts
- Integration tests for cross-service interactions
- Test database connectivity from Lambda and ECS
- Verify DynamoDB query patterns and GSI performance
- Test Step Functions state machine execution
- Validate CloudFront distribution serving S3 content
- Test Cognito authentication flows
- Verify SNS message delivery

**Do NOT create or modify any other files** including package.json, tsconfig.json, cdk.json, README.md, or application code.

## Implementation Instructions

### Stack Implementation Approach

#### 1. Resource Organization in tap-stack.ts:
1. Stack initialization and props
2. VPC and networking resources
3. Security groups (define all upfront)
4. Aurora MySQL cluster
5. DynamoDB table with GSIs
6. S3 bucket and CloudFront distribution
7. Cognito user pools (freelancer + client)
8. ECS cluster, task definition, and Fargate service
9. Application Load Balancer with listeners and target groups
10. Lambda function for payment webhooks
11. Step Functions state machine
12. SNS topics for notifications
13. SES configuration
14. CloudWatch dashboards and alarms
15. IAM roles and policies
16. CfnOutputs for key resources


#### 2. Naming Conventions
- Use kebab-case with environment prefix: `${env}-freelancer-platform-{resource}`
- Examples: `dev-freelancer-platform-vpc`, `dev-freelancer-platform-aurora-cluster`

#### 3. Tagging Strategy
Apply to all resources:
```typescript
Tags.of(resource).add('Environment', 'dev');
Tags.of(resource).add('Project', 'freelancer-platform');
Tags.of(resource).add('ManagedBy', 'CDK');
Tags.of(resource).add('CostCenter', 'engineering');
```

#### 4. Security Best Practices
- All database credentials in Secrets Manager
- Security groups with minimal necessary access
- S3 buckets with encryption enabled
- VPC endpoints for AWS services to avoid internet gateway
- IAM policies following least privilege principle

#### 5. High Availability Configuration
- Multi-AZ for VPC subnets
- Aurora with read replicas
- ECS Fargate with multiple tasks across AZs
- ElastiCache with automatic failover
- CloudFront for global distribution

#### 6. Configuration Management
Use CDK context or environment variables for:
- VPC CIDR block
- Database instance sizes
- ECS task CPU/memory
- Redis node type
- Domain names
- Email addresses for SES


## Code Quality Requirements

- Enable TypeScript strict mode in tsconfig.json (assumed already configured)
- Use explicit type annotations for all variables and function parameters
- Include JSDoc comments for all classes, methods, and complex logic
- Follow AWS CDK L2 construct patterns (avoid L1/CfnResources unless necessary)
- Implement proper error handling with try-catch blocks where applicable
- Use constants for magic numbers and repeated strings
- Extract reusable logic into private methods
- Ensure all resources have meaningful descriptions
- Include inline comments explaining WHY decisions were made, not just WHAT
- Use CDK's RemovalPolicy appropriately (RETAIN for production data, DESTROY for dev)
- Implement resource dependencies explicitly when order matters
- Validate input parameters and configurations
- Use CDK assertions in tests (hasResourceProperties, hasOutput, etc.)
- Test both positive and negative scenarios
- Mock external dependencies in integration tests when appropriate
- Achieve >80% code coverage in tests

## Success Criteria

The infrastructure implementation will be considered successful when:

### Functional Requirements
1. ✓ Stack deploys without errors using `cdk deploy`
2. ✓ All resources are created in us-east-2 region
3. ✓ VPC with 10.36.0.0/16 CIDR is properly configured with multi-AZ
4. ✓ Two separate Cognito user pools are operational
5. ✓ ECS Fargate service is running and accessible via ALB
6. ✓ Aurora MySQL accepts connections from ECS tasks
7. ✓ DynamoDB table supports efficient message querying (< 100ms)
8. ✓ S3 content is accessible through CloudFront distribution
9. ✓ Lambda function processes payment webhooks successfully
10. ✓ Step Functions workflow executes all states correctly
11. ✓ SNS notifications are delivered to subscribers
12. ✓ SES sends transactional emails

### Testing Requirements
1. ✓ All unit tests pass with `npm test`
2. ✓ Integration tests validate resource connectivity
3. ✓ IAM policies are correctly scoped (no over-permissioning)
4. ✓ Security groups allow only necessary traffic
5. ✓ Template synthesizes without warnings or errors

### Performance Requirements
1. ✓ Platform supports 8,000+ concurrent users
2. ✓ Message queries complete in under 100ms
3. ✓ Portfolio content loads with low latency globally
4. ✓ ALB health checks pass consistently
5. ✓ Redis cache hit ratio > 80%

### Security Requirements
1. ✓ All data encrypted at rest and in transit
2. ✓ Database credentials stored in Secrets Manager
3. ✓ No hardcoded secrets in code
4. ✓ Least-privilege IAM policies applied
5. ✓ User pool separation enforced

### Code Quality
1. ✓ TypeScript compiles without errors
2. ✓ No linting warnings
3. ✓ All resources properly tagged
4. ✓ Comprehensive inline documentation
5. ✓ Consistent naming conventions followed

## Output Format

Provide your response in the following format:

### File 1: lib/tap-stack.ts
```typescript
// Complete stack implementation with all resources
// Include imports, class definition, and all AWS resources
```

### File 2: tests/tap-stack.unit.test.ts
```typescript
// Comprehensive unit tests
// Test resource creation, properties, and configurations
```

### File 3: tests/tap-stack.int.test.ts
```typescript
// Integration tests
// Test cross-service interactions and workflows
```

For each file:
- Start with necessary imports
- Include all required code with no placeholders
- Add detailed comments explaining key decisions
- Ensure proper TypeScript typing
- Follow AWS CDK best practices

## Thinking Guidance

Before writing code, consider:

### Architecture Decisions
- How should VPC subnets be distributed across AZs for optimal availability?
- What's the appropriate instance sizing for Aurora and ElastiCache given 8,000 users?
- Should DynamoDB use on-demand or provisioned capacity?
- How many ECS tasks are needed for expected load?

### Security Considerations
- Which services need VPC endpoints to avoid internet traffic?
- How to structure IAM policies to prevent privilege escalation?
- What's the blast radius if one component is compromised?
- How to rotate credentials without downtime?

### Operational Excellence
- What metrics should trigger CloudWatch alarms?
- How to implement gradual rollout of infrastructure changes?
- What backup and recovery strategy is needed?
- How to handle resource limits and quotas?

### Cost Optimization
- Can any resources be downsized for dev environment?
- Which S3 lifecycle policies reduce storage costs?
- Should NAT Gateways be reduced to one per region for dev?
- How to set up budget alerts?

### Integration Patterns
- How should ECS tasks discover database endpoints?
- What retry logic is needed for Lambda → SNS?
- How to handle Step Functions state timeouts?
- What caching strategy maximizes Redis efficiency?

Think through these considerations and make explicit decisions in your implementation comments.