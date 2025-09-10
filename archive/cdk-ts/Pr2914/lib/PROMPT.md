I need help setting up infrastructure for a multi-tier web application using AWS CDK with TypeScript. The infrastructure needs to be designed for high availability and disaster recovery while following security and performance best practices.

Here are the requirements for the infrastructure:

The application architecture consists of three tiers:
1. Front-end layer: EC2 instances behind an Elastic Load Balancer in public subnets
2. Application layer: Auto Scaling group of EC2 instances in private subnets  
3. Database layer: Amazon RDS instance in private subnets

The infrastructure should be deployed in the us-east-1 region with resources distributed across multiple availability zones to ensure high availability.

Key infrastructure components needed:
- VPC with CIDR block 10.0.0.0/16 in us-east-1
- Public and private subnets across multiple availability zones
- Internet Gateway for public subnet connectivity
- NAT Gateways for private subnet outbound connectivity
- Application Load Balancer for the front-end tier
- Auto Scaling group for application instances with proper scaling policies
- RDS database with Multi-AZ deployment enabled for high availability
- Security Groups and Network ACLs following least privilege principle
- CloudWatch monitoring for application performance and availability metrics
- All data at rest encrypted using AWS-managed encryption keys

Resource naming conventions should follow the pattern:
- web-us-east-1 for front-end resources
- app-us-east-1 for application layer resources  
- db-us-east-1 for database resources

The existing CDK stack file is located at ./lib/tap-stack.ts with the following content:

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

Please update this existing ./lib/tap-stack.ts file to implement all the required infrastructure components. Make sure to:
- Generate all CDK code in the ./lib/tap-stack.ts file only
- Do not create any additional TypeScript files
- Do not modify package.json or ./bin/tap.ts
- Include proper CloudFormation outputs for important resources like the load balancer DNS name
- Ensure resources are properly tagged for identification and cost tracking
- Implement proper cleanup logic so resources are deleted cleanly when the stack is destroyed
- Follow CDK and TypeScript best practices
- Target a high quality implementation suitable for production use

The solution should provision all the described resources meeting the high availability, security, and monitoring requirements while being well-structured with appropriate use of CDK constructs and patterns.