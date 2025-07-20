import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters, Resources, Outputs sections', () => {
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expected = [
        'EnvironmentSuffix',
        'VpcCidr',
        'AMIId',
        'RdsInstanceType',
      ];
      expect(Object.keys(template.Parameters).sort()).toEqual(expected.sort());
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toMatch(/environment suffix/i);
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toMatch(/alphanumeric/i);
    });

    test('AMIId parameter should be of correct type', () => {
      const param = template.Parameters.AMIId;
      expect(param.Type).toBe('AWS::EC2::Image::Id');
      expect(param.Default).toMatch(/^ami-/);
    });
  });

  describe('Resources', () => {
    test('should have all expected resources', () => {
      const expected = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway1',
        'ElasticIP1',
        'PublicRouteTable',
        'PrivateRouteTable',
        'PublicRoute',
        'PrivateRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'FlowLogsLogGroup',
        'FlowLogsRole',
        'FlowLogs',
        'EC2InstanceRole',
        'EC2InstanceProfile',
        'LaunchTemplate',
        'AutoScalingGroup',
        'EC2SecurityGroup',
        'CPUAlarm',
        'SNSTopic',
        'RDSSecret',
        'RDSInstance',
        'RDSSecurityGroup',
        'DBSubnetGroup',
        'ElastiCacheSubnetGroup',
        'ElastiCacheCluster',
        'ElastiCacheSecurityGroup',
        'S3Bucket',
        'CloudFrontDistribution',
        'WAFWebACL',
      ];
      expect(Object.keys(template.Resources).sort()).toEqual(expected.sort());
    });

    test('VPC should have correct CIDR and tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags[0].Value['Fn::Sub']).toMatch(
        /vpc-\${EnvironmentSuffix}/
      );
    });

    test('AutoScalingGroup should reference LaunchTemplate', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(5);
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
        Ref: 'LaunchTemplate',
      });
    });

    test('RDSSecret should have correct username, exclusions', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(
        secret.Properties.GenerateSecretString.SecretStringTemplate
      ).toContain('"masteruser"');
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe(
        '/@" '
      );
    });

    test('RDSInstance should use RDSSecret and have DeletionPolicy Delete', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.Properties.DBInstanceClass).toEqual({
        Ref: 'RdsInstanceType',
      });
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.MasterUsername['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('ElastiCacheCluster should use custom subnet group', () => {
      const ec = template.Resources.ElastiCacheCluster;
      expect(ec.Type).toBe('AWS::ElastiCache::CacheCluster');
      expect(ec.Properties.Engine).toBe('redis');
      expect(ec.Properties.CacheSubnetGroupName).toEqual({
        Ref: 'ElastiCacheSubnetGroup',
      });
    });

    test('CloudFrontDistribution should use S3 bucket as origin', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Type).toBe('AWS::CloudFront::Distribution');
      const origin = cf.Properties.DistributionConfig.Origins[0];
      expect(origin.DomainName['Fn::GetAtt'][0]).toBe('S3Bucket');
    });

    test('WAFWebACL should have AWSManagedRulesCommonRuleSet', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(
        waf.Properties.Rules[0].Statement.ManagedRuleGroupStatement.Name
      ).toBe('AWSManagedRulesCommonRuleSet');
    });

    test('All resources should have Type and Properties', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'VpcId',
        'S3BucketName',
        'S3BucketArn',
        'RDSEndpoint',
        'ElastiCacheEndpoint',
        'AutoScalingGroupName',
        'CloudFrontDomainName',
        'CloudWatchAlarmArn',
        'WAFWebACLArn',
      ];
      expect(Object.keys(template.Outputs).sort()).toEqual(expected.sort());
    });

    test('VpcId output should reference VPC', () => {
      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
    });

    test('S3BucketArn output should use Fn::GetAtt', () => {
      expect(template.Outputs.S3BucketArn.Value['Fn::GetAtt'][0]).toBe(
        'S3Bucket'
      );
    });

    test('RDSEndpoint output should use Fn::GetAtt', () => {
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt'][0]).toBe(
        'RDSInstance'
      );
    });

    test('CloudFrontDomainName output should use Fn::GetAtt', () => {
      expect(template.Outputs.CloudFrontDomainName.Value['Fn::GetAtt'][0]).toBe(
        'CloudFrontDistribution'
      );
    });

    test('All outputs should have Value', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
      });
    });
  });

  describe('Naming and Conventions', () => {
    test('All resource names and tags should include environment suffix', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          resource.Properties.Tags.forEach((tag: any) => {
            if (typeof tag.Value === 'object' && tag.Value['Fn::Sub']) {
              expect(tag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
            }
          });
        }
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should not have any undefined or null required sections', () => {
      [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs',
      ].forEach(key => {
        expect(template[key]).toBeDefined();
        expect(template[key]).not.toBeNull();
      });
    });

    test('All resources should have unique logical IDs', () => {
      const ids = Object.keys(template.Resources);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });
});
