import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
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

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Metadata Configuration', () => {
    test('should have parameter groups defined', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata.ParameterGroups).toBeDefined();
      expect(Array.isArray(metadata.ParameterGroups)).toBe(true);
      expect(metadata.ParameterGroups.length).toBeGreaterThan(0);
    });

    test('should have parameter labels defined', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata.ParameterLabels).toBeDefined();
      expect(metadata.ParameterLabels.EnvironmentSuffix).toBeDefined();
    });

    test('parameter groups should include all required groups', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      const groupLabels = metadata.ParameterGroups.map((g: any) => g.Label.default);
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('Database Configuration');
      expect(groupLabels).toContain('GitHub Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('should have GitHubToken parameter with NoEcho', () => {
      expect(template.Parameters.GitHubToken).toBeDefined();
      const param = template.Parameters.GitHubToken;
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('');
    });

    test('should have GitHubRepo parameter', () => {
      expect(template.Parameters.GitHubRepo).toBeDefined();
      expect(template.Parameters.GitHubRepo.Type).toBe('String');
    });

    test('should have GitHubBranch parameter', () => {
      expect(template.Parameters.GitHubBranch).toBeDefined();
      expect(template.Parameters.GitHubBranch.Default).toBe('main');
    });
  });

  describe('Conditions', () => {
    test('should have CreateCICDResources condition', () => {
      expect(template.Conditions.CreateCICDResources).toBeDefined();
    });

    test('CreateCICDResources condition should check GitHubToken', () => {
      const condition = template.Conditions.CreateCICDResources;
      expect(condition['Fn::Not']).toBeDefined();
      expect(Array.isArray(condition['Fn::Not'])).toBe(true);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should have eu-central-1 region', () => {
      expect(template.Mappings.RegionMap['eu-central-1']).toBeDefined();
      expect(template.Mappings.RegionMap['eu-central-1'].AMI).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support and hostnames enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(Array.isArray(vpc.Properties.Tags)).toBe(true);
      const envTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('public subnets should map public IPs on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have two database subnets', () => {
      expect(template.Resources.DBSubnet1).toBeDefined();
      expect(template.Resources.DBSubnet2).toBeDefined();
      expect(template.Resources.DBSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DBSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('database subnets should have correct CIDR blocks', () => {
      expect(template.Resources.DBSubnet1.Properties.CidrBlock).toBe('10.0.20.0/24');
      expect(template.Resources.DBSubnet2.Properties.CidrBlock).toBe('10.0.21.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1Az = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2Az = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(subnet1Az['Fn::Select'][0]).toBe(0);
      expect(subnet2Az['Fn::Select'][0]).toBe(1);
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have two NAT Gateway EIPs', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
      expect(template.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway EIPs should depend on Internet Gateway attachment', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
    });

    test('should have two NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      const route = template.Resources.PublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('private routes should point to NAT Gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS traffic', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServer security group should only allow traffic from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Database security group should only allow MySQL traffic from WebServer', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have LoggingBucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LoggingBucket should have deletion policy', () => {
      expect(template.Resources.LoggingBucket.DeletionPolicy).toBe('Delete');
    });

    test('LoggingBucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('LoggingBucket should have lifecycle rules', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Transitions).toHaveLength(2);
    });

    test('LoggingBucket should have ownership controls for ACL', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.OwnershipControls).toBeDefined();
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });

    test('LoggingBucket should allow ACLs for CloudFront logging', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(false);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(false);
    });

    test('should have WebContentBucket', () => {
      expect(template.Resources.WebContentBucket).toBeDefined();
      expect(template.Resources.WebContentBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.WebContentBucket.DeletionPolicy).toBe('Delete');
    });

    test('WebContentBucket should have encryption enabled', () => {
      const bucket = template.Resources.WebContentBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('WebContentBucket should block public access', () => {
      const bucket = template.Resources.WebContentBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have ArtifactStoreBucket with condition', () => {
      expect(template.Resources.ArtifactStoreBucket).toBeDefined();
      expect(template.Resources.ArtifactStoreBucket.Condition).toBe('CreateCICDResources');
    });
  });

  describe('IAM Role Resources', () => {
    test('should have EC2InstanceRole', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have proper trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should follow least privilege for S3', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      const s3GetPolicy = policies.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3GetPolicy).toBeDefined();
      expect(s3GetPolicy.Resource).toBeDefined();
      expect(Array.isArray(s3GetPolicy.Resource)).toBe(true);
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CodeBuildServiceRole with condition', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CodeBuildServiceRole.Condition).toBe('CreateCICDResources');
    });

    test('CodeBuildServiceRole should have proper permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;

      const logsPolicy = statements.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsPolicy).toBeDefined();
    });

    test('should have CodePipelineServiceRole with condition', () => {
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
      expect(template.Resources.CodePipelineServiceRole.Condition).toBe('CreateCICDResources');
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DBPasswordSecret', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBPasswordSecret should generate secure password', () => {
      const secret = template.Resources.DBPasswordSecret;
      const config = secret.Properties.GenerateSecretString;
      expect(config.PasswordLength).toBe(16);
      expect(config.RequireEachIncludedType).toBe(true);
      expect(config.ExcludeCharacters).toBeDefined();
    });

    test('DBPasswordSecret should include username in template', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DBSubnetGroup should use dedicated DB subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DBSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DBSubnet2' });
    });

    test('should have RDSDatabase', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDSDatabase should have deletion policy', () => {
      expect(template.Resources.RDSDatabase.DeletionPolicy).toBe('Delete');
    });

    test('RDSDatabase should have deletion protection disabled', () => {
      expect(template.Resources.RDSDatabase.Properties.DeletionProtection).toBe(false);
    });

    test('RDSDatabase should be encrypted', () => {
      expect(template.Resources.RDSDatabase.Properties.StorageEncrypted).toBe(true);
    });

    test('RDSDatabase should be Multi-AZ', () => {
      expect(template.Resources.RDSDatabase.Properties.MultiAZ).toBe(true);
    });

    test('RDSDatabase should have automated backups', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('RDSDatabase should use secrets manager for password', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('RDSDatabase should use MySQL 8.0.43', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have TargetGroup', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('TargetGroup should have health check configured', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ApplicationLoadBalancer should have deletion protection disabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attr = alb.Properties.LoadBalancerAttributes.find((a: any) =>
        a.Key === 'deletion_protection.enabled'
      );
      expect(attr.Value).toBe(false);
    });

    test('ApplicationLoadBalancer should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('ApplicationLoadBalancer should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have HTTP listener that forwards to target group', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should use t3.micro instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('LaunchTemplate should have UserData', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have AutoScalingGroup', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('AutoScalingGroup should have correct capacity settings', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('AutoScalingGroup should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have ScalingPolicy', () => {
      expect(template.Resources.ScalingPolicy).toBeDefined();
      expect(template.Resources.ScalingPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('ScalingPolicy should use target tracking', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should be enabled', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront should use ALB as origin', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const origin = cf.Properties.DistributionConfig.Origins[0];
      expect(origin.DomainName['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should have logging configured', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Properties.DistributionConfig.Logging).toBeDefined();
      expect(cf.Properties.DistributionConfig.Logging.Bucket['Fn::GetAtt'][0]).toBe('LoggingBucket');
    });
  });

  describe('CI/CD Resources', () => {
    test('should have CodeBuildProject with condition', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeBuildProject.Condition).toBe('CreateCICDResources');
    });

    test('CodeBuildProject should use standard Linux container', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
      expect(project.Properties.Environment.Image).toBe('aws/codebuild/standard:5.0');
    });

    test('should have CodePipeline with condition', () => {
      expect(template.Resources.CodePipeline).toBeDefined();
      expect(template.Resources.CodePipeline.Condition).toBe('CreateCICDResources');
    });

    test('CodePipeline should have Source and Build stages', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.Stages).toHaveLength(2);
      expect(pipeline.Properties.Stages[0].Name).toBe('Source');
      expect(pipeline.Properties.Stages[1].Name).toBe('Build');
    });

    test('should have CodePipelineWebhook with condition', () => {
      expect(template.Resources.CodePipelineWebhook).toBeDefined();
      expect(template.Resources.CodePipelineWebhook.Condition).toBe('CreateCICDResources');
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      resourcesWithTags.forEach(resourceKey => {
        const tags = template.Resources[resourceKey].Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });

    test('all taggable resources should have Name tag', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      resourcesWithTags.forEach(resourceKey => {
        const tags = template.Resources[resourceKey].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
    });

    test('should have CloudFrontURL output', () => {
      expect(template.Outputs.CloudFrontURL).toBeDefined();
      expect(template.Outputs.CloudFrontURL.Value['Fn::Sub']).toContain('CloudFrontDistribution.DomainName');
    });

    test('should have RDSEndpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt'][0]).toBe('RDSDatabase');
    });

    test('should have bucket outputs', () => {
      expect(template.Outputs.LoggingBucketName).toBeDefined();
      expect(template.Outputs.WebContentBucketName).toBeDefined();
    });

    test('should have PipelineName output with condition', () => {
      expect(template.Outputs.PipelineName).toBeDefined();
      expect(template.Outputs.PipelineName.Condition).toBe('CreateCICDResources');
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(typeof template.Outputs[outputKey].Description).toBe('string');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should not have publicly accessible configuration', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.PubliclyAccessible).not.toBe(true);
    });

    test('S3 buckets should have encryption enabled', () => {
      const buckets = ['LoggingBucket', 'WebContentBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('Secrets should not be in plain text', () => {
      const db = template.Resources.RDSDatabase;
      const password = db.Properties.MasterUserPassword;
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('Security groups should follow principle of least privilege', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      webSG.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });
  });

  describe('High Availability', () => {
    test('resources should be deployed across multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('RDS should be Multi-AZ', () => {
      expect(template.Resources.RDSDatabase.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling Group should have multiple instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeGreaterThanOrEqual(2);
    });

    test('Load Balancer should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Deletion Policies', () => {
    test('critical resources should have deletion policies', () => {
      expect(template.Resources.RDSDatabase.DeletionPolicy).toBeDefined();
      expect(template.Resources.LoggingBucket.DeletionPolicy).toBeDefined();
      expect(template.Resources.WebContentBucket.DeletionPolicy).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.DeletionPolicy).toBeDefined();
    });

    test('all deletion policies should be set to Delete', () => {
      const resourcesWithDeletionPolicy = Object.keys(template.Resources).filter(key =>
        template.Resources[key].DeletionPolicy
      );

      resourcesWithDeletionPolicy.forEach(resourceKey => {
        expect(template.Resources[resourceKey].DeletionPolicy).toBe('Delete');
      });
    });
  });
});
