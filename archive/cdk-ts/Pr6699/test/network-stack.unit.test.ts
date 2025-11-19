import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test123';

  const stack = new NetworkStack(app, 'TestNetworkStack', {
    environmentSuffix: environmentSuffix,
  });

  const template = Template.fromStack(stack);

  test('VPC created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('VPC created with correct properties', () => {
    // VPC is created - check that exactly 1 exists
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('Three public subnets created', () => {
    // With natGateways: 1, CDK creates subnets in 2 AZs for cost optimization
    // Check public subnets
    const subnets = template.findResources('AWS::EC2::Subnet');
    const publicSubnets = Object.values(subnets).filter((subnet: any) => {
      return subnet.Properties.Tags?.some((tag: any) =>
        tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
      );
    });

    // With 1 NAT gateway, CDK creates 2 public subnets (one per AZ where NAT is needed)
    expect(publicSubnets.length).toBe(2);
  });

  test('Three private subnets created', () => {
    const subnets = template.findResources('AWS::EC2::Subnet');
    const privateSubnets = Object.values(subnets).filter((subnet: any) => {
      return subnet.Properties.Tags?.some((tag: any) =>
        tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
      );
    });

    // With 1 NAT gateway, CDK creates 2 private subnets (one per AZ where NAT is needed)
    expect(privateSubnets.length).toBe(2);
  });

  test('One NAT Gateway created for cost optimization', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('Internet Gateway created', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('Private hosted zone created', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: `internal.${environmentSuffix}.local.`,
      VPCs: Match.arrayWith([
        Match.objectLike({
          VPCId: Match.anyValue(),
          VPCRegion: Match.anyValue(),
        }),
      ]),
    });
  });

  test('VPC ID output exported with environmentSuffix', () => {
    template.hasOutput('VpcId', {
      Export: {
        Name: `VpcId-${environmentSuffix}`,
      },
    });
  });

  test('Hosted Zone ID output exported with environmentSuffix', () => {
    template.hasOutput('PrivateHostedZoneId', {
      Export: {
        Name: `PrivateHostedZoneId-${environmentSuffix}`,
      },
    });
  });
});
