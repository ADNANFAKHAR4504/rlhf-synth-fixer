import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Secure Web Infrastructure Unit Test', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../../../templates/cfn-yaml/lib/IDEAL_RESPONSE.md');
    const file = fs.readFileSync(templatePath, 'utf8');
    const parsed = yaml.parse(file.split('```yaml')[1].split('```')[0]);
    template = Template.fromJSON(parsed);
  });

  test('VPC should be created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('EC2 Instance should be of type t3.micro', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 't3.micro',
      },
    });
  });

  test('RDS should be encrypted and Multi-AZ', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: true,
      StorageEncrypted: true,
    });
  });

  test('SecretsManager should be used for DB credentials', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('AutoScalingGroup should target three subnets', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      VPCZoneIdentifier: expect.arrayContaining([
        expect.anything(), expect.anything(), expect.anything(),
      ]),
    });
  });

  test('CloudFront should be configured with origin and HTTPS redirect', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Enabled: true,
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  test('WAF WebACL should have monitoring enabled', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        SampledRequestsEnabled: true,
      },
    });
  });

  test('KMS key should have key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('LoadBalancer should span 3 subnets', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Subnets: expect.arrayContaining([
        expect.anything(), expect.anything(), expect.anything(),
      ]),
    });
  });

  test('Instance profile should be created', () => {
    template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
  });

  test('SNS Alarm topic must exist', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });
});
