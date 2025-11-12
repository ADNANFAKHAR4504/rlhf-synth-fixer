I'll complete the output. Here's the continuation and completion of the CDKTF TypeScript project:

## main.ts (continued)

```typescript
        name: regionalResources["eu-west-1"].alb.dnsName,
        zoneId: regionalResources["eu-west-1"].alb.zoneId,
        evaluateTargetHealth: true
      },
      provider: providers["us-east-1"]
    });

    // Outputs
    new TerraformOutput(this, "primary-alb-dns", {
      value: regionalResources["us-east-1"].alb.dnsName,
      description: "Primary ALB DNS name (us-east-1)"
    });

    new TerraformOutput(this, "secondary-alb-dns", {
      value: regionalResources["eu-west-1"].alb.dnsName,
      description: "Secondary ALB DNS name (eu-west-1)"
    });

    new TerraformOutput(this, "primary-bucket-name", {
      value: primaryBucket.bucket,
      description: "Primary S3 bucket name"
    });

    new TerraformOutput(this, "replica-bucket-name", {
      value: replicaBucket.bucket,
      description: "Replica S3 bucket name"
    });

    new TerraformOutput(this, "hosted-zone-id", {
      value: hostedZone.zoneId,
      description: "Route 53 hosted zone ID"
    });

    new TerraformOutput(this, "failover-dns", {
      value: "app.example.com", // Replace with your actual domain
      description: "Failover DNS endpoint"
    });

    new TerraformOutput(this, "sns-topics", {
      value: {
        "us-east-1": snsTopics["us-east-1"].arn,
        "eu-west-1": snsTopics["eu-west-1"].arn
      },
      description: "SNS topic ARNs for notifications"
    });
  }
}

const app = new App();
new MultiRegionStack(app, "multi-region-aws-stack");
app.synth();
```

## package.json

```json
{
  "name": "multi-region-aws-cdktf",
  "version": "1.0.0",
  "description": "Multi-region AWS infrastructure with CDKTF",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "test": "jest",
    "get": "cdktf get",
    "validate": "cdktf validate"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "cdktf.out"]
}
```

## cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "multi-region-aws-project",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Test Files

Create a `__tests__` directory with the following test files:

### **tests**/infrastructure.test.ts

```typescript
import { Testing } from 'cdktf';
import { MultiRegionStack } from '../main';

describe('Multi-Region Infrastructure', () => {
  it('should create infrastructure without errors', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(synthesized).toHaveProperty('resource');
  });

  it('should create VPCs in both regions', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for VPCs
    const vpcs = Object.keys(synthesized.resource?.aws_vpc || {});
    expect(vpcs.length).toBeGreaterThanOrEqual(2);
  });

  it('should create load balancers in both regions', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for ALBs
    const albs = Object.keys(synthesized.resource?.aws_lb || {});
    expect(albs.length).toBeGreaterThanOrEqual(2);
  });

  it('should create auto scaling groups in both regions', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for ASGs
    const asgs = Object.keys(synthesized.resource?.aws_autoscaling_group || {});
    expect(asgs.length).toBeGreaterThanOrEqual(2);
  });

  it('should create S3 buckets with replication', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for S3 buckets
    const buckets = Object.keys(synthesized.resource?.aws_s3_bucket || {});
    expect(buckets.length).toBeGreaterThanOrEqual(2);

    // Check for replication configuration
    const replication = Object.keys(
      synthesized.resource?.aws_s3_bucket_replication_configuration || {}
    );
    expect(replication.length).toBeGreaterThanOrEqual(1);
  });

  it('should create Route 53 health checks and DNS records', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for health checks
    const healthChecks = Object.keys(
      synthesized.resource?.aws_route53_health_check || {}
    );
    expect(healthChecks.length).toBeGreaterThanOrEqual(2);

    // Check for DNS records
    const dnsRecords = Object.keys(
      synthesized.resource?.aws_route53_record || {}
    );
    expect(dnsRecords.length).toBeGreaterThanOrEqual(2);
  });

  it('should create SNS topics in both regions', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for SNS topics
    const snsTopics = Object.keys(synthesized.resource?.aws_sns_topic || {});
    expect(snsTopics.length).toBeGreaterThanOrEqual(2);
  });

  it('should create CloudWatch alarms', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    // Check for CloudWatch alarms
    const alarms = Object.keys(
      synthesized.resource?.aws_cloudwatch_metric_alarm || {}
    );
    expect(alarms.length).toBeGreaterThanOrEqual(4); // 2 per region (high/low CPU)
  });
});
```

### **tests**/failover.test.ts

```typescript
import { Testing } from 'cdktf';
import { MultiRegionStack } from '../main';

describe('Failover Strategy', () => {
  it('should have primary and secondary DNS records', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    const dnsRecords = synthesized.resource?.aws_route53_record || {};
    const recordKeys = Object.keys(dnsRecords);

    // Find primary and secondary records
    const primaryRecord = recordKeys.find(
      key => dnsRecords[key].failover_routing_policy?.[0]?.type === 'PRIMARY'
    );
    const secondaryRecord = recordKeys.find(
      key => dnsRecords[key].failover_routing_policy?.[0]?.type === 'SECONDARY'
    );

    expect(primaryRecord).toBeDefined();
    expect(secondaryRecord).toBeDefined();
  });

  it('should have health checks for both regions', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    const healthChecks = Object.keys(
      synthesized.resource?.aws_route53_health_check || {}
    );
    expect(healthChecks.length).toBeGreaterThanOrEqual(2);
  });

  it('should have cross-region S3 replication configured', () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    const replicationConfigs =
      synthesized.resource?.aws_s3_bucket_replication_configuration || {};
    expect(Object.keys(replicationConfigs).length).toBeGreaterThanOrEqual(1);

    // Check that replication rule exists
    const replicationConfig = Object.values(replicationConfigs)[0] as any;
    expect(replicationConfig.rule).toBeDefined();
    expect(replicationConfig.rule[0].status).toBe('Enabled');
  });
});
```

## Deployment Scripts

Create additional helper scripts:

### scripts/deploy.sh

```bash
#!/bin/bash
set -e

echo "🚀 Starting multi-region deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Get provider schemas
echo "🔄 Getting provider schemas..."
cdktf get

# Validate configuration
echo "✅ Validating configuration..."
cdktf validate

# Run tests
echo "🧪 Running tests..."
npm test

# Synthesize Terraform configuration
echo "🔨 Synthesizing Terraform configuration..."
cdktf synth

# Deploy infrastructure
echo "🌍 Deploying infrastructure..."
cdktf deploy --auto-approve

echo "✨ Deployment completed successfully!"
echo "🔗 Check the outputs for ALB DNS names and other important information."
```

### scripts/destroy.sh

```bash
#!/bin/bash
set -e

echo "🗑️  Starting infrastructure destruction..."

# Confirm destruction
read -p "Are you sure you want to destroy all infrastructure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Destruction cancelled."
    exit 0
fi

# Destroy infrastructure
echo "💥 Destroying infrastructure..."
cdktf destroy --auto-approve

echo "✅ Infrastructure destroyed successfully!"
```

### scripts/validate.sh

```bash
#!/bin/bash
set -e

echo "🔍 Validating multi-region infrastructure..."

# Install dependencies
npm install

# Get provider schemas
cdktf get

# Validate configuration
cdktf validate

# Run tests
npm test

# Check synthesized output
cdktf synth

echo "✅ Validation completed successfully!"
```

## README.md

````markdown
# Multi-Region AWS Infrastructure with CDKTF

This project deploys a highly available, multi-region AWS infrastructure using CDKTF (TypeScript) with automatic failover capabilities between `us-east-1` and `eu-west-1`.

## Architecture Overview

### Core Components

- **Multi-Region VPCs** with public/private subnets
- **Application Load Balancers** in each region
- **Auto Scaling Groups** with EC2 instances
- **S3 Cross-Region Replication**
- **Route 53 DNS Failover**
- **CloudWatch Monitoring & Alarms**
- **SNS Notifications**
- **Parameter Store** for secrets management

### Failover Strategy

- **Primary Region**: us-east-1
- **Secondary Region**: eu-west-1
- **DNS Failover**: Route 53 health checks automatically route traffic to healthy region
- **Data Replication**: S3 cross-region replication ensures data availability
- **Monitoring**: CloudWatch alarms trigger scaling and notifications

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Node.js** (v16 or later)
3. **Terraform** (v1.0 or later)
4. **CDKTF CLI** (`npm install -g cdktf-cli`)

## Required AWS Permissions

Your AWS credentials need the following permissions:

- EC2 (VPC, instances, security groups, load balancers)
- IAM (roles, policies, instance profiles)
- S3 (buckets, replication, policies)
- Route 53 (hosted zones, records, health checks)
- CloudWatch (logs, alarms, metrics)
- SNS (topics, subscriptions)
- Systems Manager (Parameter Store)
- Auto Scaling

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd multi-region-aws-cdktf
npm install
```
````

### 2. Configure Environment

Update the following in `main.ts`:

- Replace `"example.com"` with your actual domain
- Replace `"admin@example.com"` with your notification email
- Replace `"my-key-pair"` with your EC2 key pair name
- Update AMI IDs if needed for your regions

### 3. Initialize CDKTF

```bash
cdktf get
```

### 4. Validate Configuration

```bash
./scripts/validate.sh
```

### 5. Deploy Infrastructure

```bash
./scripts/deploy.sh
```

## Testing Failover

### 1. Test Primary Region

```bash
# Get primary ALB DNS from outputs
curl http://<primary-alb-dns>
```

### 2. Simulate Primary Region Failure

```bash
# Stop instances in primary region ASG
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name asg-us-east-1 \
  --desired-capacity 0 \
  --region us-east-1
```

### 3. Verify Failover

```bash
# DNS should now resolve to secondary region
nslookup app.example.com
curl http://app.example.com
```

### 4. Restore Primary Region

```bash
# Restore instances in primary region
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name asg-us-east-1 \
  --desired-capacity 2 \
  --region us-east-1
```

## Monitoring & Alerts

### CloudWatch Dashboards

- CPU utilization across regions
- Request count and latency
- Health check status
- S3 replication metrics

### SNS Notifications

- Auto scaling events
- Health check failures
- CloudWatch alarm triggers
- Infrastructure changes

## Security Features

### Network Security

- Private subnets for application instances
- Security groups with least privilege rules
- NACLs for additional network protection

### Data Security

- S3 bucket encryption at rest
- Public access blocked on all buckets
- IAM roles with minimal required permissions

### Access Control

- Parameter Store for sensitive configuration
- Instance profiles for EC2 access
- Cross-region replication with dedicated IAM role

## Cost Optimization

### Auto Scaling

- Scales down during low traffic periods
- Uses t3.micro instances for cost efficiency
- Terminates unhealthy instances automatically

### Storage

- S3 Intelligent Tiering for cost optimization
- CloudWatch log retention policies
- EBS volume optimization

## Troubleshooting

### Common Issues

1. **Health Check Failures**

   ```bash
   # Check ALB target health
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```

2. **DNS Resolution Issues**

   ```bash
   # Check Route 53 health check status
   aws route53 get-health-check --health-check-id <health-check-id>
   ```

3. **S3 Replication Issues**
   ```bash
   # Check replication status
   aws s3api get-bucket-replication --bucket <bucket-name>
   ```

### Logs and Monitoring

- CloudWatch Logs: `/aws/ec2/app-<region>`
- CloudWatch Metrics: Custom metrics from applications
- SNS Notifications: Real-time alerts

## Cleanup

To destroy all infrastructure:

```bash
./scripts/destroy.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Run validation: `./scripts/validate.sh`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

```

This completes the comprehensive multi-region AWS infrastructure project with CDKTF. The solution includes:

1. **Complete Infrastructure Code**: VPCs, ALBs, ASGs, S3, Route 53, CloudWatch, SNS, Parameter Store
2. **Security Best Practices**: Least privilege IAM, encrypted storage, private subnets
3. **High Availability**: Multi-AZ deployment, auto scaling, health checks
4. **Failover Strategy**: Route 53 DNS failover with health checks
5. **Monitoring**: CloudWatch alarms, SNS notifications, comprehensive logging
6. **Testing**: Unit tests for infrastructure validation
7. **Documentation**: Complete setup, deployment, and troubleshooting guide
8. **Scripts**: Automated deployment, validation, and cleanup scripts

The infrastructure automatically handles failover between regions and maintains data consistency through S3 cross-region replication.
```
