# AWS IAM Infrastructure Solution

This solution provides a secure AWS Identity and Access Management (IAM)
configuration for a medium-sized enterprise using AWS CDK (TypeScript). The
implementation creates a DevOps user group with appropriate managed and custom
policies following AWS security best practices.

## Solution Overview

The solution creates:

1. **DevOps IAM User Group**: A dedicated group for DevOps team members
2. **AWS Managed Policy**: Attaches `AmazonS3ReadOnlyAccess` for read-only
   S3 access
3. **Custom EC2 Policy**: Creates a custom policy for EC2 instance start/stop operations
4. **Proper Resource Tagging**: Implements consistent tagging for Environment and Department
5. **CloudFormation Outputs**: Exports all resource ARNs and names for reference

## Implementation

### Infrastructure Code

The main infrastructure is implemented in the following file:

#### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly devOpsGroupArn: string;
  public readonly customEC2PolicyArn: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the DevOps IAM user group
    const devOpsGroup = new iam.Group(this, 'DevOpsGroup', {
      groupName: `DevOps-${environmentSuffix}`,
    });

    // Attach the AWS managed policy AmazonS3ReadOnlyAccess to the DevOps group
    devOpsGroup.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
    );

    // Create custom IAM policy for EC2 start/stop permissions
    const customEC2Policy = new iam.ManagedPolicy(this, 'CustomEC2Policy', {
      managedPolicyName: `CustomEC2Policy-${environmentSuffix}`,
      description: 'Policy to allow starting and stopping EC2 instances',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:StartInstances',
            'ec2:StopInstances',
            'ec2:DescribeInstances',
            'ec2:DescribeInstanceStatus',
          ],
          resources: ['*'],
        }),
      ],
    });

    // Attach the custom EC2 policy to the DevOps group
    devOpsGroup.addManagedPolicy(customEC2Policy);

    // Add consistent tags to all IAM resources
    cdk.Tags.of(devOpsGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(devOpsGroup).add('Department', 'DevOps');

    cdk.Tags.of(customEC2Policy).add('Environment', environmentSuffix);
    cdk.Tags.of(customEC2Policy).add('Department', 'DevOps');

    // Export outputs for testing and reference
    this.devOpsGroupArn = devOpsGroup.groupArn;
    this.customEC2PolicyArn = customEC2Policy.managedPolicyArn;

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DevOpsGroupArn', {
      value: devOpsGroup.groupArn,
      description: 'ARN of the DevOps IAM group',
      exportName: `DevOpsGroupArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CustomEC2PolicyArn', {
      value: customEC2Policy.managedPolicyArn,
      description: 'ARN of the custom EC2 policy',
      exportName: `CustomEC2PolicyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DevOpsGroupName', {
      value: devOpsGroup.groupName,
      description: 'Name of the DevOps IAM group',
      exportName: `DevOpsGroupName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CustomEC2PolicyName', {
      value: customEC2Policy.managedPolicyName!,
      description: 'Name of the custom EC2 policy',
      exportName: `CustomEC2PolicyName-${environmentSuffix}`,
    });
  }
}
```

#### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## Deployment Commands

The solution can be deployed using the following commands:

### Development Deployment

```bash
# Install dependencies
npm ci

# Build the TypeScript code
npm run build

# Lint the code
npm run lint

# Run unit tests with coverage
npm run test:unit

# Synthesize CloudFormation template
npm run cdk:synth

# Bootstrap CDK (first-time setup)
npm run cdk:bootstrap

# Deploy the stack
npm run cdk:deploy

# Run integration tests (after deployment)
npm run test:integration
```

### Production Deployment

```bash
# Set environment suffix for production
export ENVIRONMENT_SUFFIX=prod

# Deploy with production context
npm run cdk:deploy
```

### Cleanup

```bash
# Destroy all resources
npm run cdk:destroy
```

## Security Features

### 1. Principle of Least Privilege

- The custom EC2 policy grants only the minimum required permissions:
  - `ec2:StartInstances`
  - `ec2:StopInstances`
  - `ec2:DescribeInstances`
  - `ec2:DescribeInstanceStatus`

### 2. Resource Isolation

- Environment suffix ensures resource isolation across different environments
- No hardcoded values or sensitive information in the code

### 3. Secure Data Handling

- No sensitive information is hardcoded in the infrastructure code
- Uses AWS Secrets Manager or SSM Parameter Store patterns for sensitive data (when needed)
- All credentials and keys are managed through AWS IAM securely

## Testing Strategy

### Unit Tests

The solution includes comprehensive unit tests that verify:

- IAM group creation with correct naming
- Policy attachments (both managed and custom)
- CloudFormation outputs
- Resource tagging
- Idempotency
- Security best practices

### Integration Tests

Integration tests validate:

- Actual AWS resource creation
- Policy attachments in live environment
- End-to-end IAM workflows
- Resource isolation and naming
- Security validation

## Key Design Decisions

### 1. Idempotency

AWS CDK inherently provides idempotency through CloudFormation's declarative 
nature. The stack can be deployed multiple times without side effects.

### 2. State Management

CloudFormation automatically manages the state of deployed resources, 
eliminating the need for external state management.

### 3. Resource Tagging

Consistent tagging strategy implemented for:

- **Environment**: Identifies the deployment environment (dev, staging, prod)
- **Department**: Identifies the owning department (DevOps)

### 4. Environment Isolation

Using environment suffixes ensures that multiple environments can coexist 
without conflicts:

- Development: `DevOps-dev`, `CustomEC2Policy-dev`
- Production: `DevOps-prod`, `CustomEC2Policy-prod`

## Compliance and Best Practices

 **IAM User Group Creation**: Creates DevOps group with environment-specific naming  
 **Managed Policy Attachment**: Attaches AmazonS3ReadOnlyAccess policy  
 **Custom IAM Policy**: Creates CustomEC2Policy with EC2 start/stop permissions  
 **Idempotency**: CloudFormation ensures idempotent deployments  
 **Resource Tagging**: Implements Environment and Department tags  
 **State Management**: Uses CloudFormation's built-in state management  
 **Secure Data Handling**: No hardcoded sensitive information  

## Resources Created

1. **IAM Group**: `DevOps-{environmentSuffix}`
2. **Custom Managed Policy**: `CustomEC2Policy-{environmentSuffix}`
3. **CloudFormation Outputs**:
   - DevOpsGroupArn
   - CustomEC2PolicyArn
   - DevOpsGroupName
   - CustomEC2PolicyName

This solution provides a robust, secure, and scalable IAM configuration that 
meets enterprise requirements while following AWS best practices and security 
standards.