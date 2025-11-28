# Payment Processing System with Multi-Environment Deployment

Hey team,

We're working with a fintech startup that needs to build a robust payment processing infrastructure that can scale across multiple environments. They want to deploy identical infrastructure to dev, staging, and production with controlled variations for scaling parameters. The business requirement is clear: we need consistency between environments while allowing environment-specific optimizations.

This is a multi-account AWS deployment challenge. The payment processing system needs to handle transactions, send notifications, and maintain audit trails across three separate AWS accounts. Each environment runs in a different region: dev in us-east-1, staging in us-west-2, and production in eu-west-1. The infrastructure includes Lambda functions for processing payments, DynamoDB tables for storing transaction records, and SNS topics for sending notifications.

The key challenge here is maintaining configuration consistency while allowing controlled variations. Dev needs minimal resources for testing, staging needs to mirror production closely for realistic testing, and production needs full scaling. We also need automated drift detection to ensure staging and production don't diverge unexpectedly.

## What we need to build

Create a multi-environment payment processing system using **Pulumi with TypeScript** that deploys identical infrastructure patterns across dev, staging, and production environments with environment-specific scaling configurations.

### Core Requirements

1. **Reusable Infrastructure Pattern**
   - Create a PaymentProcessor ComponentResource that encapsulates all infrastructure
   - Component should include Lambda function, DynamoDB table, and SNS topic
   - Make it reusable across all three environments
   - All resource names must include **environmentSuffix** parameter for uniqueness

2. **Multi-Environment Deployment**
   - Deploy to three separate AWS accounts: dev, staging, and prod
   - Use different Pulumi stacks for each environment
   - Dev deploys to us-east-1, staging to us-west-2, prod to eu-west-1
   - Configure cross-account IAM roles for deployment access

3. **Environment-Specific Scaling**
   - Lambda concurrent executions: dev=1, staging=10, prod=100
   - Lambda memory allocation: dev=512MB, staging=1GB, prod=2GB
   - DynamoDB point-in-time recovery: disabled in dev, enabled in staging and prod
   - All Lambda functions must use ARM64 architecture for cost optimization

4. **Stack References and Cross-Stack Dependencies**
   - Use Pulumi stack references to share outputs between environments
   - Propagate DynamoDB table ARNs from lower to higher environments
   - Enable environment promotion workflows using stack outputs

5. **Dead Letter Queue Configuration**
   - Set up SQS dead letter queues for all Lambda functions
   - Different retry counts per environment: dev=2, staging=3, prod=5
   - Configure DLQ alarm thresholds based on environment

6. **Notification System**
   - Create SNS topics for payment notifications in each environment
   - Configure email subscriptions using environment-specific addresses from Pulumi config
   - Set up topic policies for cross-account access if needed

7. **Drift Detection Automation**
   - Implement drift detection using Pulumi Automation API
   - Compare staging and prod configurations programmatically
   - Generate comparison report showing configuration differences
   - Validate that production mirrors staging with only controlled parameter variations

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** with ARM64 architecture for payment processing functions
- Use **Amazon DynamoDB** for transaction record storage with PITR for staging/prod
- Use **Amazon SNS** for notification delivery
- Use **Amazon SQS** for dead letter queues
- Use **AWS IAM** with cross-account assume role capabilities
- Use **Amazon VPC** with private subnets and VPC endpoints for DynamoDB/SNS
- Use **Pulumi Automation API** for drift detection script
- Resource names must include **environmentSuffix** for uniqueness across stacks
- Follow naming convention: {resource-type}-{environment}-suffix
- Deploy to multiple regions: us-east-1 (dev), us-west-2 (staging), eu-west-1 (prod)
- Node.js 18+ runtime for Lambda functions

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, use RemovalPolicy.DESTROY equivalent)
- Include environmentSuffix parameter in ALL resource names
- Each Pulumi stack must have separate configuration file: Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml
- Stack outputs must export DynamoDB ARNs for cross-stack references
- VPC endpoints required for private subnet Lambda access to DynamoDB and SNS
- Cross-account IAM roles must be pre-configured for deployment
- Automation API script should be executable standalone (not part of main stack)

### Constraints

- Must deploy to exactly three AWS accounts using separate Pulumi stacks
- Lambda functions must use ARM64 architecture only (no x86_64)
- Point-in-time recovery must be disabled in dev to reduce costs
- DynamoDB tables must not use provisioned capacity (use on-demand billing)
- SNS email subscriptions require manual confirmation (document this in README)
- VPC must use private subnets only for Lambda (no public subnets required)
- Drift detection must identify scaling parameter differences as "controlled variations"
- All resources must be fully contained within stack (no external dependencies except IAM roles)
- Include proper error handling and logging in Lambda functions
- Resource naming must follow consistent pattern across all environments

## Success Criteria

- Functionality: Deploy identical infrastructure patterns to three separate environments successfully
- Performance: Lambda functions scale independently per environment (1/10/100 concurrent executions)
- Reliability: Point-in-time recovery enabled for staging and prod DynamoDB tables
- Security: Lambda functions isolated in private subnets with VPC endpoints for AWS service access
- Resource Naming: All resources include environmentSuffix and follow naming convention
- Configuration Management: Stack-specific config files with environment-specific parameters
- Drift Detection: Automation API script successfully compares staging and prod configurations
- Code Quality: TypeScript with proper typing, ComponentResource pattern for reusability, documented

## What to deliver

- Complete Pulumi TypeScript implementation with ComponentResource class
- PaymentProcessor ComponentResource encapsulating Lambda, DynamoDB, SNS, SQS resources
- Three stack configuration files: Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml
- Drift detection script using Pulumi Automation API for staging/prod comparison
- Lambda function code with payment processing logic (can be placeholder)
- VPC configuration with private subnets and VPC endpoints for DynamoDB and SNS
- Cross-account IAM role configuration examples
- Stack reference implementation for DynamoDB ARN propagation
- Unit tests for ComponentResource class
- Documentation covering deployment process, environment promotion workflow, and drift detection usage