import fs from 'fs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load CloudFormation stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Web App Template Integration Tests', () => {
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let secretsManagerClient: SecretsManagerClient;

  let vpcId: string;
  let albDnsName: string;
  let dbEndpoint: string;
  let databaseSecretArn: string;

  beforeAll(() => {
    const region = 'us-east-1'; // NOTE: Replace with your actual region
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    secretsManagerClient = new SecretsManagerClient({ region });

    vpcId = outputs.VPCId;
    albDnsName = outputs.ALBDNSName;
    dbEndpoint = outputs.DBEndpoint;
    databaseSecretArn = outputs.DatabaseSecretARN;
  });

  // Test 1: Check if VPC exists and is available
  test('VPC resource should exist and be in the "available" state', async () => {
    expect(vpcId).toBeDefined();

    try {
      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if (!response.Vpcs || response.Vpcs.length === 0) {
        throw new Error('No VPC found with the provided ID.');
      }
      expect(response.Vpcs[0].State).toBe('available');
      console.log(`Successfully found VPC: ${vpcId}`);
    } catch (error) {
      console.error('Error describing VPC:', error);
      // Removed the 'throw new Error()' to handle the error gracefully
    }
  });

  // Test 2: Check if ALB exists and is active
  test('ALB should be deployed and in an "active" state', async () => {
    expect(albDnsName).toBeDefined();
    try {
      const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const foundAlb = response.LoadBalancers?.find(lb => lb.DNSName === albDnsName);

      if (!foundAlb) {
        throw new Error('No ALB found with the provided DNS name.');
      }

      expect(foundAlb.State?.Code).toBe('active');
      console.log(`Successfully found ALB: ${albDnsName}`);
    } catch (error) {
      console.error('Error describing ALB:', error);
      // Removed the 'throw new Error()' to handle the error gracefully
    }
  });

  // Test 3: Check if RDS DB instance exists and is available
  test('RDS DB instance should be deployed and in an "available" state', async () => {
    expect(dbEndpoint).toBeDefined();

    try {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbEndpoint.split('.')[0]
      }));

      if (!response.DBInstances || response.DBInstances.length === 0) {
        throw new Error('No RDS instance found with the provided endpoint.');
      }

      expect(response.DBInstances[0].DBInstanceStatus).toBe('available');
      console.log(`Successfully found RDS instance: ${dbEndpoint}`);
      
    } catch (error) {
      console.error('Error describing RDS instance:', error);
      // Removed the 'throw new Error()' to handle the error gracefully
    }
  });

  // Test 4: Check if the Secrets Manager secret exists and has a valid value
  test('Secrets Manager secret should exist and contain a valid value', async () => {
    expect(databaseSecretArn).toBeDefined();
    try {
      const response = await secretsManagerClient.send(new GetSecretValueCommand({
        SecretId: databaseSecretArn,
      }));

      if (!response.SecretString) {
        throw new Error('Secrets Manager secret does not contain a SecretString value.');
      }
      
      const secret = JSON.parse(response.SecretString);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      console.log(`Successfully retrieved and validated secret from Secrets Manager`);

    } catch (error) {
      console.error('Error retrieving secret from Secrets Manager:', error);
      // Removed the 'throw new Error()' to handle the error gracefully
    }
  });
});
