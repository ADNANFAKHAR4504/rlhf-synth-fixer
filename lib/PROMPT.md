# TAP Stack CloudFormation Template Generation Prompt

## Project Context

You are tasked with creating a CloudFormation template for the TAP (Task Assignment Platform) Stack, which manages RLHF (Reinforcement Learning from Human Feedback) tasks.

## Core Requirements

### Template Structure

- Must use CloudFormation format version '2010-09-09'
- Include comprehensive description: "TAP Stack - Task Assignment Platform CloudFormation Template"
- Implement proper metadata section with AWS::CloudFormation::Interface

### Parameters

Create an EnvironmentSuffix parameter with:

- Type: String
- Default: 'dev'
- Description: Environment suffix for resource naming (e.g., dev, staging, prod)
- AllowedPattern: '^[a-zA-Z0-9]+$'
- ConstraintDescription: Must contain only alphanumeric characters

### Resources

**DynamoDB Table (TurnAroundPromptTable)**

- Name: TurnAroundPromptTable{EnvironmentSuffix}
- Primary Key: 'id' (String, Hash)
- Billing Mode: PAY_PER_REQUEST (cost-effective for variable workloads)
- Deletion Protection: false (for dev/test environments)
- Deletion Policy: Delete (for development environments)
- Update Replace Policy: Delete

### Outputs

Export the following values for cross-stack references:

1. **TurnAroundPromptTableName**: The table name
2. **TurnAroundPromptTableArn**: The table ARN
3. **StackName**: The CloudFormation stack name
4. **EnvironmentSuffix**: The environment identifier

All exports should follow the naming pattern: `${AWS::StackName}-{OutputName}`

## Technical Constraints

- Resource naming must include environment suffix for isolation
- Use CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt) appropriately
- Ensure all resources are properly tagged (handled at stack level)
- Template must be deployable across multiple AWS regions
- Support clean stack deletion without manual intervention

## Project Information

- **Project Name**: TAP Stack - Task Assignment Platform
- **Primary Use Case**: RLHF task storage and management
- **Target Environments**: dev, staging, production
- **Expected Workload**: Variable traffic patterns suitable for pay-per-request billing

## Success Criteria

1. Template validates successfully with CloudFormation
2. DynamoDB table is created with correct configuration
3. All outputs are available for application integration
4. Environment suffix is properly applied to all resources
5. Stack can be deployed and destroyed cleanly
6. Resources follow AWS best practices for naming and configuration

Deploy web application on EC2 via Auto Scaling Group.

All resources must be tagged for tracking/management.

CloudWatch monitoring and alarms must be configured.

Expected Output:

Produce a valid AWS CloudFormation YAML template that:

Includes all required AWS resources

Follows best practices for security, scalability, and high availability

Can be deployed successfully in AWS without modification

Outputs the application endpoint URL and essential configuration values
