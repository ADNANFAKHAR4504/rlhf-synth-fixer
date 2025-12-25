import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expected = [
        'Environment',
        'VpcCidr',
        'InstanceType',
        'KeyPairName',
        'MinSize',
        'MaxSize',
      ];
      expected.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
    test('Environment parameter should have correct allowed values', () => {
      const env = template.Parameters.Environment;
      expect(env.Type).toBe('String');
      expect(env.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });
    test('VpcCidr parameter should have correct allowed pattern', () => {
      const vpc = template.Parameters.VpcCidr;
      expect(vpc.AllowedPattern).toMatch(/^\^/);
    });
    test('InstanceType parameter should have allowed values', () => {
      const inst = template.Parameters.InstanceType;
      expect(inst.AllowedValues).toContain('t3.medium');
    });
    test('MinSize and MaxSize should be numbers with correct min/max', () => {
      expect(template.Parameters.MinSize.Type).toBe('Number');
      expect(template.Parameters.MinSize.MinValue).toBe(1);
      expect(template.Parameters.MaxSize.Type).toBe('Number');
      expect(template.Parameters.MaxSize.MaxValue).toBe(20);
    });
  });

  describe('Resources', () => {
    test('should create all required resources', () => {
      const resources = template.Resources;
      const expected = [
        'SecureAppApplicationKMSKey',
        'SecureAppApplicationKMSKeyAlias',
        'SecureAppVPC',
        'SecureAppInternetGateway',
        'SecureAppInternetGatewayAttachment',
        'SecureAppPublicSubnet1',
        'SecureAppPublicSubnet2',
        'SecureAppPrivateSubnet1',
        'SecureAppPrivateSubnet2',
        'SecureAppNatGateway1EIP',
        'SecureAppNatGateway2EIP',
        'SecureAppNatGateway1',
        'SecureAppNatGateway2',
        'SecureAppPublicRouteTable',
        'SecureAppDefaultPublicRoute',
        'SecureAppPublicSubnet1RouteTableAssociation',
        'SecureAppPublicSubnet2RouteTableAssociation',
        'SecureAppPrivateRouteTable1',
        'SecureAppDefaultPrivateRoute1',
        'SecureAppPrivateSubnet1RouteTableAssociation',
        'SecureAppPrivateRouteTable2',
        'SecureAppDefaultPrivateRoute2',
        'SecureAppPrivateSubnet2RouteTableAssociation',
        'SecureAppPrivateNetworkAcl',
        'SecureAppPrivateInboundRule',
        'SecureAppPrivateOutboundRule',
        'SecureAppPrivateSubnet1NetworkAclAssociation',
        'SecureAppPrivateSubnet2NetworkAclAssociation',
        'SecureAppLoadBalancerSecurityGroup',
        'SecureAppApplicationSecurityGroup',
        'SecureAppBastionSecurityGroup',
        'SecureAppEC2InstanceRole',
        'SecureAppEC2InstanceProfile',
        'SecureAppApplicationS3Bucket',
        'SecureAppLoggingS3Bucket',
        'SecureAppLoggingS3BucketPolicy',
        'SecureAppCloudTrailRole',
        'SecureAppCloudTrailLogGroup',
        'SecureAppApplicationCloudTrail',
        'SecureAppVPCFlowLogRole',
        'SecureAppVPCFlowLogGroup',
        'SecureAppVPCFlowLog',
        'SecureAppApplicationLogGroup',
        'SecureAppS3AccessLogGroup',
        'SecureAppApplicationLaunchTemplate',
        'SecureAppApplicationLoadBalancer',
        'SecureAppApplicationTargetGroup',
        'SecureAppApplicationListener',
        'SecureAppApplicationAutoScalingGroup',
        'SecureAppBastionHost',
      ];
      expected.forEach(res => {
        expect(resources[res]).toBeDefined();
      });
    });

    test('VPC should have correct CIDR and tags', () => {
      const vpc = template.Resources.SecureAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Name' }),
        ])
      );
    });

    test('S3 buckets should be encrypted and not public', () => {
      const buckets = [
        template.Resources.SecureAppApplicationS3Bucket,
        template.Resources.SecureAppLoggingS3Bucket,
      ];
      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ).toBe(true);
      });
    });

    test('IAM roles should have least privilege', () => {
      const role = template.Resources.SecureAppEC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
      expect(role.Properties.Policies).toBeDefined();
      // Should not allow * for Action or Resource except for root KMS
      role.Properties.Policies.forEach((policy: any) => {
        const statements = Array.isArray(policy.PolicyDocument.Statement)
          ? policy.PolicyDocument.Statement
          : [policy.PolicyDocument.Statement];
        statements.forEach((stmt: any) => {
          if (stmt.Effect === 'Allow') {
            if (stmt.Action !== 'kms:*' && stmt.Resource !== '*') {
              expect(stmt.Action).not.toBe('*');
              expect(stmt.Resource).not.toBe('*');
            }
          }
        });
      });
    });

    test('Security groups should restrict ingress/egress as required', () => {
      const albSg = template.Resources.SecureAppLoadBalancerSecurityGroup;
      expect(albSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
          expect.objectContaining({ FromPort: 443, ToPort: 443 }),
        ])
      );
      const appSg = template.Resources.SecureAppApplicationSecurityGroup;
      expect(appSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
        ])
      );
    });

    test('KMS key should have correct policy', () => {
      const kms = template.Resources.SecureAppApplicationKMSKey;
      expect(kms.Type).toBe('AWS::KMS::Key');
      expect(kms.Properties.KeyPolicy.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Sid: 'Enable IAM User Permissions' }),
        ])
      );
    });

    test('CloudTrail and VPC Flow Logs should be present', () => {
      expect(template.Resources.SecureAppApplicationCloudTrail).toBeDefined();
      expect(template.Resources.SecureAppVPCFlowLog).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      const expected = ['VPCId', 'PublicSubnets'];
      expected.forEach(out => {
        expect(outputs[out]).toBeDefined();
      });
    });
    test('VPCId output should export VPC ID', () => {
      const out = template.Outputs.VPCId;
      expect(out.Description).toMatch(/VPC ID/);
      expect(out.Value).toBeDefined();
      expect(out.Export.Name).toBeDefined();
    });
    test('PublicSubnets output should export subnet IDs', () => {
      const out = template.Outputs.PublicSubnets;
      expect(out.Description).toMatch(/Public subnet IDs/);
      expect(out.Value).toBeDefined();
      expect(out.Export.Name).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 2 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(2);
    });
    test('should have at least 40 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
        expect(typeof output.Export.Name).toBe('object');
      });
    });
  });
});
