# IDEAL_RESPONSE.md - AWS CDK TypeScript VPC Infrastructure

This document contains the final, corrected implementation for the payment processing VPC infrastructure.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly flowLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Mandatory tags
    const mandatoryTags = {
      Environment: 'production',
      Project: 'payment-processor',
      CostCenter: 'engineering',
    };

    // Create S3 bucket for VPC Flow Logs
    this.flowLogBucket = new s3.Bucket(
      this,
      `FlowLogBucket${environmentSuffix}`,
      {
        bucketName: `vpc-flow-logs-${environmentSuffix}-${this.account}-${this.region}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Apply tags to bucket
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.flowLogBucket).add(key, value);
    });

    // Create VPC with specific configuration
    this.vpc = new ec2.Vpc(this, `PaymentVPC${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // One NAT Gateway to save costs and EIP addresses
    });

    // Apply tags to VPC
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // Create VPC Flow Logs to S3
    new ec2.FlowLog(this, `VPCFlowLog${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toS3(this.flowLogBucket),
      trafficType: ec2.FlowLogTrafficType.ALL,
      flowLogName: `vpc-flow-log-${environmentSuffix}`,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Add S3 Gateway Endpoint
    this.vpc.addGatewayEndpoint(`S3Endpoint${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: this.vpc.privateSubnets,
        },
      ],
    });

    // Add DynamoDB Gateway Endpoint
    this.vpc.addGatewayEndpoint(`DynamoDBEndpoint${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnets: this.vpc.privateSubnets,
        },
      ],
    });

    // Create ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    // Add ingress rules for ALB (HTTP and HTTPS)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Apply tags to ALB security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.albSecurityGroup).add(key, value);
    });

    // Create ECS Security Group
    this.ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `ECSSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `ecs-sg-${environmentSuffix}`,
        description: 'Security group for ECS Fargate containers',
        allowAllOutbound: true,
      }
    );

    // Add ingress rule for ECS (only from ALB)
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB on port 8080'
    );

    // Apply tags to ECS security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.ecsSecurityGroup).add(key, value);
    });

    // Create RDS Security Group
    this.rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `rds-sg-${environmentSuffix}`,
        description: 'Security group for RDS Aurora PostgreSQL',
        allowAllOutbound: false,
      }
    );

    // Add ingress rule for RDS (only from ECS)
    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from ECS containers'
    );

    // Apply tags to RDS security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.rdsSecurityGroup).add(key, value);
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `PrivateSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: this.albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `ALBSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ECSSecurityGroupId', {
      value: this.ecsSecurityGroup.securityGroupId,
      description: 'ECS Security Group ID',
      exportName: `ECSSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RDSSecurityGroupId', {
      value: this.rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
      exportName: `RDSSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FlowLogBucketName', {
      value: this.flowLogBucket.bucketName,
      description: 'S3 Bucket for VPC Flow Logs',
      exportName: `FlowLogBucketName-${environmentSuffix}`,
    });
  }
}
```

## File: test/tap-stack.int.test.ts

```typescript
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-2';

const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });

async function getStackOutputs(): Promise<Record<string, string>> {
  const response = await cfnClient.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = response.Stacks?.[0];
  if (!stack || !stack.Outputs) {
    throw new Error(`Stack ${stackName} not found or has no outputs`);
  }

  const outputs: Record<string, string> = {};
  for (const output of stack.Outputs) {
    if (output.OutputKey && output.OutputValue) {
      outputs[output.OutputKey] = output.OutputValue;
    }
  }

  return outputs;
}

let outputs: Record<string, string>;

describe('Payment Processing VPC Integration Tests', () => {
  beforeAll(async () => {
    outputs = await getStackOutputs();
  }, 30000);

  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');

      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('VPC has mandatory tags', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(
        tags.map((tag) => [tag.Key, tag.Value])
      );

      expect(tagMap['Environment']).toBe('production');
      expect(tagMap['Project']).toBe('payment-processor');
      expect(tagMap['CostCenter']).toBe('engineering');
    });
  });

  describe('Subnet Configuration', () => {
    test('public subnets exist and are configured correctly', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets exist and are configured correctly', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets span 3 availability zones', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const availabilityZones = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );

      expect(availabilityZones.size).toBe(3);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateway exists in public subnet', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      response.NatGateways!.forEach((natGateway) => {
        expect(publicSubnetIds).toContain(natGateway.SubnetId);
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS traffic', async () => {
      const sgId = outputs.ALBSecurityGroupId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const httpRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('ECS security group allows traffic from ALB on port 8080', async () => {
      const sgId = outputs.ECSSecurityGroupId;
      const albSgId = outputs.ALBSecurityGroupId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const ecsRule = sg.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 8080 &&
          rule.ToPort === 8080 &&
          rule.UserIdGroupPairs?.some((pair) => pair.GroupId === albSgId)
      );

      expect(ecsRule).toBeDefined();
    });

    test('RDS security group allows traffic from ECS on port 5432', async () => {
      const sgId = outputs.RDSSecurityGroupId;
      const ecsSgId = outputs.ECSSecurityGroupId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const rdsRule = sg.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.UserIdGroupPairs?.some((pair) => pair.GroupId === ecsSgId)
      );

      expect(rdsRule).toBeDefined();
    });

    test('all security groups have mandatory tags', async () => {
      const sgIds = [
        outputs.ALBSecurityGroupId,
        outputs.ECSSecurityGroupId,
        outputs.RDSSecurityGroupId,
      ];

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );

      response.SecurityGroups!.forEach((sg) => {
        const tags = sg.Tags || [];
        const tagMap = Object.fromEntries(
          tags.map((tag) => [tag.Key, tag.Value])
        );

        expect(tagMap['Environment']).toBe('production');
        expect(tagMap['Project']).toBe('payment-processor');
        expect(tagMap['CostCenter']).toBe('engineering');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs are enabled', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
      );

      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.MaxAggregationInterval).toBe(60);
    });

    test('Flow Log S3 bucket exists', async () => {
      const bucketName = outputs.FlowLogBucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });
  });

  describe('VPC Endpoints', () => {
    test('S3 VPC endpoint exists', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'service-name', Values: [`com.amazonaws.${region}.s3`] },
          ],
        })
      );

      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
      expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
    });

    test('DynamoDB VPC endpoint exists', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.dynamodb`],
            },
          ],
        })
      );

      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
      expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
    });
  });
});
```

## Implementation Summary

This implementation creates a production-ready VPC infrastructure with the following components:

### Infrastructure Components

1. **VPC**: CIDR 10.0.0.0/16 spanning 3 availability zones with DNS enabled
2. **Subnets**: 3 public and 3 private subnets distributed across AZs
3. **NAT Gateway**: 1 NAT Gateway for cost optimization and EIP conservation
4. **Security Groups**: ALB, ECS, and RDS with least-privilege rules
5. **VPC Flow Logs**: All traffic logged to S3 with 1-minute aggregation
6. **VPC Endpoints**: S3 and DynamoDB Gateway Endpoints

### Integration Tests

Integration tests dynamically discover deployed resources via CloudFormation API with no file dependencies, supporting multi-region deployments.

### Key Corrections from MODEL_RESPONSE

1. **NAT Gateway Optimization**: Reduced from 3 to 1 to avoid AWS EIP limits
2. **Dynamic Stack Discovery**: Implemented CloudFormation-based discovery instead of file-based
3. **Region Flexibility**: Tests adapt to any AWS region via environment variable
4. **Clean Imports**: Removed unused iam import
