import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Production-ready infrastructure with VPC, RDS, and security best practices for ap-south-1 region'
      );
    });
  });

  describe('Parameters', () => {
    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
    });

    test('DBUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.Description).toBe('Database administrator username');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should not have DBPassword parameter (replaced with Secrets Manager)', () => {
      expect(template.Parameters.DBPassword).toBeUndefined();
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
    });

    test('DBInstanceClass parameter should have correct properties', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toEqual([
        'db.t3.micro',
        'db.t3.small',
        'db.t3.medium',
        'db.t3.large'
      ]);
    });
  });

  describe('VPC Resources', () => {
    test('should have ProductionVPC resource', () => {
      expect(template.Resources.ProductionVPC).toBeDefined();
    });

    test('ProductionVPC should be a VPC', () => {
      const vpc = template.Resources.ProductionVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('ProductionVPC should have correct properties', () => {
      const vpc = template.Resources.ProductionVPC;
      const properties = vpc.Properties;

      expect(properties.CidrBlock).toBe('10.0.0.0/16');
      expect(properties.EnableDnsHostnames).toBe(true);
      expect(properties.EnableDnsSupport).toBe(true);
    });

    test('ProductionVPC should have correct tags', () => {
      const vpc = template.Resources.ProductionVPC;
      const tags = vpc.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Name',
        Value: 'Production-VPC'
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
    });

    test('PublicSubnet should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet;
      const properties = subnet.Properties;

      expect(properties.VpcId.Ref).toBe('ProductionVPC');
      expect(properties.CidrBlock).toBe('10.0.1.0/24');
      expect(properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
    });

    test('PrivateSubnet1 should have correct properties', () => {
      const subnet = template.Resources.PrivateSubnet1;
      const properties = subnet.Properties;

      expect(properties.VpcId.Ref).toBe('ProductionVPC');
      expect(properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('PrivateSubnet2 should have correct properties', () => {
      const subnet = template.Resources.PrivateSubnet2;
      const properties = subnet.Properties;

      expect(properties.VpcId.Ref).toBe('ProductionVPC');
      expect(properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('all subnets should have correct tags', () => {
      const subnets = ['PublicSubnet', 'PrivateSubnet1', 'PrivateSubnet2'];
      
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        const tags = subnet.Properties.Tags;
        
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: 'Production'
        });
      });
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('should have InternetGatewayAttachment resource', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('InternetGatewayAttachment should reference correct resources', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
      expect(attachment.Properties.VpcId.Ref).toBe('ProductionVPC');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NatGatewayEIP resource', () => {
      expect(template.Resources.NatGatewayEIP).toBeDefined();
    });

    test('should have NatGateway resource', () => {
      expect(template.Resources.NatGateway).toBeDefined();
    });

    test('NatGateway should be in public subnet', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.SubnetId.Ref).toBe('PublicSubnet');
    });
  });

  describe('Route Tables', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('should have PrivateRouteTable resource', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('public route table should route to internet gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    test('private route table should route to NAT gateway', () => {
      const route = template.Resources.DefaultPrivateRoute;
      expect(route.Properties.RouteTableId.Ref).toBe('PrivateRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId.Ref).toBe('NatGateway');
    });
  });

  describe('Security Groups', () => {
    test('should have WebSecurityGroup resource', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
    });

    test('WebSecurityGroup should allow HTTP and HTTPS from specified CIDR', () => {
      const sg = template.Resources.WebSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('203.0.113.0/24');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('203.0.113.0/24');
    });

    test('should have DatabaseSecurityGroup resource', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('DatabaseSecurityGroup should allow MySQL from web security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const mysqlRule = ingress.find((rule: any) => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId.Ref).toBe('WebSecurityGroup');
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
    });

    test('DatabaseSecret should have correct properties', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name['Fn::Sub']).toContain('database-secret');
      expect(secret.Properties.Description).toBe('Database credentials for production environment');
    });

    test('DatabaseSecret should generate password with correct settings', () => {
      const secret = template.Resources.DatabaseSecret;
      const generateSecret = secret.Properties.GenerateSecretString;
      
      expect(generateSecret.GenerateStringKey).toBe('password');
      expect(generateSecret.PasswordLength).toBe(16);
      expect(generateSecret.ExcludeCharacters).toBe('"@/\\');
      expect(generateSecret.RequireEachIncludedType).toBe(true);
    });
  });

  describe('KMS Resources', () => {
    test('should have RDSKMSKey resource', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
    });

    test('should have RDSKMSKeyAlias resource', () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
    });

    test('KMS key should have correct alias', () => {
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias.Properties.AliasName).toBe('alias/production-rds-key');
    });
  });

  describe('RDS Resources', () => {
    test('should have DBSubnetGroup resource', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
    });

    test('DBSubnetGroup should include both private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = subnetGroup.Properties.SubnetIds;

      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have DatabaseInstance resource', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
    });

    test('DatabaseInstance should be encrypted with KMS', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId.Ref).toBe('RDSKMSKey');
    });

    test('DatabaseInstance should be in private subnet', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
    });

    test('DatabaseInstance should use dynamic references for credentials', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBInstanceClass.Ref).toBe('DBInstanceClass');
      expect(db.Properties.MasterUsername['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });
  });

  describe('IAM Resources', () => {
    test('should have RDSEnhancedMonitoringRole resource', () => {
      expect(template.Resources.RDSEnhancedMonitoringRole).toBeDefined();
    });

    test('RDSEnhancedMonitoringRole should have correct trust policy', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(trustPolicy.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'WebSecurityGroupId',
        'NATGatewayId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value.Ref).toBe('ProductionVPC');
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS instance endpoint');
      expect(output.Value['Fn::GetAtt']).toEqual(['DatabaseInstance', 'Endpoint.Address']);
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // VPC, subnets, IGW, NAT, routes, SGs, KMS, RDS, IAM
    });

    test('should have exactly two parameters (DBPassword replaced with Secrets Manager)', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have exactly seven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have Environment: Production tag', () => {
      const resources = template.Resources;
      
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('RDS should not be publicly accessible', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should have deletion protection enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DeletionProtection).toBe(true);
    });
  });
});

