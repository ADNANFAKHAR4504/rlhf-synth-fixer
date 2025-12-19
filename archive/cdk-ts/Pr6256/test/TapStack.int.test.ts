import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/TapStack';

describe('TapStack integration', () => {
  const defaultProps = {
    environmentSuffix: 'integration',
    env: {
      account: '123456789012',
      region: 'eu-central-2',
    },
  };

  test('synth produces VPC, log group, and S3 endpoint resources', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'IntegrationStack', defaultProps);
    const assembly = app.synth();
    const artifact = assembly.getStackArtifact(stack.artifactId);
    const resources = (artifact.template.Resources || {}) as Record<string, { Type: string }>;

    const resourceTypes = Object.values(resources).map((resource) => resource.Type);
    expect(resourceTypes).toEqual(
      expect.arrayContaining(['AWS::EC2::VPC', 'AWS::EC2::VPCEndpoint', 'AWS::Logs::LogGroup'])
    );
  });

  test('stack outputs expose subnet and endpoint metadata', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'IntegrationOutputsStack', {
      ...defaultProps,
      environmentSuffix: 'integration-outputs',
    });
    const assembly = app.synth();
    const artifact = assembly.getStackArtifact(stack.artifactId);
    const outputs = (artifact.template.Outputs || {}) as Record<string, unknown>;

    expect(outputs).toEqual(
      expect.objectContaining({
        VpcId: expect.anything(),
        PublicSubnet1Id: expect.anything(),
        PublicSubnet2Id: expect.anything(),
        PublicSubnet3Id: expect.anything(),
        PrivateSubnet1Id: expect.anything(),
        PrivateSubnet2Id: expect.anything(),
        PrivateSubnet3Id: expect.anything(),
        S3EndpointId: expect.anything(),
        FlowLogsLogGroup: expect.anything(),
      })
    );
  });
});
