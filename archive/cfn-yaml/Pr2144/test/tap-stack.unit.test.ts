import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Assumes you converted YAML -> JSON at lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Basic Template Checks', () => {
    test('has AWSTemplateFormatVersion 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has a Description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Single-region VPC');
    });
  });

  describe('Parameters', () => {
    const paramNames = [
      'VpcCIDR',
      'PublicSubnet1CIDR',
      'PublicSubnet2CIDR',
      'PrivateSubnet1CIDR',
      'PrivateSubnet2CIDR',
    ];

    paramNames.forEach((param) => {
      test(`has parameter ${param}`, () => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
      });
    });
  });

  describe('Resources', () => {
    test('has VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(subnet => {
      test(`has subnet resource ${subnet}`, () => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('has InternetGateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('has NAT Gateway and EIP', () => {
      expect(template.Resources.NatEIP).toBeDefined();
      expect(template.Resources.NatEIP.Type).toBe('AWS::EC2::EIP');

      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('has Public and Private Route Tables and Routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');

      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
    });

    test('has RDSSubnetGroup', () => {
      expect(template.Resources.RDSSubnetGroup).toBeDefined();
      expect(template.Resources.RDSSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('has DBSecret for RDS password', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      const genString = template.Resources.DBSecret.Properties.GenerateSecretString;
      expect(genString).toBeDefined();
      expect(genString.SecretStringTemplate).toContain('username');
      expect(genString.GenerateStringKey).toBe('password');
    });

    test('has RDSInstance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');

      const props = template.Resources.RDSInstance.Properties;
      expect(props.MasterUsername).toContain('secretsmanager');
      expect(props.MasterUserPassword).toContain('secretsmanager');
      expect(props.MultiAZ).toBe(true);
      expect(props.PubliclyAccessible).toBe(false);
      expect(props.BackupRetentionPeriod).toBe(7);
    });

    test('has EC2 IAM Role and Instance Profile', () => {
      expect(template.Resources.EC2IAMRole).toBeDefined();
      expect(template.Resources.EC2IAMRole.Type).toBe('AWS::IAM::Role');

      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('has CloudWatch Alarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');

      const props = template.Resources.CPUAlarm.Properties;
      expect(props.MetricName).toBe('CPUUtilization');
      expect(props.Threshold).toBe(80);
      expect(props.EvaluationPeriods).toBe(2);
    });

    test('has S3 bucket for logging with public access blocked', () => {
      expect(template.Resources.LogBucket).toBeDefined();
      expect(template.Resources.LogBucket.Type).toBe('AWS::S3::Bucket');

      const props = template.Resources.LogBucket.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');

      const pab = props.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Outputs', () => {
    const outputNames = [
      'VPCId',
      'PublicSubnets',
      'PrivateSubnets',
      'RDSInstanceEndpoint',
      'LoggingBucket',
    ];

    outputNames.forEach(name => {
      test(`has output ${name}`, () => {
        expect(template.Outputs).toBeDefined();
        expect(template.Outputs[name]).toBeDefined();
      });
    });
  });
});
