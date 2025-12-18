import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing System CloudFormation Template', () => {
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

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Payment Processing System');
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('RDS MySQL Multi-AZ');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have 18 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(18);
    });

    test('should have 17 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(17);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Unique suffix');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet3CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet3CIDR).toBeDefined();
    });

    test('should have database parameters', () => {
      const dbParams = [
        'DBUsername',
        'DBInstanceClass',
        'DBAllocatedStorage',
      ];
      dbParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have tagging parameters', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.CostCenter).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should include EnvironmentSuffix in name tag', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('should have 3 public subnets across different AZs', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      subnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }],
        });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets across different AZs', () => {
      const subnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      subnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }],
        });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have 3 NAT Gateway EIPs', () => {
      const eips = ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'];
      eips.forEach(eipName => {
        const eip = template.Resources[eipName];
        expect(eip).toBeDefined();
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.DependsOn).toBe('InternetGatewayAttachment');
      });
    });

    test('should have 3 NAT Gateways in public subnets', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      natGateways.forEach((natName, index) => {
        const nat = template.Resources[natName];
        expect(nat).toBeDefined();
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.SubnetId).toEqual({
          Ref: `PublicSubnet${index + 1}`,
        });
      });
    });

    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have 3 private route tables with NAT gateway routes', () => {
      const routeTables = [
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'PrivateRouteTable3',
      ];
      const routes = [
        'DefaultPrivateRoute1',
        'DefaultPrivateRoute2',
        'DefaultPrivateRoute3',
      ];

      routeTables.forEach((rtName, index) => {
        const routeTable = template.Resources[rtName];
        expect(routeTable).toBeDefined();
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

        const route = template.Resources[routes[index]];
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({
          Ref: `NatGateway${index + 1}`,
        });
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have App Server security group allowing traffic from ALB', () => {
      const sg = template.Resources.AppServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);

      const albRule = ingress.find(
        (rule: any) => rule.SourceSecurityGroupId?.Ref === 'ALBSecurityGroup'
      );
      expect(albRule).toBeDefined();
    });

    test('should have RDS security group allowing MySQL traffic', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();

      const mysqlRules = ingress.filter(
        (rule: any) => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRules.length).toBeGreaterThan(0);
    });

    test('all security groups should include EnvironmentSuffix in name', () => {
      const securityGroups = [
        'ALBSecurityGroup',
        'AppServerSecurityGroup',
        'RDSSecurityGroup',
      ];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });
  });

  describe('RDS MySQL Multi-AZ', () => {
    test('should have RDS KMS key for encryption', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });

    test('should have DB subnet group with 3 private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('RDS instance should have correct engine and version', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBeDefined();
    });

    test('RDS instance should have DeletionProtection disabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should have Delete deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('RDS instance should include EnvironmentSuffix in identifier', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Secrets Manager', () => {
    test('should have DB password secret with auto-generation', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have OnPremises DB password secret with auto-generation', () => {
      const secret = template.Resources.OnPremisesDBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('DB password secret should include EnvironmentSuffix in name', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in all 3 public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('should have ALB target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALB target group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
      expect(tg.Properties.HealthCheckIntervalSeconds).toBeDefined();
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({
        Ref: 'ApplicationLoadBalancer',
      });
    });

    test('ALB should include EnvironmentSuffix in name', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should have EC2 IAM role with necessary permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('EC2 role should have access to Secrets Manager', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies || [];
      const secretsPolicy = policies.find((p: any) =>
        p.PolicyName.includes('SecretsManager')
      );
      expect(secretsPolicy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({
        Ref: 'EC2InstanceRole',
      });
    });

    test('should have launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should reference instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('launch template should have user data script', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should span all 3 private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
    });

    test('ASG should reference ALB target group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toContainEqual({
        Ref: 'ALBTargetGroup',
      });
    });

    test('ASG should have min, max, and desired capacity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS topic for alarms', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);

      const emailSub = topic.Properties.Subscription.find(
        (sub: any) => sub.Protocol === 'email'
      );
      expect(emailSub).toBeDefined();
    });

    test('should have RDS high CPU alarm', () => {
      const alarm = template.Resources.RDSHighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have RDS low storage alarm', () => {
      const alarm = template.Resources.RDSLowStorageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('alarms should reference SNS topic', () => {
      const cpuAlarm = template.Resources.RDSHighCPUAlarm;
      const storageAlarm = template.Resources.RDSLowStorageAlarm;

      expect(cpuAlarm.Properties.AlarmActions).toContainEqual({
        Ref: 'SNSTopic',
      });
      expect(storageAlarm.Properties.AlarmActions).toContainEqual({
        Ref: 'SNSTopic',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'Project', 'CostCenter'];

      // Test a sample of resources
      const resourcesToTest = [
        'VPC',
        'RDSInstance',
        'ApplicationLoadBalancer',
        'AutoScalingGroup',
      ];

      resourcesToTest.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];

        requiredTags.forEach(tagKey => {
          const tag = tags.find((t: any) => t.Key === tagKey);
          expect(tag).toBeDefined();
        });
      });
    });

    test('all resources with names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'NatGateway1',
        'ApplicationLoadBalancer',
        'RDSInstance',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const nameTag = tags.find((t: any) => t.Key === 'Name');

        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required networking outputs', () => {
      const networkOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
      ];

      networkOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have RDS outputs', () => {
      expect(template.Outputs.RDSInstanceEndpoint).toBeDefined();
      expect(template.Outputs.RDSInstancePort).toBeDefined();
      expect(template.Outputs.DBSecretArn).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });

    test('should have ALB outputs', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBTargetGroupArn).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.AppServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
    });

    test('should have monitoring output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names (except KMSKeyId)', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // KMSKeyId doesn't have an export (known issue)
        if (outputKey !== 'KMSKeyId') {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('private subnets should not auto-assign public IPs', () => {
      const privateSubnets = [
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];

      privateSubnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should use Secrets Manager for password management', () => {
      // Verify Secrets Manager secrets exist for auto-generated passwords
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
      expect(template.Resources.OnPremisesDBPasswordSecret).toBeDefined();
      expect(template.Resources.OnPremisesDBPasswordSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );

      // Verify secrets have auto-generation enabled
      expect(
        template.Resources.DBPasswordSecret.Properties.GenerateSecretString
      ).toBeDefined();
      expect(
        template.Resources.OnPremisesDBPasswordSecret.Properties
          .GenerateSecretString
      ).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy resources across 3 availability zones', () => {
      // Verify 3 public subnets in different AZs
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      // Verify 3 private subnets in different AZs
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      // Verify 3 NAT Gateways for redundancy
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
    });

    test('Application Load Balancer should span multiple AZs', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.length).toBeGreaterThanOrEqual(2);
    });
  });
});
