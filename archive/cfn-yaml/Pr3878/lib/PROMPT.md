<task_context>
You are an expert AWS infrastructure engineer building a production-grade crowdfunding platform using CloudFormation (YAML). The platform manages 5,000 active campaigns with milestone-based fund release, backer rewards, and fraud prevention capabilities. This infrastructure will be deployed in us-west-2 for a production environment.
</task_context>

<objective>
Create a complete, production-ready CloudFormation stack that connects all AWS services to enable a fully functional crowdfunding platform. Focus on proper resource integration, security, and scalability. Your implementation should demonstrate deep understanding of service dependencies and data flows between components.
</objective>

<required_files>
You must ONLY modify and output code for these three files:
1. lib/TapStack.yml - Complete CloudFormation stack implementation
2. tests/tap-stack.unit.test.ts - Comprehensive unit tests
3. tests/tap-stack.int.test.ts - Integration tests validating resource connections
</required_files>

<infrastructure_requirements>

### Core Services and Integration Points

**API Layer:**
- API Gateway REST API for campaign management endpoints
- Connect to Lambda functions for backend processing
- Integrate with Cognito for authentication/authorization

**Compute Layer:**
- Lambda functions (Node.js 18 runtime) for:
  - Campaign management operations
  - Payment processing with retry logic
  - Contribution screening integration
- Grant necessary IAM permissions for all integrations

**Data Layer:**
- DynamoDB tables for campaigns and contributions
- Implement DynamoDB transactions for atomic contribution processing
- Enable point-in-time recovery and encryption at rest
- Configure GSIs for query optimization

**Workflow Orchestration:**
- Step Functions state machine for milestone-based fund release workflows
- Include milestone approval states with human intervention points
- Integrate with Lambda for processing steps
- Connect to SNS for notifications at key milestones

**Fraud Prevention:**
- Integrate AWS Fraud Detector for real-time contribution screening
- Configure detector endpoints and event types
- Connect Lambda payment processor to Fraud Detector

**Storage and Content Delivery:**
- S3 bucket for campaign media with versioning
- CloudFront distribution connected to S3 origin
- Configure OAI (Origin Access Identity) for secure access
- Set appropriate cache behaviors

**Authentication:**
- Cognito User Pool for creators and backers
- Separate user pool groups for role-based access
- Configure app clients for API Gateway integration

**Notifications:**
- SES for campaign update emails (configure verified identities)
- SNS topics for milestone notifications
- Subscribe relevant endpoints to SNS topics

**Monitoring and Automation:**
- EventBridge rules for campaign deadline monitoring
- CloudWatch metrics for funding progress tracking
- CloudWatch alarms for critical thresholds
- Log groups for Lambda functions

**Analytics:**
- Athena workgroup for campaign analytics queries
- S3 bucket for Athena query results
- QuickSight datasets and dashboards for campaign creators
- Connect QuickSight to DynamoDB and Athena

**Security:**
- KMS customer-managed key for payment data encryption
- Apply encryption to DynamoDB tables and S3 buckets
- IAM roles with least-privilege policies
- Resource policies where applicable

</infrastructure_requirements>

<critical_implementation_details>

**Resource Connection Priorities:**
1. DynamoDB transactions must support atomic writes across campaigns and contributions tables
2. Lambda functions require environment variables pointing to DynamoDB table names, SNS topic ARNs, and KMS key IDs
3. Step Functions must orchestrate multi-step workflows with proper error handling and retries
4. API Gateway must integrate with Lambda using proxy integration
5. CloudFront must properly reference S3 bucket with OAI
6. EventBridge rules must trigger Lambda functions on campaign deadline events
7. All sensitive data paths must use KMS encryption
8. IAM roles must follow principle of least privilege with explicit resource ARNs

**Transaction Patterns:**
- Implement DynamoDB TransactWriteItems for atomic contribution processing
- Include conditional checks to prevent double-spending
- Handle transaction conflicts with appropriate error responses

**State Machine Design:**
- Model milestone approval workflow with choice states
- Include wait states for approval timeouts
- Integrate SNS notifications at state transitions
- Handle failure scenarios with catch blocks

**Monitoring Requirements:**
- CloudWatch custom metrics for: total funding per campaign, contribution velocity, milestone completion rate
- Log all Lambda invocations with structured logging
- Create composite alarms for system health

</critical_implementation_details>

<output_specifications>

For lib/TapStack.yml:
- Write production-ready CloudFormation YAML with proper indentation
- Use !Ref and !GetAtt for resource references (not Fn:: syntax)
- Include descriptive resource names following convention: ResourceTypePurpose (e.g., CampaignDynamoDBTable)
- Add Outputs section exporting critical resource ARNs and endpoints
- Include Parameters section for configurable values (environment, bucket names)
- Group related resources with comments for readability
- Ensure all cross-resource dependencies are properly defined
- Total stack should contain 25-30 interconnected resources

For tests/tap-stack.unit.test.ts:
- Write comprehensive TypeScript unit tests using Jest
- Test each resource type has correct properties
- Verify IAM policies have required permissions
- Validate environment variables are properly set
- Check DynamoDB table configurations (billing mode, encryption, GSIs)
- Confirm Lambda runtime and handler configurations
- Test Step Functions state machine has all required states
- Minimum 15 test cases covering all critical resources

For tests/tap-stack.int.test.ts:
- Write integration tests validating resource connections
- Test API Gateway -> Lambda integration
- Verify Lambda -> DynamoDB permissions
- Validate Step Functions -> Lambda -> SNS workflow
- Check CloudFront -> S3 connectivity
- Confirm EventBridge -> Lambda triggers
- Test KMS key usage across encrypted resources
- Minimum 10 integration test scenarios

</output_specifications>

<constraints>
- Use YAML format exclusively for CloudFormation
- Target AWS region: us-west-2
- Environment: prod
- Node.js runtime version: 18.x
- Do not use nested stacks or external templates
- All resources must be defined in a single TapStack.yml file
- Follow AWS Well-Architected Framework principles
- Ensure all resources have appropriate tags for cost allocation
</constraints>

<success_criteria>
Your implementation is successful when:
1. All 25-30 resources are properly defined with correct CloudFormation syntax
2. Resource dependencies create a valid deployment order
3. IAM permissions enable all required service integrations
4. DynamoDB transaction support is correctly configured
5. Step Functions workflow implements milestone-based fund release logic
6. Fraud Detector integration is functional in payment processing flow
7. All tests pass and provide meaningful coverage
8. The stack can be deployed without errors
9. Services can communicate as designed (API -> Lambda -> DynamoDB, etc.)
10. Security best practices are followed throughout
</success_criteria>

<instructions>
Begin by creating the complete CloudFormation stack in lib/TapStack.yml. Focus heavily on properly connecting resources through:
- IAM role trust relationships and policies
- Environment variables and configuration
- Event sources and triggers
- Resource references using !Ref and !GetAtt
- Proper dependency ordering with DependsOn where needed

After completing the CloudFormation template, create comprehensive unit tests that validate each resource's configuration, followed by integration tests that verify cross-resource connectivity and data flows.

Implement the complete solution with production-quality code. Include as many relevant features and proper integrations as possible. Go beyond the basics to create a fully-featured, secure, and scalable implementation.
</instructions>
