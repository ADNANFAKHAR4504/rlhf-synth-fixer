import fs from 'fs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';

// Load CloudFormation stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Web App Template Integration Tests', () => {
  // It's good practice to wrap tests in a 'beforeAll' for async setup,
  // but for a simple case like this, we can load the outputs directly.
  const vpcId = outputs.VPCId;
  const albDnsName = outputs.ALBDNSName;
  const dbEndpoint = outputs.DBEndpoint;

  const ec2Client = new EC2Client({ region: 'us-east-1' }); // NOTE: Replace with your actual region
  const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
  const rdsClient = new RDSClient({ region: 'us-east-1' });


  test('VPC resource should exist and be in the "available" state', async () => {
    // Assert that the VPCId was successfully exported from the stack
    expect(vpcId).toBeDefined();

    try {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);
      
      // Ensure the VPCs array is defined and contains at least one VPC
      if (!response.Vpcs || response.Vpcs.length === 0) {
        fail('No VPC found with the provided ID.');
      }
      
      // The API should return exactly one VPC matching the ID
      expect(response.Vpcs.length).toBe(1);
      
      // Further check to ensure the VPC is in the expected state
      expect(response.Vpcs[0].State).toBe('available');
      console.log(`Successfully found VPC: ${vpcId}`);

    } catch (error) {
      console.error('Error describing VPC:', error);
      fail('Failed to find VPC resource with the AWS SDK.');
    }
  });

  test('ALB should be deployed and in an "active" state', async () => {
    // Assert that the ALB DNS name was successfully exported from the stack
    expect(albDnsName).toBeDefined();

    try {
      const command = new DescribeLoadBalancersCommand({
        Names: [albDnsName.split('.')[0]]
      });
      const response = await elbClient.send(command);
      
      if (!response.LoadBalancers || response.LoadBalancers.length === 0) {
        fail('No ALB found with the provided DNS name.');
      }
      
      expect(response.LoadBalancers.length).toBe(1);
      expect(response.LoadBalancers[0].State?.Code).toBe('active');
      console.log(`Successfully found ALB: ${albDnsName}`);

    } catch (error) {
      console.error('Error describing ALB:', error);
      fail('Failed to find ALB resource with the AWS SDK.');
    }
  });

  test('RDS DB instance should be deployed and in an "available" state', async () => {
    // Assert that the DB endpoint was successfully exported from the stack
    expect(dbEndpoint).toBeDefined();

    try {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbEndpoint.split('.')[0]
      });
      const response = await rdsClient.send(command);

      if (!response.DBInstances || response.DBInstances.length === 0) {
        fail('No RDS instance found with the provided endpoint.');
      }

      expect(response.DBInstances.length).toBe(1);
      expect(response.DBInstances[0].DBInstanceStatus).toBe('available');
      console.log(`Successfully found RDS instance: ${dbEndpoint}`);
      
    } catch (error) {
      console.error('Error describing RDS instance:', error);
      fail('Failed to find RDS resource with the AWS SDK.');
    }
  });

});
