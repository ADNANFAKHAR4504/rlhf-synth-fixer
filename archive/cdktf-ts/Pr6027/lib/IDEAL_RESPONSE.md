# Payment Processing VPC Infrastructure - CDKTF TypeScript Implementation

## Overview

This implementation creates a production-ready, PCI DSS-compliant VPC infrastructure for a payment processing platform using CDKTF with TypeScript. The architecture features:

- Multi-tier network segmentation (public, application, database)
- High availability across 3 availability zones
- Cost-optimized NAT instances (instead of NAT Gateways)
- Comprehensive security controls (NACLs, Security Groups)
- Compliance features (VPC Flow Logs, Transit Gateway)
- VPC Endpoints for private AWS service access

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { SecurityConstruct } from './security-construct';
import { EndpointsConstruct } from './endpoints-construct';
import { TransitGatewayConstruct } from './transit-gateway-construct';
import { FlowLogsConstruct } from './flow-logs-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create networking infrastructure (VPC, subnets, routing, NAT instances)
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region: awsRegion,
    });

    // Create security groups with strict ingress/egress rules
    new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      vpcId: networking.vpcId,
    });

    // Create VPC endpoints for S3 and DynamoDB
    new EndpointsConstruct(this, 'Endpoints', {
      environmentSuffix,
      vpcId: networking.vpcId,
      routeTableIds: networking.privateRouteTableIds,
    });

    // Create Transit Gateway for multi-region connectivity
    // Note: Transit Gateway attachments require exactly one subnet per AZ
    new TransitGatewayConstruct(this, 'TransitGateway', {
      environmentSuffix,
      vpcId: networking.vpcId,
      subnetIds: networking.appSubnetIds,
    });

    // Enable VPC Flow Logs with S3 storage
    const flowLogs = new FlowLogsConstruct(this, 'FlowLogs', {
      environmentSuffix,
      vpcId: networking.vpcId,
    });

    // Output key resource identifiers for integration tests
    new TerraformOutput(this, 'VpcId', {
      value: networking.vpcId,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'Region', {
      value: awsRegion,
      description: 'The AWS region',
    });

    new TerraformOutput(this, 'FlowLogsBucketName', {
      value: flowLogs.flowLogsBucketName,
      description: 'The name of the S3 bucket for VPC Flow Logs',
    });
  }
}
```

## File: lib/networking-construct.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { EipAssociation } from '@cdktf/provider-aws/lib/eip-association';

interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly appSubnetIds: string[];
  public readonly dbSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly publicRouteTableId: string;
  public readonly privateRouteTableIds: string[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Availability zones for us-east-1
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    const vpc = new Vpc(this, 'VPC', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'IGW', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Create Public Subnets
    const publicSubnets: Subnet[] = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `PublicSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Public',
        },
      });
      publicSubnets.push(subnet);
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create Private Subnets - Application Tier
    const appSubnets: Subnet[] = [];
    const appSubnetCidrs = ['10.0.16.0/23', '10.0.18.0/23', '10.0.20.0/23'];

    appSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `AppSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-app-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Application',
        },
      });
      appSubnets.push(subnet);
    });

    this.appSubnetIds = appSubnets.map(s => s.id);

    // Create Private Subnets - Database Tier
    const dbSubnets: Subnet[] = [];
    const dbSubnetCidrs = ['10.0.32.0/23', '10.0.34.0/23', '10.0.36.0/23'];

    dbSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `DBSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-db-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
          Tier: 'Database',
        },
      });
      dbSubnets.push(subnet);
    });

    this.dbSubnetIds = dbSubnets.map(s => s.id);
    this.privateSubnetIds = [...this.appSubnetIds, ...this.dbSubnetIds];

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.publicRouteTableId = publicRouteTable.id;

    // Create route to Internet Gateway
    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `PublicRTA${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Get Amazon Linux 2 AMI for NAT instances
    const amiData = new DataAwsAmi(this, 'AmazonLinux2AMI', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create NAT Instance Security Group
    const natSecurityGroup = new SecurityGroup(this, 'NATSecurityGroup', {
      name: `payment-nat-sg-${environmentSuffix}`,
      description: 'Security group for NAT instances',
      vpcId: vpc.id,
      tags: {
        Name: `payment-nat-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Allow HTTP/HTTPS from private subnets
    new SecurityGroupRule(this, 'NATIngressHTTP', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: natSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'NATIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: natSecurityGroup.id,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'NATEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: natSecurityGroup.id,
    });

    // Create NAT instances and private route tables
    const natInstances: Instance[] = [];
    const privateRouteTables: RouteTable[] = [];

    publicSubnets.forEach((subnet, index) => {
      // Create Elastic IP for NAT instance
      const eip = new Eip(this, `NATEIP${index + 1}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      });

      // Create NAT instance
      const natInstance = new Instance(this, `NATInstance${index + 1}`, {
        ami: amiData.id,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [natSecurityGroup.id],
        sourceDestCheck: false,
        userData: `#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
yum install -y iptables-services
service iptables save
`,
        tags: {
          Name: `payment-nat-instance-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      });

      natInstances.push(natInstance);

      // Associate EIP with NAT instance
      new EipAssociation(this, `NATEIPAssoc${index + 1}`, {
        instanceId: natInstance.id,
        allocationId: eip.id,
      });

      // Create private route table for this AZ
      const privateRouteTable = new RouteTable(
        this,
        `PrivateRouteTable${index + 1}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `payment-private-rt-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
            Project: 'PaymentProcessing',
            CostCenter: 'FinTech',
          },
        }
      );

      privateRouteTables.push(privateRouteTable);

      // Create route to NAT instance
      new Route(this, `PrivateRoute${index + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        networkInterfaceId: natInstance.primaryNetworkInterfaceId,
      });

      // Associate app subnet with private route table
      new RouteTableAssociation(this, `AppRTA${index + 1}`, {
        subnetId: appSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });

      // Associate db subnet with private route table
      new RouteTableAssociation(this, `DBRTA${index + 1}`, {
        subnetId: dbSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.privateRouteTableIds = privateRouteTables.map(rt => rt.id);

    // Create Network ACL for public subnets
    const publicNacl = new NetworkAcl(this, 'PublicNACL', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-nacl-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // NACL rules for public subnets
    // Ingress: Allow HTTPS (443)
    new NetworkAclRule(this, 'NACLIngressHTTPS', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: false,
    });

    // Ingress: Allow ephemeral ports
    new NetworkAclRule(this, 'NACLIngressEphemeral', {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });

    // Egress: Allow HTTPS
    new NetworkAclRule(this, 'NACLEgressHTTPS', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    // Egress: Allow ephemeral ports
    new NetworkAclRule(this, 'NACLEgressEphemeral', {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: true,
    });

    // Associate NACL with public subnets
    publicSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `PublicNACLAssoc${index + 1}`, {
        networkAclId: publicNacl.id,
        subnetId: subnet.id,
      });
    });
  }
}
```

## File: lib/security-construct.ts

```typescript
import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

interface SecurityConstructProps {
  environmentSuffix: string;
  vpcId: string;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroupId: string;
  public readonly appSecurityGroupId: string;
  public readonly dbSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId } = props;

    // Web Tier Security Group
    const webSG = new SecurityGroup(this, 'WebSG', {
      name: `payment-web-sg-${environmentSuffix}`,
      description: 'Security group for web tier',
      vpcId: vpcId,
      tags: {
        Name: `payment-web-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Web',
      },
    });

    this.webSecurityGroupId = webSG.id;

    // Allow HTTPS from internet
    new SecurityGroupRule(this, 'WebIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSG.id,
      description: 'Allow HTTPS from internet',
    });

    // Allow HTTP from internet
    new SecurityGroupRule(this, 'WebIngressHTTP', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSG.id,
      description: 'Allow HTTP from internet',
    });

    // Allow all outbound
    new SecurityGroupRule(this, 'WebEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSG.id,
    });

    // Application Tier Security Group
    const appSG = new SecurityGroup(this, 'AppSG', {
      name: `payment-app-sg-${environmentSuffix}`,
      description: 'Security group for application tier',
      vpcId: vpcId,
      tags: {
        Name: `payment-app-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Application',
      },
    });

    this.appSecurityGroupId = appSG.id;

    // Allow traffic from web tier
    new SecurityGroupRule(this, 'AppIngressFromWeb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSG.id,
      securityGroupId: appSG.id,
      description: 'Allow traffic from web tier',
    });

    // Allow all outbound
    new SecurityGroupRule(this, 'AppEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSG.id,
    });

    // Database Tier Security Group
    const dbSG = new SecurityGroup(this, 'DBSG', {
      name: `payment-db-sg-${environmentSuffix}`,
      description: 'Security group for database tier',
      vpcId: vpcId,
      tags: {
        Name: `payment-db-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Database',
      },
    });

    this.dbSecurityGroupId = dbSG.id;

    // Allow PostgreSQL from app tier
    new SecurityGroupRule(this, 'DBIngressPostgreSQL', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSG.id,
      securityGroupId: dbSG.id,
      description: 'Allow PostgreSQL from app tier',
    });

    // Allow all outbound
    new SecurityGroupRule(this, 'DBEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSG.id,
    });
  }
}
```

## File: lib/endpoints-construct.ts

```typescript
import { Construct } from 'constructs';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';

interface EndpointsConstructProps {
  environmentSuffix: string;
  vpcId: string;
  routeTableIds: string[];
}

export class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EndpointsConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId, routeTableIds } = props;

    // S3 VPC Endpoint (Gateway type)
    new VpcEndpoint(this, 'S3Endpoint', {
      vpcId: vpcId,
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: routeTableIds,
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // DynamoDB VPC Endpoint (Gateway type)
    new VpcEndpoint(this, 'DynamoDBEndpoint', {
      vpcId: vpcId,
      serviceName: 'com.amazonaws.us-east-1.dynamodb',
      vpcEndpointType: 'Gateway',
      routeTableIds: routeTableIds,
      tags: {
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });
  }
}
```

## File: lib/transit-gateway-construct.ts

```typescript
import { Construct } from 'constructs';
import { Ec2TransitGateway } from '@cdktf/provider-aws/lib/ec2-transit-gateway';
import { Ec2TransitGatewayVpcAttachment } from '@cdktf/provider-aws/lib/ec2-transit-gateway-vpc-attachment';

interface TransitGatewayConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
}

export class TransitGatewayConstruct extends Construct {
  public readonly transitGatewayId: string;
  public readonly vpcAttachmentId: string;

  constructor(
    scope: Construct,
    id: string,
    props: TransitGatewayConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, vpcId, subnetIds } = props;

    // Create Transit Gateway
    const transitGateway = new Ec2TransitGateway(this, 'TransitGateway', {
      description: 'Transit Gateway for multi-region connectivity',
      amazonSideAsn: 64512,
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: {
        Name: `payment-tgw-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.transitGatewayId = transitGateway.id;

    // Attach VPC to Transit Gateway
    const vpcAttachment = new Ec2TransitGatewayVpcAttachment(
      this,
      'VPCAttachment',
      {
        transitGatewayId: transitGateway.id,
        vpcId: vpcId,
        subnetIds: subnetIds,
        dnsSupport: 'enable',
        ipv6Support: 'disable',
        tags: {
          Name: `payment-tgw-attachment-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      }
    );

    this.vpcAttachmentId = vpcAttachment.id;
  }
}
```

## File: lib/flow-logs-construct.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

interface FlowLogsConstructProps {
  environmentSuffix: string;
  vpcId: string;
}

export class FlowLogsConstruct extends Construct {
  public readonly flowLogsBucketName: string;
  public readonly flowLogId: string;

  constructor(scope: Construct, id: string, props: FlowLogsConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId } = props;

    // Create S3 bucket for VPC Flow Logs
    const flowLogsBucket = new S3Bucket(this, 'FlowLogsBucket', {
      bucket: `payment-flow-logs-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `payment-flow-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.flowLogsBucketName = flowLogsBucket.bucket;

    // Block public access to flow logs bucket
    new S3BucketPublicAccessBlock(this, 'FlowLogsBucketPublicAccessBlock', {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'FlowLogsBucketEncryption',
      {
        bucket: flowLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Configure lifecycle policy for 90-day retention
    new S3BucketLifecycleConfiguration(this, 'FlowLogsBucketLifecycle', {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: 'delete-old-logs',
          status: 'Enabled',
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new IamRole(this, 'FlowLogsRole', {
      name: `payment-flow-logs-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `payment-flow-logs-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Create IAM policy for flow logs to write to S3
    new IamRolePolicy(this, 'FlowLogsPolicy', {
      name: `payment-flow-logs-policy-${environmentSuffix}`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetBucketLocation', 's3:ListBucket'],
            Resource: [flowLogsBucket.arn, `${flowLogsBucket.arn}/*`],
          },
        ],
      }),
    });

    // Create VPC Flow Log
    const flowLog = new FlowLog(this, 'VPCFlowLog', {
      vpcId: vpcId,
      trafficType: 'ALL',
      logDestinationType: 's3',
      logDestination: flowLogsBucket.arn,
      tags: {
        Name: `payment-flow-log-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.flowLogId = flowLog.id;
  }
}
```

## Architecture Highlights

### 1. Modular Construct Design
- Each construct is self-contained and reusable
- Clear separation of concerns (networking, security, endpoints, etc.)
- Easy to test and maintain

### 2. Security Best Practices
- Multi-tier security groups with least privilege
- Network ACLs for additional layer of defense
- VPC Flow Logs for audit and compliance
- Encrypted S3 bucket for flow logs
- Private subnets for application and database tiers

### 3. High Availability
- Resources distributed across 3 availability zones
- Independent NAT instances per AZ
- Transit Gateway ready for multi-region expansion

### 4. Cost Optimization
- NAT instances instead of NAT Gateways (~75% cost savings)
- Gateway VPC endpoints for S3 and DynamoDB (no data transfer charges)
- Lifecycle policies for automatic log cleanup

### 5. Compliance Features
- VPC Flow Logs with 90-day retention
- Comprehensive tagging strategy
- Transit Gateway for future regulatory requirements
- Encrypted state files and flow logs
