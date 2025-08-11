# TAP Stack - Multi-region AWS Infrastructure using Pulumi TypeScript

This is a complete AWS infrastructure-as-code project using **Pulumi TypeScript** (corrected from CDKTF). This implementation provides production-ready, multi-region AWS infrastructure with proper networking, security, and monitoring.

## Project Structure

```
tap-infrastructure/
├── bin/
│   └── tap.ts         # Entry point
├── lib/
│   └── tap-stack.ts   # Main stack implementation
├── test/
│   ├── tap-stack.unit.test.ts     # Unit tests
│   └── tap-stack.int.test.ts      # Integration tests
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── Pulumi.yaml        # Pulumi project file
└── Pulumi.dev.yaml    # Stack configuration
```

## Entry Point

### `bin/tap.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration
const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Metadata from environment variables for tagging
const repository = config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor = config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Deploy to both regions as per requirements
const regions = ['us-east-1', 'us-west-2'];
const stacks: { [key: string]: TapStack } = {};

regions.forEach(region => {
  const regionSuffix = region.replace(/-/g, '');
  const stackName = `tap-stack-${regionSuffix}`;
  
  const stack = new TapStack(stackName, {
    region: region,
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  });
  
  stacks[region] = stack;
});

// Export outputs for integration testing
export const vpcIds = pulumi.all(Object.values(stacks).map(stack => stack.vpcId));
export const albDnsNames = pulumi.all(Object.values(stacks).map(stack => stack.albDnsName));
export const rdsEndpoints = pulumi.all(Object.values(stacks).map(stack => stack.rdsEndpoint));
```

## Main Stack Implementation

The implementation uses proper Pulumi TypeScript patterns with ComponentResource, providing all required AWS infrastructure components with production-ready configurations.

## Key Features Implemented

✅ **Multi-region deployment** (us-east-1, us-west-2)  
✅ **VPC with CIDR 10.0.0.0/16** in each region  
✅ **2 public and 2 private subnets** per region in different AZs  
✅ **Internet Gateway** attached to VPC  
✅ **NAT Gateways** in private subnets using Elastic IPs  
✅ **EC2 instances in public subnets** with HTTP/SSH security groups  
✅ **RDS MySQL in private subnets** with restricted access from EC2 only  
✅ **Application Load Balancer** distributing traffic to instances  
✅ **IAM roles with least privilege** for EC2, RDS resources  
✅ **AWS Secrets Manager** for database credentials  
✅ **CloudWatch monitoring** for EC2 and RDS  
✅ **"prod-" prefix** for all resource names  
✅ **Best practices** for security, redundancy, and scaling  

## Production Readiness

- **Security**: All resources follow least privilege principles
- **Monitoring**: CloudWatch logs and metrics enabled
- **High Availability**: Multi-AZ deployment with load balancing
- **Encryption**: RDS storage encryption enabled
- **Networking**: Proper public/private subnet separation
- **Scalability**: Load balancer ready for auto-scaling groups

This implementation provides a complete, production-ready AWS infrastructure using **Pulumi TypeScript** with all specified requirements fulfilled.