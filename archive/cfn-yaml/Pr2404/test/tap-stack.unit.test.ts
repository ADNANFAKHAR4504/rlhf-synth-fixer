import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json` // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should define required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should include required parameters (without secret name param)', () => {
      const params = template.Parameters;
      expect(params.DBAllocatedStorage).toBeDefined();
      expect(params.DBInstanceClass).toBeDefined();
      expect(params.DBEngineVersion).toBeDefined();
      expect(params.BackupRetentionPeriod).toBeDefined();
    });

    test('DBAllocatedStorage should have sane defaults and constraints', () => {
      const p = template.Parameters.DBAllocatedStorage;
      expect(p.Type).toBe('Number');
      expect(p.Default).toBeGreaterThanOrEqual(20);
      expect(p.MinValue).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC and subnets', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('subnets should use dynamic AZs via GetAZs', () => {
      const publicAz = template.Resources.PublicSubnet.Properties.AvailabilityZone;
      const private1Az = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const private2Az = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;

      // Validate structure like { "Fn::Select": [ 0, { "Fn::GetAZs": "" } ] }
      const isSelectGetAZs = (az: any) =>
        az && az['Fn::Select'] && Array.isArray(az['Fn::Select']) && az['Fn::Select'][1] && az['Fn::Select'][1]['Fn::GetAZs'] !== undefined;

      expect(isSelectGetAZs(publicAz)).toBe(true);
      expect(isSelectGetAZs(private1Az)).toBe(true);
      expect(isSelectGetAZs(private2Az)).toBe(true);
    });

    test('should have IGW, route tables, NAT and associations', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });

    test('PublicRoute should depend on VPCGatewayAttachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBeDefined();
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('NatGatewayEIP should depend on VPCGatewayAttachment', () => {
      const eip = template.Resources.NatGatewayEIP;
      expect(eip.DependsOn).toBeDefined();
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Security Group', () => {
    test('ingress should allow only 80 and 443 from 203.0.113.0/24', () => {
      const sg = template.Resources.SecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const ports = ingress.map((r: any) => ({ from: r.FromPort, to: r.ToPort, cidr: r.CidrIp }));
      expect(ports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ from: 80, to: 80, cidr: '203.0.113.0/24' }),
          expect.objectContaining({ from: 443, to: 443, cidr: '203.0.113.0/24' }),
        ])
      );
      expect(ingress.length).toBe(2);
    });
  });

  describe('RDS Instance', () => {
    test('RDS should exist and be private/encrypted', () => {
      const db = template.Resources.RDSInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should use best-practice properties', () => {
      const p = template.Resources.RDSInstance.Properties;
      expect(p.DBInstanceClass).toBeDefined();
      expect(p.Engine).toBe('mysql');
      // EngineVersion can be a literal or an intrinsic Ref
      const engineVersionIsLiteralOrRef =
        typeof p.EngineVersion === 'string' || !!p.EngineVersion?.Ref;
      expect(engineVersionIsLiteralOrRef).toBe(true);
      // AllocatedStorage can be a number or an intrinsic Ref to parameter
      expect(p.AllocatedStorage).toBeDefined();
      if (typeof p.AllocatedStorage === 'number') {
        expect(p.AllocatedStorage).toBeGreaterThanOrEqual(20);
      } else {
        expect(p.AllocatedStorage.Ref).toBeDefined();
      }
      expect(p.StorageType).toBe('gp3');
      expect(p.CopyTagsToSnapshot).toBe(true);
      expect(p.MultiAZ).toBe(true);
      expect(p.DeletionProtection).toBe(true);
      expect(p.BackupRetentionPeriod).toBeDefined();
      expect(p.PreferredBackupWindow).toBeDefined();
      expect(p.PreferredMaintenanceWindow).toBeDefined();
      expect(p.AutoMinorVersionUpgrade).toBe(true);
    });

    test('RDS should manage master user password via Secrets Manager', () => {
      const p = template.Resources.RDSInstance.Properties;
      expect(p.ManageMasterUserPassword).toBe(true);
      expect(p.MasterUserPassword).toBeUndefined();
    });

    test('RDS should be in private subnets via subnet group', () => {
      const subnetGroup = template.Resources.RDSSubnetGroup;
      expect(subnetGroup).toBeDefined();
      const ids = subnetGroup.Properties.SubnetIds;
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(2);
    });
  });

  describe('Outputs', () => {
    test('should expose key outputs', () => {
      const outputs = template.Outputs;
      const expected = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'InternetGatewayId',
        'NatGatewayId',
        'SecurityGroupId',
        'RDSSubnetGroupName',
        'RDSEndpointAddress',
      ];
      expected.forEach(name => expect(outputs[name]).toBeDefined());
    });
  });

  describe('Best Practices and Tagging (from archive reference)', () => {
    test('critical resources should carry Environment: Production tag', () => {
      const resourcesToCheck = [
        'VPC',
        'PublicSubnet',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'InternetGateway',
        'PublicRouteTable',
        'NatGatewayEIP',
        'NatGateway',
        'PrivateRouteTable',
        'SecurityGroup',
        'RDSSubnetGroup',
        'RDSInstance',
      ];

      const hasEnvProdTag = (res: any) => {
        const tags = res?.Properties?.Tags || [];
        return tags.some((t: any) => t.Key === 'Environment' && t.Value === 'Production');
      };

      resourcesToCheck.forEach(name => {
        expect(template.Resources[name]).toBeDefined();
        expect(hasEnvProdTag(template.Resources[name])).toBe(true);
      });
    });

    test('RDS should have lifecycle protections (deletion/update policies)', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.DeletionPolicy).toBe('Retain');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });
  });
});
