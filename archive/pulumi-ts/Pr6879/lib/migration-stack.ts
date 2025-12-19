/**
 * Migration Stack - AWS DMS and Lambda validation function
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';

export interface MigrationStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  sourceDbEndpoint: string;
  sourceDbPort: number;
  targetDbEndpoint: pulumi.Output<string>;
  targetDbPort: number;
  databaseSecurityGroupId: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class MigrationStack extends pulumi.ComponentResource {
  public readonly replicationTaskArn: pulumi.Output<string>;
  public readonly validationLambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MigrationStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:migration:MigrationStack', name, {}, opts);

    // Create security group for DMS replication instance
    const dmsSecurityGroup = new aws.ec2.SecurityGroup(
      `dms-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for DMS replication instance',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...args.tags,
          Name: `dms-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Allow DMS to access RDS
    new aws.ec2.SecurityGroupRule(
      `dms-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: dmsSecurityGroup.id,
        securityGroupId: args.databaseSecurityGroupId,
        description: 'PostgreSQL access from DMS',
      },
      { parent: this }
    );

    // Create DMS subnet group
    const dmsSubnetGroup = new aws.dms.ReplicationSubnetGroup(
      `dms-subnet-group-${args.environmentSuffix}`,
      {
        replicationSubnetGroupId: `dms-subnet-group-${args.environmentSuffix}`,
        replicationSubnetGroupDescription: 'DMS replication subnet group',
        subnetIds: args.privateSubnetIds,
        tags: {
          ...args.tags,
          Name: `dms-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for DMS
    const dmsRole = new aws.iam.Role(
      `dms-role-${args.environmentSuffix}`,
      {
        name: `dms-vpc-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'dms.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...args.tags,
          Name: `dms-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `dms-vpc-policy-${args.environmentSuffix}`,
      {
        role: dmsRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole',
      },
      { parent: this }
    );

    // Create DMS replication instance
    const replicationInstance = new aws.dms.ReplicationInstance(
      `dms-repl-instance-${args.environmentSuffix}`,
      {
        replicationInstanceId: `dms-repl-${args.environmentSuffix}`,
        replicationInstanceClass: 'dms.t3.medium',
        allocatedStorage: 100,
        vpcSecurityGroupIds: [dmsSecurityGroup.id],
        replicationSubnetGroupId: dmsSubnetGroup.id,
        publiclyAccessible: false,
        engineVersion: '3.5.3',
        multiAz: false,
        tags: {
          ...args.tags,
          Name: `dms-repl-instance-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create source endpoint (on-premises PostgreSQL)
    const sourceEndpoint = new aws.dms.Endpoint(
      `dms-source-endpoint-${args.environmentSuffix}`,
      {
        endpointId: `source-db-${args.environmentSuffix}`,
        endpointType: 'source',
        engineName: 'postgres',
        serverName: args.sourceDbEndpoint,
        port: args.sourceDbPort,
        databaseName: 'sourcedb',
        username: 'sourceuser',
        password: pulumi.secret('SourcePassword123!'), // Should be from Secrets Manager
        tags: {
          ...args.tags,
          Name: `dms-source-endpoint-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create target endpoint (Aurora PostgreSQL)
    const targetEndpoint = new aws.dms.Endpoint(
      `dms-target-endpoint-${args.environmentSuffix}`,
      {
        endpointId: `target-db-${args.environmentSuffix}`,
        endpointType: 'target',
        engineName: 'aurora-postgresql',
        serverName: args.targetDbEndpoint,
        port: args.targetDbPort,
        databaseName: 'paymentdb',
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'), // Should match RDS password
        tags: {
          ...args.tags,
          Name: `dms-target-endpoint-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DMS replication task with CDC enabled
    const replicationTask = new aws.dms.ReplicationTask(
      `dms-repl-task-${args.environmentSuffix}`,
      {
        replicationTaskId: `migration-task-${args.environmentSuffix}`,
        migrationType: 'full-load-and-cdc',
        replicationInstanceArn: replicationInstance.replicationInstanceArn,
        sourceEndpointArn: sourceEndpoint.endpointArn,
        targetEndpointArn: targetEndpoint.endpointArn,
        tableMappings: JSON.stringify({
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'public',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        }),
        replicationTaskSettings: JSON.stringify({
          TargetMetadata: {
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
            LimitedSizeLobMode: true,
            LobMaxSize: 32,
          },
          FullLoadSettings: {
            TargetTablePrepMode: 'DROP_AND_CREATE',
          },
          Logging: {
            EnableLogging: true,
            LogComponents: [
              {
                Id: 'TRANSFORMATION',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_CAPTURE',
                Severity: 'LOGGER_SEVERITY_INFO',
              },
              {
                Id: 'TARGET_APPLY',
                Severity: 'LOGGER_SEVERITY_INFO',
              },
            ],
          },
          ChangeProcessingTuning: {
            BatchApplyPreserveTransaction: true,
            BatchApplyTimeoutMin: 1,
            BatchApplyTimeoutMax: 30,
            BatchSplitSize: 0,
            CommitTimeout: 1,
            MemoryLimitTotal: 1024,
            MemoryKeepTime: 60,
            StatementCacheSize: 50,
          },
        }),
        tags: {
          ...args.tags,
          Name: `dms-repl-task-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.replicationTaskArn = replicationTask.replicationTaskArn;

    // Create IAM role for Lambda validation function
    const lambdaRole = new aws.iam.Role(
      `lambda-validation-role-${args.environmentSuffix}`,
      {
        name: `lambda-validation-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...args.tags,
          Name: `lambda-validation-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-exec-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-exec-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for validation Lambda function',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...args.tags,
          Name: `lambda-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Allow Lambda to access RDS
    new aws.ec2.SecurityGroupRule(
      `lambda-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: lambdaSecurityGroup.id,
        securityGroupId: args.databaseSecurityGroupId,
        description: 'PostgreSQL access from Lambda',
      },
      { parent: this }
    );

    // Create Lambda function for data validation
    const validationLambda = new aws.lambda.Function(
      `validation-lambda-${args.environmentSuffix}`,
      {
        name: `db-validation-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            SOURCE_DB_ENDPOINT: args.sourceDbEndpoint,
            TARGET_DB_ENDPOINT: args.targetDbEndpoint,
            DB_NAME: 'paymentdb',
            DB_PORT: '5432',
          },
        },
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'validation')
          ),
        }),
        tags: {
          ...args.tags,
          Name: `validation-lambda-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.validationLambdaArn = validationLambda.arn;

    this.registerOutputs({
      replicationTaskArn: this.replicationTaskArn,
      validationLambdaArn: this.validationLambdaArn,
    });
  }
}
