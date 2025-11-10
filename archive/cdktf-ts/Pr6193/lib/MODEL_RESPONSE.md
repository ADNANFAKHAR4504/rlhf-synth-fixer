# CDKTF TypeScript Implementation: Financial Services VPC Infrastructure

This implementation provides a production-ready VPC infrastructure with complete network segmentation, security controls, and monitoring for a financial services application.

## File: lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, Fn } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NetworkAcl } from "@cdktf/provider-aws/lib/network-acl";
import { NetworkAclRule } from "@cdktf/provider-aws/lib/network-acl-rule";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { FlowLog } from "@cdktf/provider-aws/lib/flow-log";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

export interface TapStackConfig {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const { environmentSuffix, region } = config;

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: region,
    });

    // Get current AWS account ID
    const currentAccount = new DataAwsCallerIdentity(this, "current", {});

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `financial-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: "Financial Services Application",
      },
    });

    // Availability Zones
    const availabilityZones = ["us-east-1a", "us-east-1b", "us-east-1c"];

    // Public Subnets
    const publicSubnetCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
    const publicSubnets: Subnet[] = [];

    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Purpose: "Public subnet for external-facing resources",
          Tier: "Public",
        },
      });
      publicSubnets.push(subnet);
    });

    // Private Subnets
    const privateSubnetCidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"];
    const privateSubnets: Subnet[] = [];

    privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Purpose: "Private subnet for internal microservices",
          Tier: "Private",
        },
      });
      privateSubnets.push(subnet);
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Elastic IPs for NAT Gateways
    const eips: Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `eip-${i}`, {
        domain: "vpc",
        tags: {
          Name: `nat-eip-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      eips.push(eip);
    }

    // NAT Gateways (one in each public subnet)
    const natGateways: NatGateway[] = [];
    publicSubnets.forEach((subnet, index) => {
      const nat = new NatGateway(this, `nat-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `nat-gateway-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      natGateways.push(nat);
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Route to Internet Gateway for public subnets
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ)
    const privateRouteTables: RouteTable[] = [];
    privateSubnets.forEach((subnet, index) => {
      const privateRt = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      privateRouteTables.push(privateRt);

      // Route to NAT Gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });
    });

    // Network ACL
    const networkAcl = new NetworkAcl(this, "network-acl", {
      vpcId: vpc.id,
      subnetIds: [...publicSubnets.map(s => s.id), ...privateSubnets.map(s => s.id)],
      tags: {
        Name: `network-acl-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Network ACL Rule - Deny inbound SSH from internet
    new NetworkAclRule(this, "nacl-deny-ssh", {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: "6", // TCP
      ruleAction: "deny",
      cidrBlock: "0.0.0.0/0",
      fromPort: 22,
      toPort: 22,
      egress: false,
    });

    // Network ACL Rule - Allow all other inbound traffic
    new NetworkAclRule(this, "nacl-allow-inbound", {
      networkAclId: networkAcl.id,
      ruleNumber: 200,
      protocol: "-1", // All protocols
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: false,
    });

    // Network ACL Rule - Allow all outbound traffic
    new NetworkAclRule(this, "nacl-allow-outbound", {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: "-1", // All protocols
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true,
    });

    // S3 Bucket for VPC Flow Logs
    const flowLogsBucket = new S3Bucket(this, "flow-logs-bucket", {
      bucket: `vpc-flow-logs-${environmentSuffix}-${currentAccount.accountId}`,
      tags: {
        Name: `vpc-flow-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket Encryption
    new S3BucketServerSideEncryptionConfigurationA(this, "flow-logs-encryption", {
      bucket: flowLogsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, "flow-logs-public-access-block", {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Lifecycle Policy - 90-day retention
    new S3BucketLifecycleConfiguration(this, "flow-logs-lifecycle", {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: "expire-old-logs",
          status: "Enabled",
          expiration: {
            days: 90,
          },
        },
      ],
    });

    // VPC Flow Logs
    new FlowLog(this, "vpc-flow-log", {
      vpcId: vpc.id,
      trafficType: "ALL",
      logDestinationType: "s3",
      logDestination: `arn:aws:s3:::${flowLogsBucket.id}`,
      tags: {
        Name: `vpc-flow-log-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Alarms for NAT Gateways
    natGateways.forEach((nat, index) => {
      new CloudwatchMetricAlarm(this, `nat-alarm-${index}`, {
        alarmName: `nat-gateway-${index + 1}-high-bytes-${environmentSuffix}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "BytesOutToDestination",
        namespace: "AWS/NATGateway",
        period: 300, // 5 minutes
        statistic: "Sum",
        threshold: 1073741824, // 1GB in bytes
        actionsEnabled: true,
        alarmDescription: `Alert when NAT Gateway ${index + 1} bytes out exceeds 1GB in 5 minutes`,
        dimensions: {
          NatGatewayId: nat.id,
        },
        tags: {
          Name: `nat-alarm-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: Fn.jsonencode(publicSubnets.map(s => s.id)),
      description: "Public Subnet IDs",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: Fn.jsonencode(privateSubnets.map(s => s.id)),
      description: "Private Subnet IDs",
    });

    new TerraformOutput(this, "nat_gateway_ids", {
      value: Fn.jsonencode(natGateways.map(n => n.id)),
      description: "NAT Gateway IDs",
    });

    new TerraformOutput(this, "internet_gateway_id", {
      value: igw.id,
      description: "Internet Gateway ID",
    });

    new TerraformOutput(this, "flow_logs_bucket", {
      value: flowLogsBucket.id,
      description: "S3 Bucket for VPC Flow Logs",
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import { App } from "cdktf";
import { TapStack } from "../lib/tap-stack";

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";
const region = process.env.AWS_REGION || "us-east-1";

new TapStack(app, "tap-stack", {
  environmentSuffix,
  region,
});

app.synth();
```

## File: lib/README.md

```markdown
# Financial Services VPC Infrastructure

Production-ready VPC infrastructure for financial services applications using CDKTF with TypeScript.

## Architecture Overview

This infrastructure creates a highly available, secure VPC across three availability zones in us-east-1:

- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for internet-facing resources
- **Private Subnets**: 3 subnets (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24) for internal services
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: One per AZ for private subnet outbound traffic
- **Network ACLs**: Explicitly deny SSH from internet, allow all other traffic
- **VPC Flow Logs**: All network traffic logged to encrypted S3 bucket
- **CloudWatch Alarms**: Monitor NAT Gateway traffic patterns

## Security Features

### Network Isolation
- Public/private subnet segregation
- Private subnets have no direct internet access
- All outbound traffic from private subnets goes through NAT Gateways

### Access Controls
- Network ACLs deny inbound SSH (port 22) from 0.0.0.0/0
- Explicit route table associations (no main route table dependency)

### Audit and Compliance
- VPC Flow Logs capture all network traffic
- Flow logs stored in S3 with AES256 encryption
- 90-day retention policy on flow logs
- CloudWatch alarms for anomalous NAT Gateway traffic

## Prerequisites

- Node.js 18+ and npm
- CDKTF CLI: `npm install -g cdktf-cli`
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"
```

### 3. Synthesize Terraform Configuration

```bash
cdktf synth
```

### 4. Deploy Infrastructure

```bash
cdktf deploy
```

### 5. Verify Deployment

```bash
# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=financial-vpc-${ENVIRONMENT_SUFFIX}"

# Check Flow Logs
aws ec2 describe-flow-logs --filter "Name=resource-type,Values=VPC"

# Check CloudWatch Alarms
aws cloudwatch describe-alarms --alarm-name-prefix "nat-gateway"
```

## Outputs

After deployment, the stack provides the following outputs:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: Array of public subnet IDs
- `private_subnet_ids`: Array of private subnet IDs
- `nat_gateway_ids`: Array of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway identifier
- `flow_logs_bucket`: S3 bucket name for VPC Flow Logs

These outputs are available in `cfn-outputs/flat-outputs.json` for integration testing.

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

## Cost Considerations

Main cost drivers:
- **NAT Gateways**: ~$0.045/hour per gateway × 3 = ~$97/month
- **Data Transfer**: NAT Gateway data processing charges
- **S3 Storage**: Flow logs storage (minimal with 90-day lifecycle)

For development environments, consider using a single NAT Gateway or VPC endpoints to reduce costs.

## Compliance Notes

This infrastructure is designed for financial services compliance requirements:
- Network traffic logging meets audit requirements
- SSH access from internet is blocked at network level
- Encryption at rest for all stored data
- High availability across multiple AZs
- Clear network segregation between tiers

## Troubleshooting

### Issue: CloudWatch alarms not triggering
- Verify NAT Gateway metrics are being published
- Check alarm threshold (1GB over 5 minutes)
- Ensure alarm actions are enabled

### Issue: Flow logs not appearing in S3
- Verify S3 bucket policy allows VPC Flow Logs service
- Check Flow Log status in AWS Console
- Wait 10-15 minutes for initial logs to appear

### Issue: Private subnet instances can't reach internet
- Verify NAT Gateway is in healthy state
- Check private route table has route to NAT Gateway
- Verify security groups allow outbound traffic
```
