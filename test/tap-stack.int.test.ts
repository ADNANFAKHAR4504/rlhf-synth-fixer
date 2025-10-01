import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Deployment Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.InstanceConnectEndpointId).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
    });

    test('output values have correct formats', () => {
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.EC2InstanceId).toMatch(/^i-/);
      expect(outputs.InstanceConnectEndpointId).toMatch(/^eice-/);
      expect(outputs.RDSEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('WebAppStack was deployed successfully', async () => {
      const allOutputs = JSON.parse(
        fs.readFileSync('cfn-outputs/all-outputs.json', 'utf8')
      );

      const stackNames = Object.keys(allOutputs);
      expect(stackNames.length).toBeGreaterThan(0);

      // Get the first stack (should be TapStack or WebAppStack)
      const stackName = stackNames[0];
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toMatch(
        /CREATE_COMPLETE|UPDATE_COMPLETE/
      );
    });
  });
});
