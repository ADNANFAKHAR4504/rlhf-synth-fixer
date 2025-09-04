I need help building a secure AWS infrastructure using AWS CDK with TypeScript. The requirements are to create a comprehensive security-focused infrastructure setup that follows AWS best practices.

Here are the specific requirements for the infrastructure:

1. **IAM Security**: Set up IAM roles with appropriate policies that enforce multi-factor authentication (MFA) for user access. The roles should follow the principle of least privilege.

2. **Network Security**: Configure security groups that restrict traffic to only essential ports. Network access should be limited to specific pre-defined IP address ranges for additional security.

3. **Data Encryption**: Implement AWS KMS to encrypt all data at rest across cloud storage services. Each storage service should have its own KMS key for proper key management.

4. **S3 Configuration**: Create S3 buckets with:
   - Private access by default (no public access)
   - Versioning enabled for data protection
   - Server-side encryption using KMS

5. **VPC and Networking**: Deploy all EC2 instances within a designated VPC with properly configured subnets. The network architecture should follow security best practices with proper isolation.

6. **Monitoring and Alerting**: Set up CloudWatch alarms to monitor security events in real-time. Include alarms for:
   - Unauthorized access attempts
   - Configuration changes
   - Resource utilization anomalies

7. **Logging and Compliance**: Implement comprehensive logging strategies that align with AWS security best practices. This includes CloudTrail for API logging and VPC Flow Logs for network monitoring.

8. **Security Best Practices**:
   - No hard-coded secrets or sensitive information in the code
   - Use environment variables or AWS Systems Manager Parameter Store for configuration
   - Apply proper tagging for cost tracking and auditing

The infrastructure should be deployed to the us-east-1 region and all resources must be properly tagged with environment and purpose tags.

Here's the existing CDK stack file that needs to be updated with the security infrastructure:

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

Please update this file (lib/tap-stack.ts) to include all the security infrastructure components. The implementation should:
- Follow CDK best practices
- Be production-ready
- Include proper error handling
- Have clear resource naming conventions
- Be easily maintainable and scalable
- Don't create any additional file.

The final solution should pass compliance tests and demonstrate proper implementation of AWS security best practices. Focus on creating a robust, secure infrastructure that could be used in a production environment.