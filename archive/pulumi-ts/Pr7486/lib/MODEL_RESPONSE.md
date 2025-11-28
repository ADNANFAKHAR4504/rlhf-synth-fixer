# Multi-Region Disaster Recovery Infrastructure

Complete Pulumi TypeScript implementation for multi-region DR infrastructure.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly drVpcId: pulumi.Output<string>;
  public readonly auroraGlobalClusterId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const baseTags = {
      Environment: 'Production',
      DisasterRecovery: 'Enabled',
      ...(args.tags || {}),
    };

    // Providers
    const primaryProvider = new aws.Provider(`primary-${environmentSuffix}`, {
      region: 'us-east-1',
    }, { parent: this });

    const drProvider = new aws.Provider(`dr-${environmentSuffix}`, {
      region: 'us-west-2',
    }, { parent: this });

    // KMS Keys
    const primaryKmsKey = new aws.kms.Key(`primary-kms-${environmentSuffix}`, {
      description: `Primary KMS key ${environmentSuffix}`,
      deletionWindowInDays: 7,
      tags: { ...baseTags, Name: `primary-kms-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drKmsKey = new aws.kms.Key(`dr-kms-${environmentSuffix}`, {
      description: `DR KMS key ${environmentSuffix}`,
      deletionWindowInDays: 7,
      tags: { ...baseTags, Name: `dr-kms-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // VPCs
    const primaryVpc = new aws.ec2.Vpc(`primary-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...baseTags, Name: `primary-vpc-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drVpc = new aws.ec2.Vpc(`dr-vpc-${environmentSuffix}`, {
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...baseTags, Name: `dr-vpc-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // Subnets - Primary
    const primaryPublicSubnets: aws.ec2.Subnet[] = [];
    const primaryPrivateSubnets: aws.ec2.Subnet[] = [];
    const primaryAzs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    primaryAzs.forEach((az, i) => {
      primaryPublicSubnets.push(new aws.ec2.Subnet(`primary-pub-${i}-${environmentSuffix}`, {
        vpcId: primaryVpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { ...baseTags, Name: `primary-pub-${i}-${environmentSuffix}` },
      }, { provider: primaryProvider, parent: this }));

      primaryPrivateSubnets.push(new aws.ec2.Subnet(`primary-priv-${i}-${environmentSuffix}`, {
        vpcId: primaryVpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: az,
        tags: { ...baseTags, Name: `primary-priv-${i}-${environmentSuffix}` },
      }, { provider: primaryProvider, parent: this }));
    });

    // Subnets - DR
    const drPublicSubnets: aws.ec2.Subnet[] = [];
    const drPrivateSubnets: aws.ec2.Subnet[] = [];
    const drAzs = ['us-west-2a', 'us-west-2b', 'us-west-2c'];

    drAzs.forEach((az, i) => {
      drPublicSubnets.push(new aws.ec2.Subnet(`dr-pub-${i}-${environmentSuffix}`, {
        vpcId: drVpc.id,
        cidrBlock: `10.1.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { ...baseTags, Name: `dr-pub-${i}-${environmentSuffix}` },
      }, { provider: drProvider, parent: this }));

      drPrivateSubnets.push(new aws.ec2.Subnet(`dr-priv-${i}-${environmentSuffix}`, {
        vpcId: drVpc.id,
        cidrBlock: `10.1.${i + 10}.0/24`,
        availabilityZone: az,
        tags: { ...baseTags, Name: `dr-priv-${i}-${environmentSuffix}` },
      }, { provider: drProvider, parent: this }));
    });

    // Internet Gateways
    const primaryIgw = new aws.ec2.InternetGateway(`primary-igw-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      tags: { ...baseTags, Name: `primary-igw-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drIgw = new aws.ec2.InternetGateway(`dr-igw-${environmentSuffix}`, {
      vpcId: drVpc.id,
      tags: { ...baseTags, Name: `dr-igw-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // Route Tables
    const primaryRt = new aws.ec2.RouteTable(`primary-rt-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      routes: [{ cidrBlock: '0.0.0.0/0', gatewayId: primaryIgw.id }],
      tags: { ...baseTags, Name: `primary-rt-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drRt = new aws.ec2.RouteTable(`dr-rt-${environmentSuffix}`, {
      vpcId: drVpc.id,
      routes: [{ cidrBlock: '0.0.0.0/0', gatewayId: drIgw.id }],
      tags: { ...baseTags, Name: `dr-rt-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    primaryPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`primary-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: primaryRt.id,
      }, { provider: primaryProvider, parent: this });
    });

    drPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`dr-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: drRt.id,
      }, { provider: drProvider, parent: this });
    });

    // Security Groups
    const primaryAlbSg = new aws.ec2.SecurityGroup(`primary-alb-sg-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      ingress: [
        { protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlocks: ['0.0.0.0/0'] },
        { protocol: 'tcp', fromPort: 443, toPort: 443, cidrBlocks: ['0.0.0.0/0'] }
      ],
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `primary-alb-sg-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const primaryRdsSg = new aws.ec2.SecurityGroup(`primary-rds-sg-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      ingress: [{ protocol: 'tcp', fromPort: 5432, toPort: 5432, cidrBlocks: ['10.0.0.0/16'] }],
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `primary-rds-sg-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drAlbSg = new aws.ec2.SecurityGroup(`dr-alb-sg-${environmentSuffix}`, {
      vpcId: drVpc.id,
      ingress: [
        { protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlocks: ['0.0.0.0/0'] },
        { protocol: 'tcp', fromPort: 443, toPort: 443, cidrBlocks: ['0.0.0.0/0'] }
      ],
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `dr-alb-sg-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    const drRdsSg = new aws.ec2.SecurityGroup(`dr-rds-sg-${environmentSuffix}`, {
      vpcId: drVpc.id,
      ingress: [{ protocol: 'tcp', fromPort: 5432, toPort: 5432, cidrBlocks: ['10.1.0.0/16'] }],
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `dr-rds-sg-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // RDS Subnet Groups
    const primarySubnetGroup = new aws.rds.SubnetGroup(`primary-sng-${environmentSuffix}`, {
      subnetIds: primaryPrivateSubnets.map(s => s.id),
      tags: { ...baseTags, Name: `primary-sng-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drSubnetGroup = new aws.rds.SubnetGroup(`dr-sng-${environmentSuffix}`, {
      subnetIds: drPrivateSubnets.map(s => s.id),
      tags: { ...baseTags, Name: `dr-sng-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // Aurora Global Cluster
    const globalCluster = new aws.rds.GlobalCluster(`aurora-global-${environmentSuffix}`, {
      globalClusterIdentifier: `aurora-global-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'transactions',
      storageEncrypted: true,
    }, { provider: primaryProvider, parent: this });

    const primaryCluster = new aws.rds.Cluster(`primary-cluster-${environmentSuffix}`, {
      clusterIdentifier: `primary-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'transactions',
      masterUsername: 'dbadmin',
      masterPassword: pulumi.secret('ChangeMe12345!'),
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [primaryRdsSg.id],
      globalClusterIdentifier: globalCluster.id,
      skipFinalSnapshot: true,
      deletionProtection: false,
      storageEncrypted: true,
      kmsKeyId: primaryKmsKey.arn,
      backupRetentionPeriod: 1,
      tags: { ...baseTags, Name: `primary-cluster-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this, dependsOn: [globalCluster] });

    new aws.rds.ClusterInstance(`primary-inst-${environmentSuffix}`, {
      identifier: `primary-inst-${environmentSuffix}`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      tags: { ...baseTags, Name: `primary-inst-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drCluster = new aws.rds.Cluster(`dr-cluster-${environmentSuffix}`, {
      clusterIdentifier: `dr-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      dbSubnetGroupName: drSubnetGroup.name,
      vpcSecurityGroupIds: [drRdsSg.id],
      globalClusterIdentifier: globalCluster.id,
      skipFinalSnapshot: true,
      deletionProtection: false,
      storageEncrypted: true,
      kmsKeyId: drKmsKey.arn,
      tags: { ...baseTags, Name: `dr-cluster-${environmentSuffix}` },
    }, { provider: drProvider, parent: this, dependsOn: [primaryCluster] });

    new aws.rds.ClusterInstance(`dr-inst-${environmentSuffix}`, {
      identifier: `dr-inst-${environmentSuffix}`,
      clusterIdentifier: drCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      tags: { ...baseTags, Name: `dr-inst-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // DynamoDB Global Table
    const dynamoTable = new aws.dynamodb.Table(`session-table-${environmentSuffix}`, {
      name: `session-table-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'sessionId',
      attributes: [{ name: 'sessionId', type: 'S' }],
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      replicas: [{ regionName: 'us-west-2' }],
      pointInTimeRecovery: { enabled: true },
      serverSideEncryption: { enabled: true, kmsKeyArn: primaryKmsKey.arn },
      tags: { ...baseTags, Name: `session-table-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    // S3 Replication Role
    const replRole = new aws.iam.Role(`s3-repl-role-${environmentSuffix}`, {
      name: `s3-repl-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Action: 'sts:AssumeRole', Principal: { Service: 's3.amazonaws.com' }, Effect: 'Allow' }],
      }),
      tags: { ...baseTags, Name: `s3-repl-role-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const replPolicy = new aws.iam.RolePolicy(`s3-repl-policy-${environmentSuffix}`, {
      role: replRole.id,
      policy: pulumi.all([primaryKmsKey.arn, drKmsKey.arn]).apply(([pk, dk]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
              Resource: [`arn:aws:s3:::artifacts-primary-${environmentSuffix}`],
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObjectVersionForReplication', 's3:GetObjectVersionAcl', 's3:GetObjectVersionTagging'],
              Resource: [`arn:aws:s3:::artifacts-primary-${environmentSuffix}/*`],
            },
            {
              Effect: 'Allow',
              Action: ['s3:ReplicateObject', 's3:ReplicateDelete', 's3:ReplicateTags'],
              Resource: [`arn:aws:s3:::artifacts-dr-${environmentSuffix}/*`],
            },
            { Effect: 'Allow', Action: ['kms:Decrypt'], Resource: [pk] },
            { Effect: 'Allow', Action: ['kms:Encrypt'], Resource: [dk] },
          ],
        })
      ),
    }, { provider: primaryProvider, parent: this });

    const drBucket = new aws.s3.Bucket(`artifacts-dr-${environmentSuffix}`, {
      bucket: `artifacts-dr-${environmentSuffix}`,
      versioning: { enabled: true },
      serverSideEncryptionConfiguration: {
        rule: { applyServerSideEncryptionByDefault: { sseAlgorithm: 'aws:kms', kmsMasterKeyId: drKmsKey.arn } },
      },
      tags: { ...baseTags, Name: `artifacts-dr-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    const primaryBucket = new aws.s3.Bucket(`artifacts-primary-${environmentSuffix}`, {
      bucket: `artifacts-primary-${environmentSuffix}`,
      versioning: { enabled: true },
      serverSideEncryptionConfiguration: {
        rule: { applyServerSideEncryptionByDefault: { sseAlgorithm: 'aws:kms', kmsMasterKeyId: primaryKmsKey.arn } },
      },
      replicationConfiguration: {
        role: replRole.arn,
        rules: [{
          id: 'ReplicateAll',
          status: 'Enabled',
          destination: { bucket: drBucket.arn, replicaKmsKeyId: drKmsKey.arn, storageClass: 'STANDARD' },
          sourceSelectionCriteria: { sseKmsEncryptedObjects: { enabled: true } },
        }],
      },
      tags: { ...baseTags, Name: `artifacts-primary-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this, dependsOn: [replPolicy, drBucket] });

    // Lambda Role
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      name: `lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Action: 'sts:AssumeRole', Principal: { Service: 'lambda.amazonaws.com' }, Effect: 'Allow' }],
      }),
      tags: { ...baseTags, Name: `lambda-role-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { provider: primaryProvider, parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-vpc-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { provider: primaryProvider, parent: this });

    new aws.iam.RolePolicy(`lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: dynamoTable.arn.apply(arn =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            { Effect: 'Allow', Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query'], Resource: [arn] },
            { Effect: 'Allow', Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'], Resource: ['*'] },
          ],
        })
      ),
    }, { provider: primaryProvider, parent: this });

    // Lambda Security Groups
    const primaryLambdaSg = new aws.ec2.SecurityGroup(`primary-lambda-sg-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `primary-lambda-sg-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drLambdaSg = new aws.ec2.SecurityGroup(`dr-lambda-sg-${environmentSuffix}`, {
      vpcId: drVpc.id,
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
      tags: { ...baseTags, Name: `dr-lambda-sg-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // Lambda Functions
    const lambdaCode = new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  return { statusCode: 200, body: JSON.stringify({ message: 'Success', timestamp: new Date().toISOString() }) };
};
      `),
    });

    const primaryTxnLambda = new aws.lambda.Function(`primary-txn-${environmentSuffix}`, {
      name: `primary-txn-${environmentSuffix}`,
      role: lambdaRole.arn,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 3008,
      timeout: 300,
      vpcConfig: { subnetIds: primaryPrivateSubnets.map(s => s.id), securityGroupIds: [primaryLambdaSg.id] },
      environment: { variables: { DB_ENDPOINT: primaryCluster.endpoint, DYNAMODB_TABLE: dynamoTable.name, REGION: 'us-east-1' } },
      code: lambdaCode,
      tags: { ...baseTags, Name: `primary-txn-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const primaryHealthLambda = new aws.lambda.Function(`primary-health-${environmentSuffix}`, {
      name: `primary-health-${environmentSuffix}`,
      role: lambdaRole.arn,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 512,
      timeout: 30,
      vpcConfig: { subnetIds: primaryPrivateSubnets.map(s => s.id), securityGroupIds: [primaryLambdaSg.id] },
      environment: { variables: { DB_ENDPOINT: primaryCluster.endpoint, REGION: 'us-east-1' } },
      code: lambdaCode,
      tags: { ...baseTags, Name: `primary-health-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drTxnLambda = new aws.lambda.Function(`dr-txn-${environmentSuffix}`, {
      name: `dr-txn-${environmentSuffix}`,
      role: lambdaRole.arn,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 3008,
      timeout: 300,
      vpcConfig: { subnetIds: drPrivateSubnets.map(s => s.id), securityGroupIds: [drLambdaSg.id] },
      environment: { variables: { DB_ENDPOINT: drCluster.endpoint, DYNAMODB_TABLE: dynamoTable.name, REGION: 'us-west-2' } },
      code: lambdaCode,
      tags: { ...baseTags, Name: `dr-txn-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    const drHealthLambda = new aws.lambda.Function(`dr-health-${environmentSuffix}`, {
      name: `dr-health-${environmentSuffix}`,
      role: lambdaRole.arn,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 512,
      timeout: 30,
      vpcConfig: { subnetIds: drPrivateSubnets.map(s => s.id), securityGroupIds: [drLambdaSg.id] },
      environment: { variables: { DB_ENDPOINT: drCluster.endpoint, REGION: 'us-west-2' } },
      code: lambdaCode,
      tags: { ...baseTags, Name: `dr-health-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // ALBs
    const primaryAlb = new aws.lb.LoadBalancer(`primary-alb-${environmentSuffix}`, {
      name: `primary-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [primaryAlbSg.id],
      subnets: primaryPublicSubnets.map(s => s.id),
      tags: { ...baseTags, Name: `primary-alb-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const primaryTg = new aws.lb.TargetGroup(`primary-tg-${environmentSuffix}`, {
      name: `primary-tg-${environmentSuffix}`,
      targetType: 'lambda',
      tags: { ...baseTags, Name: `primary-tg-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    new aws.lb.TargetGroupAttachment(`primary-tga-${environmentSuffix}`, {
      targetGroupArn: primaryTg.arn,
      targetId: primaryTxnLambda.arn,
    }, { provider: primaryProvider, parent: this });

    new aws.lambda.Permission(`primary-lambda-perm-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: primaryTxnLambda.name,
      principal: 'elasticloadbalancing.amazonaws.com',
      sourceArn: primaryTg.arn,
    }, { provider: primaryProvider, parent: this });

    new aws.lb.Listener(`primary-listener-${environmentSuffix}`, {
      loadBalancerArn: primaryAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{ type: 'forward', targetGroupArn: primaryTg.arn }],
    }, { provider: primaryProvider, parent: this });

    const primaryHealthUrl = new aws.lambda.FunctionUrl(`primary-health-url-${environmentSuffix}`, {
      functionName: primaryHealthLambda.name,
      authorizationType: 'NONE',
    }, { provider: primaryProvider, parent: this });

    const drAlb = new aws.lb.LoadBalancer(`dr-alb-${environmentSuffix}`, {
      name: `dr-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [drAlbSg.id],
      subnets: drPublicSubnets.map(s => s.id),
      tags: { ...baseTags, Name: `dr-alb-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    const drTg = new aws.lb.TargetGroup(`dr-tg-${environmentSuffix}`, {
      name: `dr-tg-${environmentSuffix}`,
      targetType: 'lambda',
      tags: { ...baseTags, Name: `dr-tg-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    new aws.lb.TargetGroupAttachment(`dr-tga-${environmentSuffix}`, {
      targetGroupArn: drTg.arn,
      targetId: drTxnLambda.arn,
    }, { provider: drProvider, parent: this });

    new aws.lambda.Permission(`dr-lambda-perm-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: drTxnLambda.name,
      principal: 'elasticloadbalancing.amazonaws.com',
      sourceArn: drTg.arn,
    }, { provider: drProvider, parent: this });

    new aws.lb.Listener(`dr-listener-${environmentSuffix}`, {
      loadBalancerArn: drAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{ type: 'forward', targetGroupArn: drTg.arn }],
    }, { provider: drProvider, parent: this });

    const drHealthUrl = new aws.lambda.FunctionUrl(`dr-health-url-${environmentSuffix}`, {
      functionName: drHealthLambda.name,
      authorizationType: 'NONE',
    }, { provider: drProvider, parent: this });

    // SNS Topics
    const primarySnsTopic = new aws.sns.Topic(`primary-alerts-${environmentSuffix}`, {
      name: `primary-alerts-${environmentSuffix}`,
      tags: { ...baseTags, Name: `primary-alerts-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drSnsTopic = new aws.sns.Topic(`dr-alerts-${environmentSuffix}`, {
      name: `dr-alerts-${environmentSuffix}`,
      tags: { ...baseTags, Name: `dr-alerts-${environmentSuffix}` },
    }, { provider: drProvider, parent: this });

    // CloudWatch Alarm
    new aws.cloudwatch.MetricAlarm(`repl-lag-alarm-${environmentSuffix}`, {
      name: `repl-lag-alarm-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'AuroraGlobalDBReplicationLag',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 30000,
      alarmDescription: 'RDS replication lag > 30s',
      alarmActions: [primarySnsTopic.arn],
      dimensions: { DBClusterIdentifier: primaryCluster.id },
      tags: { ...baseTags, Name: `repl-lag-alarm-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    // Route 53
    const hostedZone = new aws.route53.Zone(`dr-zone-${environmentSuffix}`, {
      name: `dr-${environmentSuffix}.example.com`,
      comment: 'DR managed by Pulumi',
      tags: { ...baseTags, Name: `dr-zone-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const primaryHealthCheck = new aws.route53.HealthCheck(`primary-hc-${environmentSuffix}`, {
      type: 'HTTPS',
      resourcePath: '/',
      fullyQualifiedDomainName: primaryHealthUrl.functionUrl.apply(url => url.replace('https://', '').replace('/', '')),
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
      measureLatency: true,
      tags: { ...baseTags, Name: `primary-hc-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    const drHealthCheck = new aws.route53.HealthCheck(`dr-hc-${environmentSuffix}`, {
      type: 'HTTPS',
      resourcePath: '/',
      fullyQualifiedDomainName: drHealthUrl.functionUrl.apply(url => url.replace('https://', '').replace('/', '')),
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
      measureLatency: true,
      tags: { ...baseTags, Name: `dr-hc-${environmentSuffix}` },
    }, { provider: primaryProvider, parent: this });

    new aws.route53.Record(`primary-record-${environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: `api.dr-${environmentSuffix}.example.com`,
      type: 'A',
      setIdentifier: 'primary',
      aliases: [{ name: primaryAlb.dnsName, zoneId: primaryAlb.zoneId, evaluateTargetHealth: true }],
      weightedRoutingPolicies: [{ weight: 100 }],
      healthCheckId: primaryHealthCheck.id,
    }, { provider: primaryProvider, parent: this });

    new aws.route53.Record(`dr-record-${environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: `api.dr-${environmentSuffix}.example.com`,
      type: 'A',
      setIdentifier: 'dr',
      aliases: [{ name: drAlb.dnsName, zoneId: drAlb.zoneId, evaluateTargetHealth: true }],
      weightedRoutingPolicies: [{ weight: 0 }],
      healthCheckId: drHealthCheck.id,
    }, { provider: primaryProvider, parent: this });

    this.primaryVpcId = primaryVpc.id;
    this.drVpcId = drVpc.id;
    this.auroraGlobalClusterId = globalCluster.id;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      drVpcId: this.drVpcId,
      auroraGlobalClusterId: this.auroraGlobalClusterId,
      primaryClusterEndpoint: primaryCluster.endpoint,
      drClusterEndpoint: drCluster.endpoint,
      dynamoTableName: dynamoTable.name,
      primaryBucketName: primaryBucket.bucket,
      drBucketName: drBucket.bucket,
      primaryAlbDnsName: primaryAlb.dnsName,
      drAlbDnsName: drAlb.dnsName,
      hostedZoneId: hostedZone.zoneId,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: 'Production',
  DisasterRecovery: 'Enabled',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const stack = new TapStack('dr-infrastructure', {
  environmentSuffix,
  tags: defaultTags,
});

export const primaryVpcId = stack.primaryVpcId;
export const drVpcId = stack.drVpcId;
export const auroraGlobalClusterId = stack.auroraGlobalClusterId;
```
