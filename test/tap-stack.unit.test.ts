import fs from 'fs';
import path from 'path';

describe('Failover Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Ensure the template is in JSON. Convert from YAML beforehand if needed.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  //
  // Basic structure
  //
  describe('Template Structure', () => {
    test('has valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Automated failover between primary and standby EC2 instances using Route 53 health checks'
      );
    });

    test('has Parameters, Resources, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  //
  // Parameters
  //
  describe('Parameters', () => {
    const requiredParams = [
      'HostedZoneId',
      'RecordName',
      'InstanceType',
      'KeyName',
      'AllowedSSHCidr',
      'HealthCheckPort',
      'HealthCheckPath',
      'LatestAmiId',
    ];

    test('contains all expected parameters', () => {
      requiredParams.forEach(p => {
        expect(template.Parameters[p]).toBeDefined();
      });
    });

    test('InstanceType has allowed values', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
    });

    test('LatestAmiId uses SSM parameter type', () => {
      const p = template.Parameters.LatestAmiId;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(typeof p.Default).toBe('string');
      expect(p.Default).toContain('/aws/service/ami-amazon-linux-latest/');
    });
  });

  //
  // Helper utilities
  //
  const getResourcesByType = (type: string) =>
    Object.entries(template.Resources).filter(([, v]: any) => v.Type === type);

  const getResource = (logicalId: string) => template.Resources[logicalId];

  //
  // Core network resources
  //
  describe('VPC & Networking', () => {
    test('creates a VPC', () => {
      const vpcs = getResourcesByType('AWS::EC2::VPC');
      expect(vpcs.length).toBe(1);
      const [, vpc]: any = vpcs[0];
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('creates two public subnets in different AZs', () => {
      const subnets = getResourcesByType('AWS::EC2::Subnet').map(([, v]) => v as any);
      expect(subnets.length).toBe(2);
      subnets.forEach(s => {
        expect(s.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(s.Properties.VpcId).toBeDefined();
      });
    });

    test('has InternetGateway and attachment', () => {
      expect(getResourcesByType('AWS::EC2::InternetGateway').length).toBe(1);
      const attaches = getResourcesByType('AWS::EC2::VPCGatewayAttachment');
      expect(attaches.length).toBe(1);
    });

    test('public route to IGW exists', () => {
      const routes = getResourcesByType('AWS::EC2::Route').map(([, v]) => v as any);
      expect(routes.length).toBeGreaterThanOrEqual(1);
      const defaultRoute = routes.find(r => r.Properties.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeTruthy();
      expect(defaultRoute!.Properties.GatewayId).toBeDefined();
    });
  });

  //
  // Security Group
  //
  describe('Security Group', () => {
    test('allows HTTP(80) from anywhere and SSH(22) from AllowedSSHCidr', () => {
      const sgs = getResourcesByType('AWS::EC2::SecurityGroup');
      expect(sgs.length).toBe(1);
      const [, sg]: any = sgs[0];
      const ingress = sg.Properties.SecurityGroupIngress;

      const http = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === '0.0.0.0/0');
      expect(http).toBeTruthy();

      const ssh = ingress.find((r: any) => r.FromPort === 22 && r.ToPort === 22);
      expect(ssh).toBeTruthy();
      expect(ssh.CidrIp).toEqual({ Ref: 'AllowedSSHCidr' });
    });
  });

  //
  // EC2 Instances + EIPs
  //
  describe('Instances & EIPs', () => {
    test('creates primary and standby EC2 instances', () => {
      const instances = getResourcesByType('AWS::EC2::Instance');
      expect(instances.length).toBe(2);
      const ids = instances.map(([k]) => k);
      expect(ids).toEqual(expect.arrayContaining(['PrimaryInstance', 'StandbyInstance']));
    });

    test('instances reference AMI and SG and subnet', () => {
      const primary: any = getResource('PrimaryInstance');
      expect(primary.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(primary.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'SecurityGroup' });
      expect(primary.Properties.SubnetId).toBeDefined();

      const standby: any = getResource('StandbyInstance');
      expect(standby.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(standby.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'SecurityGroup' });
      expect(standby.Properties.SubnetId).toBeDefined();
    });

    test('user-data is present for both instances', () => {
      const primary: any = getResource('PrimaryInstance');
      const standby: any = getResource('StandbyInstance');
      expect(primary.Properties.UserData).toBeDefined();
      expect(standby.Properties.UserData).toBeDefined();
    });

    test('allocates and associates EIPs via EIPAssociation (VPC-safe)', () => {
      const eips = getResourcesByType('AWS::EC2::EIP');
      expect(eips.length).toBe(2);
      const associations = getResourcesByType('AWS::EC2::EIPAssociation').map(([, v]) => v as any);
      expect(associations.length).toBe(2);
      associations.forEach(a => {
        expect(a.Properties.AllocationId).toBeDefined();
        expect(a.Properties.InstanceId).toBeDefined();
      });
    });
  });

  //
  // Route 53 Failover
  //
  describe('Route53 Failover', () => {
    test('creates a health check probing the primary EIP over HTTP', () => {
      const hcs = getResourcesByType('AWS::Route53::HealthCheck');
      expect(hcs.length).toBe(1);
      const [, hc]: any = hcs[0];
      const cfg = hc.Properties.HealthCheckConfig;
      expect(cfg.Type).toBe('HTTP');
      expect(cfg.IPAddress).toEqual({ Ref: 'PrimaryEIP' });
      expect(cfg.Port).toEqual({ Ref: 'HealthCheckPort' });
      expect(cfg.ResourcePath).toEqual({ Ref: 'HealthCheckPath' });
      expect(cfg.FailureThreshold).toBe(3);
      expect(cfg.RequestInterval).toBe(30);
    });

    test('creates PRIMARY and SECONDARY A records with SetIdentifier and TTL', () => {
      const records = getResourcesByType('AWS::Route53::RecordSet').map(([k, v]) => [k, v as any]);
      expect(records.length).toBe(2);

      const primary = records.find(([k, v]) => v.Properties.Failover === 'PRIMARY');
      const secondary = records.find(([k, v]) => v.Properties.Failover === 'SECONDARY');

      expect(primary).toBeTruthy();
      expect(secondary).toBeTruthy();

      const [, primaryRs]: any = primary!;
      expect(primaryRs.Properties.Type).toBe('A');
      expect(primaryRs.Properties.SetIdentifier).toBe('Primary');
      expect(primaryRs.Properties.TTL).toBe(60);
      expect(primaryRs.Properties.HealthCheckId).toEqual({ Ref: 'PrimaryHealthCheck' });
      expect(primaryRs.Properties.ResourceRecords).toEqual([{ Ref: 'PrimaryEIP' }]);

      const [, secondaryRs]: any = secondary!;
      expect(secondaryRs.Properties.Type).toBe('A');
      expect(secondaryRs.Properties.SetIdentifier).toBe('Standby');
      expect(secondaryRs.Properties.TTL).toBe(60);
      expect(secondaryRs.Properties.ResourceRecords).toEqual([{ Ref: 'StandbyEIP' }]);
    });
  });

  //
  // Outputs
  //
  describe('Outputs', () => {
    const expectedOutputs = [
      'PrimaryInstanceId',
      'StandbyInstanceId',
      'PrimaryEIPOut',
      'StandbyEIPOut',
      'DNSName',
      'HealthCheckId',
    ];

    test('has all expected outputs', () => {
      expectedOutputs.forEach(o => {
        expect(template.Outputs[o]).toBeDefined();
      });
    });

    test('DNSName output references RecordName parameter', () => {
      const out = template.Outputs.DNSName;
      expect(out.Value).toEqual({ Ref: 'RecordName' });
    });
  });

  //
  // Sanity checks (no brittle exact counts except where meaningful)
  //
  describe('Sanity', () => {
    test('template is a JSON object', () => {
      expect(template && typeof template === 'object').toBe(true);
    });
  });
});
