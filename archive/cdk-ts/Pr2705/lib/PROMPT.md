# AWS Infrastructure Implementation Request

Hi! I need help implementing a comprehensive AWS infrastructure setup using AWS CDK in TypeScript. I have a partially set up project and need you to update the existing code to meet specific requirements.

## Project Context
I have an existing AWS CDK project with a main stack file at `lib/tap-stack.ts`. The current implementation is minimal and needs to be expanded to include a full serverless application infrastructure with CI/CD pipeline capabilities.

## Current Code Structure
Here's my existing `lib/tap-stack.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```

## Requirements to Implement

I need you to update this existing stack to include:

### Core Infrastructure Requirements:
1. **VPC Setup**: Create a VPC with both public and private subnets spanning two Availability Zones
2. **Database**: Implement RDS Aurora as the database back-end with Multi-AZ setup
3. **Auto Scaling**: Setup an Auto Scaling group that efficiently manages resource allocation (min 2, max 6 instances)
4. **Networking**: Use NAT Gateways to enable internet access for instances in private subnets
5. **Content Delivery**: Setup CloudFront as a CDN to improve content delivery
6. **Load Balancing**: Deploy an application load balancer for distributing incoming traffic across multiple targets
7. **Storage**: Use S3 for storage with versioning enabled on all buckets
8. **Database (NoSQL)**: DynamoDB tables with on-demand capacity mode

### Security & Monitoring:
1. **Logging**: Log all network flow and application requests using CloudWatch and VPC Flow Logs
2. **Security**: Secure the infrastructure with robust IAM policies, security group configurations, and RDS encryption
3. **IAM**: Include IAM roles with least privilege principles
4. **Encryption**: Encrypted storage must be used wherever applicable
5. **Network Security**: Security groups should restrict access based on specific ports and IP ranges
6. **Public Access**: IAM policies should prevent any resource from being publicly accessible

### Compliance & Standards:
- Use AWS CloudFormation to manage all deployed resources (through CDK)
- All resources must be tagged with 'Environment', 'Department', and 'Project' identifiers
- All AMIs used should be from the latest Amazon Linux 2 versions
- VPC Flow Logs must be enabled for security monitoring

## Important Implementation Guidelines:

**CRITICAL**: Please update ONLY the existing `tap-stack.ts` file. Do not create new stack files or separate stacks. I want everything implemented within the current TapStack class structure.

**CRITICAL**: Do not create new stacks or provide output by creating additional stack files. Update only the existing given stack file.

The infrastructure should be designed for a secure, scalable web application environment that can support a CI/CD pipeline for serverless application deployment.

Please implement all these requirements by updating the existing code structure while maintaining the current class and interface definitions. Make sure to follow AWS CDK best practices and ensure all resources are properly configured for production use.

Thank you for your help with this infrastructure implementation!