I need help implementing a secure AWS infrastructure using CDK with TypeScript. The infrastructure should be production-ready and follow AWS security best practices.

Here are the specific requirements I need to implement:

1. Create an S3 bucket with these security features:
   - Server-side encryption enabled
   - Versioning enabled  
   - Bucket policy that allows access only from CloudFront
   - Proper naming convention with 'prod-' prefix

2. Set up an EC2 instance with:
   - Security group that only allows inbound SSH traffic (port 22) from a specific IP address
   - Proper tagging and naming with 'prod-' prefix

3. Configure IAM roles and policies:
   - Follow least privilege principle
   - Create only the minimum necessary permissions for services to interact

4. Implement comprehensive logging:
   - CloudWatch logging for all deployed services
   - CloudTrail enabled for account auditability

5. Create a VPC with:
   - Subnets configured for high availability across two availability zones
   - Proper network isolation

6. Set up an RDS instance with:
   - Automatic backups configured
   - Encryption enabled
   - Multi-AZ for high availability

7. Define CloudFormation outputs for:
   - S3 bucket ARN
   - EC2 instance ID
   - Other relevant resource attributes

Technical constraints:
- Deploy everything in the us-east-1 region
- All resources must use 'prod-' prefix for naming
- IAM policies must grant only least privilege necessary
- All S3 buckets must have server-side encryption enabled

Current code file to update (./lib/tap-stack.ts):
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

Important notes:
- Generate all CDK code in the existing ./lib/tap-stack.ts file
- Do not create any additional files
- The solution should be a complete, working CDK implementation
- Ensure the code passes AWS CDK validation and can be successfully deployed
- Follow TypeScript and CDK best practices
- Include proper error handling and validation

Please provide a complete implementation that addresses all these requirements in the tap-stack.ts file.