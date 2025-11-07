import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('E-commerce CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/ecommerce-stack.json');
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

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('ecommerce');
    });

    test('should have EnvironmentTag parameter', () => {
      expect(template.Parameters.EnvironmentTag).toBeDefined();
      expect(template.Parameters.EnvironmentTag.Type).toBe('String');
    });

    test('should have DBMasterUsername parameter with constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param).toBeDefined();
      expect(param.MinLength).toBe('1');
      expect(param.MaxLength).toBe('16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have LatestAmiId parameter using SSM', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('amazon-linux-latest');
    });

    test('should have EnvironmentTag parameter with allowed values', () => {
      const param = template.Parameters.EnvironmentTag;
      expect(param).toBeDefined();
      expect(param.AllowedValues).toContain('development');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('production');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have two public subnets', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should use different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('private subnets should use different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should have NAT Gateways with Elastic IPs', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();

      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateways should be in public subnets', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;

      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('private route tables should route through NAT Gateways', () => {
      const route1 = template.Resources.PrivateRoute1;
      const route2 = template.Resources.PrivateRoute2;

      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTPS and HTTP', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      const httpRule = ingress.find((r: any) => r.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should only allow traffic from ALB on port 3000', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3000);
      expect(ingress[0].ToPort).toBe(3000);
      expect(ingress[0].SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should only allow traffic from EC2 on port 5432', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;

      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have target group for port 3000', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(3000);
      expect(tg.Properties.Protocol).toBe('HTTP');
    });

    test('target group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have HTTP listener forwarding to target group', () => {
      const listener = template.Resources.ALBHTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');

      const action = listener.Properties.DefaultActions[0];
      expect(action.Type).toBe('forward');
      expect(action.TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('RDS Database', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnets = subnetGroup.Properties.SubnetIds;

      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDS PostgreSQL instance', () => {
      const db = template.Resources.DBInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('postgres');
    });

    test('RDS instance should use PostgreSQL 14.x', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.EngineVersion).toMatch(/^14\./);
    });

    test('RDS instance should use db.t3.medium', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
    });

    test('RDS instance should have Multi-AZ enabled', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should have deletion protection disabled for testing', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should have backup retention', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('RDS instance should have delete deletion policy for testing', () => {
      const db = template.Resources.DBInstance;
      expect(db.DeletionPolicy).toBe('Delete');
    });

    test('should have read replica', () => {
      const replica = template.Resources.DBReadReplica;
      expect(replica).toBeDefined();
      expect(replica.Type).toBe('AWS::RDS::DBInstance');
      expect(replica.Properties.SourceDBInstanceIdentifier).toEqual({
        Ref: 'DBInstance',
      });
    });

    test('read replica should use db.t3.medium', () => {
      const replica = template.Resources.DBReadReplica;
      expect(replica.Properties.DBInstanceClass).toBe('db.t3.medium');
    });

    test('read replica should not be publicly accessible', () => {
      const replica = template.Resources.DBReadReplica;
      expect(replica.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should auto-generate password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'password'
      );
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have secret target attachment', () => {
      const attachment = template.Resources.SecretAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe(
        'AWS::SecretsManager::SecretTargetAttachment'
      );
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have IAM role for EC2 instances', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should allow Secrets Manager access', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('SecretsManagerAccess');
      expect(policy.PolicyDocument.Statement[0].Action).toContain(
        'secretsmanager:GetSecretValue'
      );
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use t3.medium', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
    });

    test('launch template should have user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
    });

    test('user data should reference database secret', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData =
        lt.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('${DBSecret}');
      expect(userData).toContain('${DBInstance.Endpoint.Address}');
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should scale between 2 and 6 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('6');
      expect(asg.Properties.DesiredCapacity).toBe('2');
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;

      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('ASG should have ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBeGreaterThan(0);
    });

    test('ASG should depend on DBInstance', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toContain('DBInstance');
    });

    test('should have scaling policies', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp).toBeDefined();
      expect(scaleDown).toBeDefined();
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('scaling policies should use CPU-based target tracking', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(scaleDown.Properties.PolicyType).toBe('TargetTrackingScaling');

      expect(
        scaleUp.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification
          .PredefinedMetricType
      ).toBe('ASGAverageCPUUtilization');
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('VPC should include environmentSuffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: { 'Fn::Sub': 'vpc-${EnvironmentSuffix}' },
          }),
        ])
      );
    });

    test('ALB should include environmentSuffix', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': 'app-alb-${EnvironmentSuffix}',
      });
    });

    test('RDS instance should include environmentSuffix', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'postgres-db-${EnvironmentSuffix}',
      });
    });

    test('RDS replica should include environmentSuffix', () => {
      const replica = template.Resources.DBReadReplica;
      expect(replica.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'postgres-db-replica-${EnvironmentSuffix}',
      });
    });

    test('Secret should include environmentSuffix', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'db-credentials-${EnvironmentSuffix}',
      });
    });
  });

  describe('Resource Tagging', () => {
    const checkTags = (resource: any) => {
      expect(resource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Project' }),
        ])
      );
    };

    test('VPC should have Environment and Project tags', () => {
      checkTags(template.Resources.VPC);
    });

    test('Subnets should have Environment and Project tags', () => {
      checkTags(template.Resources.PublicSubnet1);
      checkTags(template.Resources.PrivateSubnet1);
    });

    test('Security Groups should have Environment and Project tags', () => {
      checkTags(template.Resources.ALBSecurityGroup);
      checkTags(template.Resources.EC2SecurityGroup);
      checkTags(template.Resources.RDSSecurityGroup);
    });

    test('RDS instances should have Environment and Project tags', () => {
      checkTags(template.Resources.DBInstance);
      checkTags(template.Resources.DBReadReplica);
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSReadReplicaEndpoint).toBeDefined();
      expect(template.Outputs.DBSecretArn).toBeDefined();
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export).toBeDefined();
    });

    test('LoadBalancerDNS output should reference ALB DNS', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RDS endpoints should be exported', () => {
      const primary = template.Outputs.RDSEndpoint;
      const replica = template.Outputs.RDSReadReplicaEndpoint;

      expect(primary.Export).toBeDefined();
      expect(replica.Export).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all resource names should include environmentSuffix references', () => {
      const resourcesWithNames = [
        'VPC',
        'ApplicationLoadBalancer',
        'DBInstance',
        'DBReadReplica',
        'DBSecret',
        'AutoScalingGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toContain('EnvironmentSuffix');
      });
    });

    test('no hardcoded regions should be present', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('us-west-2');
      expect(templateStr).not.toContain('eu-west-1');
      // Allow us-east-1 in SSM parameter path
    });

    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('EC2 instances should not be in public subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;

      expect(subnets).not.toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).not.toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('RDS should not be publicly accessible', () => {
      const db = template.Resources.DBInstance;
      const replica = template.Resources.DBReadReplica;

      // PubliclyAccessible defaults to false, so either false or undefined is OK
      if (db.Properties.PubliclyAccessible !== undefined) {
        expect(db.Properties.PubliclyAccessible).toBe(false);
      }
      expect(replica.Properties.PubliclyAccessible).toBe(false);
    });

    test('database credentials should be in Secrets Manager', () => {
      const db = template.Resources.DBInstance;
      const username = JSON.stringify(db.Properties.MasterUsername);
      const password = JSON.stringify(db.Properties.MasterUserPassword);

      expect(username).toContain('secretsmanager');
      expect(password).toContain('secretsmanager');
    });

    test('HTTP listener should forward to target group', () => {
      const httpListener = template.Resources.ALBHTTPListener;

      expect(httpListener.Properties.Protocol).toBe('HTTP');
      expect(httpListener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });
});
