# EC2 Compliance Monitoring System - Implementation

This implementation provides a complete infrastructure compliance monitoring system using Pulumi with TypeScript.

## Architecture Overview

The solution includes:
- VPC with public/private subnets across 2 AZs
- EC2 instances with required tagging
- CloudWatch custom metrics and alarms for compliance monitoring
- Lambda function for automated tag remediation
- Systems Manager integration for inventory collection
- CloudWatch Dashboard for visualization
- Parameter Store for compliance reporting

## File: lib/vpc-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;

  constructor(name: string, args: VpcStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:vpc:VpcStack', name, {}, opts);

    const { environmentSuffix, tags = {} } = args;

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`public-subnet-${i}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azs.names[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `public-subnet-${i}-${environmentSuffix}`,
          Type: 'public',
        },
      }, { parent: this });
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`private-subnet-${i}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs.names[i],
        tags: {
          ...tags,
          Name: `private-subnet-${i}-${environmentSuffix}`,
          Type: 'private',
        },
      }, { parent: this });
      this.privateSubnets.push(subnet);
    }

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(`nat-eip-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        ...tags,
        Name: `nat-eip-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create NAT Gateway in first public subnet
    this.natGateway = new aws.ec2.NatGateway(`nat-gateway-${environmentSuffix}`, {
      subnetId: this.publicSubnets[0].id,
      allocationId: eip.id,
      tags: {
        ...tags,
        Name: `nat-gateway-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `public-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Add route to Internet Gateway
    new aws.ec2.Route(`public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    }, { parent: this });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Create private route table
    const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `private-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Add route to NAT Gateway
    new aws.ec2.Route(`private-route-${environmentSuffix}`, {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    }, { parent: this });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`private-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
    });
  }
}
```

## File: lib/ec2-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Ec2StackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  tags?: { [key: string]: string };
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instances: aws.ec2.Instance[];
  public readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(name: string, args: Ec2StackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:ec2:Ec2Stack', name, {}, opts);

    const { environmentSuffix, vpcId, privateSubnetIds, tags = {} } = args;

    // Create security group for EC2 instances
    this.securityGroup = new aws.ec2.SecurityGroup(`ec2-sg-${environmentSuffix}`, {
      vpcId: vpcId,
      description: 'Security group for compliance-monitored EC2 instances',
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: {
        ...tags,
        Name: `ec2-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [{
        name: 'name',
        values: ['amzn2-ami-hvm-*-x86_64-gp2'],
      }],
    });

    // Create IAM role for EC2 instances (for SSM)
    const ec2Role = new aws.iam.Role(`ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      tags: {
        ...tags,
        Name: `ec2-role-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach SSM managed policy
    new aws.iam.RolePolicyAttachment(`ec2-ssm-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(`ec2-profile-${environmentSuffix}`, {
      role: ec2Role.name,
      tags: {
        ...tags,
        Name: `ec2-profile-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create EC2 instances
    this.instances = [];
    pulumi.output(privateSubnetIds).apply(subnetIds => {
      for (let i = 0; i < 2; i++) {
        const instance = new aws.ec2.Instance(`instance-${i}-${environmentSuffix}`, {
          ami: ami.id,
          instanceType: 't3.micro',
          subnetId: subnetIds[i % subnetIds.length],
          vpcSecurityGroupIds: [this.securityGroup.id],
          iamInstanceProfile: instanceProfile.name,
          tags: {
            ...tags,
            Name: `instance-${i}-${environmentSuffix}`,
            Environment: 'production',
            Owner: 'compliance-team',
            CostCenter: 'engineering',
          },
        }, { parent: this });
        this.instances.push(instance);
      }
    });

    this.registerOutputs({
      instanceIds: pulumi.all(this.instances.map(i => i.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
```

## File: lib/lambda/tag-remediation.py

```python
import json
import boto3
import os
from datetime import datetime

ec2_client = boto3.client('ec2')
ssm_client = boto3.client('ssm')

# Default tag values
DEFAULT_TAGS = {
    'Environment': 'untagged',
    'Owner': 'unknown',
    'CostCenter': 'unassigned'
}

def lambda_handler(event, context):
    """
    Lambda function to remediate missing tags on EC2 instances.
    Triggered by CloudWatch Events when instances are launched or tag compliance issues are detected.
    """

    print(f"Received event: {json.dumps(event)}")

    # Get all instances
    try:
        response = ec2_client.describe_instances()

        remediated_instances = []

        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                existing_tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                # Check for missing required tags
                missing_tags = {}
                for required_tag, default_value in DEFAULT_TAGS.items():
                    if required_tag not in existing_tags:
                        missing_tags[required_tag] = default_value

                # Apply missing tags
                if missing_tags:
                    print(f"Adding missing tags to {instance_id}: {missing_tags}")

                    tags_list = [{'Key': k, 'Value': v} for k, v in missing_tags.items()]
                    ec2_client.create_tags(
                        Resources=[instance_id],
                        Tags=tags_list
                    )

                    remediated_instances.append({
                        'instance_id': instance_id,
                        'tags_added': missing_tags
                    })

        # Store compliance report in Parameter Store
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'remediated_count': len(remediated_instances),
            'instances': remediated_instances
        }

        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        parameter_name = f'/compliance/reports/{environment_suffix}/latest'

        ssm_client.put_parameter(
            Name=parameter_name,
            Value=json.dumps(report),
            Type='String',
            Overwrite=True
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tag remediation completed',
                'remediated_count': len(remediated_instances)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
```

## File: lib/lambda-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly role: aws.iam.Role;

  constructor(name: string, args: LambdaStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:lambda:LambdaStack', name, {}, opts);

    const { environmentSuffix, tags = {} } = args;

    // Create IAM role for Lambda
    this.role = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      tags: {
        ...tags,
        Name: `lambda-role-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // Create custom policy for EC2 and SSM access
    const lambdaPolicy = new aws.iam.Policy(`lambda-policy-${environmentSuffix}`, {
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:CreateTags',
              'ec2:DescribeTags',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ssm:PutParameter',
              'ssm:GetParameter',
            ],
            Resource: `arn:aws:ssm:*:*:parameter/compliance/reports/${environmentSuffix}/*`,
          },
        ],
      }),
      tags: {
        ...tags,
        Name: `lambda-policy-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach custom policy
    new aws.iam.RolePolicyAttachment(`lambda-custom-policy-${environmentSuffix}`, {
      role: this.role.name,
      policyArn: lambdaPolicy.arn,
    }, { parent: this });

    // Read Lambda function code
    const lambdaCode = fs.readFileSync(
      path.join(__dirname, 'lambda', 'tag-remediation.py'),
      'utf-8'
    );

    // Create Lambda function
    this.function = new aws.lambda.Function(`tag-remediation-${environmentSuffix}`, {
      runtime: 'python3.11',
      handler: 'index.lambda_handler',
      role: this.role.arn,
      code: new pulumi.asset.AssetArchive({
        'index.py': new pulumi.asset.StringAsset(lambdaCode),
      }),
      timeout: 60,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      },
      tags: {
        ...tags,
        Name: `tag-remediation-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create CloudWatch Log Group
    new aws.cloudwatch.LogGroup(`lambda-logs-${environmentSuffix}`, {
      name: `/aws/lambda/tag-remediation-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        ...tags,
        Name: `lambda-logs-${environmentSuffix}`,
      },
    }, { parent: this });

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  instanceIds: pulumi.Input<string[]>;
  lambdaFunctionArn: pulumi.Input<string>;
  tags?: { [key: string]: string };
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly complianceAlarm: aws.cloudwatch.MetricAlarm;
  public readonly eventRule: aws.cloudwatch.EventRule;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:monitoring:MonitoringStack', name, {}, opts);

    const { environmentSuffix, instanceIds, lambdaFunctionArn, tags = {} } = args;

    // Create EventBridge rule to trigger Lambda every 5 minutes
    this.eventRule = new aws.cloudwatch.EventRule(`compliance-check-rule-${environmentSuffix}`, {
      description: 'Trigger tag compliance check every 5 minutes',
      scheduleExpression: 'rate(5 minutes)',
      tags: {
        ...tags,
        Name: `compliance-check-rule-${environmentSuffix}`,
      },
    }, { parent: this });

    // Add Lambda permission for EventBridge
    new aws.lambda.Permission(`lambda-eventbridge-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: lambdaFunctionArn,
      principal: 'events.amazonaws.com',
      sourceArn: this.eventRule.arn,
    }, { parent: this });

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(`compliance-check-target-${environmentSuffix}`, {
      rule: this.eventRule.name,
      arn: lambdaFunctionArn,
    }, { parent: this });

    // Create CloudWatch alarm for compliance violations
    this.complianceAlarm = new aws.cloudwatch.MetricAlarm(`compliance-alarm-${environmentSuffix}`, {
      name: `compliance-violations-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'NonCompliantInstances',
      namespace: `Compliance/${environmentSuffix}`,
      period: 300,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'Alert when instances are missing required tags',
      treatMissingData: 'notBreaching',
      tags: {
        ...tags,
        Name: `compliance-alarm-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
      dashboardName: `compliance-${environmentSuffix}`,
      dashboardBody: pulumi.all([instanceIds]).apply(([ids]) => {
        return JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['Compliance/' + environmentSuffix, 'CompliantInstances', { stat: 'Average' }],
                  ['.', 'NonCompliantInstances', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Compliance Status',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['Compliance/' + environmentSuffix, 'CompliancePercentage', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Compliance Percentage',
                yAxis: {
                  left: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
          ],
        });
      }),
    }, { parent: this });

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
      alarmArn: this.complianceAlarm.arn,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { Ec2Stack } from './ec2-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly instanceIds: pulumi.Output<string[]>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC infrastructure
    const vpcStack = new VpcStack('vpc', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create EC2 instances
    const ec2Stack = new Ec2Stack('ec2', {
      environmentSuffix,
      vpcId: vpcStack.vpc.id,
      privateSubnetIds: pulumi.all(vpcStack.privateSubnets.map(s => s.id)),
      tags,
    }, { parent: this });

    // Create Lambda for tag remediation
    const lambdaStack = new LambdaStack('lambda', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create monitoring and compliance dashboard
    const monitoringStack = new MonitoringStack('monitoring', {
      environmentSuffix,
      instanceIds: pulumi.all(ec2Stack.instances.map(i => i.id)),
      lambdaFunctionArn: lambdaStack.function.arn,
      tags,
    }, { parent: this });

    // Set outputs
    this.vpcId = vpcStack.vpc.id;
    this.instanceIds = pulumi.all(ec2Stack.instances.map(i => i.id));
    this.lambdaFunctionArn = lambdaStack.function.arn;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${monitoringStack.dashboard.dashboardName}`;

    this.registerOutputs({
      vpcId: this.vpcId,
      instanceIds: this.instanceIds,
      lambdaFunctionArn: this.lambdaFunctionArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix,
  tags: {
    Project: 'compliance-monitoring',
    ManagedBy: 'pulumi',
  },
});

export const vpcId = stack.vpcId;
export const instanceIds = stack.instanceIds;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const dashboardUrl = stack.dashboardUrl;
```

## File: lib/README.md

```markdown
# EC2 Compliance Monitoring System

This infrastructure provides automated compliance monitoring for EC2 instances with tag validation and remediation.

## Architecture

- **VPC**: Multi-AZ VPC with public and private subnets
- **EC2 Instances**: Monitored instances in private subnets with required tags
- **Lambda Function**: Automated tag remediation triggered every 5 minutes
- **CloudWatch**: Dashboard and alarms for compliance monitoring
- **Systems Manager**: Parameter Store for compliance reports

## Required Tags

All EC2 instances must have:
- Environment
- Owner
- CostCenter

## Deployment

```bash
# Install dependencies
npm install

# Set environment suffix
pulumi config set environmentSuffix dev

# Deploy
pulumi up
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Outputs

- `vpcId`: VPC identifier
- `instanceIds`: List of EC2 instance IDs
- `lambdaFunctionArn`: Tag remediation Lambda function ARN
- `dashboardUrl`: CloudWatch Dashboard URL
```
