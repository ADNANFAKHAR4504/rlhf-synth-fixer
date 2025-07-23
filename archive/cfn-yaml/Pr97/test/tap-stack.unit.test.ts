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
    test('should have correct CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-Ready');
      expect(template.Description).toContain('Highly Available');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have YourIpForSsh parameter with default value', () => {
      const param = template.Parameters.YourIpForSsh;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.Description).toContain('CIDR block for SSH access');
    });

    test('should have DbUsername parameter with default value', () => {
      const param = template.Parameters.DbUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('postgres');
      expect(param.Description).toContain('Master username');
    });

    test('should have InstanceType parameter with default value', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
    });

    test('should have ImageId parameter with default AMI', () => {
      const param = template.Parameters.ImageId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::EC2::Image::Id');
      expect(param.Default).toBe('ami-0c02fb55956c7d316');
      expect(param.Description).toContain('AMI ID');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.IGWAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe(
        'InternetGateway'
      );
    });

    test('should create public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.101.0/24');

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.102.0/24');
    });

    test('should create NAT Gateways with Elastic IPs', () => {
      const natEip1 = template.Resources.NatEIP1;
      const natEip2 = template.Resources.NatEIP2;
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;

      expect(natEip1.Type).toBe('AWS::EC2::EIP');
      expect(natEip1.Properties.Domain).toBe('vpc');
      expect(natEip1.DependsOn).toBe('IGWAttachment');

      expect(natEip2.Type).toBe('AWS::EC2::EIP');
      expect(natEip2.Properties.Domain).toBe('vpc');
      expect(natEip2.DependsOn).toBe('IGWAttachment');

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId.Ref).toBe('PublicSubnet1');

      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP access', () => {
      const sg = template.Resources.AlbSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('HTTP');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should create EC2 security group with SSH and HTTP access', () => {
      const sg = template.Resources.Ec2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      // SSH access
      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.CidrIp.Ref).toBe('YourIpForSsh');

      // HTTP access from ALB
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.SourceSecurityGroupId.Ref).toBe('AlbSecurityGroup');
    });

    test('should create RDS security group with PostgreSQL access', () => {
      const sg = template.Resources.RdsSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('Ec2SecurityGroup');
    });
  });

  describe('Compute Resources', () => {
    test('should create Launch Template with correct configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateName).toBe(
        'production-launch-template'
      );

      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType.Ref).toBe('InstanceType');
      expect(data.ImageId.Ref).toBe('ImageId');
      expect(data.SecurityGroupIds[0].Ref).toBe('Ec2SecurityGroup');
      expect(data.UserData).toBeDefined();
    });

    test('should create Auto Scaling Group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');

      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.MaxSize).toBe(3);

      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets).toHaveLength(2);
      expect(subnets[0].Ref).toBe('PublicSubnet1');
      expect(subnets[1].Ref).toBe('PublicSubnet2');

      expect(asg.Properties.TargetGroupARNs[0].Ref).toBe('AlbTargetGroup');
    });

    test('should create Scaling Policy with target tracking', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');

      const config = policy.Properties.TargetTrackingConfiguration;
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe(
        'ASGAverageCPUUtilization'
      );
      expect(config.TargetValue).toBe(50.0);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should create Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Name).toBe('production-alb');
      expect(alb.Properties.Scheme).toBe('internet-facing');

      const subnets = alb.Properties.Subnets;
      expect(subnets).toHaveLength(2);
      expect(subnets[0].Ref).toBe('PublicSubnet1');
      expect(subnets[1].Ref).toBe('PublicSubnet2');
    });

    test('should create Target Group with health checks', () => {
      const tg = template.Resources.AlbTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Name).toBe('production-tg');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');

      // Health check configuration
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(5);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(2);
    });

    test('should create HTTP Listener', () => {
      const listener = template.Resources.AlbListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');

      const actions = listener.Properties.DefaultActions;
      expect(actions).toHaveLength(1);
      expect(actions[0].Type).toBe('forward');
      expect(actions[0].TargetGroupArn.Ref).toBe('AlbTargetGroup');
    });
  });

  describe('Database Resources', () => {
    test('should create RDS Secret for password management', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toBe('production-rds-password');
      expect(secret.Properties.Description).toContain('RDS PostgreSQL');

      const genString = secret.Properties.GenerateSecretString;
      expect(genString.SecretStringTemplate).toContain('postgres');
      expect(genString.GenerateStringKey).toBe('password');
      expect(genString.PasswordLength).toBe(16);
      expect(genString.ExcludeCharacters).toBe('\"@/\\');
    });

    test('should create DB Subnet Group', () => {
      const subnetGroup = template.Resources.DbSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets).toHaveLength(2);
      expect(subnets[0].Ref).toBe('PrivateSubnet1');
      expect(subnets[1].Ref).toBe('PrivateSubnet2');
    });

    test('should create RDS Instance with proper configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');

      const props = rds.Properties;
      expect(props.DBInstanceIdentifier).toBe('production-db-instance');
      expect(props.DBName).toBe('productiondb');
      expect(props.Engine).toBe('postgres');
      expect(props.DBInstanceClass).toBe('db.t3.micro');
      expect(props.MultiAZ).toBe(true);
      expect(props.AllocatedStorage).toBe(20);
      expect(props.StorageEncrypted).toBe(true);
      expect(props.DeletionProtection).toBe(true);

      // Check password is using Secrets Manager
      expect(props.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
      expect(props.MasterUserPassword['Fn::Sub']).toContain('${RDSSecret}');
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all major resources with Environment=Production', () => {
      const taggedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway1',
        'NatGateway2',
        'AlbSecurityGroup',
        'Ec2SecurityGroup',
        'RdsSecurityGroup',
        'ApplicationLoadBalancer',
        'RDSSecret',
        'DbSubnetGroup',
        'RDSInstance',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.Properties.Tags).toBeDefined();

        const envTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      });
    });

    test('should propagate tags to Auto Scaling Group instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
      expect(envTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should output ALB DNS name', () => {
      const output = template.Outputs.AlbDnsName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DNS name');
      expect(output.Value['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
      expect(output.Value['Fn::GetAtt'][1]).toBe('DNSName');
    });

    test('should output RDS endpoint', () => {
      const output = template.Outputs.RdsEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Endpoint address');
      expect(output.Value['Fn::GetAtt'][0]).toBe('RDSInstance');
      expect(output.Value['Fn::GetAtt'][1]).toBe('Endpoint.Address');
    });
  });

  describe('Security Best Practices', () => {
    test('should use encrypted storage for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should enable deletion protection for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(true);
    });

    test('should use Secrets Manager for RDS password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'secretsmanager'
      );
    });

    test('should place RDS in private subnets', () => {
      const subnetGroup = template.Resources.DbSubnetGroup;
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets[0].Ref).toBe('PrivateSubnet1');
      expect(subnets[1].Ref).toBe('PrivateSubnet2');
    });

    test('should have deletion and update replace policies for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('High Availability', () => {
    test('should deploy resources across multiple AZs', () => {
      // Public subnets in different AZs
      const pub1 = template.Resources.PublicSubnet1;
      const pub2 = template.Resources.PublicSubnet2;
      expect(pub1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(pub2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);

      // Private subnets in different AZs
      const priv1 = template.Resources.PrivateSubnet1;
      const priv2 = template.Resources.PrivateSubnet2;
      expect(priv1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(priv2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should enable Multi-AZ for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have NAT Gateways in each AZ for redundancy', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      expect(natGw1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(natGw2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });
});
