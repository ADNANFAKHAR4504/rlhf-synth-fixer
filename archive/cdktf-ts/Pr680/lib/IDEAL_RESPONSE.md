# CDKTF TypeScript Infrastructure Solution

## lib/tap-stack.ts

```typescript
// lib/tap-stack.ts
// This file defines a complete, highly available AWS infrastructure stack using CDKTF.

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route'; // Corrected: Added missing import
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';

// Define the properties for the stack, now requiring allowedIngressCidrBlocks
export interface TapStackProps {
  awsRegion: string;
  vpcCidr?: string;
  allowedIngressCidrBlocks: string[];
  tags?: { [key: string]: string };
}

export class TapStack extends TerraformStack {
  public readonly vpcId: string;
  public readonly securityGroupId: string;
  public readonly s3BucketName: string;
  public readonly kmsKeyArn: string;
  public readonly asgName: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const {
      awsRegion,
      vpcCidr = '10.0.0.0/16',
      allowedIngressCidrBlocks,
      tags = {},
    } = props;

    // 1. AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
    });

    // 2. VPC and Subnets
    const availabilityZones = new DataAwsAvailabilityZones(
      this,
      'available-zones',
      {
        state: 'available',
      }
    );

    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      tags: { Name: `${id}-vpc`, ...tags },
    });
    this.vpcId = vpc.id;

    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    // Fixed: Use Fn.element to correctly access the token list
    // Fixed: Changed loop condition to create 3 availability zones
    for (let index = 0; index < 3; index++) {
      const zone = Fn.element(availabilityZones.names, index);
      publicSubnets.push(
        new Subnet(this, `public-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index * 2}.0/24`,
          mapPublicIpOnLaunch: true,
          availabilityZone: zone,
          tags: { Name: `${id}-public-subnet-${index}`, ...tags },
        })
      );

      privateSubnets.push(
        new Subnet(this, `private-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index * 2 + 1}.0/24`,
          availabilityZone: zone,
          tags: { Name: `${id}-private-subnet-${index}`, ...tags },
        })
      );
    }

    // 3. Internet Gateway and NAT Gateways for high availability
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `${id}-igw`, ...tags },
    });

    const natGateways: NatGateway[] = [];
    const natGatewayEips: Eip[] = [];
    publicSubnets.forEach((subnet, index) => {
      const natGatewayEip = new Eip(this, `nat-gateway-eip-${index}`, {
        tags: { Name: `${id}-nat-gateway-eip-${index}`, ...tags },
      });
      natGatewayEips.push(natGatewayEip);

      natGateways.push(
        new NatGateway(this, `nat-gateway-${index}`, {
          allocationId: natGatewayEip.id,
          subnetId: subnet.id,
          tags: { Name: `${id}-nat-gateway-${index}`, ...tags },
        })
      );
    });

    // 4. Route Tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: { Name: `${id}-public-route-table`, ...tags },
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `public-route-table-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    new Route(this, 'public-internet-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: vpc.id,
          tags: { Name: `${id}-private-route-table-${index}`, ...tags },
        }
      );
      new RouteTableAssociation(
        this,
        `private-route-table-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );

      new Route(this, `private-internet-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });
    });

    // 5. Security Group for web servers (requires explicit CIDR)
    const securityGroup = new SecurityGroup(this, 'web-sg', {
      vpcId: vpc.id,
      name: `${id}-web-sg`,
      description: 'Security group for web instances',
      tags: { Name: `${id}-web-sg`, ...tags },
    });
    this.securityGroupId = securityGroup.id;

    new SecurityGroupRule(this, 'http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: allowedIngressCidrBlocks, // Now explicitly required
      securityGroupId: securityGroup.id,
    });

    new SecurityGroupRule(this, 'ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: allowedIngressCidrBlocks, // Now explicitly required
      securityGroupId: securityGroup.id,
    });

    new SecurityGroupRule(this, 'all-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1', // All protocols
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: securityGroup.id,
    });

    // 6. S3 Encryption with a Customer-Managed KMS Key
    const kmsKey = new KmsKey(this, 's3-kms-key', {
      description: `KMS key for S3 bucket ${id}`,
      enableKeyRotation: true,
      tags: { Name: `${id}-s3-kms-key`, ...tags },
    });
    this.kmsKeyArn = kmsKey.arn;

    const s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `${id}-my-web-bucket`,
      // Fixed: The structure was corrected to match the CDKTF type definition.
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKey.arn,
            sseAlgorithm: 'aws:kms',
          },
        },
      },
      tags: { Name: `${id}-s3-bucket`, ...tags },
    });
    this.s3BucketName = s3Bucket.id;

    // 7. IAM Role, Policy, and Instance Profile
    const iamRole = new IamRole(this, 'iam-role', {
      name: `${id}-iam-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: { Name: `${id}-iam-role`, ...tags },
    });

    const s3Policy = new IamPolicy(this, 's3-policy', {
      name: `${id}-s3-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject', 's3:ListBucket'],
            Effect: 'Allow',
            Resource: [s3Bucket.arn, `${s3Bucket.arn}/*`],
          },
        ],
      }),
      tags: { Name: `${id}-s3-policy`, ...tags },
    });

    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: iamRole.name,
      policyArn: s3Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${id}-instance-profile`,
      role: iamRole.name,
    });

    // 8. Launch Template and Auto Scaling Group
    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${id}-launch-template`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: { name: instanceProfile.name },
      tags: { Name: `${id}-launch-template`, ...tags },
    });

    const webAsg = new AutoscalingGroup(this, 'web-asg', {
      name: `${id}-web-asg`,
      launchTemplate: {
        id: launchTemplate.id,
        version: `${launchTemplate.latestVersion}`,
      },
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      tag: [
        {
          key: 'Name',
          value: `${id}-web-instance`,
          propagateAtLaunch: true,
        },
      ],
    });
    this.asgName = webAsg.name;

    // 9. Monitoring
    // No longer assigning to a variable as it's not used later
    new CloudwatchLogGroup(this, 'log-group', {
      name: `/${id}/web-server`,
      retentionInDays: 7,
      tags: { Name: `${id}-log-group`, ...tags },
    });

    // CloudWatch alarm for ASG CPU Utilization
    // No longer assigning to a variable as it's not used later
    new CloudwatchMetricAlarm(this, 'asg-cpu-alarm', {
      alarmName: `${id}-asg-cpu-utilization`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        AutoScalingGroupName: webAsg.name,
      },
      alarmDescription: 'Alarms when ASG CPU utilization is high',
    });

    // CloudWatch alarms for NAT Gateway port allocation errors
    const natGatewayAlarms: CloudwatchMetricAlarm[] = [];
    natGateways.forEach((nat, index) => {
      natGatewayAlarms.push(
        new CloudwatchMetricAlarm(this, `nat-gateway-error-alarm-${index}`, {
          alarmName: `${id}-nat-gateway-error-alarm-${index}`,
          comparisonOperator: 'GreaterThanOrEqualToThreshold',
          evaluationPeriods: 1,
          metricName: 'ErrorPortAllocation',
          namespace: 'AWS/NATGateway',
          period: 60,
          statistic: 'Sum',
          threshold: 1,
          dimensions: {
            NatGatewayId: nat.id,
          },
          alarmDescription: `Alarms when NAT Gateway ${index} has port allocation errors`,
        })
      );
    });

    // CloudWatch Dashboard for overall observability
    new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `${id}-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                [
                  'AWS/EC2',
                  'CPUUtilization',
                  'AutoScalingGroupName',
                  webAsg.name,
                ],
              ],
              view: 'timeSeries',
              stacked: false,
              region: awsRegion,
              title: 'ASG CPU Utilization',
              yAxis: {
                left: {
                  label: 'CPU (%)',
                  showUnits: false,
                },
              },
            },
          },
          ...natGateways.map((nat, index) => ({
            type: 'metric',
            x: 12,
            y: index * 6,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                [
                  'AWS/NATGateway',
                  'ErrorPortAllocation',
                  'NatGatewayId',
                  nat.id,
                  {
                    stat: 'Sum',
                    period: 60,
                    label: `NatGateway-${index} Port Allocation Errors`,
                  },
                ],
              ],
              view: 'timeSeries',
              stacked: false,
              region: awsRegion,
              title: `NAT Gateway ${index} Port Allocation Errors`,
              yAxis: {
                left: {
                  label: 'Errors',
                  showUnits: false,
                },
              },
            },
          })),
        ],
      }),
      // Removed: CloudwatchDashboard resource does not support the `tags` property directly
    });

    // 10. Outputs
    new TerraformOutput(this, 'vpc_id_output', {
      value: vpc.id,
      description: 'The ID of the created VPC',
    });

    new TerraformOutput(this, 'private_subnet_ids_output', {
      value: privateSubnets.map(s => s.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'public_subnet_ids_output', {
      value: publicSubnets.map(s => s.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'security_group_id', {
      value: securityGroup.id,
      description: 'The ID of the web security group',
    });
  }
}
```
