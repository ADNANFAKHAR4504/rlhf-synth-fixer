# Serverless Trade Processing System

Hey! We need to build a serverless trade processing infrastructure for a financial services company that handles real-time stock market data feeds. The business is processing JSON payloads with trade information that need validation, enrichment with market metadata, and compliant storage for regulatory purposes.

The challenge here is that they're dealing with variable load patterns during market hours, and absolutely everything needs proper audit trails for compliance. They receive trade events from three different source systems, and each trade needs to go through validation, get enriched with metadata, and then stored with compliance recording.

The system needs to be highly available with multi-region failover capability. The primary deployment is in us-east-1, but we need to replicate to eu-west-1 for disaster recovery. All of this needs to be deployed using **CloudFormation with JSON** format.

## What we need to build

Create a serverless trade processing system using **CloudFormation with JSON** that orchestrates trade validation, enrichment, and compliant storage across multiple regions.

### Core Requirements

1. **State Machine Orchestration**
   - Create a Step Functions state machine that orchestrates the entire trade processing workflow
   - Implement parallel validation and enrichment states to process trades efficiently
   - The workflow should handle error cases and retries appropriately
   - Use Step Functions to coordinate between validation, enrichment, and recording phases

2. **Lambda Container Functions**
   - Deploy three Lambda functions using container images (not zip files)
   - Trade validator function to validate incoming trade data
   - Metadata enricher function to add market context to trades
   - Compliance recorder function to log trades for regulatory purposes
   - All functions must use ARM-based Graviton2 processors for cost efficiency
   - Configure reserved concurrent executions for each function to prevent throttling
   - All functions must have Lambda Insights enabled for monitoring and custom metrics

3. **DynamoDB Global Table**
   - Configure DynamoDB global table spanning us-east-1 and eu-west-1 regions
   - Store all processed trades with full compliance metadata
   - Use on-demand billing mode to handle variable load patterns
   - Enable point-in-time recovery for data protection
   - Since this requires custom configuration, implement using a custom CloudFormation resource

4. **Event Routing**
   - Set up EventBridge rules to trigger the state machine on trade events
   - Configure rules to receive events from three different source systems
   - Each source system should have its own event pattern matching
   - Route all matching events to the Step Functions state machine

5. **Error Handling and Monitoring**
   - Implement dead letter queues (SQS) for all three Lambda functions
   - DLQ message retention must be exactly 14 days
   - Create CloudWatch alarms that monitor DLQ depth
   - Alert when messages accumulate in any dead letter queue

6. **Configuration Management**
   - Create SSM parameters for all API endpoints used by the functions
   - Store processing thresholds in SSM Parameter Store
   - All configuration values should be externalized to SSM

7. **Container Image Replication**
   - Set up ECR repository for Lambda container images
   - Configure cross-region replication from us-east-1 to eu-west-1
   - Ensure images are available in both regions for disaster recovery

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** format exclusively
- Use **Step Functions** for workflow orchestration with parallel states
- Use **Lambda** with container images (must specify ARM architecture)
- Use **DynamoDB** with global table configuration across two regions
- Use **EventBridge** for event routing from multiple sources
- Use **SQS** for dead letter queues with 14-day retention
- Use **SSM Parameter Store** for configuration management
- Use **CloudWatch** for alarms and Lambda Insights monitoring
- Use **ECR** with cross-region replication for container images
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-environmentSuffix`
- Deploy to **us-east-1** as primary region with **eu-west-1** replication

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy: Delete, NOT Retain)
- No resources should have DeletionPolicy: Retain or RemovalPolicy: RETAIN
- Lambda functions must use container images, not zip deployments
- DynamoDB must use on-demand billing mode, not provisioned capacity
- Reserved concurrent executions must be specified for each Lambda function
- Dead letter queue retention period must be exactly 14 days (no other value)
- Custom CloudFormation resource required for DynamoDB global table setup
- All SSM parameters should use String type for configuration values

### Constraints

- JSON format exclusively for CloudFormation template (no YAML)
- Lambda functions must use container images instead of zip deployments
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- All Lambda functions must have reserved concurrent executions configured
- Use SSM Parameter Store for all configuration values (API endpoints, thresholds)
- Implement custom CloudFormation resource for DynamoDB global table configuration
- Dead letter queues must have message retention of exactly 14 days
- Lambda functions must use ARM-based Graviton2 processors (arm64 architecture)
- All resources must be fully destroyable for testing and redeployment
- Include proper error handling and logging in all components
- VPC Endpoints required for private connectivity to AWS services
- Deployment uses CloudFormation JSON templates with cross-region stack sets capability

## Success Criteria

- **Functionality**: State machine successfully orchestrates parallel validation and enrichment
- **Performance**: Lambda container functions process trades efficiently on ARM architecture
- **Reliability**: DynamoDB global table replicates across us-east-1 and eu-west-1
- **Security**: Private connectivity through VPC endpoints, all config in SSM
- **Monitoring**: CloudWatch alarms trigger on DLQ depth, Lambda Insights enabled
- **Resource Naming**: All resources include environmentSuffix parameter
- **Error Handling**: All Lambda functions route failures to DLQs with 14-day retention
- **Code Quality**: Complete CloudFormation JSON, well-structured, production-ready

## What to deliver

- Complete CloudFormation JSON template implementation
- Step Functions state machine with parallel processing states
- Three Lambda container function definitions (validator, enricher, recorder)
- DynamoDB global table spanning us-east-1 and eu-west-1
- EventBridge rules for three source systems
- SQS dead letter queues with CloudWatch alarms
- SSM parameters for configuration management
- ECR repository with cross-region replication
- Lambda Insights configuration for all functions
- Custom CloudFormation resource for global table setup
- Documentation and deployment instructions
