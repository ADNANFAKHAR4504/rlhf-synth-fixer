# AWS CDK TypeScript Infrastructure - Multi-Region Secure VPC

A production-ready AWS infrastructure using CDK TypeScript that implements security best practices, high availability, and cost optimization across multiple regions.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { SecretsStack } from './secrets-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const projectName = 'secure-vpc-project';
    const costCenter = 'infrastructure';

    // Apply common tags
    const commonTags = {
      Environment: environmentSuffix,
      ProjectName: projectName,
      CostCenter: costCenter,
    };

    // Primary region (us-east-1) infrastructure
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    const secretsStack = new SecretsStack(this, 'SecretsStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      env: props?.env,
    });

    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      dbSecurityGroup: securityStack.dbSecurityGroup,
      env: props?.env,
    });

    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      env: props?.env,
    });

    // Cross-region replication stack for us-west-2
    if (props?.env?.region === 'us-east-1') {
      new StorageStack(this, 'StorageStackWest', {
        environmentSuffix,
        commonTags,
        regionSuffix: '-west2',
        env: { ...props?.env, region: 'us-west-2' },
      });
    }
  }
}
```

## lib/networking-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.StackProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
}

export class NetworkingStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-vpc`,
      {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 3,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-public`,
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-private`,
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 28,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-isolated`,
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
        // Optimize NAT gateway usage
        natGateways: 2,
        flowLogs: {
          cloudwatch: {
            destination: ec2.FlowLogDestination.toCloudWatchLogs(),
            trafficType: ec2.FlowLogTrafficType.ALL,
          },
        },
      }
    );

    // Apply tags to VPC
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // VPC Endpoints for secure AWS service access
    this.vpc.addGatewayEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-s3-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      }
    );

    this.vpc.addGatewayEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-dynamodb-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      }
    );

    // Interface endpoints for other AWS services
    this.vpc.addInterfaceEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-secrets-endpoint`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    this.vpc.addInterfaceEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-ssm-endpoint`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );
  }
}
```

## Key Improvements in the IDEAL_RESPONSE

1. **Fixed Circular Dependencies**: Properly ordered stack creation to avoid circular dependencies between SecretsStack and DatabaseStack.

2. **Optimized NAT Gateways**: Configured NAT gateway count to balance cost and availability.

3. **Enhanced Security**:
   - Implemented strict security groups with least privilege access
   - Added Network ACLs for defense in depth
   - Enabled GuardDuty with extended threat detection features
   - Configured VPC endpoints for secure AWS service access

4. **Cost Optimization**:
   - Used t3.micro instances for RDS to reduce costs
   - Implemented S3 lifecycle policies for intelligent tiering
   - Optimized NAT gateway usage

5. **High Availability**:
   - Multi-AZ deployment across 3 availability zones
   - RDS cluster with 2 instances for redundancy
   - Cross-region replication capability for S3

6. **Monitoring & Compliance**:
   - VPC Flow Logs enabled for all traffic
   - CloudWatch dashboards and alarms configured
   - Comprehensive tagging strategy implemented
   - All resources properly tagged for cost tracking

7. **Clean Deployment**:
   - All resources configured with RemovalPolicy.DESTROY for clean teardown
   - No retention policies that would prevent deletion
   - Auto-delete enabled for S3 buckets

This infrastructure provides a secure, scalable, and cost-effective foundation for hosting applications in AWS with multi-region support and comprehensive monitoring.