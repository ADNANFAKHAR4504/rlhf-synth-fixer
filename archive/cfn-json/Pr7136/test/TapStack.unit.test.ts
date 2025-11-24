import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Zero-Trust Security Infrastructure');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test('EnvironmentSuffix should have pattern constraint', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have TransitGatewayId parameter', () => {
      expect(template.Parameters.TransitGatewayId).toBeDefined();
      expect(template.Parameters.TransitGatewayId.Type).toBe('String');
    });

    test('should have VpcCidr parameter with default', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should enable DNS', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3).toBeDefined();
    });

    test('private subnets should be in different AZs', () => {
      const az1 = template.Resources.PrivateSubnetAZ1.Properties.AvailabilityZone;
      const az2 = template.Resources.PrivateSubnetAZ2.Properties.AvailabilityZone;
      const az3 = template.Resources.PrivateSubnetAZ3.Properties.AvailabilityZone;

      expect(az1['Fn::Select'][0]).toBe(0);
      expect(az2['Fn::Select'][0]).toBe(1);
      expect(az3['Fn::Select'][0]).toBe(2);
    });

    test('should have 3 firewall subnets', () => {
      expect(template.Resources.FirewallSubnetAZ1).toBeDefined();
      expect(template.Resources.FirewallSubnetAZ2).toBeDefined();
      expect(template.Resources.FirewallSubnetAZ3).toBeDefined();
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('private subnets should be associated with route table', () => {
      expect(template.Resources.PrivateSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3RouteTableAssociation).toBeDefined();
    });
  });

  describe('Transit Gateway', () => {
    test('should have conditional Transit Gateway attachment', () => {
      expect(template.Resources.TransitGatewayAttachment).toBeDefined();
      expect(template.Resources.TransitGatewayAttachment.Condition).toBe('HasTransitGateway');
    });

    test('should have HasTransitGateway condition', () => {
      expect(template.Conditions.HasTransitGateway).toBeDefined();
    });

    test('Transit Gateway attachment should use all 3 private subnets', () => {
      const subnets = template.Resources.TransitGatewayAttachment.Properties.SubnetIds;
      expect(subnets.length).toBe(3);
    });
  });

  describe('Network Firewall', () => {
    test('should have Network Firewall rule group', () => {
      expect(template.Resources.NetworkFirewallRuleGroup).toBeDefined();
      expect(template.Resources.NetworkFirewallRuleGroup.Type).toBe('AWS::NetworkFirewall::RuleGroup');
    });

    test('rule group should be stateful', () => {
      expect(template.Resources.NetworkFirewallRuleGroup.Properties.Type).toBe('STATEFUL');
    });

    test('should have Network Firewall policy', () => {
      expect(template.Resources.NetworkFirewallPolicy).toBeDefined();
      expect(template.Resources.NetworkFirewallPolicy.Type).toBe('AWS::NetworkFirewall::FirewallPolicy');
    });

    test('should have Network Firewall', () => {
      expect(template.Resources.NetworkFirewall).toBeDefined();
      expect(template.Resources.NetworkFirewall.Type).toBe('AWS::NetworkFirewall::Firewall');
    });

    test('Network Firewall should use all 3 firewall subnets', () => {
      const subnets = template.Resources.NetworkFirewall.Properties.SubnetMappings;
      expect(subnets.length).toBe(3);
    });

    test('should have firewall logging configuration', () => {
      expect(template.Resources.NetworkFirewallLogging).toBeDefined();
      expect(template.Resources.NetworkFirewallLogging.Type).toBe('AWS::NetworkFirewall::LoggingConfiguration');
    });

    test('should have firewall log group', () => {
      expect(template.Resources.NetworkFirewallLogGroup).toBeDefined();
      expect(template.Resources.NetworkFirewallLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention policy', () => {
      expect(template.Resources.NetworkFirewallLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log group should have DeletionPolicy Delete', () => {
      expect(template.Resources.NetworkFirewallLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('KMS Keys', () => {
    test('should have EBS KMS key', () => {
      expect(template.Resources.EBSKMSKey).toBeDefined();
      expect(template.Resources.EBSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have S3 KMS key', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have RDS KMS key', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('all KMS keys should have rotation enabled', () => {
      expect(template.Resources.EBSKMSKey.Properties.EnableKeyRotation).toBe(true);
      expect(template.Resources.S3KMSKey.Properties.EnableKeyRotation).toBe(true);
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('all KMS keys should have DeletionPolicy Delete', () => {
      expect(template.Resources.EBSKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.S3KMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.RDSKMSKey.DeletionPolicy).toBe('Delete');
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.EBSKMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
    });

    test('KMS keys should have proper key policies', () => {
      expect(template.Resources.EBSKMSKey.Properties.KeyPolicy).toBeDefined();
      expect(template.Resources.S3KMSKey.Properties.KeyPolicy).toBeDefined();
      expect(template.Resources.RDSKMSKey.Properties.KeyPolicy).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have SSM managed policy', () => {
      const policies = template.Resources.EC2InstanceRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 role should have inline policies', () => {
      const policies = template.Resources.EC2InstanceRole.Properties.Policies;
      expect(policies.length).toBeGreaterThan(0);
    });

    test('EC2 role should not have wildcard permissions', () => {
      const policies = template.Resources.EC2InstanceRole.Properties.Policies;
      const policyStrings = JSON.stringify(policies);
      expect(policyStrings).not.toContain('"Resource":"*"');
      expect(policyStrings).not.toContain('"Action":"*"');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('instance profile should reference EC2 role', () => {
      const roles = template.Resources.EC2InstanceProfile.Properties.Roles;
      expect(roles[0].Ref).toBe('EC2InstanceRole');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Logs bucket', () => {
      expect(template.Resources.VPCFlowLogsBucket).toBeDefined();
      expect(template.Resources.VPCFlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('flow logs bucket should have encryption', () => {
      const encryption = template.Resources.VPCFlowLogsBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('flow logs bucket should block public access', () => {
      const config = template.Resources.VPCFlowLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('flow logs bucket should have versioning enabled', () => {
      expect(template.Resources.VPCFlowLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('flow logs bucket should have lifecycle policy', () => {
      const rules = template.Resources.VPCFlowLogsBucket.Properties.LifecycleConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('flow logs bucket should have DeletionPolicy Delete', () => {
      expect(template.Resources.VPCFlowLogsBucket.DeletionPolicy).toBe('Delete');
    });

    test('should have VPC Flow Logs bucket policy', () => {
      expect(template.Resources.VPCFlowLogsBucketPolicy).toBeDefined();
      expect(template.Resources.VPCFlowLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have VPC Flow Log', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Log should capture ALL traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC Flow Log should depend on bucket policy', () => {
      expect(template.Resources.VPCFlowLog.DependsOn).toBe('VPCFlowLogsBucketPolicy');
    });
  });

  describe('AWS Config', () => {
    test('should have Config bucket', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      expect(template.Resources.ConfigBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Config bucket should have encryption', () => {
      const encryption = template.Resources.ConfigBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('Config bucket should have DeletionPolicy Delete', () => {
      expect(template.Resources.ConfigBucket.DeletionPolicy).toBe('Delete');
    });

    test('should have Config role', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });

    test('Config role should use correct managed policy', () => {
      const policies = template.Resources.ConfigRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should have Config recorder', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('Config recorder should use RoleARN property', () => {
      expect(template.Resources.ConfigRecorder.Properties.RoleARN).toBeDefined();
    });

    test('Config recorder should record all resources', () => {
      const recordingGroup = template.Resources.ConfigRecorder.Properties.RecordingGroup;
      expect(recordingGroup.AllSupported).toBe(true);
      expect(recordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have Config delivery channel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have encrypted-volumes config rule', () => {
      expect(template.Resources.ConfigRuleEncryptedVolumes).toBeDefined();
      expect(template.Resources.ConfigRuleEncryptedVolumes.Type).toBe('AWS::Config::ConfigRule');
    });

    test('encrypted-volumes rule should depend on ConfigRecorder', () => {
      expect(template.Resources.ConfigRuleEncryptedVolumes.DependsOn).toBe('ConfigRecorder');
    });

    test('should have iam-password-policy config rule', () => {
      expect(template.Resources.ConfigRuleIAMPasswordPolicy).toBeDefined();
      expect(template.Resources.ConfigRuleIAMPasswordPolicy.Type).toBe('AWS::Config::ConfigRule');
    });

    test('iam-password-policy rule should depend on ConfigRecorder', () => {
      expect(template.Resources.ConfigRuleIAMPasswordPolicy.DependsOn).toBe('ConfigRecorder');
    });
  });

  describe('GuardDuty', () => {
    test('should not have GuardDuty detector (account-level resource)', () => {
      expect(template.Resources.GuardDutyDetector).toBeUndefined();
    });
  });

  describe('Systems Manager Endpoints', () => {
    test('should have SSM endpoint security group', () => {
      expect(template.Resources.SSMEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.SSMEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('SSM security group should allow HTTPS from VPC', () => {
      const ingress = template.Resources.SSMEndpointSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
    });

    test('should have SSM endpoint', () => {
      expect(template.Resources.SSMEndpoint).toBeDefined();
      expect(template.Resources.SSMEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have SSM Messages endpoint', () => {
      expect(template.Resources.SSMMessagesEndpoint).toBeDefined();
      expect(template.Resources.SSMMessagesEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have EC2 Messages endpoint', () => {
      expect(template.Resources.EC2MessagesEndpoint).toBeDefined();
      expect(template.Resources.EC2MessagesEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('all SSM endpoints should be Interface type', () => {
      expect(template.Resources.SSMEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(template.Resources.SSMMessagesEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(template.Resources.EC2MessagesEndpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('all SSM endpoints should have private DNS enabled', () => {
      expect(template.Resources.SSMEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(template.Resources.SSMMessagesEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(template.Resources.EC2MessagesEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('all SSM endpoints should use all 3 private subnets', () => {
      expect(template.Resources.SSMEndpoint.Properties.SubnetIds.length).toBe(3);
      expect(template.Resources.SSMMessagesEndpoint.Properties.SubnetIds.length).toBe(3);
      expect(template.Resources.EC2MessagesEndpoint.Properties.SubnetIds.length).toBe(3);
    });
  });

  describe('Resource Naming', () => {
    test('VPC should include environmentSuffix in name', () => {
      const name = template.Resources.VPC.Properties.Tags.find((t: any) => t.Key === 'Name').Value;
      expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('all subnets should include environmentSuffix in name', () => {
      const checkSubnet = (resourceName: string) => {
        const name = template.Resources[resourceName].Properties.Tags.find((t: any) => t.Key === 'Name').Value;
        expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      };

      checkSubnet('PrivateSubnetAZ1');
      checkSubnet('PrivateSubnetAZ2');
      checkSubnet('PrivateSubnetAZ3');
      checkSubnet('FirewallSubnetAZ1');
      checkSubnet('FirewallSubnetAZ2');
      checkSubnet('FirewallSubnetAZ3');
    });

    test('Network Firewall resources should include environmentSuffix', () => {
      expect(template.Resources.NetworkFirewallRuleGroup.Properties.RuleGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.NetworkFirewallPolicy.Properties.FirewallPolicyName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.NetworkFirewall.Properties.FirewallName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('IAM role should include environmentSuffix', () => {
      expect(template.Resources.EC2InstanceRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 buckets should include environmentSuffix', () => {
      expect(template.Resources.VPCFlowLogsBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.ConfigBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should export VPCId', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export all private subnet IDs', () => {
      expect(template.Outputs.PrivateSubnetAZ1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnetAZ2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnetAZ3Id).toBeDefined();
    });

    test('should export Network Firewall ARN', () => {
      expect(template.Outputs.NetworkFirewallArn).toBeDefined();
    });

    test('should export all KMS key ARNs', () => {
      expect(template.Outputs.EBSKMSKeyArn).toBeDefined();
      expect(template.Outputs.S3KMSKeyArn).toBeDefined();
      expect(template.Outputs.RDSKMSKeyArn).toBeDefined();
    });

    test('should export EC2 role and profile ARNs', () => {
      expect(template.Outputs.EC2InstanceRoleArn).toBeDefined();
      expect(template.Outputs.EC2InstanceProfileArn).toBeDefined();
    });

    test('should export bucket names', () => {
      expect(template.Outputs.VPCFlowLogsBucketName).toBeDefined();
      expect(template.Outputs.ConfigBucketName).toBeDefined();
    });

    test('should export SSM endpoint DNS', () => {
      expect(template.Outputs.SSMEndpointDNS).toBeDefined();
    });

    test('should not export GuardDuty detector ID', () => {
      expect(template.Outputs.GuardDutyDetectorId).toBeUndefined();
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('S3 buckets should block public access', () => {
      const checkBucket = (resourceName: string) => {
        if (template.Resources[resourceName].Type === 'AWS::S3::Bucket') {
          const config = template.Resources[resourceName].Properties.PublicAccessBlockConfiguration;
          expect(config.BlockPublicAcls).toBe(true);
          expect(config.BlockPublicPolicy).toBe(true);
          expect(config.IgnorePublicAcls).toBe(true);
          expect(config.RestrictPublicBuckets).toBe(true);
        }
      };

      checkBucket('VPCFlowLogsBucket');
      checkBucket('ConfigBucket');
    });

    test('no security groups should allow unrestricted access', () => {
      const sg = template.Resources.SSMEndpointSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.CidrIp).not.toBe('0.0.0.0/0');
    });
  });
});
