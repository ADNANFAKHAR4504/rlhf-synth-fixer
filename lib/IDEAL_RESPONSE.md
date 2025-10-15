```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const region = 'us-east-2';
    new AwsProvider(this, 'aws', { region, alias: 'us-east-2' }); // Added alias for clarity
    new RandomProvider(this, 'random');

    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const commonTags = { Project: 'iac-rlhf-amazon' };

    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: `vpc-${randomSuffix}` },
    });

    const publicSubnetA = new Subnet(this, 'PublicSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: `public-a-${randomSuffix}` },
    });

    const publicSubnetB = new Subnet(this, 'PublicSubnetB', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: `public-b-${randomSuffix}` },
    });

    const privateSubnetA = new Subnet(this, 'PrivateSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `${region}a`,
      tags: { ...commonTags, Name: `private-a-${randomSuffix}` },
    });

    const privateSubnetB = new Subnet(this, 'PrivateSubnetB', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${region}b`,
      tags: { ...commonTags, Name: `private-b-${randomSuffix}` },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: `igw-${randomSuffix}` },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...commonTags, Name: `public-rt-${randomSuffix}` },
    });

    new RouteTableAssociation(this, 'RtAssocPubA', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });
    new RouteTableAssociation(this, 'RtAssocPubB', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    const albSg = new SecurityGroup(this, 'AlbSg', {
      name: `alb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: commonTags,
    });

    const ecsSg = new SecurityGroup(this, 'EcsSg', {
      name: `ecs-sg-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: commonTags,
    });

    const dbSg = new SecurityGroup(this, 'DbSg', {
      name: `db-sg-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [ecsSg.id],
        },
      ],
      tags: commonTags,
    });

    const alb = new Lb(this, 'Alb', {
      name: `app-lb-${randomSuffix}`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [albSg.id],
      subnets: [publicSubnetA.id, publicSubnetB.id],
      tags: commonTags,
    });

    const targetGroup = new LbTargetGroup(this, 'TargetGroup', {
      name: `app-tg-${randomSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      tags: commonTags,
    });

    const listener = new LbListener(this, 'Listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
    });

    const cluster = new EcsCluster(this, 'EcsCluster', {
      name: `app-cluster-${randomSuffix}`,
      tags: commonTags,
    });

    const ecsTaskExecutionRole = new IamRole(this, 'EcsTaskExecutionRole', {
      name: `ecs-exec-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'EcsExecAttach1', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    const taskDef = new EcsTaskDefinition(this, 'TaskDef', {
      family: `app-task-${randomSuffix}`,
      cpu: '256',
      memory: '512',
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      executionRoleArn: ecsTaskExecutionRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'app',
          image: 'public.ecr.aws/l6m2t8p7/amazon-ecs-sample:latest',
          portMappings: [{ containerPort: 80 }],
        },
      ]),
      tags: commonTags,
    });

    const ecsService = new EcsService(this, 'EcsService', {
      name: `app-service-${randomSuffix}`,
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [publicSubnetA.id, publicSubnetB.id],
        securityGroups: [ecsSg.id],
        assignPublicIp: true,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'app',
          containerPort: 80,
        },
      ],
      dependsOn: [listener, targetGroup],
    });

    const sessionTable = new DynamodbTable(this, 'SessionStateTable', {
      name: `app-sessions-${randomSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'sessionId',
      attribute: [{ name: 'sessionId', type: 'S' }],
      tags: commonTags,
    });

    const dbPassword = new Password(this, 'DbPassword', {
      length: 16,
      special: true,
      overrideSpecial: '_-!#%.',
    });

    const dbSecret = new SecretsmanagerSecret(this, 'DbSecret', {
      name: `aurora-master-secret-${randomSuffix}`,
      description: 'Aurora master password for app (auto-generated)',
      tags: commonTags,
    });

    new SecretsmanagerSecretVersion(this, 'DbSecretVersion', {
      secretId: dbSecret.id,
      secretString: dbPassword.result,
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `app-db-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
      tags: commonTags,
    });

    const masterUsername = 'dbadmin';

    const dbCluster = new RdsCluster(this, 'RegionalDbCluster', {
      clusterIdentifier: `app-db-${randomSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '13.9',
      masterUsername,
      masterPassword: dbPassword.result,
      databaseName: 'appdb',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSg.id],
      skipFinalSnapshot: true,
      tags: commonTags,
    });

    const dbInstanceA = new RdsClusterInstance(this, 'DbInstanceA', {
      clusterIdentifier: dbCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      availabilityZone: `${region}a`,
    });

    new RdsClusterInstance(this, 'DbInstanceB', {
      clusterIdentifier: dbCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      availabilityZone: `${region}b`,
    });

    new CloudwatchMetricAlarm(this, 'DbCpuAlarm', {
      alarmName: `AuroraCPUHigh-${randomSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 5,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'Trigger when DB CPU utilization > 70% for 5 minutes',
      dimensions: { DBInstanceIdentifier: dbInstanceA.identifier },
      tags: commonTags,
    });

    new Route53HealthCheck(this, 'AlbHealthCheck', {
      fqdn: alb.dnsName,
      port: 80,
      type: 'HTTP',
      failureThreshold: 3,
      requestInterval: 10,
    });

    new TerraformOutput(this, 'ApplicationEndpoint', {
      value: `http://${alb.dnsName}`,
    });
    new TerraformOutput(this, 'DbClusterIdentifier', {
      value: dbCluster.clusterIdentifier,
    });
    // Outputs added for robust integration testing
    new TerraformOutput(this, 'DynamoDbTableName', {
      value: sessionTable.name,
    });
    new TerraformOutput(this, 'EcsClusterName', { value: cluster.name });
    new TerraformOutput(this, 'EcsServiceName', { value: ecsService.name });
  }
}
```
