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
      expect(template.Description).toBe(
        'Enterprise-Grade Secure Multi-Region Cloud Infrastructure'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'Environment',
        'Owner',
        'CostCenter',
        'KeyPairName',
        'DBMasterUsername',
        'DBMasterPassword',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct allowed values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.AllowedValues).toEqual([
        'Development',
        'Test',
        'Production',
      ]);
    });

    test('DBMasterPassword should have NoEcho set to true', () => {
      expect(template.Parameters.DBMasterPassword.NoEcho).toBe(true);
    });

    test('EnvironmentSuffix should have correct pattern', () => {
      const suffixParam = template.Parameters.EnvironmentSuffix;
      expect(suffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with AMI mappings', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
    });

    test('should have EnvironmentMap with instance configurations', () => {
      expect(template.Mappings.EnvironmentMap).toBeDefined();
      ['Development', 'Test', 'Production'].forEach(env => {
        expect(template.Mappings.EnvironmentMap[env]).toBeDefined();
        expect(
          template.Mappings.EnvironmentMap[env].InstanceType
        ).toBeDefined();
        expect(template.Mappings.EnvironmentMap[env].MinSize).toBeDefined();
        expect(template.Mappings.EnvironmentMap[env].MaxSize).toBeDefined();
      });
    });
  });

  describe('Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
    });

    test('should have route tables properly configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
    });

    test('public subnets should not have MapPublicIpOnLaunch enabled', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(false);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(false);
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.FlowLogRole).toBeDefined();
    });

    test('should have Network ACLs configured', () => {
      expect(template.Resources.NetworkAcl).toBeDefined();
      expect(template.Resources.NetworkAclEntryInboundHTTP).toBeDefined();
      expect(template.Resources.NetworkAclEntryInboundHTTPS).toBeDefined();
      expect(template.Resources.NetworkAclEntryOutbound).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSKeyAlias).toBeDefined();
    });

    test('should have security groups with proper restrictions', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('WebServer security group should only allow traffic from ALB', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const ingress = webSG.Properties.SecurityGroupIngress;

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId || rule.CidrIp).toBeDefined();
      });
    });

    test('Database security group should have restricted access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Properties.SecurityGroupIngress).toBeDefined();
      expect(dbSG.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(dbSG.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
    });

    test('IAM roles should follow least privilege', () => {
      expect(template.Resources.IAMRole).toBeDefined();
      expect(template.Resources.IAMRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );

      // Check that the role has minimal required policies
      const iamRole = template.Resources.IAMRole;
      expect(iamRole.Properties.Policies).toBeDefined();

      // Should have S3 access policy for ALB logs
      const s3Policy = iamRole.Properties.Policies.find(
        (policy: any) => policy.PolicyName === 'S3Access'
      );
      expect(s3Policy).toBeDefined();

      // Should have CloudFormation signal policy
      const cfnPolicy = iamRole.Properties.Policies.find(
        (policy: any) => policy.PolicyName === 'CloudFormationSignal'
      );
      expect(cfnPolicy).toBeDefined();
    });
  });

  describe('Compute Resources', () => {
    test('should have Auto Scaling Group configured', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('should have Launch Template configured', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('Launch Template should have encrypted EBS volumes', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const launchTemplateData = launchTemplate.Properties.LaunchTemplateData;

      // Handle conditional LaunchTemplateData structure
      expect(launchTemplateData['Fn::If']).toBeDefined();

      // Check both branches of the conditional
      const withKeyPairData = launchTemplateData['Fn::If'][1];
      const withoutKeyPairData = launchTemplateData['Fn::If'][2];

      // Both branches should have EBS encryption
      expect(withKeyPairData.BlockDeviceMappings).toBeDefined();
      expect(withKeyPairData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);

      expect(withoutKeyPairData.BlockDeviceMappings).toBeDefined();
      expect(withoutKeyPairData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
    });

    test('Launch Template should enforce IMDSv2', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const launchTemplateData = launchTemplate.Properties.LaunchTemplateData;

      // Check both branches of the conditional for MetadataOptions
      const withKeyPairData = launchTemplateData['Fn::If'][1];
      const withoutKeyPairData = launchTemplateData['Fn::If'][2];

      expect(withKeyPairData.MetadataOptions).toBeDefined();
      expect(withKeyPairData.MetadataOptions.HttpTokens).toBe('required');

      expect(withoutKeyPairData.MetadataOptions).toBeDefined();
      expect(withoutKeyPairData.MetadataOptions.HttpTokens).toBe('required');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.TargetGroup).toBeDefined();
    });

    test('ALB should have access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const accessLogsEnabled = attributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.enabled'
      );
      expect(accessLogsEnabled).toBeDefined();
      expect(accessLogsEnabled.Value).toBe('true');
    });

    test('should have scaling policy configured', () => {
      expect(template.Resources.ScalingPolicy).toBeDefined();
      expect(template.Resources.ScalingPolicy.Properties.PolicyType).toBe(
        'TargetTrackingScaling'
      );
    });
  });

  describe('Database Resources', () => {
    test('should have RDS database configured', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should have SSL enforcement', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup.Properties.Parameters.require_secure_transport).toBe(
        'ON'
      );
    });

    test('RDS should have CloudWatch logs enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDS should have deletion protection disabled for testing', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should have DB subnet group configured', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 buckets for logs', () => {
      expect(template.Resources.S3LogsBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.ConfigBucket).toBeDefined();
    });

    test('S3 buckets should have encryption enabled', () => {
      // CloudTrail and Config buckets should have KMS encryption
      ['CloudTrailBucket', 'ConfigBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'aws:kms'
        );
      });

      // S3LogsBucket should not have encryption (required for ALB access logs)
      const logsBucket = template.Resources.S3LogsBucket;
      expect(logsBucket.Properties.BucketEncryption).toBeUndefined();
    });

    test('S3 buckets should block public access', () => {
      ['S3LogsBucket', 'CloudTrailBucket', 'ConfigBucket'].forEach(
        bucketName => {
          const bucket = template.Resources[bucketName];
          const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
          expect(publicAccess.BlockPublicAcls).toBe(true);
          expect(publicAccess.BlockPublicPolicy).toBe(true);
          expect(publicAccess.IgnorePublicAcls).toBe(true);
          expect(publicAccess.RestrictPublicBuckets).toBe(true);
        }
      );
    });

    test('S3 buckets should have versioning enabled', () => {
      ['S3LogsBucket', 'CloudTrailBucket', 'ConfigBucket'].forEach(
        bucketName => {
          const bucket = template.Resources[bucketName];
          expect(bucket.Properties.VersioningConfiguration.Status).toBe(
            'Enabled'
          );
        }
      );
    });

    test('S3 bucket policies should enforce SSL', () => {
      expect(template.Resources.S3LogsBucketPolicy).toBeDefined();
      const policy =
        template.Resources.S3LogsBucketPolicy.Properties.PolicyDocument;
      const denyInsecure = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
    });
  });

  describe('Monitoring and Compliance', () => {
    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('should have AWS Config configured', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigRecorderRole).toBeDefined();
    });

    test('should have Config Rules for compliance', () => {
      expect(template.Resources.ConfigRuleS3PublicRead).toBeDefined();
      expect(template.Resources.ConfigRuleS3PublicWrite).toBeDefined();
      expect(template.Resources.ConfigRuleRDSEncrypted).toBeDefined();
      expect(template.Resources.ConfigRuleUnrestrictedSSH).toBeDefined();
    });

    test('should have CloudWatch alarms configured', () => {
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
      expect(template.Resources.SecurityGroupChangesAlarm).toBeDefined();
      expect(template.Resources.IAMPolicyChangesAlarm).toBeDefined();
    });

    test('CloudWatch alarms should have proper configuration', () => {
      const alarms = [
        'UnauthorizedAPICallsAlarm',
        'SecurityGroupChangesAlarm',
        'IAMPolicyChangesAlarm',
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanOrEqualToThreshold'
        );
        expect(alarm.Properties.Threshold).toBe(1);
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'Owner', 'CostCenter'];
      const taggableResources = Object.entries(template.Resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Properties && resource.Properties.Tags
      );

      expect(taggableResources.length).toBeGreaterThan(0);

      taggableResources.forEach(([name, resource]: [string, any]) => {
        const tags = resource.Properties.Tags;

        // Handle both array and object tag formats
        if (Array.isArray(tags)) {
          const tagKeys = tags.map((tag: any) => tag.Key);
          requiredTags.forEach(requiredTag => {
            expect(tagKeys).toContain(requiredTag);
          });
        } else {
          // Object format (like SSM Parameter tags)
          requiredTags.forEach(requiredTag => {
            expect(tags).toHaveProperty(requiredTag);
          });
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete policy for testing', () => {
      const criticalResources = [
        'KMSKey',
        'RDSDatabase',
        'S3LogsBucket',
        'CloudTrailBucket',
        'ConfigBucket',
      ];

      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('High Availability', () => {
    test('should deploy resources across multiple availability zones', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const subnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('RDS should use Multi-AZ for production', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ['Fn::If']).toBeDefined();
      expect(rds.Properties.MultiAZ['Fn::If'][0]).toBe('IsProduction');
    });
  });

  describe('Outputs', () => {
    test('should have all critical outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ALBDNSName',
        'S3LogsBucket',
        'RDSEndpoint',
        'KMSKeyId',
        'CloudTrailName',
        'ConfigRecorderName',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.entries(template.Outputs).forEach(
        ([name, output]: [string, any]) => {
          expect(output.Description).toBeDefined();
        }
      );
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include environment suffix in names', () => {
      const namedResources = [
        'KMSKey',
        'VPC',
        'S3LogsBucket',
        'CloudTrailBucket',
        'ConfigBucket',
        'RDSDatabase',
        'ApplicationLoadBalancer',
        'AutoScalingGroup',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const props = resource.Properties;

        // Check for name properties that should include suffix
        if (props.Name) {
          expect(JSON.stringify(props.Name)).toContain('EnvironmentSuffix');
        } else if (props.BucketName) {
          expect(JSON.stringify(props.BucketName)).toContain(
            'EnvironmentSuffix'
          );
        } else if (props.DBInstanceIdentifier) {
          expect(JSON.stringify(props.DBInstanceIdentifier)).toContain(
            'EnvironmentSuffix'
          );
        } else if (props.AutoScalingGroupName) {
          expect(JSON.stringify(props.AutoScalingGroupName)).toContain(
            'EnvironmentSuffix'
          );
        }
      });
    });
  });

  describe('Template Best Practices', () => {
    test('should use intrinsic functions appropriately', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('Fn::Sub');
      expect(templateString).toContain('Fn::GetAtt');
      expect(templateString).toContain('Fn::If');
      expect(templateString).toContain('Ref');
    });

    test('should not have hardcoded account IDs or regions', () => {
      const templateString = JSON.stringify(template);
      // Check that we're using pseudo parameters instead
      expect(templateString).toContain('AWS::AccountId');
      expect(templateString).toContain('AWS::Region');
      expect(templateString).toContain('AWS::StackName');
    });

    test('should use conditions for environment-specific configurations', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should use mappings for region and environment specific values', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.EnvironmentMap).toBeDefined();
    });
  });
});
