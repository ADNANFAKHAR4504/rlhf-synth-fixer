import fs from 'fs';
import path from 'path';

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
        'Secure, scalable, and highly available web application architecture'
      );
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'EnvironmentSuffix',
      'ExistingVPCId',
      'SSHAccessCIDR',
      'S3AccessCIDR',
      'DBMasterUsername',
      'DBMasterPassword'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('ExistingVPCId parameter should have correct properties', () => {
      const param = template.Parameters.ExistingVPCId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('vpc-123abcde');
      expect(param.Description).toBe('Existing VPC ID where resources will be deployed');
    });

    test('SSHAccessCIDR parameter should have correct properties', () => {
      const param = template.Parameters.SSHAccessCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.0.113.0/24');
      expect(param.Description).toBe('CIDR block allowed for SSH access');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('DBMasterPassword parameter should have NoEcho set to true', () => {
      const param = template.Parameters.DBMasterPassword;
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(41);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should have AMI mappings for multiple regions', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-east-1'].AMI).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['eu-west-1']).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have all subnet resources', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DBSubnet1',
        'DBSubnet2'
      ];
      
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('subnets should use EnvironmentSuffix in naming', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnet1', 'DBSubnet2'];
      
      subnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag.Value).toEqual({
          'Fn::Sub': `${subnet}-\${EnvironmentSuffix}`
        });
      });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway should use EnvironmentSuffix', () => {
      const natGateway = template.Resources.NATGateway;
      const tags = natGateway.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'WebApp-NAT-Gateway-${EnvironmentSuffix}'
      });
    });

    test('should have route tables and routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];
      
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have all security groups', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];
      
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ALB Security Group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('EC2 Security Group should reference ALB security group and SSH CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(3);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress[2].CidrIp).toEqual({ Ref: 'SSHAccessCIDR' });
    });

    test('RDS Security Group should only allow MySQL from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('security groups should use EnvironmentSuffix in naming', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];
      
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        const tags = sg.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2Role;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 role should have managed policies', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 role should have S3 access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3AccessPolicy');
      expect(policies[0].PolicyDocument.Statement).toHaveLength(2);
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2Role' });
    });

    test('should have CloudTrail IAM role', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('CloudTrail role should have correct permissions', () => {
      const role = template.Resources.CloudTrailRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(role.Properties.Policies[0].PolicyName).toBe('CloudTrailLogsPolicy');
    });
  });

  describe('S3 Buckets', () => {
    test('should have AppDataBucket and AppLogsBucket', () => {
      expect(template.Resources.AppDataBucket).toBeDefined();
      expect(template.Resources.AppDataBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.AppLogsBucket).toBeDefined();
      expect(template.Resources.AppLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('buckets should have encryption enabled', () => {
      const buckets = ['AppDataBucket', 'AppLogsBucket'];
      
      buckets.forEach(bucket => {
        const encryption = template.Resources[bucket].Properties.BucketEncryption;
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm)
          .toBe('AES256');
      });
    });

    test('buckets should block public access', () => {
      const buckets = ['AppDataBucket', 'AppLogsBucket'];
      
      buckets.forEach(bucket => {
        const publicAccess = template.Resources[bucket].Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('bucket names should include EnvironmentSuffix', () => {
      const buckets = ['AppDataBucket', 'AppLogsBucket'];
      
      buckets.forEach(bucket => {
        const bucketName = template.Resources[bucket].Properties.BucketName;
        expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('should have bucket policies', () => {
      expect(template.Resources.AppDataBucketPolicy).toBeDefined();
      expect(template.Resources.AppDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(template.Resources.AppLogsBucketPolicy).toBeDefined();
      expect(template.Resources.AppLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('RDS Database', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should have correct configuration', () => {
      const rds = template.Resources.RDSInstance;
      
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(rds.Properties.AllocatedStorage).toBe(100);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.DeletionProtection).toBe(true);
    });

    test('RDS instance name should include EnvironmentSuffix', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('RDS should have Snapshot deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should have correct configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      
      expect(data.InstanceType).toBe('t3.medium');
      expect(data.IamInstanceProfile).toBeDefined();
      expect(data.SecurityGroupIds).toHaveLength(1);
      expect(data.UserData).toBeDefined();
    });

    test('launch template name should include EnvironmentSuffix', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group name should include EnvironmentSuffix', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.AutoScalingGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should have correct configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.IpAddressType).toBe('ipv4');
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.SecurityGroups).toHaveLength(1);
    });

    test('ALB name should include EnvironmentSuffix', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB listener should forward to target group', () => {
      const listener = template.Resources.ALBListener;
      
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have log groups', () => {
      expect(template.Resources.WebAppLogGroup).toBeDefined();
      expect(template.Resources.WebAppLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have retention periods', () => {
      expect(template.Resources.WebAppLogGroup.Properties.RetentionInDays).toBe(14);
      expect(template.Resources.CloudTrailLogGroup.Properties.RetentionInDays).toBe(90);
    });

    test('log group names should include EnvironmentSuffix', () => {
      const webAppLog = template.Resources.WebAppLogGroup;
      const cloudTrailLog = template.Resources.CloudTrailLogGroup;
      
      expect(webAppLog.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(cloudTrailLog.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have CloudWatch alarms', () => {
      const alarms = ['CPUAlarmHigh', 'CPUAlarmLow', 'ALBTargetHealthAlarm'];
      
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('CPU alarms should trigger scaling policies', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;
      
      expect(highAlarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleUpPolicy' });
      expect(lowAlarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleDownPolicy' });
    });

    test('alarm names should include EnvironmentSuffix', () => {
      const alarms = ['CPUAlarmHigh', 'CPUAlarmLow', 'ALBTargetHealthAlarm'];
      
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('CloudTrail Auditing', () => {
    test('should have CloudTrail trail', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have correct configuration', () => {
      const trail = template.Resources.CloudTrail;
      
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'AppLogsBucket' });
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail name should include EnvironmentSuffix', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.TrailName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have CloudTrail log stream', () => {
      expect(template.Resources.CloudTrailLogStream).toBeDefined();
      expect(template.Resources.CloudTrailLogStream.Type).toBe('AWS::Logs::LogStream');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'LoadBalancerDNS',
      'LoadBalancerURL',
      'RDSEndpoint',
      'AppDataBucket',
      'AppLogsBucket',
      'AutoScalingGroupName',
      'NATGatewayEIP',
      'EnvironmentSuffix'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(expectedOutputs.length);
    });

    test('LoadBalancerDNS output should reference ALB', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('RDSEndpoint output should reference RDS instance', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address']
      });
    });

    test('most outputs should have exports', () => {
      // LoadBalancerURL is an exception - it doesn't need an export
      const outputsRequiringExport = Object.keys(template.Outputs).filter(
        key => key !== 'LoadBalancerURL'
      );
      
      outputsRequiringExport.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should follow naming convention', () => {
      const outputsWithExports = Object.keys(template.Outputs).filter(
        key => template.Outputs[key].Export
      );
      
      outputsWithExports.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NATGateway EIP should depend on Internet Gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('Public route should depend on Internet Gateway attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('Auto Scaling Group should reference target group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'TargetGroup' });
    });

    test('ALB listener should reference target group', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('Template Completeness', () => {
    test('should have correct total number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(44); // Count of all resources in the template
    });

    test('all resources with names should use EnvironmentSuffix', () => {
      const resourcesWithNames = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (
          resource.Properties.Name ||
          resource.Properties.BucketName ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.AutoScalingGroupName ||
          resource.Properties.LaunchTemplateName ||
          resource.Properties.TrailName ||
          resource.Properties.LogGroupName ||
          resource.Properties.AlarmName
        );
      });

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const props = resource.Properties;
        const nameField = props.Name || props.BucketName || props.DBInstanceIdentifier || 
                         props.AutoScalingGroupName || props.LaunchTemplateName || 
                         props.TrailName || props.LogGroupName || props.AlarmName;
        
        if (typeof nameField === 'object' && nameField['Fn::Sub']) {
          expect(nameField['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all taggable resources should have Environment tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const tags = resource.Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      });
    });
  });
});
