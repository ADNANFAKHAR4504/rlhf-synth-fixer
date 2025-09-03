I need help migrating an on-premise application to AWS cloud infrastructure in the us-west-2 region using AWS CDK with TypeScript. The migration requires a comprehensive, production-ready infrastructure setup that follows AWS best practices for security, scalability, and high availability.

Here are the specific infrastructure components I need to implement:

**Core Networking Requirements:**
- A VPC with proper network isolation containing 2 public subnets and 2 private subnets distributed across different availability zones for redundancy
- NAT Gateway configuration to enable secure internet access for resources in private subnets

**Compute Layer:**
- EC2 instances managed by an Auto Scaling Group that can dynamically adjust capacity based on application load
- Minimum of 2 instances distributed across different availability zones for fault tolerance
- Proper instance configuration with appropriate instance types and security groups

**Database Layer:**
- RDS PostgreSQL database instance configured for production use
- Read replicas to ensure high availability and distribute read traffic
- Proper backup and maintenance window configuration

**Storage and Backup:**
- S3 bucket dedicated for application backups
- Lifecycle management policies to optimize storage costs (transition to Glacier for old backups, expire after retention period)

**Security Requirements:**
- IAM roles and policies following the principle of least privilege for all resources
- All data must be encrypted at rest using AWS KMS managed keys
- Security groups configured with minimal required access

**DNS and Networking:**
- Route 53 configuration for DNS management and domain setup

**Monitoring and Alerting:**
- CloudWatch monitoring for all critical resources
- CPU utilization alarms that trigger when usage exceeds 70%
- Proper logging and metrics collection

**Additional Constraints:**
- The infrastructure must support zero-downtime updates and deployments
- All resources must be properly tagged for cost tracking and management
- The solution should be cost-optimized while maintaining reliability

I have an existing CDK TypeScript file at `./lib/tap-stack.ts` that needs to be updated with this infrastructure. Here's the current file content:

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

Please update this file to implement all the required AWS infrastructure components. The implementation should be production-ready, follow CDK best practices, and be deployable without errors using AWS CDK CLI. Make sure the code is well-structured, maintainable, and includes proper resource naming conventions that incorporate the environment suffix for multi-environment deployments.