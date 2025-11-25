import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
  region?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly secretArn: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:resource:TapStack', name, {}, opts);

    const { environmentSuffix } = args;

    // Common tags
    const tags = {
      Environment: environmentSuffix,
      CostCenter: 'security-operations',
      Compliance: 'required',
    };

    // Get current AWS account ID and region
    const current = aws.getCallerIdentityOutput({});
    const accountId = current.accountId;
    const region = aws.getRegionOutput({}).name;

    // KMS Key for database encryption with comprehensive policy
    const dbKmsKey = new aws.kms.Key(
      `db-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for Aurora database encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow RDS to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "rds.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey",
        "kms:CreateGrant"
      ],
      "Resource": "*"
    }
  ]
}`,
        tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `db-kms-alias-${environmentSuffix}`,
      {
        name: `alias/db-${environmentSuffix}`,
        targetKeyId: dbKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for Secrets Manager with comprehensive policy
    const secretsKmsKey = new aws.kms.Key(
      `secrets-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for Secrets Manager encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Secrets Manager to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "secretsmanager.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey",
        "kms:CreateGrant"
      ],
      "Resource": "*"
    }
  ]
}`,
        tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `secrets-kms-alias-${environmentSuffix}`,
      {
        name: `alias/secrets-${environmentSuffix}`,
        targetKeyId: secretsKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for CloudWatch Logs with MANDATORY FIX: comprehensive policy including CloudWatch Logs service
    const logsKmsKey = new aws.kms.Key(
      `logs-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.${region}.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "ArnEquals": {
          "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/rotation-function-${environmentSuffix}"
        }
      }
    }
  ]
}`,
        tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `logs-kms-alias-${environmentSuffix}`,
      {
        name: `alias/logs-${environmentSuffix}`,
        targetKeyId: logsKmsKey.keyId,
      },
      { parent: this }
    );

    // VPC with private subnets
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Private subnets across multiple AZs
    const privateSubnets = [0, 1].map(i => {
      return new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.names.apply(names => names[i]),
          tags: { ...tags, Name: `private-subnet-${i}-${environmentSuffix}` },
        },
        { parent: this }
      );
    });

    // Subnet group for Aurora
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnets.map(s => s.id),
        tags: { ...tags, Name: `db-subnet-group-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Security group for Aurora
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Aurora MySQL cluster',
        tags: { ...tags, Name: `db-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Lambda rotation function',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...tags, Name: `lambda-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Allow Lambda to connect to Aurora
    new aws.ec2.SecurityGroupRule(
      `db-sg-ingress-lambda-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        securityGroupId: dbSecurityGroup.id,
        sourceSecurityGroupId: lambdaSecurityGroup.id,
      },
      { parent: this }
    );

    // VPC Endpoints for Secrets Manager
    new aws.ec2.VpcEndpoint(
      `secretsmanager-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `secretsmanager-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // VPC Endpoint for KMS
    new aws.ec2.VpcEndpoint(
      `kms-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.kms`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `kms-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Aurora MySQL Cluster with MANDATORY FIX: db.t3.medium instance class
    const dbCluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        databaseName: 'secretsdb',
        masterUsername: 'admin',
        masterPassword: pulumi.secret('ChangeMe123!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: dbKmsKey.arn,
        skipFinalSnapshot: true,
        deletionProtection: false,
        tags: { ...tags, Name: `aurora-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Aurora instance with MANDATORY FIX: db.t3.medium
    new aws.rds.ClusterInstance(
      `aurora-instance-${environmentSuffix}`,
      {
        clusterIdentifier: dbCluster.id,
        instanceClass: 'db.t3.medium', // MANDATORY FIX: db.t3.medium instead of db.t3.small
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        publiclyAccessible: false,
        tags: { ...tags, Name: `aurora-instance-${environmentSuffix}` },
      },
      { parent: this }
    );

    // IAM role for Lambda rotation function
    const lambdaRole = new aws.iam.Role(
      `rotation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Lambda policy for VPC access
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Least-privilege policy for Lambda
    const lambdaPolicy = new aws.iam.Policy(
      `rotation-lambda-policy-${environmentSuffix}`,
      {
        policy: pulumi
          .all([
            dbCluster.arn,
            secretsKmsKey.arn,
            logsKmsKey.arn,
            region,
            accountId,
          ])
          .apply(
            ([
              _clusterArn,
              secretsKeyArn,
              logsKeyArn,
              regionStr,
              accountIdStr,
            ]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'secretsmanager:DescribeSecret',
                      'secretsmanager:GetSecretValue',
                      'secretsmanager:PutSecretValue',
                      'secretsmanager:UpdateSecretVersionStage',
                    ],
                    Resource: `arn:aws:secretsmanager:${regionStr}:${accountIdStr}:secret:db-secret-${environmentSuffix}-*`,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['secretsmanager:GetRandomPassword'],
                    Resource: '*',
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'kms:Decrypt',
                      'kms:DescribeKey',
                      'kms:GenerateDataKey',
                    ],
                    Resource: [secretsKeyArn, logsKeyArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents',
                    ],
                    Resource: `arn:aws:logs:${regionStr}:${accountIdStr}:log-group:/aws/lambda/rotation-function-${environmentSuffix}:*`,
                  },
                ],
              })
          ),
        tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-policy-attachment-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: this }
    );

    // CloudWatch Log Group with KMS encryption
    const logGroup = new aws.cloudwatch.LogGroup(
      `rotation-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/rotation-function-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: logsKmsKey.arn,
        tags,
      },
      { parent: this, dependsOn: [logsKmsKey] }
    );

    // Lambda function for rotation
    const rotationFunction = new aws.lambda.Function(
      `rotation-function-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            CLUSTER_ARN: dbCluster.arn,
            DB_NAME: 'secretsdb',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  const token = event.ClientRequestToken;
  const secretId = event.SecretId;
  const step = event.Step;

  console.log(\`Rotation step: \${step} for secret: \${secretId}\`);

  switch (step) {
    case 'createSecret':
      await createSecret(secretId, token);
      break;
    case 'setSecret':
      await setSecret(secretId, token);
      break;
    case 'testSecret':
      await testSecret(secretId, token);
      break;
    case 'finishSecret':
      await finishSecret(secretId, token);
      break;
    default:
      throw new Error(\`Invalid step: \${step}\`);
  }
};

async function createSecret(secretId, token) {
  const current = await secretsManager.getSecretValue({ SecretId: secretId, VersionStage: 'AWSCURRENT' }).promise();

  try {
    await secretsManager.getSecretValue({ SecretId: secretId, VersionId: token, VersionStage: 'AWSPENDING' }).promise();
    console.log('Secret version already exists');
  } catch (err) {
    const password = await secretsManager.getRandomPassword({
      PasswordLength: 32,
      ExcludeCharacters: '"@/\\\\'
    }).promise();

    const currentSecret = JSON.parse(current.SecretString);
    currentSecret.password = password.RandomPassword;

    await secretsManager.putSecretValue({
      SecretId: secretId,
      ClientRequestToken: token,
      SecretString: JSON.stringify(currentSecret),
      VersionStages: ['AWSPENDING']
    }).promise();

    console.log('Created new secret version');
  }
}

async function setSecret(secretId, token) {
  const pending = await secretsManager.getSecretValue({ SecretId: secretId, VersionId: token, VersionStage: 'AWSPENDING' }).promise();
  const current = await secretsManager.getSecretValue({ SecretId: secretId, VersionStage: 'AWSCURRENT' }).promise();

  const pendingSecret = JSON.parse(pending.SecretString);
  const currentSecret = JSON.parse(current.SecretString);

  const connection = await mysql.createConnection({
    host: currentSecret.host,
    user: currentSecret.username,
    password: currentSecret.password,
    database: currentSecret.dbname
  });

  await connection.execute(\`ALTER USER '\${currentSecret.username}'@'%' IDENTIFIED BY '\${pendingSecret.password}'\`);
  await connection.end();

  console.log('Password updated in database');
}

async function testSecret(secretId, token) {
  const pending = await secretsManager.getSecretValue({ SecretId: secretId, VersionId: token, VersionStage: 'AWSPENDING' }).promise();
  const pendingSecret = JSON.parse(pending.SecretString);

  const connection = await mysql.createConnection({
    host: pendingSecret.host,
    user: pendingSecret.username,
    password: pendingSecret.password,
    database: pendingSecret.dbname
  });

  await connection.execute('SELECT 1');
  await connection.end();

  console.log('Successfully tested new password');
}

async function finishSecret(secretId, token) {
  const metadata = await secretsManager.describeSecret({ SecretId: secretId }).promise();

  for (const versionId in metadata.VersionIdsToStages) {
    if (metadata.VersionIdsToStages[versionId].includes('AWSCURRENT')) {
      if (versionId === token) {
        console.log('Version already marked as AWSCURRENT');
        return;
      }

      await secretsManager.updateSecretVersionStage({
        SecretId: secretId,
        VersionStage: 'AWSCURRENT',
        MoveToVersionId: token,
        RemoveFromVersionId: versionId
      }).promise();

      console.log('Successfully moved AWSCURRENT to new version');
      break;
    }
  }
}
`),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'rotation-function',
              version: '1.0.0',
              dependencies: {
                mysql2: '^3.6.0',
              },
            })
          ),
        }),
        tags,
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // Lambda permission for Secrets Manager to invoke
    new aws.lambda.Permission(
      `rotation-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: rotationFunction.name,
        principal: 'secretsmanager.amazonaws.com',
      },
      { parent: this }
    );

    // Secrets Manager secret with rotation
    const dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${environmentSuffix}`,
      {
        name: `db-secret-${environmentSuffix}`,
        description: 'Aurora MySQL database credentials',
        kmsKeyId: secretsKmsKey.id,
        tags,
      },
      { parent: this }
    );

    // Secret version with initial credentials
    const secretVersion = new aws.secretsmanager.SecretVersion(
      `db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi
          .all([
            dbCluster.endpoint,
            dbCluster.masterUsername,
            dbCluster.masterPassword,
          ])
          .apply(([endpoint, username, password]) =>
            JSON.stringify({
              engine: 'mysql',
              host: endpoint,
              username: username,
              password: password,
              dbname: 'secretsdb',
              port: 3306,
            })
          ),
      },
      { parent: this }
    );

    // Rotation schedule (30 days)
    new aws.secretsmanager.SecretRotation(
      `db-secret-rotation-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        rotationLambdaArn: rotationFunction.arn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this, dependsOn: [secretVersion] }
    );

    // Outputs
    this.secretArn = dbSecret.arn;
    this.vpcId = vpc.id;
    this.clusterEndpoint = dbCluster.endpoint;

    this.registerOutputs({
      secretArn: this.secretArn,
      vpcId: this.vpcId,
      clusterEndpoint: this.clusterEndpoint,
    });
  }
}
