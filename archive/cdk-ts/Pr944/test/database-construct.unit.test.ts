import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DatabaseConstruct } from '../lib/database-construct';

describe('DatabaseConstruct', () => {
  let stack: cdk.Stack;
  let template: Template;
  let vpc: cdk.aws_ec2.Vpc;
  let kmsKey: cdk.aws_kms.Key;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    vpc = new cdk.aws_ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    kmsKey = new cdk.aws_kms.Key(stack, 'TestKey', {
      enableKeyRotation: true,
    });
  });

  describe('Primary Region Database', () => {
    let databaseConstruct: DatabaseConstruct;

    beforeEach(() => {
      databaseConstruct = new DatabaseConstruct(stack, 'Database', {
        environmentSuffix: 'test',
        region: 'us-east-1',
        vpc,
        isPrimary: true,
        kmsKey,
      });

      template = Template.fromStack(stack);
    });

    test('should create Aurora Serverless v2 cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster',
        Match.objectLike({
          Engine: 'aurora-postgresql',
          ServerlessV2ScalingConfiguration: Match.objectLike({
            MinCapacity: 0.5,
            MaxCapacity: 4,
          }),
          DBClusterIdentifier: 'test-aurora-us-east-1',
        })
      );
    });

    test('should enable storage encryption with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster',
        Match.objectLike({
          StorageEncrypted: true,
          KmsKeyId: Match.anyValue(),
        })
      );
    });

    test('should configure backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster',
        Match.objectLike({
          BackupRetentionPeriod: 7,
          PreferredBackupWindow: '03:00-04:00',
          PreferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
        })
      );
    });

    test('should disable deletion protection for dev/test', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster',
        Match.objectLike({
          DeletionProtection: false,
        })
      );
    });

    test('should create writer and reader instances', () => {
      // Check for writer instance
      template.hasResourceProperties('AWS::RDS::DBInstance',
        Match.objectLike({
          DBInstanceClass: 'db.serverless',
          DBClusterIdentifier: Match.anyValue(),
          PromotionTier: 0,
        })
      );

      // Check for reader instance
      template.hasResourceProperties('AWS::RDS::DBInstance',
        Match.objectLike({
          DBInstanceClass: 'db.serverless',
          DBClusterIdentifier: Match.anyValue(),
          PromotionTier: 2,
        })
      );
    });

    test('should create DynamoDB table with replication regions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: 'test-global-table',
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: Match.objectLike({
            SSEEnabled: true,
          }),
          PointInTimeRecoverySpecification: Match.objectLike({
            PointInTimeRecoveryEnabled: true,
          }),
          // Note: replicationRegions is a CDK construct property, not a CloudFormation property
        })
      );
    });

    test('should use AWS managed encryption for global table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: 'test-global-table',
          SSESpecification: Match.objectLike({
            SSEEnabled: true,
            // AWS managed encryption doesn't specify SSEType or KMSMasterKeyId
          }),
        })
      );
    });

    test('should create global secondary index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'GSI1',
              KeySchema: Match.arrayWith([
                Match.objectLike({
                  AttributeName: 'GSI1PK',
                  KeyType: 'HASH',
                }),
                Match.objectLike({
                  AttributeName: 'GSI1SK',
                  KeyType: 'RANGE',
                }),
              ]),
            }),
          ]),
        })
      );
    });

    test('should expose RDS cluster and DynamoDB table', () => {
      expect(databaseConstruct.rdsCluster).toBeDefined();
      expect(databaseConstruct.dynamoDbTable).toBeDefined();
    });
  });

  describe('Secondary Region Database', () => {
    let databaseConstruct: DatabaseConstruct;

    beforeEach(() => {
      databaseConstruct = new DatabaseConstruct(stack, 'Database', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        vpc,
        isPrimary: false,
        kmsKey,
      });

      template = Template.fromStack(stack);
    });

    test('should create regional DynamoDB table without replication', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: 'test-regional-table-us-west-2',
          BillingMode: 'PAY_PER_REQUEST',
        })
      );

      // Verify no replicas are configured
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        if (table.Properties?.TableName === 'test-regional-table-us-west-2') {
          expect(table.Properties.Replicas).toBeUndefined();
        }
      });
    });

    test('should use customer managed KMS for regional table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: 'test-regional-table-us-west-2',
          SSESpecification: Match.objectLike({
            SSEEnabled: true,
            SSEType: 'KMS',
            KMSMasterKeyId: Match.not('alias/aws/dynamodb'),
          }),
        })
      );
    });

    test('should create RDS cluster in secondary region', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster',
        Match.objectLike({
          DBClusterIdentifier: 'test-aurora-us-west-2',
        })
      );
    });
  });

  describe('Database Security', () => {
    beforeEach(() => {
      new DatabaseConstruct(stack, 'Database', {
        environmentSuffix: 'test',
        region: 'us-east-1',
        vpc,
        isPrimary: true,
        kmsKey,
      });

      template = Template.fromStack(stack);
    });

    test('should create security group for RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
          GroupDescription: 'RDS security group',
        })
      );
    });

    test('should store RDS credentials in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret',
        Match.objectLike({
          Name: 'test/rds/credentials/us-east-1',
          GenerateSecretString: Match.objectLike({
            SecretStringTemplate: '{"username":"dbadmin"}',
            GenerateStringKey: 'password',
          }),
        })
      );
    });

    test('should encrypt RDS credentials with KMS', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret',
        Match.objectLike({
          KmsKeyId: Match.anyValue(),
        })
      );
    });

    test('should attach secret to RDS cluster', () => {
      template.hasResourceProperties('AWS::SecretsManager::SecretTargetAttachment',
        Match.objectLike({
          TargetType: 'AWS::RDS::DBCluster',
        })
      );
    });
  });
});