I need help implementing a secure and highly available AWS infrastructure using AWS CDK in TypeScript. The organization has strict security requirements and needs infrastructure as code that follows AWS best practices.

Here are the specific requirements to implement:

1. **VPC Configuration**: Set up a VPC with both public and private subnets across multiple availability zones for network isolation and redundancy.

2. **EC2 Instances**: Deploy EC2 instances in at least two different availability zones to ensure high availability. These instances should be placed in private subnets for security.

3. **Load Balancing**: Configure an Elastic Load Balancer (ELB) to distribute incoming traffic across the EC2 instances. The load balancer should be in public subnets.

4. **Auto Scaling**: Implement an Auto Scaling group with a minimum of 2 instances and maximum of 4 to handle varying loads automatically.

5. **Encryption at Rest**: Apply AWS KMS encryption for all data at rest, including EBS volumes and S3 buckets.

6. **IAM Security**: Configure IAM roles and policies following least privilege principles. Each service should only have the permissions it absolutely needs.

7. **Audit Logging**: Set up AWS CloudTrail to log all API requests for security auditing and compliance.

8. **Encryption in Transit**: Ensure all data in transit is encrypted using TLS/SSL.

9. **Systems Management**: Use AWS Systems Manager for managing and configuring EC2 instances without direct SSH access.

10. **S3 Security**: Create S3 buckets with tight access policies following least privilege access control.

11. **Serverless Integration**: Deploy a Lambda function that gets triggered by S3 events (like object creation).

12. **Resource Tagging**: Tag all resources with "Environment: Production" for cost tracking and resource management.

Additional technical requirements:
- SSH access to EC2 instances should be restricted to specific IP ranges only
- The infrastructure should span at least 2 availability zones in us-east-1 region
- All resources should be defined using AWS CDK in TypeScript

I have an existing CDK TypeScript project structure with a file at `./lib/tap-stack.ts` that needs to be updated with this implementation. Here's the current content of the file:

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

Please update this file to implement all the requirements listed above. The implementation should:
- Follow CDK best practices and TypeScript conventions
- Be production-ready with proper error handling
- Include all necessary imports from aws-cdk-lib
- Define all resources within the TapStack class
- Use the environmentSuffix for resource naming where appropriate
- Ensure all security requirements are properly implemented

The solution should be a complete, working CDK stack that can be deployed to AWS and satisfy all the security and availability requirements.