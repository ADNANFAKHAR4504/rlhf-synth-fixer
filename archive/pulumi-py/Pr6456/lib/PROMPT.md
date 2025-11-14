Hey team,

We've been asked to build a serverless payment webhook processor for a fintech startup. They need to handle payment webhooks from multiple providers like Stripe and PayPal, and they need this system to be reliable, scalable, and able to handle traffic spikes during peak shopping seasons. The infrastructure needs to be created using **Pulumi with Python** since we're standardizing on that stack.

The business is looking for a solution that can process webhooks reliably, store transaction data securely, and provide good observability into what's happening in the system. During Black Friday and other high-traffic events, webhook volumes can spike dramatically, so we need serverless components that scale automatically.

## What we need to build

Create a serverless payment webhook processing system using **Pulumi with Python** that handles webhooks from multiple payment providers.

### Core Requirements

1. **Lambda Functions for Webhook Processing**
   - Create a Lambda function for Stripe webhooks
   - Create a Lambda function for PayPal webhooks
   - Both functions must use Python 3.11 runtime
   - Configure 512MB memory allocation for each function
   - Set maximum timeout of 30 seconds per function
   - Lambda functions must have proper execution roles with least privilege

2. **DynamoDB for Transaction Storage**
   - Deploy a DynamoDB table named 'PaymentTransactions'
   - Use 'transactionId' as the partition key (string type)
   - Configure on-demand billing mode for automatic scaling
   - Enable point-in-time recovery for data protection
   - Disable deletion protection to allow easy cleanup
   - Include stack deletion policy to retain DynamoDB data on stack deletion

3. **IAM Execution Roles and Permissions**
   - Create Lambda execution roles following least privilege principle
   - Grant permissions to write to DynamoDB (PutItem, UpdateItem, GetItem only)
   - Grant permissions to write to CloudWatch Logs
   - No wildcard actions allowed in IAM policies
   - Each Lambda function needs its own dedicated role

4. **CloudWatch Logging and Monitoring**
   - Set up CloudWatch Log Groups for both Lambda functions
   - Configure exactly 7 days retention for all logs
   - Ensure Lambda functions can write to their respective log groups

5. **Environment Variables and Configuration**
   - Add 'TABLE_NAME' environment variable pointing to DynamoDB table
   - Add 'WEBHOOK_TYPE' environment variable (set to 'Stripe' or 'PayPal')
   - No hardcoded secrets in environment variables

6. **X-Ray Distributed Tracing**
   - Configure X-Ray tracing active mode for both Lambda functions
   - Enable tracing for debugging and performance monitoring

7. **Stack Outputs**
   - Export both Lambda function ARNs
   - Export DynamoDB table name
   - Export DynamoDB table ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Lambda** for webhook processing (Python 3.11 runtime)
- Use **DynamoDB** for transaction storage
- Use **IAM** for access control
- Use **CloudWatch Logs** for monitoring
- Use **X-Ray** for distributed tracing
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Lambda functions must use Python 3.11 runtime with 512MB memory
- Lambda functions must have maximum timeout of 30 seconds
- DynamoDB tables must use on-demand billing mode
- DynamoDB must have point-in-time recovery enabled
- DynamoDB must have deletion protection disabled
- All Lambda functions must have X-Ray tracing active
- CloudWatch Logs retention must be exactly 7 days
- All IAM roles must follow least privilege principle with no wildcard actions
- Lambda environment variables must not contain hardcoded secrets
- All resources must be destroyable (no Retain policies except DynamoDB data as specified)
- Include proper error handling and logging in Lambda code

## Success Criteria

- **Functionality**: Two Lambda functions process webhooks and write to DynamoDB
- **Performance**: Functions can handle traffic spikes with automatic scaling
- **Reliability**: Point-in-time recovery enabled for data protection
- **Security**: Least privilege IAM roles, no hardcoded secrets
- **Observability**: CloudWatch logs and X-Ray tracing fully configured
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation
- Lambda functions for Stripe and PayPal webhook processing
- DynamoDB table with proper configuration
- IAM roles with least privilege permissions
- CloudWatch Log Groups with 7-day retention
- X-Ray tracing configuration
- Proper Lambda function code for webhook processing
- Unit tests for all components
- Documentation and deployment instructions
