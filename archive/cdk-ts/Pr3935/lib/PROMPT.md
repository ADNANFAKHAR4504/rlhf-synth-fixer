I need help building out a secure AWS infrastructure using TypeScript and CloudFormation (AWS CDK). This is for a production-grade environment that needs to meet strict security and compliance requirements in a single region.

Here's what I need to implement:

**Infrastructure Requirements:**

1. **Networking:** Set up VPCs with both public and private subnets. Security groups should be configured differently for each subnet type based on their exposure level.

2. **Compute:** Deploy EC2 instances with Auto Scaling based on CPU and memory metrics. Put an Application Load Balancer in front of them with access logging enabled (logs should go to S3). All EC2 instances need detailed monitoring turned on.

3. **Database:** Set up RDS instances with Multi-AZ deployment for high availability. Database credentials should be managed through AWS Secrets Manager, not hardcoded anywhere.

4. **Security & Encryption:**
   - Everything stored should be encrypted using KMS
   - S3 buckets must enforce encryption and SSL-only access
   - Use IAM roles for EC2 instances that need S3 access (no access keys)
   - Require MFA for any IAM users with console access
   - Implement regular access key rotation and cleanup of unused keys

5. **Compliance & Monitoring:**
   - Enable CloudTrail for API call logging across the account
   - Configure AWS Config to enforce security best practices
   - Schedule regular Amazon Inspector assessments for vulnerability scanning
   - Set up Network ACLs according to security policy
   - Configure AWS WAF to protect the web applications

**Critical Constraints:**

- This needs to work across multiple AWS accounts without any modifications - no hardcoded account IDs, ARNs, or region names
- Use parameters or environment variables for anything that might vary
- Tag all resources with: `iac-rlhf-amazon`
- If you're adding Lambda functions, they should solve real problems (like log processing, event handling, or cost monitoring) - not just basic examples

**Existing Code:**

I already have a base stack file at `lib/tap-stack.ts`. Here's what it currently contains:

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

**Important:** Please UPDATE this existing tap-stack.ts file. Don't create entirely new stack files or give me a completely different structure. Work with what's there and build on top of it. Create any necessary separate stack classes as mentioned in the comments, but the main entry point should remain this TapStack class.

The solution needs to be production-ready and pass validation tests for security compliance and functionality. Can you help me implement this?
