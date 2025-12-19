I need help building a production-grade AWS infrastructure setup using AWS CDK with TypeScript. The infrastructure will support a web application that requires high availability and strong security measures.

Here are the specific requirements for this implementation:

The infrastructure must be deployed in the us-west-2 (Oregon) region and should be designed to accommodate future scaling to other regions. I need to create a comprehensive setup that includes networking, compute, database, storage, and load balancing components.

For the networking layer, please set up:
- A custom VPC with an IPv4 CIDR block of 10.0.0.0/16
- Two public subnets in different availability zones
- Two private subnets in different availability zones
- An Internet Gateway attached to the VPC
- Route tables configured so public subnets can access the Internet Gateway

For the compute resources:
- Deploy two EC2 instances of type t2.micro
- Place them in different public subnets for high availability
- Assign Elastic IPs to both instances
- Configure a Security Group that allows HTTP traffic on port 80 from anywhere
- Set up a Network ACL for the subnets to control inbound HTTP and SSH traffic from specific IPs

For the database:
- Create an RDS MySQL instance
- Deploy it in one of the private subnets
- Allocate 20 GB of storage
- Ensure the database is not publicly accessible

For storage:
- Create an S3 bucket for application logs
- Enable versioning on the bucket
- Configure server-side encryption using SSE-S3 for all objects

For load balancing:
- Deploy an Application Load Balancer in the VPC
- Configure two target groups for the EC2 instances
- Set up listeners to forward traffic to the appropriate target groups

Important implementation notes:
- All resources must be tagged with 'Environment: Production' for proper resource management
- Use standardized AWS tagging practices
- The infrastructure should pass AWS validation checks
- Ensure all components are configured for high availability and security

Please update the existing file at ./lib/tap-stack.ts with all the CDK code. The current file has the following content:

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

Please implement all the infrastructure components directly in this TapStack class. Make sure the code follows CDK best practices, is well-structured, and includes proper error handling. The implementation should be production-ready and follow AWS security best practices.

Ensure that during stack destruction, all resources are properly cleaned up and deleted. Configure resources with appropriate deletion policies where necessary to avoid orphaned resources.