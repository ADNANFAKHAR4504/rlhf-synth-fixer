import fs from 'fs';
import path from 'path';

describe('WebApp CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // IMPORTANT: For these tests to run, you need to convert your YAML CloudFormation template to JSON.
    // If your template is named 'web-app-deployment.yaml', you can convert it using:
    // pipenv run cfn-flip -i web-app-deployment.yaml -o web-app-deployment.json
    // Make sure 'cfn-flip' is installed (pip install cfn-flip).
    const templatePath = path.join(__dirname, 'TapStack.json');
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
        'CloudFormation template for a highly available web application deployment.'
      );
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
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
    test('should define all expected parameters', () => {
      const expectedParams = [
        'VpcCIDR', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'InstanceType',
        'KeyPairName', 'SSHLocation', 'DBInstanceClass',
        'DBAllocatedStorage', 'DBUsername', 'AppPort'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('KeyPairName parameter should be String type with default empty', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toEqual(['t3.nano', 't3.micro', 't3.small', 't3.medium', 't3.large']);
    });
  });

  describe('Conditions', () => {
    test('HasKeyPair condition should be defined correctly', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toEqual([
        { "Ref": "KeyPairName" },
        ""
      ]);
    });
  });

  describe('Resources', () => {
    // VPC and Networking
    test('WebAppVPC should be defined', () => {
      const vpc = template.Resources.WebAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ "Ref": "VpcCIDR" });
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('Subnets should be defined and span AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('NAT Gateway and EIP should be defined', () => {
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway.Properties.SubnetId).toEqual({ "Ref": "PublicSubnet1" });
    });

    // Security Groups
    test('Security Groups should be defined with correct ingress rules', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ec2SG = template.Resources.EC2SecurityGroup;
      const dbSG = template.Resources.DBSecurityGroup;

      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');

      // ALB SG ingress
      expect(albSG.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
        ])
      );

      // EC2 SG ingress
      expect(ec2SG.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: { "Ref": "AppPort" }, ToPort: { "Ref": "AppPort" }, SourceSecurityGroupId: { "Fn::GetAtt": ["ALBSecurityGroup", "GroupId"] } }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: { "Ref": "SSHLocation" } })
        ])
      );

      // DB SG ingress
      expect(dbSG.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: { "Fn::GetAtt": ["EC2SecurityGroup", "GroupId"] } }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 5432, ToPort: 5432, SourceSecurityGroupId: { "Fn::GetAtt": ["EC2SecurityGroup", "GroupId"] } })
        ])
      );
    });

    // Application Load Balancer
    test('WebAppALB, ALBTargetGroup, and ALBListener should be defined', () => {
      const alb = template.Resources.WebAppALB;
      const targetGroup = template.Resources.ALBTargetGroup;
      const listener = template.Resources.ALBListener;

      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);

      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Port).toEqual({ "Ref": "AppPort" });
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');

      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({ "Ref": "WebAppALB" });
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ "Ref": "ALBTargetGroup" });
    });

    // EC2 Auto Scaling
    test('WebAppLaunchTemplate should be defined with conditional KeyName', () => {
      const lt = template.Resources.WebAppLaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateName).toBe('WebAppLaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ "Ref": "InstanceType" });

      // Test conditional KeyName
      expect(lt.Properties.LaunchTemplateData.KeyName).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If']).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If'][0]).toBe('HasKeyPair');
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If'][1]).toEqual({ "Ref": "KeyPairName" });
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If'][2]).toEqual({ "Ref": "AWS::NoValue" });

      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.TagSpecifications[0].ResourceType).toBe('instance');
    });

    test('WebAppAutoScalingGroup should be defined', () => {
      const asg = template.Resources.WebAppAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ "Ref": "WebAppLaunchTemplate" });
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
      expect(asg.Properties.TargetGroupARNs).toEqual([{ "Ref": "ALBTargetGroup" }]);
    });

    // RDS Database
    test('WebAppDB should be defined with Multi-AZ and Secrets Manager integration', () => {
      const db = template.Resources.WebAppDB;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.DBInstanceClass).toEqual({ "Ref": "DBInstanceClass" });
      expect(db.Properties.AllocatedStorage).toEqual({ "Ref": "DBAllocatedStorage" });
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.MasterUsername).toEqual({ "Ref": "DBUsername" });
      expect(db.Properties.MasterUserPassword).toBe('{{resolve:secretsmanager:/my-app/rds/master-password:SecretString}}');
      expect(db.Properties.DBSubnetGroupName).toEqual({ "Ref": "DBSubnetGroup" });
      expect(db.Properties.VPCSecurityGroups).toEqual([{"Fn::GetAtt": ["DBSecurityGroup", "GroupId"]}]);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('DBSubnetGroup should be defined', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Outputs', () => {
    test('should have WebAppURL output', () => {
      const output = template.Outputs.WebAppURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL of the web application (Application Load Balancer DNS Name)');
      expect(output.Value).toEqual({ "Fn::GetAtt": ["WebAppALB", "DNSName"] });
    });

    test('should have DBEndpoint output', () => {
      const output = template.Outputs.DBEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Endpoint of the RDS database');
      expect(output.Value).toEqual({ "Fn::GetAtt": ["WebAppDB", "Endpoint.Address"] });
    });
  });
});
