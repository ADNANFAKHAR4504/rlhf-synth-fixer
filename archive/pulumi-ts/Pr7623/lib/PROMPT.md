# EC2 Cost Optimization with Scheduled Start/Stop

Hey team,

We've got a cost optimization challenge that's pretty common in startups. Our development team has been running test environments 24/7, and the AWS bills are getting out of hand. Management wants us to implement an automated solution that shuts down non-production EC2 instances during off-hours but keeps them ready to restart quickly when the team needs them in the morning.

The core idea is straightforward: we need to automatically stop development and staging EC2 instances at 7 PM EST on weekdays and bring them back up at 8 AM EST. This gives us about 13 hours of daily shutdown, which should translate into significant monthly savings. The tricky part is that we need to work with existing infrastructure without disrupting anything, and we need to make sure the automation is reliable and auditable.

I've been asked to build this solution using **Pulumi with TypeScript** for the us-east-1 region. The business wants a comprehensive system that not only handles the scheduling but also tracks state changes, alerts us if something goes wrong, and calculates the actual cost savings we're achieving.

## What we need to build

Create an automated EC2 cost optimization system using **Pulumi with TypeScript** that manages scheduled start/stop operations for non-production instances.

This task focuses on **infrastructure optimization**. You'll:
1. Deploy baseline infrastructure with standard resource allocations
2. Create an optimization script (`lib/optimize.py`) that reduces costs on live resources
3. Demonstrate cost savings through automated optimization

### Core Requirements

1. **Instance Management**
   - Import existing EC2 instances without recreating them (use Pulumi import)
   - Target only instances tagged with Environment=development or Environment=staging
   - Never touch instances tagged with Environment=production
   - Preserve all existing instance configurations and tags

2. **Scheduling System**
   - Create CloudWatch Events rules to stop instances at 7 PM EST on weekdays
   - Create CloudWatch Events rules to start instances at 8 AM EST on weekdays
   - Handle EST timezone properly including daylight saving transitions
   - Use cron expressions that work reliably in CloudWatch Events

3. **Lambda Automation**
   - Implement Lambda functions to handle start/stop operations
   - Process multiple instances in a single execution to minimize invocations
   - Log all instance state changes to CloudWatch Logs for audit purposes
   - Handle errors gracefully with proper retry logic

4. **Monitoring and Alerting**
   - Set up CloudWatch alarms to notify if instances fail to start
   - Alert on any automation failures or unexpected states
   - Track execution success rates

5. **Enhanced Functionality**
   - Integrate Step Functions for orchestrating complex workflows
   - Use DynamoDB to track instance states and scheduling history
   - Leverage EventBridge for event-driven architecture
   - Enable extensibility for future enhancements

6. **Cost Analysis**
   - Calculate estimated monthly cost savings based on 13 hours daily shutdown
   - Use current EC2 on-demand pricing for t3.medium and t3.large instance types
   - Output savings calculation as part of the program

7. **Optimization Script Requirements**
   - Create `lib/optimize.py` that optimizes deployed resources via AWS APIs
   - Script must read `ENVIRONMENT_SUFFIX` from environment variable
   - Find resources using naming pattern: `{resource-name}-{environmentSuffix}`
   - Optimize resources using boto3 (not file editing):
     - Adjust Lambda memory allocations for cost optimization
     - Reduce DynamoDB read/write capacity if over-provisioned
     - Optimize CloudWatch log retention periods
     - Scale down Step Functions execution history retention
   - Calculate and display monthly cost savings from optimizations
   - Include error handling and support --dry-run mode for testing
   - Log all optimization actions for audit trail

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Pulumi TypeScript SDK 3.x** with Node.js 18+
- Use **AWS SDK v3** for Lambda function implementations
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Lambda functions should be in lib/lambda/ or lib/functions/ directory

### AWS Services to Use

- **EC2** for instance management
- **Lambda** for automation logic
- **EventBridge (CloudWatch Events)** for scheduling
- **CloudWatch Logs** for audit trails
- **CloudWatch Alarms** for failure notifications
- **IAM** for roles and policies
- **Step Functions** for workflow orchestration
- **DynamoDB** for state tracking

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for multi-environment support
- All resources must be fully destroyable (use RemovalPolicy: DESTROY or DeletionPolicy: Delete)
- FORBIDDEN: Do not use RemovalPolicy.RETAIN or DeletionPolicy: Retain on any resource
- Lambda function runtimes Node.js 18+ do not include AWS SDK v2, must bundle AWS SDK v3
- IAM roles must follow least privilege principle
- All CloudWatch rules must use proper cron syntax for EST timezone

### Constraints

- Must use Pulumi's import functionality to adopt existing EC2 instances without recreation
- Lambda functions must handle multiple instances in a single execution to minimize invocations
- CloudWatch Events rules must account for EST timezone including daylight saving transitions
- Instance state changes must be logged to CloudWatch Logs for audit purposes
- Cost calculation must use current EC2 on-demand pricing for the specific instance types
- Solution must not affect instances tagged with Environment=production
- No VPC modifications required as instances remain in their current subnets
- All resources must be fully teardown-able for testing purposes

## Success Criteria

- **Functionality**: Successfully imports existing EC2 instances, schedules start/stop operations, handles errors
- **Reliability**: Instances stop at 7 PM EST and start at 8 AM EST reliably on weekdays
- **Monitoring**: CloudWatch alarms trigger on failures, all state changes are logged
- **Auditability**: Complete log trail of all instance state changes in CloudWatch Logs
- **Cost Visibility**: Accurate monthly savings calculation displayed as output
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-structured, properly typed, includes error handling

## What to deliver

- Complete **Pulumi TypeScript** implementation with baseline configuration
- Lambda functions in lib/lambda/ or lib/functions/ with AWS SDK v3
- IAM roles and policies with least privilege access
- EventBridge (CloudWatch Events) rules for scheduling with EST timezone
- CloudWatch alarms for failure notifications
- Step Functions state machine for orchestration
- DynamoDB table for state tracking
- Cost calculation logic with pricing data
- **Optimization script** `lib/optimize.py` that optimizes deployed resources via boto3
- Stack outputs showing: imported instance IDs, Lambda function ARNs, CloudWatch rule ARNs, estimated monthly savings
- README.md with deployment instructions, architecture overview, and optimization guide
