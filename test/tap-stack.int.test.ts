import fs from 'fs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101000764';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const rdsClient = new RDSClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

describe('RDS PostgreSQL Migration Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSPort).toBeDefined();
      expect(outputs.DBInstanceIdentifier).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBName).toBeDefined();
      expect(outputs.SecurityGroupId).toBeDefined();
    });

    test('RDS endpoint should be a valid hostname', () => {
      expect(outputs.RDSEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
    });

    test('RDS port should be PostgreSQL default port', () => {
      expect(outputs.RDSPort).toBe('5432');
    });

    test('DB name should be migrated_app_db', () => {
      expect(outputs.DBName).toBe('migrated_app_db');
    });

    test('DB instance identifier should include environment suffix', () => {
      expect(outputs.DBInstanceIdentifier).toContain(environmentSuffix);
    });

    test('secret ARN should be valid', () => {
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d+:secret:/);
    });

    test('security group ID should be valid', () => {
      expect(outputs.SecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });
  });

  describe('RDS Instance Validation', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBInstanceIdentifier
      });
      const response = await rdsClient.send(command);
      dbInstance = response.DBInstances?.[0];
    });

    test('RDS instance should exist and be available', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('RDS instance should use PostgreSQL engine', () => {
      expect(dbInstance.Engine).toBe('postgres');
    });

    test('RDS instance engine version should be valid', () => {
      expect(dbInstance.EngineVersion).toBeDefined();
      expect(dbInstance.EngineVersion).toMatch(/^14\.\d+$/);
    });

    test('RDS instance should have correct database name', () => {
      expect(dbInstance.DBName).toBe('migrated_app_db');
    });

    test('RDS instance should have correct identifier', () => {
      expect(dbInstance.DBInstanceIdentifier).toBe(outputs.DBInstanceIdentifier);
    });

    test('RDS instance endpoint should match output', () => {
      expect(dbInstance.Endpoint.Address).toBe(outputs.RDSEndpoint);
    });

    test('RDS instance port should match output', () => {
      expect(dbInstance.Endpoint.Port.toString()).toBe(outputs.RDSPort);
    });

    test('RDS instance should have encryption enabled', () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS instance should not be publicly accessible', () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should not have deletion protection', () => {
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('RDS instance should have correct backup retention', () => {
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('RDS instance should have storage type gp3', () => {
      expect(dbInstance.StorageType).toBe('gp3');
    });

    test('RDS instance should have CloudWatch logs exports enabled', () => {
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    test('RDS instance should have required tags', () => {
      const tags = dbInstance.TagList || [];
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('MigrationDate');
      expect(tagKeys).toContain('Project');
    });

    test('RDS instance Project tag should be DatabaseMigration', () => {
      const tags = dbInstance.TagList || [];
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('DatabaseMigration');
    });

    test('RDS instance should be in a VPC', () => {
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup.VpcId).toBeDefined();
      expect(dbInstance.DBSubnetGroup.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('RDS instance should have security groups attached', () => {
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups.length).toBeGreaterThan(0);
      expect(dbInstance.VpcSecurityGroups[0].Status).toBe('active');
    });

    test('RDS instance should use correct master username', () => {
      expect(dbInstance.MasterUsername).toBeDefined();
      expect(dbInstance.MasterUsername).toBe('dbadmin');
    });
  });

  describe('DB Subnet Group Validation', () => {
    let subnetGroup: any;

    beforeAll(async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: outputs.DBInstanceIdentifier.replace('migrated-rds', 'rds-subnet-group')
      });
      const response = await rdsClient.send(command);
      subnetGroup = response.DBSubnetGroups?.[0];
    });

    test('DB subnet group should exist', () => {
      expect(subnetGroup).toBeDefined();
    });

    test('DB subnet group should have at least 2 subnets', () => {
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('DB subnet group subnets should be in different availability zones', () => {
      const azs = subnetGroup.Subnets.map((subnet: any) => subnet.SubnetAvailabilityZone.Name);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('DB subnet group should have Active status', () => {
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
    });

    test('DB subnet group name should include environment suffix', () => {
      expect(subnetGroup.DBSubnetGroupName).toContain(environmentSuffix);
    });
  });

  describe('Security Group Validation', () => {
    let securityGroup: any;

    beforeAll(async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });
      const response = await ec2Client.send(command);
      securityGroup = response.SecurityGroups?.[0];
    });

    test('security group should exist', () => {
      expect(securityGroup).toBeDefined();
    });

    test('security group should have correct ID', () => {
      expect(securityGroup.GroupId).toBe(outputs.SecurityGroupId);
    });

    test('security group should have ingress rule for PostgreSQL port', () => {
      expect(securityGroup.IpPermissions).toBeDefined();
      const postgresRule = securityGroup.IpPermissions.find(
        (rule: any) => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
    });

    test('security group should allow TCP protocol on port 5432', () => {
      const postgresRule = securityGroup.IpPermissions.find(
        (rule: any) => rule.FromPort === 5432
      );
      expect(postgresRule.IpProtocol).toBe('tcp');
    });

    test('security group should have required tags', () => {
      const tags = securityGroup.Tags || [];
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('MigrationDate');
      expect(tagKeys).toContain('Project');
    });

    test('security group Name tag should include environment suffix', () => {
      const tags = securityGroup.Tags || [];
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });

    test('security group should be in a VPC', () => {
      expect(securityGroup.VpcId).toBeDefined();
      expect(securityGroup.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  describe('Secrets Manager Validation', () => {
    let secret: any;

    beforeAll(async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn
      });
      const response = await secretsClient.send(command);
      secret = response;
    });

    test('secret should exist and be retrievable', () => {
      expect(secret).toBeDefined();
      expect(secret.SecretString).toBeDefined();
    });

    test('secret should contain username and password', () => {
      const secretData = JSON.parse(secret.SecretString);
      expect(secretData.username).toBeDefined();
      expect(secretData.password).toBeDefined();
    });

    test('secret username should be dbadmin', () => {
      const secretData = JSON.parse(secret.SecretString);
      expect(secretData.username).toBe('dbadmin');
    });

    test('secret password should be strong (>= 16 characters)', () => {
      const secretData = JSON.parse(secret.SecretString);
      expect(secretData.password.length).toBeGreaterThanOrEqual(16);
    });

    test('secret ARN should match output', () => {
      expect(secret.ARN).toBe(outputs.DBSecretArn);
    });

    test('secret name should include environment suffix', () => {
      expect(secret.Name).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Resource Integration', () => {
    test('RDS instance should use the deployed security group', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBInstanceIdentifier
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      const sgIds = dbInstance.VpcSecurityGroups.map((sg: any) => sg.VpcSecurityGroupId);
      expect(sgIds).toContain(outputs.SecurityGroupId);
    });

    test('RDS endpoint should be resolvable DNS name', () => {
      expect(outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.RDSEndpoint).toContain(AWS_REGION);
    });

    test('all resources should be in the same region', async () => {
      expect(outputs.RDSEndpoint).toContain(AWS_REGION);
      expect(outputs.DBSecretArn).toContain(AWS_REGION);
    });

    test('infrastructure should support multi-environment deployment pattern', () => {
      expect(outputs.DBInstanceIdentifier).toMatch(/-dev-|-staging-|-prod-/);
    });
  });

  describe('Compliance and Best Practices', () => {
    test('RDS instance should follow naming convention', () => {
      expect(outputs.DBInstanceIdentifier).toMatch(/^migrated-rds-/);
    });

    test('secret should follow naming convention', () => {
      expect(outputs.DBSecretArn).toMatch(/\/rds\/(dev|staging|prod)\/master-password-/);
    });

    test('all resource names should include environment suffix for uniqueness', () => {
      expect(outputs.DBInstanceIdentifier).toContain(environmentSuffix);
      expect(outputs.DBSecretArn).toContain(environmentSuffix);
    });

    test('database should be deployed in private subnets', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBInstanceIdentifier
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('encryption should be enabled for data at rest', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBInstanceIdentifier
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance.StorageEncrypted).toBe(true);
    });
  });
});
