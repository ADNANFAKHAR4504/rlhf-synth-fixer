const fs = require('fs');
const path = require('path');
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toBe(
      'TAP Stack - Task Assignment Platform CloudFormation Template'
    );
  });
  test('should have metadata section', () => {
    expect(template.Metadata).toBeDefined();
    expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
  });

  test('should have all expected resources', () => {
    const expectedResources = [
      'EncryptionKey', 'EncryptionKeyAlias', 'VPC', 'InternetGateway', 'VPCGatewayAttachment',
      'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'NatGatewayEIP',
      'NatGateway', 'PublicRouteTable', 'PrivateRouteTable', 'PublicRoute', 'PrivateRoute',
      'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation',
      'PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation',
      'PublicNetworkAcl', 'PrivateNetworkAcl', 'PublicNetworkAclEntryInboundHTTP',
      'PublicNetworkAclEntryInboundHTTPS', 'PublicNetworkAclEntryInboundSSH',
      'PublicNetworkAclEntryInboundEphemeral', 'PublicNetworkAclEntryOutbound',
      'PrivateNetworkAclEntryInboundVPC', 'PrivateNetworkAclEntryOutbound',
      'PublicSubnet1NetworkAclAssociation', 'PublicSubnet2NetworkAclAssociation',
      'PrivateSubnet1NetworkAclAssociation', 'PrivateSubnet2NetworkAclAssociation',
      'AppDataBucket', 'AppDataBucketPolicy', 'ALBSecurityGroup', 'WebAppSecurityGroup',
      'DatabaseSecurityGroup', 'EC2InstanceRole', 'EC2InstanceProfile', 'ApplicationLoadBalancer',
      'ALBTargetGroup', 'ALBListener', 'WebAppLaunchTemplate', 'WebAppAutoScalingGroup',
      'ScaleUpPolicy', 'CPUAlarmHigh', 'DBSubnetGroup', 'Database', 'DBPassword', 'AppLogGroup',
      'ConfigRecorder', 'ConfigDeliveryChannel', 'ConfigBucket', 'ConfigRole'
    ];
    for (const res of expectedResources) {
      expect(template.Resources[res]).toBeDefined();
    }
  });

  test('should have all expected outputs', () => {
    const expectedOutputs = [
      'StackName', 'EnvironmentSuffix', 'VPCID', 'PublicSubnet1ID', 'PublicSubnet2ID',
      'PrivateSubnet1ID', 'PrivateSubnet2ID', 'LoadBalancerDNS', 'AppDataBucketName',
      'DatabaseEndpoint', 'KMSKeyARN'
    ];
    for (const out of expectedOutputs) {
      expect(template.Outputs[out]).toBeDefined();
    }
  });
  test('all resource tags and names should include environmentSuffix', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Properties && res.Properties.Tags) {
        for (const tag of res.Properties.Tags) {
          if (typeof tag.Value === 'string') {
            expect(tag.Value).toContain(environmentSuffix);
          }
        }
      }
      if (res.Properties && res.Properties.BucketName) {
        if (typeof res.Properties.BucketName === 'string') {
          expect(res.Properties.BucketName).toContain(environmentSuffix);
        }
      }
    }
  });

  test('outputs should reference correct resources', () => {
    expect(template.Outputs.StackName.Value.Ref).toBe('AWS::StackName');
    expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe('EnvironmentSuffix');
    expect(template.Outputs.VPCID.Value.Ref).toBe('VPC');
    expect(template.Outputs.PublicSubnet1ID.Value.Ref).toBe('PublicSubnet1');
    expect(template.Outputs.PublicSubnet2ID.Value.Ref).toBe('PublicSubnet2');
    expect(template.Outputs.PrivateSubnet1ID.Value.Ref).toBe('PrivateSubnet1');
    expect(template.Outputs.PrivateSubnet2ID.Value.Ref).toBe('PrivateSubnet2');
    expect(template.Outputs.AppDataBucketName.Value.Ref).toBe('AppDataBucket');
    expect(template.Outputs.KMSKeyARN.Value['Fn::GetAtt'][0]).toBe('EncryptionKey');
    expect(template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt'][0]).toBe('Database');
  });

  test('IAM roles should follow least privilege', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Type === 'AWS::IAM::Role') {
        const policies = res.Properties.Policies || [];
        for (const policy of policies) {
          const doc = policy.PolicyDocument;
          for (const stmt of doc.Statement) {
            if (Array.isArray(stmt.Action)) {
              for (const action of stmt.Action) {
                expect(action).not.toBe('*');
              }
            } else if (typeof stmt.Action === 'string') {
              expect(stmt.Action).not.toBe('*');
            }
          }
        }
      }
    }
  });

  test('resources should have encryption and policy where required', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Type === 'AWS::S3::Bucket') {
        expect(res.Properties.BucketEncryption).toBeDefined();
      }
      if (res.Type === 'AWS::RDS::DBInstance') {
        expect(res.Properties.StorageEncrypted).toBe(true);
        expect(res.Properties.KmsKeyId).toBeDefined();
      }
    }
  });

  test('all resources should match CloudFormation schema basics', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      expect(res.Type).toMatch(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/);
      expect(res.Properties).toBeDefined();
    }
  });
});
