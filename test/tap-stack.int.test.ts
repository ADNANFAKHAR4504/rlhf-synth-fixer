import fs from 'fs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

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
  const client = new EC2Client({ region: 'us-east-1' }); // NOTE: Replace with your actual region

  test('VPC resource should exist and be in the "available" state', async () => {
    // Assert that the VPCId was successfully exported from the stack
    expect(vpcId).toBeDefined();

    try {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await client.send(command);
      
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

  // You can add more tests here to check for other resources, e.g., the ALB or RDS instance
  // using their respective SDK clients (ElasticLoadBalancingV2Client, RDSClient).
  // Example placeholder:
  // test('ALB should be deployed and in an "active" state', async () => {
  //   const albDnsName = outputs.ALBDNSName;
  //   // Use AWS SDK for ELB to describe the load balancer and assert its state
  //   expect(albDnsName).toBeDefined();
  //   // ...
  // });
});
