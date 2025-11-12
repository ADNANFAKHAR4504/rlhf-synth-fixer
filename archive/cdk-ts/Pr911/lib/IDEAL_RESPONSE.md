# Ideal Response Specification

## Core Requirements

### 1. **Correct Class Structure**

```ts
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);
    const environmentSuffix = props?.environmentSuffix || 'dev';
    // ... rest of implementation
  }
}
```

### 2. **Proper Import Statements**

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
```

### 3. **Environment-Aware Resource Naming**

```ts
const encryptionKey = new kms.Key(this, `EncryptionKey-${environmentSuffix}`, {
  description: `KMS key for encrypting sensitive resources in SecurityDemo-${environmentSuffix}`,
  // ...
});

const secureBucket = new s3.Bucket(
  this,
  `SecureDataBucket-${environmentSuffix}`,
  {
    bucketName: `secure-data-${environmentSuffix}-${this.stackName}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
    // ...
  }
);
```

### 4. **Proper Security Group Configuration**

```ts
// For testing (replace with specific IP ranges in production)
albSG.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'Allow HTTP from anywhere for testing'
);

// For production
const allowedCidrBlocks = [
  '10.0.0.0/8', // Your VPC CIDR
  '172.16.0.0/12', // Your VPN CIDR
  '192.168.0.0/16', // Your office CIDR
];
```

### 5. **Working Load Balancer Configuration**

```ts
// Use HTTP listener for testing (no certificate required)
alb.addListener('HTTPListener', {
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultTargetGroups: [targetGroup],
});

// For production with HTTPS
// alb.addListener('HTTPSListener', {
//   port: 443,
//   protocol: elbv2.ApplicationProtocol.HTTPS,
//   certificates: [elbv2.ListenerCertificate.fromArn('certificate-arn')],
//   defaultTargetGroups: [targetGroup],
// });
```

### 6. **Lambda Function Without Runtime Dependencies**

```ts
const databaseLambda = new lambda.Function(this, 'DatabaseLambda', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Lambda function executed successfully',
            'vpc_config': 'Function running in private subnet',
            'database_host': os.environ.get('DB_HOST', 'not_configured'),
            's3_bucket': os.environ.get('S3_BUCKET', 'not_configured')
        })
    }
  `),
  // ...
});
```

### 7. **Proper Target Group Configuration**

```ts
const targetGroup = new elbv2.ApplicationTargetGroup(
  this,
  'WebServerTargetGroup',
  {
    vpc: vpc,
    port: 80,
    protocol: elbv2.ApplicationProtocol.HTTP,
    targets: [new targets.InstanceTarget(webServerInstance)],
    healthCheck: {
      enabled: true,
      path: '/',
      protocol: elbv2.Protocol.HTTP,
    },
  }
);
```

## Security Requirements Compliance

### 8. **Comprehensive Security Checklist**

```ts
/**
 * SECURITY COMPLIANCE CHECKLIST:
 * ✅ Encryption at rest: S3, EBS, RDS all encrypted with KMS
 * ✅ CloudTrail logging: Multi-region enabled with file validation
 * ✅ VPC Flow Logs: Enabled for all VPC traffic monitoring
 * ✅ RDS not publicly accessible: In isolated subnets
 * ✅ IAM roles for EC2: Instance profile configured
 * ✅ WAF on ALB: Web Application Firewall configured
 * ✅ Least privilege: Custom IAM policies with minimal permissions
 * ✅ Lambda in VPC: Deployed in private subnets
 * ✅ Security groups: Restricted to specific CIDR blocks
 * ✅ EBS encryption: All volumes encrypted
 *
 * ⚠️  MANUAL REQUIREMENT: Enable MFA on AWS Root account
 *    This must be done manually in AWS Console as it's not
 *    configurable via infrastructure code.
 */
```

## Testing Requirements

### 9. **Comprehensive Unit Tests**

- Test all security requirements
- Validate resource configurations
- Test environment-specific behavior
- 100% code coverage

### 10. **Integration Tests**

- Test resource dependencies
- Validate end-to-end scenarios
- Test cross-environment consistency
- Test error handling

## Documentation Requirements

### 11. **Clear Deployment Instructions**

```bash
# Install dependencies
npm install

# Run tests
npm run test:unit
npm run test:integration

# Deploy
cdk deploy TapStackdev
```

### 12. **Security Best Practices Documentation**

- Explain each security measure
- Provide production deployment guidance
- Document manual security requirements
- Include compliance validation steps

## Quality Assurance

### 13. **Error Handling**

- Validate optional parameters
- Handle missing environment variables
- Provide meaningful error messages
- Graceful degradation

### 14. **Monitoring and Observability**

- Comprehensive stack outputs
- CloudWatch logging configuration
- Resource tagging for cost tracking
- Security event monitoring

## Production Readiness

### 15. **Environment Management**

- Support for multiple environments (dev, staging, prod)
- Environment-specific configurations
- Consistent security across environments
- Proper resource naming conventions

### 16. **Operational Excellence**

- Automated testing in CI/CD
- Security compliance validation
- Cost optimization considerations
- Disaster recovery planning
