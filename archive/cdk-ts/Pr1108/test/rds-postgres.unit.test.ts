import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_kms as kms } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PostgresRds } from '../lib/constructs/rds-postgres';

describe('PostgresRds', () => {
  it('creates a PostgreSQL RDS instance with correct properties and coverage', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'Vpc', {
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    const key = new kms.Key(stack, 'Key');
    new PostgresRds(stack, 'PostgresRds', {
      vpc,
      kmsKey: key,
      idSuffix: 'unit',
    });
    const template = Template.fromStack(stack);
    // Check RDS resource exists
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    // Check engine is postgres
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      MultiAZ: true,
      StorageEncrypted: true,
      PubliclyAccessible: false,
      AllocatedStorage: '20',
      BackupRetentionPeriod: 7,
      AutoMinorVersionUpgrade: true,
      DBInstanceIdentifier: 'pg-unit',
    });
    // Check subnet group
    template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'DB Isolated Subnets',
    });
    // Check security group
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'RDS SG',
    });
  });

  it('throws if idSuffix is missing', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'Vpc', {
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    const key = new kms.Key(stack, 'Key');
    expect(() => {
      // @ts-expect-error
      new PostgresRds(stack, 'PostgresRds', { vpc, kmsKey: key });
    }).toThrow();
  });

  it('creates RDS with alternate idSuffix', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'Vpc', {
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    const key = new kms.Key(stack, 'Key');
    new PostgresRds(stack, 'PostgresRds', {
      vpc,
      kmsKey: key,
      idSuffix: 'alt',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceIdentifier: 'pg-alt',
    });
  });
});
