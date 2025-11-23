import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack integration tests', () => {
  let app: cdk.App;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App({
      context: {
        '@aws-cdk/core:stackRelativeExports': true,
      },
    });
    const stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix: 'int',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('synthesizes an EKS cluster with logging enabled', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
      Config: {
        logging: {
          clusterLogging: Match.arrayWith([
            Match.objectLike({
              enabled: true,
              types: Match.arrayWith(['api', 'audit']),
            }),
          ]),
        },
      },
    });
  });

  test('creates the expected number of subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6);
  });

  test('configures the cluster to run Kubernetes 1.28', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
      Config: Match.objectLike({
        version: '1.28',
      }),
    });
  });

  test('creates a managed node group with launch template and scaling settings', () => {
    template.hasResourceProperties('AWS::EKS::Nodegroup', {
      ScalingConfig: Match.objectLike({
        MinSize: 3,
        MaxSize: 9,
        DesiredSize: 3,
      }),
      LaunchTemplate: Match.objectLike({
        Id: Match.anyValue(),
      }),
      InstanceTypes: Match.arrayWith(['t4g.medium']),
      CapacityType: 'ON_DEMAND',
    });
  });

  test('enforces IMDSv2 on the launch template', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        MetadataOptions: {
          HttpTokens: 'required',
          HttpPutResponseHopLimit: 2,
        },
      }),
    });
  });
});
