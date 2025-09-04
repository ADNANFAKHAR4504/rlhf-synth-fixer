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

    test('has Parameters, Resources, (optional) Conditions, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      // We only rely on HasKeyName now
      if (template.Conditions) {
        expect(template.Conditions.HasKeyName).toBeDefined();
      }
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

    test('HealthCheckPort has proper validation', () => {
      const p = template.Parameters.HealthCheckPort;
      expect(p.Type).toBe('Number');
      expect(p.Default).toBe(80);
      expect(p.MinValue).toBe(1);
      expect(p.MaxValue).toBe(65535);
    });

    test('HealthCheckPath has default value', () => {
      const p = template.Parameters.HealthCheckPath;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('/');
    });
  });

  //
  // Helper utilities
  //
  const getResourcesByType = (type: string) =>
    Object.entries(template.Resources).filter(([, v]: any) => v.Type === type);

  const getResource = (logicalId: string) => template.Resources[logicalId];

  //
  // VPC & Networking
  //
  describe('VPC & Networking', () => {
    test('creates a VPC with proper configuration', () => {
      const vpcs = getResourcesByType('AWS::EC2::VPC');
      expect(vpcs.length).toBe(1);
      const [, vpc]: any = vpcs[0];
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      // Name tag present (value usually Fn::Sub with ${AWS::StackName}-*)
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('creates two public subnets in different AZs', () => {
      const subnets = getResourcesByType('AWS::EC2::Subnet').map(([, v]) => v as any);
      expect(subnets.length).toBe(2);

      const subnet1 = subnets.find(s => s.Properties.CidrBlock === '10.0.1.0/24');
      const subnet2 = subnets.find(s => s.Properties.CidrBlock === '10.0.2.0/24');

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();

      // Check they use different AZs
      expect(subnet1!.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2!.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);

      subnets.forEach(s => {
        expect(s.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(s.Properties.VpcId).toBeDefined();
        const nameTag = s.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });

    test('has InternetGateway and attachment', () => {
      expect(getResourcesByType('AWS::EC2::InternetGateway').length).toBe(1);
      const attaches = getResourcesByType('AWS::EC2::VPCGatewayAttachment');
      expect(attaches.length).toBe(1);
      const [, attach]: any = attaches[0];
      expect(attach.Properties.VpcId.Ref).toBe('VPC');
      expect(attach.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });

    test('has route table with public route to IGW', () => {
      const routeTables = getResourcesByType('AWS::EC2::RouteTable');
      expect(routeTables.length).toBe(1);

      const routes = getResourcesByType('AWS::EC2::Route').map(([, v]) => v as any);
      expect(routes.length).toBeGreaterThanOrEqual(1);
      const defaultRoute = routes.find(r => r.Properties.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeTruthy();
      expect(defaultRoute!.Properties.GatewayId).toBeDefined();
    });

    test('associates subnets with route table', () => {
      const associations = getResourcesByType('AWS::EC2::SubnetRouteTableAssociation');
      expect(associations.length).toBe(2);
      associations.forEach(([, assoc]: any) => {
        expect(assoc.Properties.SubnetId).toBeDefined();
        expect(assoc.Properties.RouteTableId).toBeDefined();
      });
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

      // We do NOT set GroupName (best practice). Ensure it’s absent.
      expect(sg.Properties.GroupName).toBeUndefined();

      const ingress = sg.Properties.SecurityGroupIngress;

      const http = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === '0.0.0.0/0');
      expect(http).toBeTruthy();
      expect(http.IpProtocol).toBe('tcp');

      const ssh = ingress.find((r: any) => r.FromPort === 22 && r.ToPort === 22);
      expect(ssh).toBeTruthy();
      expect(ssh.CidrIp).toEqual({ Ref: 'AllowedSSHCidr' });
      expect(ssh.IpProtocol).toBe('tcp');

      // Egress allow-all present
      const egress = sg.Properties.SecurityGroupEgress || [];
      const allowAll = egress.find((r: any) => r.IpProtocol === -1 || r.IpProtocol === '-1');
      expect(allowAll).toBeTruthy();
    });

    test('has proper tags', () => {
      const sgs = getResourcesByType('AWS::EC2::SecurityGroup');
      const [, sg]: any = sgs[0];
      const nameTag = sg.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      const projectTag = sg.Properties.Tags.find((t: any) => t.Key === 'Project');
      expect(projectTag.Value).toBe('IaC - AWS Nova Model Breaking');
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

    test('instances reference AMI, SG, and subnets correctly', () => {
      const primary: any = getResource('PrimaryInstance');
      expect(primary.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(primary.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'SecurityGroup' });
      expect(primary.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(primary.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });

      const standby: any = getResource('StandbyInstance');
      expect(standby.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(standby.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'SecurityGroup' });
      expect(standby.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(standby.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('instances have conditional KeyName', () => {
      const primary: any = getResource('PrimaryInstance');
      const standby: any = getResource('StandbyInstance');

      expect(primary.Properties.KeyName['Fn::If']).toBeDefined();
      expect(primary.Properties.KeyName['Fn::If'][0]).toBe('HasKeyName');

      expect(standby.Properties.KeyName['Fn::If']).toBeDefined();
      expect(standby.Properties.KeyName['Fn::If'][0]).toBe('HasKeyName');
    });

    test('user-data is present for both instances', () => {
      const primary: any = getResource('PrimaryInstance');
      const standby: any = getResource('StandbyInstance');
      expect(primary.Properties.UserData).toBeDefined();
      expect(standby.Properties.UserData).toBeDefined();
      expect(primary.Properties.UserData['Fn::Base64']).toContain('Primary Instance');
      expect(standby.Properties.UserData['Fn::Base64']).toContain('Standby Instance');
    });

    test('allocates and associates EIPs via EIPAssociation (VPC-safe)', () => {
      const eips = getResourcesByType('AWS::EC2::EIP');
      expect(eips.length).toBe(2);

      eips.forEach(([, eip]: any) => {
        expect(eip.Properties.Domain).toBe('vpc');
        const nameTag = eip.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });

      const associations = getResourcesByType('AWS::EC2::EIPAssociation').map(([, v]) => v as any);
      expect(associations.length).toBe(2);
      associations.forEach(a => {
        expect(a.Properties.AllocationId).toBeDefined();
        expect(a.Properties.InstanceId).toBeDefined();
      });
    });

    test('instances have proper Role tags', () => {
      const primary: any = getResource('PrimaryInstance');
      const standby: any = getResource('StandbyInstance');

      const primaryRoleTag = primary.Properties.Tags.find((t: any) => t.Key === 'Role');
      expect(primaryRoleTag.Value).toBe('Primary');

      const standbyRoleTag = standby.Properties.Tags.find((t: any) => t.Key === 'Role');
      expect(standbyRoleTag.Value).toBe('Standby');
    });
  });

  //
  // Route 53 Failover (no hosted zone creation in this template)
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
      // Has a Name tag
      const nameTag = hc.Properties.HealthCheckTags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('creates PRIMARY and SECONDARY A records with SetIdentifier and TTL', () => {
      const records = getResourcesByType('AWS::Route53::RecordSet').map(([k, v]) => [k, v as any]);
      expect(records.length).toBe(2);

      const primary = records.find(([, v]) => v.Properties.Failover === 'PRIMARY');
      const secondary = records.find(([, v]) => v.Properties.Failover === 'SECONDARY');

      expect(primary).toBeTruthy();
      expect(secondary).toBeTruthy();

      const [, primaryRs]: any = primary!;
      expect(primaryRs.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
      expect(primaryRs.Properties.Name).toEqual({ Ref: 'RecordName' });
      expect(primaryRs.Properties.Type).toBe('A');
      expect(primaryRs.Properties.SetIdentifier).toBe('Primary');
      expect(primaryRs.Properties.TTL).toBe(60);
      expect(primaryRs.Properties.HealthCheckId).toEqual({ Ref: 'PrimaryHealthCheck' });
      expect(primaryRs.Properties.ResourceRecords).toEqual([{ Ref: 'PrimaryEIP' }]);

      const [, secondaryRs]: any = secondary!;
      expect(secondaryRs.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
      expect(secondaryRs.Properties.Name).toEqual({ Ref: 'RecordName' });
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
      'HostedZoneIdOutput',
      'VPCId',
    ];

    test('has all expected outputs', () => {
      expectedOutputs.forEach(o => {
        expect(template.Outputs[o]).toBeDefined();
      });
    });

    test('outputs have proper export names with stack name', () => {
      Object.entries(template.Outputs).forEach(([key, output]: any) => {
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('DNSName output echoes RecordName parameter', () => {
      const out = template.Outputs.DNSName;
      expect(out.Value).toEqual({ Ref: 'RecordName' });
    });

    test('VPCId output references VPC resource', () => {
      const out = template.Outputs.VPCId;
      expect(out.Value).toEqual({ Ref: 'VPC' });
    });

    test('HostedZoneIdOutput equals HostedZoneId parameter (no condition)', () => {
      const out = template.Outputs.HostedZoneIdOutput;
      expect(out.Value).toEqual({ Ref: 'HostedZoneId' });
    });
  });

  //
  // Best Practices
  //
  describe('Best Practices', () => {
    test('all taggable resources have Name tags', () => {
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::EC2::EIP',
      ];

      taggableTypes.forEach(type => {
        const resources = getResourcesByType(type);
        resources.forEach(([, resource]: any) => {
          if (resource.Properties.Tags) {
            const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
            expect(nameTag).toBeDefined();
          }
        });
      });
    });

    test('all resources with Project tag have correct value', () => {
      Object.entries(template.Resources).forEach(([, resource]: any) => {
        if (resource.Properties?.Tags) {
          const projectTag = resource.Properties.Tags.find((t: any) => t.Key === 'Project');
          if (projectTag) {
            expect(projectTag.Value).toBe('IaC - AWS Nova Model Breaking');
          }
        }
      });
    });

    test('no old environment-specific markers (except allowed KeyName default)', () => {
      const templateString = JSON.stringify(template);

      // Allow pr104 only where it appears as part of the KeyName default
      const allowedKeyDefault =
        template?.Parameters?.KeyName?.Default ?? '';

      // Remove the allowed occurrence(s) from the string before checking
      const sanitized = allowedKeyDefault
        ? templateString.split(allowedKeyDefault).join('<KEYNAME_DEFAULT>')
        : templateString;

      expect(sanitized).not.toContain('pr104');
    });

  });

  //
  // Sanity checks
  //
  describe('Sanity', () => {
    test('template is a valid JSON object', () => {
      expect(template && typeof template === 'object').toBe(true);
    });

    test('has reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
      expect(resourceCount).toBeLessThan(50);
    });

    test('all resource types are valid AWS types', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });
  });
});
