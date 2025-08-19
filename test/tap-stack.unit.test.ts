import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('High Availability Web Application CloudFormation Template Unit Tests', () => {
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

    test('should have a proper description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('High Availability Web Application');
      expect(template.Description).toContain('Multi-AZ');
      expect(template.Description).toContain('us-east-1');
    });

    test('should have Mappings section with existing resources', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.Existing).toBeDefined();
      expect(template.Mappings.Existing.ARNs).toBeDefined();
      expect(template.Mappings.Existing.ALB).toBeDefined();
      expect(template.Mappings.Existing.ARNs.AlbArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(template.Mappings.Existing.ALB.DnsName).toMatch(/\.elb\.amazonaws\.com$/);
      expect(template.Mappings.Existing.ALB.CanonicalHostedZoneId).toBe('Z35SXDOTRQ7X7K');
    });
  });

  describe('Resources - VPC and Networking', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.30.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags[0].Key).toBe('Name');
    });

    test('should have Internet Gateway and attachment', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachIgw;
      
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two public subnets in different AZs', () => {
      const publicSubnetA = template.Resources.PublicSubnetA;
      const publicSubnetB = template.Resources.PublicSubnetB;
      
      expect(publicSubnetA).toBeDefined();
      expect(publicSubnetB).toBeDefined();
      expect(publicSubnetA.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnetB.Type).toBe('AWS::EC2::Subnet');
      
      expect(publicSubnetA.Properties.CidrBlock).toBe('10.30.0.0/24');
      expect(publicSubnetB.Properties.CidrBlock).toBe('10.30.1.0/24');
      expect(publicSubnetA.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnetB.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Check different AZs
      expect(publicSubnetA.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnetB.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have two private subnets in different AZs', () => {
      const privateSubnetA = template.Resources.PrivateSubnetA;
      const privateSubnetB = template.Resources.PrivateSubnetB;
      
      expect(privateSubnetA).toBeDefined();
      expect(privateSubnetB).toBeDefined();
      expect(privateSubnetA.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnetB.Type).toBe('AWS::EC2::Subnet');
      
      expect(privateSubnetA.Properties.CidrBlock).toBe('10.30.10.0/24');
      expect(privateSubnetB.Properties.CidrBlock).toBe('10.30.11.0/24');
      expect(privateSubnetA.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnetB.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have NAT Gateways for high availability', () => {
      const natEipA = template.Resources.NatEipA;
      const natEipB = template.Resources.NatEipB;
      const natGwA = template.Resources.NatGwA;
      const natGwB = template.Resources.NatGwB;
      
      expect(natEipA).toBeDefined();
      expect(natEipB).toBeDefined();
      expect(natEipA.Type).toBe('AWS::EC2::EIP');
      expect(natEipB.Type).toBe('AWS::EC2::EIP');
      expect(natEipA.Properties.Domain).toBe('vpc');
      expect(natEipB.Properties.Domain).toBe('vpc');
      
      expect(natGwA).toBeDefined();
      expect(natGwB).toBeDefined();
      expect(natGwA.Type).toBe('AWS::EC2::NatGateway');
      expect(natGwB.Type).toBe('AWS::EC2::NatGateway');
      expect(natGwA.DependsOn).toBe('AttachIgw');
      expect(natGwB.DependsOn).toBe('AttachIgw');
      expect(natGwA.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetA' });
      expect(natGwB.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetB' });
    });

    test('should have public and private route tables with correct routes', () => {
      const publicRT = template.Resources.PublicRT;
      const publicRoute = template.Resources.PublicDefaultRoute;
      const privateRTA = template.Resources.PrivateRTA;
      const privateRTB = template.Resources.PrivateRTB;
      const privateRouteA = template.Resources.PrivateRouteA;
      const privateRouteB = template.Resources.PrivateRouteB;
      
      expect(publicRT).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      
      expect(privateRTA).toBeDefined();
      expect(privateRTB).toBeDefined();
      expect(privateRTA.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRTB.Type).toBe('AWS::EC2::RouteTable');
      
      expect(privateRouteA).toBeDefined();
      expect(privateRouteB).toBeDefined();
      expect(privateRouteA.Properties.NatGatewayId).toEqual({ Ref: 'NatGwA' });
      expect(privateRouteB.Properties.NatGatewayId).toEqual({ Ref: 'NatGwB' });
    });

    test('should have subnet route table associations', () => {
      const assocPublicA = template.Resources.AssocPublicA;
      const assocPublicB = template.Resources.AssocPublicB;
      const assocPrivateA = template.Resources.AssocPrivateA;
      const assocPrivateB = template.Resources.AssocPrivateB;
      
      expect(assocPublicA).toBeDefined();
      expect(assocPublicB).toBeDefined();
      expect(assocPrivateA).toBeDefined();
      expect(assocPrivateB).toBeDefined();
      
      expect(assocPublicA.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assocPublicA.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetA' });
      expect(assocPublicA.Properties.RouteTableId).toEqual({ Ref: 'PublicRT' });
      
      expect(assocPrivateA.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnetA' });
      expect(assocPrivateA.Properties.RouteTableId).toEqual({ Ref: 'PrivateRTA' });
    });
  });

  describe('Resources - Security Groups', () => {
    test('should have Instance Security Group with HTTP access', () => {
      const instanceSG = template.Resources.InstanceSG;
      expect(instanceSG).toBeDefined();
      expect(instanceSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(instanceSG.Properties.GroupDescription).toContain('HTTP');
      expect(instanceSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      const httpRule = instanceSG.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('10.30.0.0/16');
    });

    test('should have Database Security Group with MySQL access from instances', () => {
      const dbSG = template.Resources.DBSG;
      expect(dbSG).toBeDefined();
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Properties.GroupDescription).toContain('MySQL');
      
      const mysqlRule = dbSG.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'InstanceSG' });
    });
  });

  describe('Resources - IAM', () => {
    test('should have EC2 Role with SSM permissions', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have EC2 Instance Profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });
  });

  describe('Resources - Web Tier (ALB, Target Group, ASG)', () => {
    test('should have Target Group with correct configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.Matcher.HttpCode).toBe('200-399');
      
      const deregDelay = tg.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'deregistration_delay.timeout_seconds'
      );
      expect(deregDelay.Value).toBe('30');
    });

    test('should have Launch Template with user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const ltData = lt.Properties.LaunchTemplateData;
      expect(ltData.ImageId).toContain('resolve:ssm');
      expect(ltData.InstanceType).toBe('t2.micro');
      expect(ltData.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
      expect(ltData.SecurityGroupIds).toContainEqual({ Ref: 'InstanceSG' });
      expect(ltData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group with correct settings', () => {
      const asg = template.Resources.ASG;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnetA' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnetB' });
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      expect(asg.Properties.TargetGroupARNs).toContainEqual({ Ref: 'TargetGroup' });
    });

    test('should have CPU Target Tracking Scaling Policy', () => {
      const policy = template.Resources.CpuTargetTracking;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(50.0);
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType)
        .toBe('ASGAverageCPUUtilization');
    });
  });

  describe('Resources - Database', () => {
    test('should have DB Subnet Group with private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnetA' });
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnetB' });
    });

    test('should have DB Secret with auto-generated password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Retain');
      expect(secret.UpdateReplacePolicy).toBe('Retain');
      
      const genString = secret.Properties.GenerateSecretString;
      expect(genString.SecretStringTemplate).toBe('{"username":"dbadmin"}');
      expect(genString.GenerateStringKey).toBe('password');
      expect(genString.PasswordLength).toBe(16);
    });

    test('should have RDS instance with Multi-AZ and encryption', () => {
      const db = template.Resources.DBInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
      
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.AllocatedStorage).toBe(20);
      expect(db.Properties.StorageType).toBe('gp3');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DBSG' });
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });
  });

  describe('Resources - S3 and KMS', () => {
    test('should have KMS key with key rotation enabled', () => {
      const kmsKey = template.Resources.S3KmsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Retain');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement[0].Sid).toBe('EnableRootPermissions');
      expect(keyPolicy.Statement[0].Effect).toBe('Allow');
      expect(keyPolicy.Statement[0].Action).toBe('kms:*');
    });

    test('should have S3 bucket with KMS encryption and versioning', () => {
      const bucket = template.Resources.PrimaryBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3KmsKey' });
      
      const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Resources - WAFv2', () => {
    test('should have WebACL with AWS Managed Rules', () => {
      const webAcl = template.Resources.WebACL;
      expect(webAcl).toBeDefined();
      expect(webAcl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webAcl.Properties.Scope).toBe('REGIONAL');
      expect(webAcl.Properties.DefaultAction).toEqual({ Allow: {} });
      
      const rule = webAcl.Properties.Rules[0];
      expect(rule.Name).toBe('AWSManagedCommon');
      expect(rule.Priority).toBe(1);
      expect(rule.OverrideAction).toEqual({ None: {} });
      
      const ruleGroup = rule.Statement.ManagedRuleGroupStatement;
      expect(ruleGroup.VendorName).toBe('AWS');
      expect(ruleGroup.Name).toBe('AWSManagedRulesCommonRuleSet');
    });
  });

  describe('Resources - Route53', () => {
    test('should have Hosted Zone', () => {
      const hostedZone = template.Resources.HostedZone;
      expect(hostedZone).toBeDefined();
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
     expect(hostedZone.Properties.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}.ha.example.com' });
    });

    test('should have Primary and Secondary Alias A records with failover', () => {
      const primaryRecord = template.Resources.AlbAliasPrimary;
      const secondaryRecord = template.Resources.AlbAliasSecondary;
      
      expect(primaryRecord).toBeDefined();
      expect(primaryRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(primaryRecord.Properties.Type).toBe('A');
      expect(primaryRecord.Properties.SetIdentifier).toBe('primary');
      expect(primaryRecord.Properties.Failover).toBe('PRIMARY');
      expect(primaryRecord.Properties.AliasTarget.EvaluateTargetHealth).toBe(true);
      
      expect(secondaryRecord).toBeDefined();
      expect(secondaryRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(secondaryRecord.Properties.Type).toBe('A');
      expect(secondaryRecord.Properties.SetIdentifier).toBe('secondary');
      expect(secondaryRecord.Properties.Failover).toBe('SECONDARY');
      expect(secondaryRecord.Properties.TTL).toBe('60');
      expect(secondaryRecord.Properties.ResourceRecords).toContain('198.51.100.10');
    });
  });

  describe('Resources - Monitoring', () => {
    test('should have CloudWatch CPU alarm', () => {
      const alarm = template.Resources.HighCpuAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      
      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('AutoScalingGroupName');
      expect(dimension.Value).toEqual({ Ref: 'ASG' });
    });

    test('should have CloudWatch Dashboard', () => {
      const dashboard = template.Resources.Dashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({ 'Fn::Sub': '${AWS::StackName}-dashboard' });
     expect(dashboard.Properties.DashboardBody['Fn::Sub']).toContain('ASG CPU Utilization');
expect(dashboard.Properties.DashboardBody['Fn::Sub']).toContain('RDS CPU Utilization');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.TargetGroupArn).toBeDefined();
      expect(template.Outputs.AlbReused).toBeDefined();
      expect(template.Outputs.AlbDNS).toBeDefined();
      expect(template.Outputs.ZoneName).toBeDefined();
      expect(template.Outputs.AppFQDN).toBeDefined();
    });

    test('TargetGroupArn output should reference TargetGroup', () => {
      expect(template.Outputs.TargetGroupArn.Value).toEqual({ Ref: 'TargetGroup' });
      expect(template.Outputs.TargetGroupArn.Description).toContain('Target Group ARN');
    });

    test('AlbReused output should use FindInMap', () => {
      expect(template.Outputs.AlbReused.Value).toEqual({
        'Fn::FindInMap': ['Existing', 'ARNs', 'AlbArn']
      });
    });

    test('AlbDNS output should use FindInMap', () => {
      expect(template.Outputs.AlbDNS.Value).toEqual({
        'Fn::FindInMap': ['Existing', 'ALB', 'DnsName']
      });
    });

    test('AppFQDN output should contain app subdomain', () => {
      expect(template.Outputs.AppFQDN.Description).toContain('Primary app DNS');
      expect(template.Outputs.AppFQDN.Value).toHaveProperty('Fn::Sub');
      expect(template.Outputs.AppFQDN.Value['Fn::Sub']).toContain('app.');
    });
  });

  describe('Template Validation', () => {
    test('should have proper dependencies for NAT Gateways', () => {
      expect(template.Resources.NatGwA.DependsOn).toBe('AttachIgw');
      expect(template.Resources.NatGwB.DependsOn).toBe('AttachIgw');
      expect(template.Resources.PublicDefaultRoute.DependsOn).toBe('AttachIgw');
    });

    test('should use intrinsic functions correctly', () => {
      // Test Fn::Sub usage
      const dashboard = template.Resources.Dashboard;
      expect(dashboard.Properties.DashboardBody).toHaveProperty('Fn::Sub');
      
      // Test Fn::GetAtt usage
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toHaveProperty('Fn::GetAtt');
      
      // Test Fn::Select usage
      const subnetA = template.Resources.PublicSubnetA;
      expect(subnetA.Properties.AvailabilityZone).toHaveProperty('Fn::Select');
    });

    test('should have valid resource types', () => {
      const validTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment', 'AWS::EC2::RouteTable', 'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation', 'AWS::EC2::SecurityGroup',
        'AWS::EC2::NatGateway', 'AWS::EC2::EIP', 'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup', 'AWS::AutoScaling::ScalingPolicy',
        'AWS::ElasticLoadBalancingV2::TargetGroup', 'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup', 'AWS::S3::Bucket', 'AWS::KMS::Key',
        'AWS::SecretsManager::Secret', 'AWS::IAM::Role', 'AWS::IAM::InstanceProfile',
        'AWS::CloudWatch::Alarm', 'AWS::CloudWatch::Dashboard', 'AWS::WAFv2::WebACL',
        'AWS::Route53::HostedZone', 'AWS::Route53::RecordSet'
      ];
      
      Object.values(template.Resources).forEach((resource: any) => {
        expect(validTypes).toContain(resource.Type);
      });
    });

    test('should have tags on major resources', () => {
      const taggedResources = [
        'VPC', 'InternetGateway', 'PublicSubnetA', 'PublicSubnetB',
        'PrivateSubnetA', 'PrivateSubnetB', 'NatGwA', 'NatGwB',
        'InstanceSG', 'DBSG', 'DBInstance', 'S3KmsKey', 'PrimaryBucket'
      ];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });

    test('should have retention policies on stateful resources', () => {
      expect(template.Resources.DBSecret.DeletionPolicy).toBe('Retain');
      expect(template.Resources.DBInstance.DeletionPolicy).toBe('Snapshot');
      expect(template.Resources.S3KmsKey.DeletionPolicy).toBe('Retain');
      expect(template.Resources.PrimaryBucket.DeletionPolicy).toBe('Retain');
    });
  });
});