import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MultiEnvEcsStack } from '../lib/multienv-ecs-stack';

interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName: string;
  domainName: string;
}

const envConfig: EnvironmentConfig = {
  envName: 'dev',
  vpcCidr: '10.0.0.0/16',
  hostedZoneName: 'dummy.local',
  domainName: 'api.dummy.local',
};

describe.only('MultiEnvEcsStack', () => {
  let app: cdk.App;
  let stack: MultiEnvEcsStack;
  let template: Template;

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  beforeEach(() => {

    app = new cdk.App();
    stack = new MultiEnvEcsStack(app, 'MultiEnvEcsStack', envConfig, { env: { account: '12345678', region: 'us-east-2' } });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a MultiEnvEcsStack instance', () => {
      expect(stack).toBeInstanceOf(MultiEnvEcsStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack).toBeDefined()
    });
  });
});
