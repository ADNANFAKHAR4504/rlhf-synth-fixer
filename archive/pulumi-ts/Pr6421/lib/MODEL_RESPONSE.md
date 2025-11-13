# Production VPC Infrastructure with NAT Instances - Implementation

This implementation creates a production-grade VPC infrastructure with comprehensive network segmentation, NAT instances for cost-optimized outbound connectivity, VPC Flow Logs, and S3 VPC endpoint using Pulumi with TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * Production VPC Infrastructure with NAT Instances
 *
 * This stack creates a complete production-grade VPC with:
 * - 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
 * - 9 subnets (3 public, 3 private, 3 database)
 * - NAT instances for cost-optimized outbound connectivity
 * - Security groups for web, app, and database tiers
 * - Network ACLs with restricted ephemeral port ranges
 * - VPC Flow Logs to S3 with encryption
 * - S3 VPC endpoint for private S3 access
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly databaseSubnetIds: pulumi.Output<string>[];
  public readonly natInstanceIds: pulumi.Output<string>[];
  public readonly webSgId: pulumi.Output<string>;
  public readonly appSgId: pulumi.Output<string>;
  public readonly dbSgId: pulumi.Output<string>;
  public readonly flowLogsBucketName: pulumi.Output<string>;

  constructor(name: string, args?: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const config = new pulumi.Config();
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

    // Base tags for all resources
    const baseTags = {
      Environment: 'production',
      Project: 'payment-platform',
      CostCenter: 'engineering',
      ...args?.tags,
    };

    // Availability zones
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // VPC
    const vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...baseTags,
        Name: `vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...baseTags,
        Name: `igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Public Subnets
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const publicSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`public-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: publicSubnetCidrs[i],
        availabilityZone: azs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...baseTags,
          Name: `public-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'public',
        },
      }, { parent: this });
      publicSubnets.push(subnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Private Subnets
    const privateSubnetCidrs = ['10.0.10.0/23', '10.0.12.0/23', '10.0.14.0/23'];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`private-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: privateSubnetCidrs[i],
        availabilityZone: azs[i],
        tags: {
          ...baseTags,
          Name: `private-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'private',
        },
      }, { parent: this });
      privateSubnets.push(subnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Database Subnets
    const databaseSubnetCidrs = ['10.0.20.0/24', '10.0.21.0/24', '10.0.22.0/24'];
    const databaseSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`database-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: databaseSubnetCidrs[i],
        availabilityZone: azs[i],
        tags: {
          ...baseTags,
          Name: `database-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'database',
        },
      }, { parent: this });
      databaseSubnets.push(subnet);
    }

    this.databaseSubnetIds = databaseSubnets.map(s => s.id);

    // Get latest Ubuntu 20.04 AMI
    const ubuntuAmi = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['099720109477'], // Canonical
      filters: [
        {
          name: 'name',
          values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Security Group for NAT Instances
    const natSg = new aws.ec2.SecurityGroup(`nat-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for NAT instances',
      ingress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow all traffic from VPC',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        ...baseTags,
        Name: `nat-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // IAM Role for NAT Instances
    const natRole = new aws.iam.Role(`nat-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        }],
      }),
      tags: {
        ...baseTags,
        Name: `nat-role-${environmentSuffix}`,
      },
    }, { parent: this });

    const natInstanceProfile = new aws.iam.InstanceProfile(`nat-profile-${environmentSuffix}`, {
      role: natRole.name,
      tags: {
        ...baseTags,
        Name: `nat-profile-${environmentSuffix}`,
      },
    }, { parent: this });

    // User data script for NAT instances
    const natUserData = `#!/bin/bash
set -e

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" | tee -a /etc/sysctl.conf
sysctl -p

# Configure iptables for NAT
iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE
iptables -A FORWARD -i ens5 -o ens5 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i ens5 -o ens5 -j ACCEPT

# Save iptables rules
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent

# Make sure rules persist
netfilter-persistent save
`;

    // NAT Instances (one per public subnet)
    const natInstances: aws.ec2.Instance[] = [];

    for (let i = 0; i < 3; i++) {
      const natInstance = new aws.ec2.Instance(`nat-instance-${i + 1}-${environmentSuffix}`, {
        ami: ubuntuAmi.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: publicSubnets[i].id,
        vpcSecurityGroupIds: [natSg.id],
        iamInstanceProfile: natInstanceProfile.name,
        sourceDestCheck: false,
        userData: natUserData,
        tags: {
          ...baseTags,
          Name: `nat-instance-${i + 1}-${environmentSuffix}`,
        },
      }, { parent: this });
      natInstances.push(natInstance);
    }

    this.natInstanceIds = natInstances.map(n => n.id);

    // Public Route Table
    const publicRt = new aws.ec2.RouteTable(`production-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...baseTags,
        Name: `production-public-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Associate public subnets with public route table
    for (let i = 0; i < 3; i++) {
      new aws.ec2.RouteTableAssociation(`public-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: publicSubnets[i].id,
        routeTableId: publicRt.id,
      }, { parent: this });
    }

    // Private Route Tables (one per AZ, routing to corresponding NAT instance)
    for (let i = 0; i < 3; i++) {
      const privateRt = new aws.ec2.RouteTable(`production-private-${azs[i]}-rt-${environmentSuffix}`, {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            networkInterfaceId: natInstances[i].primaryNetworkInterfaceId,
          },
        ],
        tags: {
          ...baseTags,
          Name: `production-private-${azs[i]}-rt-${environmentSuffix}`,
        },
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`private-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: privateSubnets[i].id,
        routeTableId: privateRt.id,
      }, { parent: this });
    }

    // Database Route Tables (one per AZ, no internet access)
    for (let i = 0; i < 3; i++) {
      const databaseRt = new aws.ec2.RouteTable(`production-database-${azs[i]}-rt-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: {
          ...baseTags,
          Name: `production-database-${azs[i]}-rt-${environmentSuffix}`,
        },
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`database-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: databaseSubnets[i].id,
        routeTableId: databaseRt.id,
      }, { parent: this });
    }

    // Security Groups

    // Web Tier Security Group
    const webSg = new aws.ec2.SecurityGroup(`web-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for web tier - allows HTTP and HTTPS',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        ...baseTags,
        Name: `web-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    this.webSgId = webSg.id;

    // App Tier Security Group
    const appSg = new aws.ec2.SecurityGroup(`app-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for app tier - allows port 8080 from web tier',
      tags: {
        ...baseTags,
        Name: `app-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`app-sg-ingress-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSg.id,
      securityGroupId: appSg.id,
      description: 'Allow port 8080 from web tier',
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`app-sg-egress-${environmentSuffix}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
      description: 'Allow all outbound traffic',
    }, { parent: this });

    this.appSgId = appSg.id;

    // Database Tier Security Group
    const dbSg = new aws.ec2.SecurityGroup(`db-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for database tier - allows port 5432 from app tier',
      tags: {
        ...baseTags,
        Name: `db-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`db-sg-ingress-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
      description: 'Allow port 5432 from app tier',
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`db-sg-egress-${environmentSuffix}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSg.id,
      description: 'Allow all outbound traffic',
    }, { parent: this });

    this.dbSgId = dbSg.id;

    // Network ACLs

    // Public Subnet Network ACL
    const publicNacl = new aws.ec2.NetworkAcl(`public-nacl-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...baseTags,
        Name: `public-nacl-${environmentSuffix}`,
      },
    }, { parent: this });

    // Public NACL Inbound Rules
    new aws.ec2.NetworkAclRule(`public-nacl-inbound-http-${environmentSuffix}`, {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
      egress: false,
    }, { parent: this });

    new aws.ec2.NetworkAclRule(`public-nacl-inbound-https-${environmentSuffix}`, {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: false,
    }, { parent: this });

    new aws.ec2.NetworkAclRule(`public-nacl-inbound-ephemeral-${environmentSuffix}`, {
      networkAclId: publicNacl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 32768,
      toPort: 65535,
      egress: false,
    }, { parent: this });

    // Public NACL Outbound Rules
    new aws.ec2.NetworkAclRule(`public-nacl-outbound-all-${environmentSuffix}`, {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    }, { parent: this });

    // Associate public subnets with public NACL
    for (let i = 0; i < 3; i++) {
      new aws.ec2.NetworkAclAssociation(`public-nacl-assoc-${i + 1}-${environmentSuffix}`, {
        networkAclId: publicNacl.id,
        subnetId: publicSubnets[i].id,
      }, { parent: this });
    }

    // Private Subnet Network ACL
    const privateNacl = new aws.ec2.NetworkAcl(`private-nacl-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...baseTags,
        Name: `private-nacl-${environmentSuffix}`,
      },
    }, { parent: this });

    // Private NACL Inbound Rules
    new aws.ec2.NetworkAclRule(`private-nacl-inbound-vpc-${environmentSuffix}`, {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      egress: false,
    }, { parent: this });

    new aws.ec2.NetworkAclRule(`private-nacl-inbound-ephemeral-${environmentSuffix}`, {
      networkAclId: privateNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 32768,
      toPort: 65535,
      egress: false,
    }, { parent: this });

    // Private NACL Outbound Rules
    new aws.ec2.NetworkAclRule(`private-nacl-outbound-all-${environmentSuffix}`, {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    }, { parent: this });

    // Associate private subnets with private NACL
    for (let i = 0; i < 3; i++) {
      new aws.ec2.NetworkAclAssociation(`private-nacl-assoc-${i + 1}-${environmentSuffix}`, {
        networkAclId: privateNacl.id,
        subnetId: privateSubnets[i].id,
      }, { parent: this });
    }

    // Database Subnet Network ACL
    const databaseNacl = new aws.ec2.NetworkAcl(`database-nacl-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...baseTags,
        Name: `database-nacl-${environmentSuffix}`,
      },
    }, { parent: this });

    // Database NACL Inbound Rules
    new aws.ec2.NetworkAclRule(`database-nacl-inbound-vpc-${environmentSuffix}`, {
      networkAclId: databaseNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      egress: false,
    }, { parent: this });

    // Database NACL Outbound Rules
    new aws.ec2.NetworkAclRule(`database-nacl-outbound-vpc-${environmentSuffix}`, {
      networkAclId: databaseNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      egress: true,
    }, { parent: this });

    // Associate database subnets with database NACL
    for (let i = 0; i < 3; i++) {
      new aws.ec2.NetworkAclAssociation(`database-nacl-assoc-${i + 1}-${environmentSuffix}`, {
        networkAclId: databaseNacl.id,
        subnetId: databaseSubnets[i].id,
      }, { parent: this });
    }

    // S3 Bucket for VPC Flow Logs
    const flowLogsBucket = new aws.s3.Bucket(`vpc-flow-logs-${environmentSuffix}`, {
      bucket: `vpc-flow-logs-${environmentSuffix}`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [
        {
          enabled: true,
          expiration: {
            days: 7,
          },
        },
      ],
      forceDestroy: true,
      tags: {
        ...baseTags,
        Name: `vpc-flow-logs-${environmentSuffix}`,
      },
    }, { parent: this });

    this.flowLogsBucketName = flowLogsBucket.id;

    // S3 Bucket Policy for VPC Flow Logs
    const flowLogsBucketPolicy = new aws.s3.BucketPolicy(`vpc-flow-logs-policy-${environmentSuffix}`, {
      bucket: flowLogsBucket.id,
      policy: pulumi.all([flowLogsBucket.arn, vpc.id]).apply(([bucketArn, vpcId]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSLogDeliveryWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          {
            Sid: 'AWSLogDeliveryAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: bucketArn,
          },
        ],
      })),
    }, { parent: this });

    // VPC Flow Log
    const vpcFlowLog = new aws.ec2.FlowLog(`vpc-flow-log-${environmentSuffix}`, {
      vpcId: vpc.id,
      logDestinationType: 's3',
      logDestination: flowLogsBucket.arn,
      trafficType: 'ALL',
      tags: {
        ...baseTags,
        Name: `vpc-flow-log-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [flowLogsBucketPolicy] });

    // S3 VPC Endpoint
    const s3Endpoint = new aws.ec2.VpcEndpoint(`s3-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: privateSubnets.map((_, i) =>
        pulumi.output(aws.ec2.getRouteTable({
          filters: [
            {
              name: 'tag:Name',
              values: [`production-private-${azs[i]}-rt-${environmentSuffix}`],
            },
          ],
        }).then(rt => rt.id))
      ),
      tags: {
        ...baseTags,
        Name: `s3-endpoint-${environmentSuffix}`,
      },
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
      natInstanceIds: this.natInstanceIds,
      webSgId: this.webSgId,
      appSgId: this.appSgId,
      dbSgId: this.dbSgId,
      flowLogsBucketName: this.flowLogsBucketName,
    });
  }
}
```

## File: lib/README.md

```markdown
# Production VPC Infrastructure with NAT Instances

This Pulumi TypeScript project deploys a production-grade VPC infrastructure with comprehensive network segmentation, NAT instances for cost-optimized outbound connectivity, VPC Flow Logs, and S3 VPC endpoint.

## Architecture Overview

### Network Structure

- **VPC**: 10.0.0.0/16 CIDR block with DNS enabled
- **Availability Zones**: 3 AZs in us-east-1 (us-east-1a, us-east-1b, us-east-1c)
- **Subnets**:
  - 3 Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - 3 Private subnets (10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23)
  - 3 Database subnets (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24)

### Internet Connectivity

- **Internet Gateway**: Provides internet access to public subnets
- **NAT Instances**: 3 t3.micro Ubuntu 20.04 instances (one per AZ) for outbound traffic from private subnets
- **Cost Optimization**: NAT instances instead of NAT Gateways for significant cost savings

### Security

- **Security Groups**:
  - Web tier: HTTP (80) and HTTPS (443) from anywhere
  - App tier: Port 8080 from web tier only
  - Database tier: Port 5432 from app tier only
- **Network ACLs**: Configured with ephemeral port restrictions (32768-65535)
- **VPC Flow Logs**: All traffic logged to S3 with encryption and 7-day retention

### S3 Access

- **S3 VPC Endpoint**: Gateway endpoint allowing private subnet access to S3 without internet routing

## Prerequisites

- Node.js 16+
- Pulumi CLI 3.x
- AWS account with appropriate permissions (VPC, EC2, S3, CloudWatch, IAM)
- AWS credentials configured

## Installation

```bash
npm install
```

## Configuration

The stack uses an `environmentSuffix` parameter for resource naming. This can be set via:

1. Environment variable: `ENVIRONMENT_SUFFIX=dev`
2. Pulumi config: `pulumi config set env dev`
3. Default: `dev`

## Deployment

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Deploy with specific environment
ENVIRONMENT_SUFFIX=prod pulumi up
```

## Outputs

The stack exports the following outputs:

- `vpcId`: VPC ID
- `publicSubnetIds`: Array of public subnet IDs
- `privateSubnetIds`: Array of private subnet IDs
- `databaseSubnetIds`: Array of database subnet IDs
- `natInstanceIds`: Array of NAT instance IDs
- `webSgId`: Web tier security group ID
- `appSgId`: App tier security group ID
- `dbSgId`: Database tier security group ID
- `flowLogsBucketName`: S3 bucket name for VPC Flow Logs

## Resource Tagging

All resources are tagged with:

- `Environment`: production
- `Project`: payment-platform
- `CostCenter`: engineering

## Cost Considerations

This infrastructure uses NAT instances (t3.micro) instead of NAT Gateways, which can save approximately $100-150/month depending on usage. The trade-off is that NAT instances require more management and have lower throughput limits.

## Security Considerations

- Private subnets have no direct internet gateway routes
- Database subnets are completely isolated from internet
- All traffic is logged via VPC Flow Logs
- S3 bucket for flow logs is encrypted with AES256
- Security groups follow principle of least privilege

## Cleanup

```bash
pulumi destroy
```

## Testing

```bash
npm test
```

## Troubleshooting

### NAT Instance Issues

If private subnet instances cannot reach the internet:

1. Verify NAT instance is running: `pulumi stack output natInstanceIds`
2. Check source/destination check is disabled on NAT instances
3. Verify route table associations
4. Check security group rules on NAT instances

### VPC Flow Logs Issues

If flow logs are not appearing in S3:

1. Verify S3 bucket policy allows log delivery
2. Check IAM permissions for flow log service
3. Wait 10-15 minutes for first logs to appear

## License

MIT
```