import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
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

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {
    const requiredParameters = [
      'StackName', 'Environment', 'DBUsername', 'TrustedCIDR',
      'DBEngine', 'DBEngineVersion', 'AppInstanceType', 'LambdaFunctionName'
    ];

    requiredParameters.forEach(paramName => {
      test(`should have ${paramName} parameter`, () => {
        expect(template.Parameters[paramName]).toBeDefined();
        expect(template.Parameters[paramName].Type).toBe('String');
        expect(template.Parameters[paramName].Description).toBeDefined();
      });
    });

    test('StackName parameter should have correct properties', () => {
      const param = template.Parameters.StackName;
      expect(param.Default).toBe('tapstack');
      expect(param.MaxLength).toBe(50);
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Default).toBe('prod');
    });

    test('DBUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Default).toBe('admin');
      expect(param.MaxLength).toBe(16);
    });

    test('TrustedCIDR parameter should have correct default', () => {
      const param = template.Parameters.TrustedCIDR;
      expect(param.Default).toBe('0.0.0.0/0');
    });

    test('DBEngine parameter should have correct default', () => {
      const param = template.Parameters.DBEngine;
      expect(param.Default).toBe('mysql');
    });

    test('DBEngineVersion parameter should have correct default', () => {
      const param = template.Parameters.DBEngineVersion;
      expect(param.Default).toBe('8.0.42');
    });

    test('AppInstanceType parameter should have correct default', () => {
      const param = template.Parameters.AppInstanceType;
      expect(param.Default).toBe('t3.micro');
    });

  });


  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment resource', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have all public subnets', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.VpcId.Ref).toBe('VPC');
      });
    });

    test('should have all private subnets', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.VpcId.Ref).toBe('VPC');
      });
    });

    test('should have EIPs for NAT Gateways', () => {
      const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];
      eips.forEach(eip => {
        expect(template.Resources[eip]).toBeDefined();
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
      });
    });

    test('should have NAT Gateways', () => {
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
      natGateways.forEach(nat => {
        expect(template.Resources[nat]).toBeDefined();
        expect(template.Resources[nat].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have route tables', () => {
      const routeTables = ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];
      routeTables.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have routes', () => {
      const routes = ['DefaultPublicRoute', 'DefaultPrivateRoute1', 'DefaultPrivateRoute2', 'DefaultPrivateRoute3'];
      routes.forEach(route => {
        expect(template.Resources[route]).toBeDefined();
        expect(template.Resources[route].Type).toBe('AWS::EC2::Route');
      });
    });

    test('should have route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation', 'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation', 'PrivateSubnet3RouteTableAssociation'
      ];
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    const securityGroups = [
      'BastionSecurityGroup', 'AppSecurityGroup', 'ALBSecurityGroup',
      'RDSSecurityGroup', 'LambdaSecurityGroup'
    ];

    securityGroups.forEach(sg => {
      test(`should have ${sg} resource`, () => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources[sg].Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources[sg].Properties.GroupDescription).toBeDefined();
      });
    });

    test('should have security group ingress rules', () => {
      const ingressRules = [
        'BastionToAppSecurityGroupRule', 'AppToRDSMySQLSecurityGroupRule',
        'AppToRDSPostgreSQLSecurityGroupRule', 'LambdaToRDSMySQLSecurityGroupRule',
        'LambdaToRDSPostgreSQLSecurityGroupRule'
      ];
      ingressRules.forEach(rule => {
        expect(template.Resources[rule]).toBeDefined();
        expect(template.Resources[rule].Type).toBe('AWS::EC2::SecurityGroupIngress');
      });
    });
  });

  describe('S3 Buckets', () => {
    const buckets = ['S3AccessLogsBucket', 'AppS3Bucket', 'CloudTrailBucket'];

    buckets.forEach(bucket => {
      test(`should have ${bucket} resource`, () => {
        expect(template.Resources[bucket]).toBeDefined();
        expect(template.Resources[bucket].Type).toBe('AWS::S3::Bucket');
        expect(template.Resources[bucket].Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(template.Resources[bucket].Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(template.Resources[bucket].Properties.BucketEncryption).toBeDefined();
      });
    });

    test('CloudTrailBucket should have OwnershipControls', () => {
      expect(template.Resources.CloudTrailBucket.Properties.OwnershipControls).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerEnforced');
    });

    test('should have CloudTrailBucketPolicy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2InstanceRole', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceRole.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Properties.Policies).toBeDefined();
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have VPCFlowLogRole (created internally)', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have LambdaExecutionRole (created internally)', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have SecurityHubLambdaRole (created internally)', () => {
      expect(template.Resources.SecurityHubLambdaRole).toBeDefined();
      expect(template.Resources.SecurityHubLambdaRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('RDS Resources', () => {
    test('should have RDSInstance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RDSInstance.Properties.Engine.Ref).toBe('DBEngine');
      expect(template.Resources.RDSInstance.Properties.EngineVersion.Ref).toBe('DBEngineVersion');
    });

    test('RDSInstance should have DeletionProtection set to false', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('should have DBSecret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBSecret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have DBSubnetGroup (created internally)', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('EC2 Resources', () => {
    test('should have TapStackKeyPair', () => {
      expect(template.Resources.TapStackKeyPair).toBeDefined();
      expect(template.Resources.TapStackKeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('should have BastionHost', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.BastionHost.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have AppLaunchTemplate', () => {
      expect(template.Resources.AppLaunchTemplate).toBeDefined();
      expect(template.Resources.AppLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(template.Resources.AppLaunchTemplate.Properties.LaunchTemplateData).toBeDefined();
    });

    test('should have AppAutoScalingGroup', () => {
      expect(template.Resources.AppAutoScalingGroup).toBeDefined();
      expect(template.Resources.AppAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(template.Resources.AppAutoScalingGroup.Properties.LaunchTemplate).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ALB', () => {
      expect(template.Resources.ALB).toBeDefined();
      expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ALB.Properties.Scheme).toBe('internet-facing');
      expect(template.Resources.ALB.Properties.Subnets).toHaveLength(2);
    });

    test('should have ALBTargetGroup', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.ALBTargetGroup.Properties.Port).toBe(80);
      expect(template.Resources.ALBTargetGroup.Properties.Protocol).toBe('HTTP');
    });

    test('should have ALBListener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListener.Properties.LoadBalancerArn.Ref).toBe('ALB');
    });
  });

  describe('WAF Resources', () => {
    test('should have WAFWebACL', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
      expect(template.Resources.WAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(template.Resources.WAFWebACL.Properties.Scope).toBe('REGIONAL');
      expect(template.Resources.WAFWebACL.Properties.Rules).toBeDefined();
    });

    test('should have WAFWebACLAssociation', () => {
      expect(template.Resources.WAFWebACLAssociation).toBeDefined();
      expect(template.Resources.WAFWebACLAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(template.Resources.WAFWebACLAssociation.Properties.ResourceArn.Ref).toBe('ALB');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrailTrail', () => {
      expect(template.Resources.CloudTrailTrail).toBeDefined();
      expect(template.Resources.CloudTrailTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrailTrail should depend on CloudTrailBucketPolicy', () => {
      expect(template.Resources.CloudTrailTrail.DependsOn).toBe('CloudTrailBucketPolicy');
    });
  });

  describe('Lambda Resources', () => {
    test('should have LambdaFunction', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have SecurityHubLambdaFunction', () => {
      expect(template.Resources.SecurityHubLambdaFunction).toBeDefined();
      expect(template.Resources.SecurityHubLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have SecurityHubCustomResource', () => {
      expect(template.Resources.SecurityHubCustomResource).toBeDefined();
      expect(template.Resources.SecurityHubCustomResource.Type).toBe('AWS::CloudFormation::CustomResource');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPCFlowLogGroup', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.VPCFlowLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have VPCFlowLog', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });
  });

  describe('Resource Tagging', () => {
    test('key resources should have team and iac-rlhf-amazon tags', () => {
      const keyResources = ['TapStackKeyPair', 'VPC', 'RDSInstance', 'BastionHost', 'LambdaFunction'];
      
      keyResources.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties && template.Resources[resourceName].Properties.Tags) {
          const resource = template.Resources[resourceName];
          const tags = resource.Properties.Tags;
          const teamTag = tags.find((tag: any) => tag.Key === 'team');
          const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');

          expect(teamTag).toBeDefined();
          expect(teamTag.Value).toBe('2');
          expect(iacTag).toBeDefined();
          expect(iacTag.Value).toBe('true');
        }
      });
    });

    test('AutoScaling Group tags should have PropagateAtLaunch', () => {
      const asgTags = template.Resources.AppAutoScalingGroup.Properties.Tags;
      asgTags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBe(true);
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('S3 buckets should use secureenv naming pattern', () => {
      const buckets = ['S3AccessLogsBucket', 'AppS3Bucket', 'CloudTrailBucket'];
      buckets.forEach(bucket => {
        const bucketName = template.Resources[bucket].Properties.BucketName;
        expect(bucketName['Fn::Sub'][0]).toContain('secureenv-${AWS::AccountId}-${AWS::Region}');
      });
    });
  });

  describe('Outputs Validation', () => {
    const expectedOutputs = [
      'VPCId', 'BastionHostPublicIP', 'BastionHostDNS', 'ALBDNSName',
      'CloudTrailName', 'RDSEndpoint', 'AppS3BucketName',
      'LambdaFunctionName', 'SecurityHubStatus'
    ];

    expectedOutputs.forEach(outputName => {
      test(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

  });

  describe('Security Validation', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['S3AccessLogsBucket', 'AppS3Bucket', 'CloudTrailBucket'];
      buckets.forEach(bucket => {
        const encryption = template.Resources[bucket].Properties.BucketEncryption;
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      const buckets = ['S3AccessLogsBucket', 'AppS3Bucket', 'CloudTrailBucket'];
      buckets.forEach(bucket => {
        const publicAccessBlock = template.Resources[bucket].Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS should have encryption enabled', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('EC2 instances should have encrypted EBS volumes', () => {
      const bastionEbs = template.Resources.BastionHost.Properties.BlockDeviceMappings[0].Ebs;
      expect(bastionEbs.Encrypted).toBe(true);

      const launchTemplateEbs = template.Resources.AppLaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(launchTemplateEbs.Encrypted).toBe(true);
    });
  });

  describe('High Availability', () => {
    test('RDS should have MultiAZ enabled', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('ALB should be in multiple subnets', () => {
      expect(template.Resources.ALB.Properties.Subnets).toHaveLength(2);
    });

    test('Auto Scaling Group should use multiple AZs', () => {
      const asg = template.Resources.AppAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });

    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrailTrail).toBeDefined();
    });

    test('should have WAF configured', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
      expect(template.Resources.WAFWebACLAssociation).toBeDefined();
    });
  });

  describe('Template Completeness', () => {
    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});

