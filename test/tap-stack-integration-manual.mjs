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

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected} but got ${value}`);
      }
    },
    toMatch(pattern) {
      if (!pattern.test(value)) {
        throw new Error(`Expected ${value} to match ${pattern}`);
      }
    },
    toContain(substring) {
      if (!value.includes(substring)) {
        throw new Error(`Expected ${value} to contain ${substring}`);
      }
    },
    toBeDefined() {
      if (value === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toBeGreaterThanOrEqual(min) {
      if (value < min) {
        throw new Error(`Expected ${value} to be >= ${min}`);
      }
    },
    toBeGreaterThan(min) {
      if (value <= min) {
        throw new Error(`Expected ${value} to be > ${min}`);
      }
    }
  };
}

console.log('Running RDS PostgreSQL Migration Integration Tests...\n');

console.log('Stack Outputs Validation:');
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

console.log('\nRDS Instance Validation:');
const dbCommand = new DescribeDBInstancesCommand({
  DBInstanceIdentifier: outputs.DBInstanceIdentifier
});
const dbResponse = await rdsClient.send(dbCommand);
const dbInstance = dbResponse.DBInstances?.[0];

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
  if (!dbInstance.EnabledCloudwatchLogsExports.includes('postgresql')) {
    throw new Error('postgresql logs export not enabled');
  }
});

test('RDS instance Project tag should be DatabaseMigration', () => {
  const projectTag = dbInstance.TagList.find(tag => tag.Key === 'Project');
  expect(projectTag?.Value).toBe('DatabaseMigration');
});

console.log('\nDB Subnet Group Validation:');
const subnetGroupName = outputs.DBInstanceIdentifier.replace('migrated-rds', 'rds-subnet-group');
const sgCommand = new DescribeDBSubnetGroupsCommand({
  DBSubnetGroupName: subnetGroupName
});
const sgResponse = await rdsClient.send(sgCommand);
const subnetGroup = sgResponse.DBSubnetGroups?.[0];

test('DB subnet group should exist', () => {
  expect(subnetGroup).toBeDefined();
});

test('DB subnet group should have at least 2 subnets', () => {
  expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
});

test('DB subnet group subnets should be in different availability zones', () => {
  const azs = subnetGroup.Subnets.map(subnet => subnet.SubnetAvailabilityZone.Name);
  const uniqueAzs = new Set(azs);
  if (uniqueAzs.size < 2) {
    throw new Error('Subnets must be in at least 2 different AZs');
  }
});

console.log('\nSecurity Group Validation:');
const ec2Command = new DescribeSecurityGroupsCommand({
  GroupIds: [outputs.SecurityGroupId]
});
const ec2Response = await ec2Client.send(ec2Command);
const securityGroup = ec2Response.SecurityGroups?.[0];

test('security group should exist', () => {
  expect(securityGroup).toBeDefined();
});

test('security group should have correct ID', () => {
  expect(securityGroup.GroupId).toBe(outputs.SecurityGroupId);
});

test('security group should have ingress rule for PostgreSQL port', () => {
  const postgresRule = securityGroup.IpPermissions.find(
    rule => rule.FromPort === 5432 && rule.ToPort === 5432
  );
  if (!postgresRule) {
    throw new Error('No ingress rule for port 5432');
  }
});

test('security group Name tag should include environment suffix', () => {
  const nameTag = securityGroup.Tags.find(tag => tag.Key === 'Name');
  expect(nameTag?.Value).toContain(environmentSuffix);
});

console.log('\nSecrets Manager Validation:');
const secretCommand = new GetSecretValueCommand({
  SecretId: outputs.DBSecretArn
});
const secretResponse = await secretsClient.send(secretCommand);

test('secret should exist and be retrievable', () => {
  expect(secretResponse).toBeDefined();
  expect(secretResponse.SecretString).toBeDefined();
});

test('secret should contain username and password', () => {
  const secretData = JSON.parse(secretResponse.SecretString);
  expect(secretData.username).toBeDefined();
  expect(secretData.password).toBeDefined();
});

test('secret username should be dbadmin', () => {
  const secretData = JSON.parse(secretResponse.SecretString);
  expect(secretData.username).toBe('dbadmin');
});

test('secret password should be strong (>= 16 characters)', () => {
  const secretData = JSON.parse(secretResponse.SecretString);
  expect(secretData.password.length).toBeGreaterThanOrEqual(16);
});

test('secret name should include environment suffix', () => {
  expect(secretResponse.Name).toContain(environmentSuffix);
});

console.log('\nEnd-to-End Resource Integration:');
test('RDS instance should use the deployed security group', () => {
  const sgIds = dbInstance.VpcSecurityGroups.map(sg => sg.VpcSecurityGroupId);
  expect(sgIds).toContain(outputs.SecurityGroupId);
});

test('RDS endpoint should be resolvable DNS name', () => {
  expect(outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
  expect(outputs.RDSEndpoint).toContain(AWS_REGION);
});

test('all resources should be in the same region', () => {
  expect(outputs.RDSEndpoint).toContain(AWS_REGION);
  expect(outputs.DBSecretArn).toContain(AWS_REGION);
});

console.log('\nCompliance and Best Practices:');
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

test('database should be deployed in private subnets', () => {
  expect(dbInstance.PubliclyAccessible).toBe(false);
});

test('encryption should be enabled for data at rest', () => {
  expect(dbInstance.StorageEncrypted).toBe(true);
});

console.log(`\n========================================`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
}
