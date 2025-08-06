import {
  EC2Client,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

// Set AWS Region
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure Integration Tests', () => {
  let bastionIp: string;
  let rdsEndpoint: string;
  let sshCommand: string;
  let secretName: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) throw new Error(`No output found for environment: ${suffix}`);

    const stackOutputs = outputs[stackKey];

    bastionIp = stackOutputs['bastion_public_ip'];
    rdsEndpoint = stackOutputs['rds_instance_endpoint'];
    sshCommand = stackOutputs['ssh_command'];
    secretName = `${suffix}/rds/postgres-creds`;

    if (!bastionIp || !rdsEndpoint || !sshCommand) {
      throw new Error('Missing one or more required outputs in stack.');
    }
  });

  // Bastion Host Tests
  describe('Bastion Host EC2 Instance', () => {
    test(`should be running and have expected tag`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'ip-address',
            Values: [bastionIp],
          },
        ],
      }));

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: expect.stringContaining('-bastion-host'),
          }),
        ])
      );
    }, 20000);
  });

  // RDS Instance Tests
  describe('RDS PostgreSQL Instance', () => {
    test(`should exist and be available`, async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const db = DBInstances?.find(d => d.Endpoint?.Address === rdsEndpoint);

      expect(db).toBeDefined();
      expect(db?.Engine).toBe('postgres');
      expect(db?.DBInstanceStatus).toBe('available');
      expect(db?.PubliclyAccessible).toBe(false);
    }, 20000);
  });

  // Secrets Manager Tests
  describe('Secrets Manager Secret', () => {
    test(`should exist with expected name and tags`, async () => {
      const { Name, Tags } = await secretsManagerClient.send(new DescribeSecretCommand({
        SecretId: secretName,
      }));

      expect(Name).toBe(secretName);
      expect(Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: expect.stringContaining('-rds-secret'),
          }),
        ])
      );
    }, 15000);

    test(`should contain "username" and "password" fields`, async () => {
      const { SecretString } = await secretsManagerClient.send(new GetSecretValueCommand({
        SecretId: secretName,
      }));

      expect(SecretString).toBeDefined();

      const secret = JSON.parse(SecretString!);
      expect(secret).toHaveProperty('username', 'postgresadmin');
      expect(secret).toHaveProperty('password');
      expect(secret.password.length).toBeGreaterThan(8);
    }, 15000);
  });

  // Output Validation
  describe('Terraform Stack Outputs', () => {
    test('should contain a valid SSH command', () => {
      expect(sshCommand).toBe(`ssh ec2-user@${bastionIp}`);
    });
  });
});
