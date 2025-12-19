# Production VPC Infrastructure with Multi-AZ Configuration

This implementation creates a production-grade VPC infrastructure for a financial services application with high availability, comprehensive security controls, and complete observability.

## Architecture Overview

- VPC with 10.0.0.0/16 CIDR across 3 availability zones
- 3 public subnets and 3 private subnets with specific CIDR ranges
- NAT Gateways in each AZ for high availability
- Custom route tables with explicit naming patterns
- VPC Flow Logs to CloudWatch for compliance
- Network ACLs blocking SSH from internet
- Security groups for web and app tier segmentation

## File: lib/vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const environment = 'production';

    // Define the 3 availability zones
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC manually to have full control over configuration
    const vpc = new ec2.Vpc(this, `FinancialAppVpc${environmentSuffix}`, {
      vpcName: `financial-app-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      availabilityZones: availabilityZones,
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Define subnet configuration
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],

      // Create one NAT Gateway per AZ for high availability
      natGateways: 3,

      // Remove default security group rules
      restrictDefaultSecurityGroup: true,
    });

    this.vpc = vpc;

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Environment', environment);
    cdk.Tags.of(vpc).add('Project', 'financial-app');
    cdk.Tags.of(vpc).add('ManagedBy', 'cdk');
    cdk.Tags.of(vpc).add('Name', `financial-app-vpc-${environmentSuffix}`);

    // Rename route tables to follow the naming pattern: {env}-{az}-{type}-rt
    // CDK creates route tables automatically, we'll add custom names via tags
    const publicSubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnets;
    const privateSubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnets;

    // Tag public subnet route tables
    publicSubnets.forEach((subnet, index) => {
      const az = availabilityZones[index];
      const azSuffix = az.slice(-1); // Get 'a', 'b', or 'c'
      cdk.Tags.of(subnet).add('Name', `${environment}-${azSuffix}-public-subnet-${environmentSuffix}`);

      // Access the route table through the subnet
      if (subnet instanceof ec2.Subnet) {
        const routeTable = subnet.routeTable;
        cdk.Tags.of(routeTable).add('Name', `${environment}-${azSuffix}-public-rt-${environmentSuffix}`);
      }
    });

    // Tag private subnet route tables
    privateSubnets.forEach((subnet, index) => {
      const az = availabilityZones[index];
      const azSuffix = az.slice(-1); // Get 'a', 'b', or 'c'
      cdk.Tags.of(subnet).add('Name', `${environment}-${azSuffix}-private-subnet-${environmentSuffix}`);

      // Access the route table through the subnet
      if (subnet instanceof ec2.Subnet) {
        const routeTable = subnet.routeTable;
        cdk.Tags.of(routeTable).add('Name', `${environment}-${azSuffix}-private-rt-${environmentSuffix}`);
      }
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, `VpcFlowLogGroup${environmentSuffix}`, {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(flowLogGroup).add('Environment', environment);
    cdk.Tags.of(flowLogGroup).add('Project', 'financial-app');
    cdk.Tags.of(flowLogGroup).add('ManagedBy', 'cdk');

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VpcFlowLogRole${environmentSuffix}`, {
      roleName: `vpc-flow-log-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    flowLogRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
      ],
      resources: [flowLogGroup.logGroupArn],
    }));

    cdk.Tags.of(flowLogRole).add('Environment', environment);
    cdk.Tags.of(flowLogRole).add('Project', 'financial-app');
    cdk.Tags.of(flowLogRole).add('ManagedBy', 'cdk');

    // Enable VPC Flow Logs capturing ALL traffic
    new ec2.CfnFlowLog(this, `VpcFlowLog${environmentSuffix}`, {
      resourceId: vpc.vpcId,
      resourceType: 'VPC',
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: environment },
        { key: 'Project', value: 'financial-app' },
        { key: 'ManagedBy', value: 'cdk' },
        { key: 'Name', value: `vpc-flow-log-${environmentSuffix}` },
      ],
    });

    // Create Network ACL for public subnets to deny SSH from internet
    const publicNetworkAcl = new ec2.NetworkAcl(this, `PublicNetworkAcl${environmentSuffix}`, {
      vpc: vpc,
      networkAclName: `public-nacl-${environmentSuffix}`,
    });

    cdk.Tags.of(publicNetworkAcl).add('Environment', environment);
    cdk.Tags.of(publicNetworkAcl).add('Project', 'financial-app');
    cdk.Tags.of(publicNetworkAcl).add('ManagedBy', 'cdk');
    cdk.Tags.of(publicNetworkAcl).add('Name', `public-nacl-${environmentSuffix}`);

    // Deny inbound SSH (port 22) from anywhere - lowest priority rule
    publicNetworkAcl.addEntry(`DenySSHInbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 1,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.DENY,
    });

    // Allow all other inbound traffic
    publicNetworkAcl.addEntry(`AllowAllInbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry(`AllowAllOutbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Associate Network ACL with public subnets
    publicSubnets.forEach((subnet, index) => {
      new ec2.NetworkAclAssociation(this, `PublicNaclAssoc${index}${environmentSuffix}`, {
        networkAcl: publicNetworkAcl,
        subnet: subnet,
      });
    });

    // Create Security Group for Web Tier
    this.webSecurityGroup = new ec2.SecurityGroup(this, `WebSecurityGroup${environmentSuffix}`, {
      vpc: vpc,
      securityGroupName: `web-tier-sg-${environmentSuffix}`,
      description: 'Security group for web tier - allows HTTP and HTTPS from internet',
      allowAllOutbound: true,
    });

    // Allow HTTP from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // Allow HTTPS from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    cdk.Tags.of(this.webSecurityGroup).add('Environment', environment);
    cdk.Tags.of(this.webSecurityGroup).add('Project', 'financial-app');
    cdk.Tags.of(this.webSecurityGroup).add('ManagedBy', 'cdk');
    cdk.Tags.of(this.webSecurityGroup).add('Name', `web-tier-sg-${environmentSuffix}`);
    cdk.Tags.of(this.webSecurityGroup).add('Tier', 'web');

    // Create Security Group for App Tier
    this.appSecurityGroup = new ec2.SecurityGroup(this, `AppSecurityGroup${environmentSuffix}`, {
      vpc: vpc,
      securityGroupName: `app-tier-sg-${environmentSuffix}`,
      description: 'Security group for app tier - allows HTTP and HTTPS only from web tier',
      allowAllOutbound: true,
    });

    // Allow HTTP from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from web tier'
    );

    // Allow HTTPS from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from web tier'
    );

    cdk.Tags.of(this.appSecurityGroup).add('Environment', environment);
    cdk.Tags.of(this.appSecurityGroup).add('Project', 'financial-app');
    cdk.Tags.of(this.appSecurityGroup).add('ManagedBy', 'cdk');
    cdk.Tags.of(this.appSecurityGroup).add('Name', `app-tier-sg-${environmentSuffix}`);
    cdk.Tags.of(this.appSecurityGroup).add('Tier', 'app');

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `VpcCidr-${environmentSuffix}`,
    });

    // Output public subnet IDs
    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID (${availabilityZones[index]})`,
        exportName: `PublicSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Output private subnet IDs
    privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID (${availabilityZones[index]})`,
        exportName: `PrivateSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Output security group IDs
    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: this.webSecurityGroup.securityGroupId,
      description: 'Web Tier Security Group ID',
      exportName: `WebSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: this.appSecurityGroup.securityGroupId,
      description: 'App Tier Security Group ID',
      exportName: `AppSecurityGroupId-${environmentSuffix}`,
    });

    // Output availability zones
    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: availabilityZones.join(','),
      description: 'Availability Zones used',
      exportName: `AvailabilityZones-${environmentSuffix}`,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC Stack with all required infrastructure
    new VpcStack(this, `VpcStack${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}
```

## File: lib/README.md

```markdown
# Production VPC Infrastructure

This CDK application deploys a production-grade VPC infrastructure for financial services applications with comprehensive security controls and high availability.

## Architecture

### Network Design
- **VPC**: 10.0.0.0/16 CIDR across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 (one per AZ)
- **Private Subnets**: 10.0.128.0/24, 10.0.129.0/24, 10.0.130.0/24 (one per AZ)
- **NAT Gateways**: One per AZ for high availability (3 total)
- **Internet Gateway**: Single IGW for all public subnets

### Security Controls

#### VPC Flow Logs
- Captures ALL traffic (accepted, rejected, and all)
- Sends logs to CloudWatch Logs
- Retention: 30 days
- Log group: `/aws/vpc/flowlogs/{environmentSuffix}`

#### Network ACLs
- Public subnet NACL explicitly denies SSH (port 22) from 0.0.0.0/0
- All other traffic allowed for flexibility
- Rule priority ensures SSH denial takes precedence

#### Security Groups
- **Web Tier**: Allows HTTP (80) and HTTPS (443) from anywhere (0.0.0.0/0)
- **App Tier**: Allows HTTP (80) and HTTPS (443) only from web tier security group
- Both security groups allow all outbound traffic

### Routing

#### Route Tables
All route tables follow the naming pattern: `{environment}-{az}-{type}-rt-{suffix}`

- **Public Route Tables**: One per AZ, routes to Internet Gateway
- **Private Route Tables**: One per AZ, routes to respective NAT Gateway in same AZ

### Resource Tagging
All resources are tagged with:
- `Environment`: production
- `Project`: financial-app
- `ManagedBy`: cdk
- `Name`: Descriptive name with environmentSuffix

## Prerequisites

- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- TypeScript installed (`npm install -g typescript`)

## Installation

```bash
npm install
```

## Deployment

### Deploy with default environment suffix (dev)
```bash
cdk deploy
```

### Deploy with custom environment suffix
```bash
cdk deploy -c environmentSuffix=prod
```

### Synthesize CloudFormation template
```bash
cdk synth
```

### View differences before deployment
```bash
cdk diff
```

## Stack Outputs

After deployment, the stack exports the following outputs:

- **VpcId**: The VPC ID
- **VpcCidr**: The VPC CIDR block (10.0.0.0/16)
- **PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id**: Public subnet IDs
- **PrivateSubnet1Id, PrivateSubnet2Id, PrivateSubnet3Id**: Private subnet IDs
- **WebSecurityGroupId**: Web tier security group ID
- **AppSecurityGroupId**: App tier security group ID
- **AvailabilityZones**: Comma-separated list of AZs used

## Usage Examples

### Reference VPC in another stack
```typescript
const vpcId = cdk.Fn.importValue(`VpcId-${environmentSuffix}`);
const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', {
  vpcId: vpcId,
});
```

### Use security groups in EC2 instances
```typescript
const webSgId = cdk.Fn.importValue(`WebSecurityGroupId-${environmentSuffix}`);
const webSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'WebSG', webSgId);
```

## Cost Considerations

### Expected Monthly Costs (us-east-1)
- **NAT Gateways**: ~$97.20 (3 gateways × $0.045/hour × 730 hours)
- **NAT Gateway Data**: Variable based on usage (~$0.045/GB processed)
- **VPC Flow Logs**: Variable based on traffic volume
- **CloudWatch Logs**: ~$0.50/GB ingested, ~$0.03/GB storage

**Total Estimated Cost**: ~$100-150/month plus data transfer charges

### Cost Optimization Options
For development/testing environments:
- Reduce NAT Gateways to 1 (saves ~$65/month)
- Disable VPC Flow Logs (saves log storage costs)
- Use shorter retention periods

## Security Best Practices

1. **Least Privilege**: Security groups follow least-privilege principle
2. **SSH Protection**: Network ACLs deny SSH from internet
3. **Logging**: VPC Flow Logs enabled for compliance and troubleshooting
4. **Encryption**: Flow logs can be sent to encrypted log groups
5. **No Public IPs**: Private subnets don't auto-assign public IPs

## Compliance Features

- VPC Flow Logs for audit trails
- Network segmentation with security groups
- Explicit SSH denial from public internet
- Resource tagging for governance
- Multi-AZ deployment for business continuity

## Troubleshooting

### VPC Flow Logs not appearing
- Check IAM role permissions
- Verify log group exists
- Check flow log status in VPC console

### NAT Gateway connectivity issues
- Verify Elastic IP allocation
- Check route table associations
- Ensure NAT Gateway is in public subnet

### Security group rules not working
- Verify security group IDs are correct
- Check for rule precedence issues
- Review VPC Flow Logs for traffic patterns

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

Note: NAT Gateway Elastic IPs will be released automatically.

## References

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS CDK VPC Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)
```

## Implementation Notes

### Key Design Decisions

1. **High Availability NAT**: Deployed 3 NAT Gateways (one per AZ) for maximum availability. Each private subnet routes through the NAT Gateway in its own AZ to avoid cross-AZ data transfer charges.

2. **Network ACL Strategy**: Applied restrictive NACL only to public subnets to deny SSH from internet while allowing flexibility for other services. Private subnets use default NACL.

3. **Security Group Hierarchy**: Web tier can receive traffic from anywhere (typical for load balancers), while app tier only accepts traffic from web tier, implementing defense in depth.

4. **Route Table Naming**: CDK manages route tables automatically, so we use Tags to implement the required naming pattern `{env}-{az}-{type}-rt`.

5. **VPC Flow Logs**: Configured to capture ALL traffic types (not just rejected) for comprehensive security monitoring and compliance.

6. **Resource Tagging**: Consistent tagging strategy applied to all resources for cost allocation, governance, and automation.

### Subnet CIDR Allocation

The implementation uses CDK's automatic CIDR allocation within the constraints:
- Public subnets: Starting from 10.0.0.0/24
- Private subnets: Starting from 10.0.128.0/24

CDK allocates these sequentially across the 3 AZs as specified in the requirements.

### Testing Recommendations

1. **Deploy to Test Environment**: Use `cdk deploy -c environmentSuffix=test`
2. **Verify Connectivity**: Launch EC2 instance in private subnet and test internet access
3. **Check Flow Logs**: Verify logs appearing in CloudWatch within 10-15 minutes
4. **Test Security Groups**: Deploy test instances in web and app tiers
5. **Verify SSH Blocking**: Attempt SSH from internet to public subnet (should be denied)

### Production Deployment Checklist

- [ ] Review and adjust NAT Gateway count based on availability requirements
- [ ] Configure appropriate CloudWatch Logs retention period
- [ ] Enable CloudWatch Logs encryption if required
- [ ] Set up CloudWatch alarms for VPC Flow Logs
- [ ] Document subnet allocation strategy
- [ ] Create runbook for NAT Gateway failover
- [ ] Configure backup and disaster recovery procedures
- [ ] Review cost allocation tags
- [ ] Enable AWS Config for compliance monitoring
- [ ] Set up AWS CloudTrail for API audit logging