# LocalStack Migration - Pr921

## Overview

This task has been migrated from AWS to LocalStack Community Edition. The original multi-region, highly available web application architecture has been simplified to work within LocalStack's limitations while preserving the core infrastructure patterns.

## Original Architecture (AWS)

- **Multi-region deployment**: us-east-1 (primary) and us-west-2 (secondary)
- **Auto Scaling Groups**: Dynamic scaling based on CPU and request count
- **Application Load Balancers**: Traffic distribution within each region
- **Route53**: DNS failover between regions
- **VPC**: Multi-AZ with public and private subnets, NAT Gateways
- **EC2**: Amazon Linux 2 instances with httpd

## LocalStack-Compatible Architecture

### Changes Made

#### Network Layer (`lib/network-stack.ts`)
- ✅ **Public subnets only** - Removed private subnets and NAT Gateways
- ✅ **Reduced AZs** - Changed from 3 to 2 availability zones
- ✅ **Removed VPC Flow Logs** - Not fully supported in LocalStack
- ✅ **Simplified routing** - Direct internet access for all resources

#### Application Layer (`lib/webapp-stack-localstack.ts`)
- ✅ **Plain EC2 instances** - Replaced AutoScaling Groups (Pro feature)
- ✅ **Direct HTTP access** - Removed Application Load Balancer (Pro feature)
- ✅ **2 instances** - Basic redundancy without auto-scaling
- ✅ **RemovalPolicy.DESTROY** - Easy cleanup for testing

#### Deployment (`bin/tap.ts`)
- ✅ **Single region** - Only us-east-1 (LocalStack runs on single endpoint)
- ✅ **Simplified dependencies** - Commented out secondary region
- ✅ **LocalStack tags** - Added migration tracking

### What Works in LocalStack Community ✅

| Service | Status | Notes |
|---------|--------|-------|
| VPC | ✅ Works | Public subnets only |
| EC2 | ✅ Works | Basic instance creation |
| Security Groups | ✅ Works | Full functionality |
| IAM | ✅ Works | Roles and policies |
| Route53 | ✅ Available | Not tested in this migration |
| Internet Gateway | ✅ Works | Internet connectivity |

### What Was Removed/Replaced ⚠️

| Service | Status | Reason |
|---------|--------|--------|
| AutoScaling | ❌ Removed | Pro feature in LocalStack |
| Load Balancer (ALB) | ❌ Removed | Pro feature in LocalStack |
| NAT Gateway | ❌ Removed | EIP allocation issues |
| Private Subnets | ❌ Removed | Requires NAT Gateway |
| VPC Flow Logs | ❌ Removed | Not fully supported |
| Multi-region | ❌ Simplified | LocalStack single endpoint |

## Deployment Instructions

### Prerequisites

```bash
# Ensure LocalStack is running
curl http://localhost:4566/_localstack/health

# Install dependencies
npm install
```

### LocalStack Deployment

```bash
# Set LocalStack environment variables
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Bootstrap CDK for LocalStack
cdklocal bootstrap

# Deploy all stacks
cdklocal deploy --all --require-approval never
```

### Verify Deployment

```bash
# List stacks
awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE

# Check EC2 instances
awslocal ec2 describe-instances

# Get stack outputs
awslocal cloudformation describe-stacks --stack-name Primary-Network-dev
awslocal cloudformation describe-stacks --stack-name Primary-WebApp-dev
```

### Cleanup

```bash
# Destroy all stacks
cdklocal destroy --all
```

## Production Deployment (AWS)

For deploying to actual AWS with the full architecture:

1. **Revert to original webapp stack**:
   ```typescript
   // In bin/tap.ts
   import { WebAppStack } from '../lib/webapp-stack'; // Original with AutoScaling/ALB
   ```

2. **Uncomment secondary region**:
   ```typescript
   // Uncomment secondary stack definitions in bin/tap.ts
   ```

3. **Restore private subnets**:
   ```typescript
   // In lib/network-stack.ts, add back:
   {
     name: 'private',
     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
     cidrMask: 24,
   }
   ```

4. **Enable Route53 failover**:
   ```typescript
   // Uncomment Route53 stack in bin/tap.ts
   ```

5. **Deploy to AWS**:
   ```bash
   npm run cdk deploy --all --require-approval never
   ```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# For LocalStack
export AWS_ENDPOINT_URL=http://localhost:4566
npm run test:int

# For AWS
unset AWS_ENDPOINT_URL
npm run test:int
```

## Limitations and Trade-offs

### LocalStack Community Limitations

1. **No Auto Scaling** - Static instance count, no dynamic scaling
2. **No Load Balancing** - Direct instance access, no traffic distribution
3. **Single Region** - Cannot test multi-region failover
4. **Simplified Networking** - Public subnets only, no private subnet isolation

### What This Migration Validates

✅ VPC and networking basics
✅ EC2 instance provisioning
✅ Security group configuration
✅ IAM role and policy creation
✅ CloudFormation stack management
✅ CDK synthesis and deployment

### What Cannot Be Tested

❌ Auto-scaling behavior
❌ Load balancer traffic distribution
❌ Multi-region failover
❌ NAT Gateway functionality
❌ Private subnet isolation
❌ VPC Flow Logs

## File Structure

```
.
├── bin/
│   └── tap.ts                          # Stack definitions (LocalStack mode)
├── lib/
│   ├── network-stack.ts                # VPC and networking (simplified)
│   ├── webapp-stack.ts                 # Original (AutoScaling + ALB)
│   ├── webapp-stack-localstack.ts      # Simplified for LocalStack
│   ├── route53-stack.ts                # DNS (not used in this migration)
│   └── simple-route53-stack.ts         # Simplified DNS (not used)
├── test/
│   ├── tap-stack.unit.test.ts          # Unit tests
│   └── tap-stack.int.test.ts           # Integration tests
├── cdk.json                             # CDK configuration
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── metadata.json                        # Task metadata
├── execution-output.md                  # Deployment log
└── LOCALSTACK_MIGRATION.md             # This file
```

## Troubleshooting

### Stack Creation Failed

```bash
# Delete failed stacks
awslocal cloudformation delete-stack --stack-name Primary-Network-dev
awslocal cloudformation delete-stack --stack-name Primary-WebApp-dev

# Retry deployment
cdklocal deploy --all --require-approval never
```

### NAT Gateway Issues

This has been fixed by removing NAT Gateways entirely. If you see NAT Gateway errors, ensure you're using `lib/network-stack.ts` with the LocalStack modifications.

### Instance Creation Timeout

LocalStack may take a moment to create EC2 instances. If deployment times out, check LocalStack logs:

```bash
docker logs localstack
```

## Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [LocalStack AWS CDK Support](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [Original PR #921](https://github.com/TuringGpt/iac-test-automations/pull/921)

## Support

For issues with this migration, please reference:
- Original PR: #921
- LocalStack Migration: `ls-Pr921`
- Complexity: Hard (simplified for LocalStack)
