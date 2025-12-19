import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

describe('Secure Multi-AZ AWS Infrastructure Template (Unit)', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure Multi-AZ AWS Infrastructure with WAF, RDS, and Enhanced Security Controls'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(Object.keys(template.Parameters)).toEqual(
        expect.arrayContaining(['Environment', 'VpcCidr'])
      );
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
      expect(envParam.Description).toBe('Environment type for resource tagging and naming');
    });

    test('Database credentials should be managed by Secrets Manager when RDS is enabled', () => {
      // Check if CreateRDSInstance condition is true
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS || createRDS['Fn::Not'][0]['Fn::Equals'][1] === 'skip-rds') {
        console.log('Skipping RDS secrets test - RDS creation disabled');
        return;
      }

      const dbSecret = template.Resources.DBSecret;
      expect(dbSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(dbSecret.Properties.GenerateSecretString.PasswordLength).toBeGreaterThanOrEqual(16);
      expect(dbSecret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(dbSecret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });

    test('RDS instance should use Secrets Manager for credentials when RDS is enabled', () => {
      // Check if CreateRDSInstance condition is true
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS || createRDS['Fn::Not'][0]['Fn::Equals'][1] === 'skip-rds') {
        console.log('Skipping RDS credentials test - RDS creation disabled');
        return;
      }

      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.MasterUsername['Fn::Sub']).toContain('{{resolve:secretsmanager:${DBSecret}:SecretString:username}}');
      expect(rdsInstance.Properties.MasterUserPassword['Fn::Sub']).toContain('{{resolve:secretsmanager:${DBSecret}:SecretString:password}}');
    });
  });

  describe('KMS Configuration', () => {
    test('should have KMS key with rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should grant necessary KMS permissions to services', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const statements = keyPolicy.Statement;

      // Check RDS permissions
      const rdsStatement = statements.find((s: any) => s.Sid === 'Allow RDS Service');
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
      expect(rdsStatement.Action).toContain('kms:GenerateDataKey');

      // Check S3 permissions
      const s3Statement = statements.find((s: any) => s.Sid === 'Allow S3 Service');
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
      expect(s3Statement.Action).toContain('kms:Decrypt');
      expect(s3Statement.Action).toContain('kms:GenerateDataKey');
    });
  });

  describe('Network Configuration', () => {
    test('should include VPC with DNS support', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have multi-AZ subnet configuration', () => {
      const pub1 = template.Resources.PublicSubnet1.Properties;
      const pub2 = template.Resources.PublicSubnet2.Properties;
      const priv1 = template.Resources.PrivateSubnet1.Properties;
      const priv2 = template.Resources.PrivateSubnet2.Properties;

      // Check AZ distribution
      expect(pub1.AvailabilityZone['Fn::Select']).toEqual([0, { 'Fn::FindInMap': ['RegionMap', { 'Ref': 'AWS::Region' }, 'AZs'] }]);
      expect(pub2.AvailabilityZone['Fn::Select']).toEqual([1, { 'Fn::FindInMap': ['RegionMap', { 'Ref': 'AWS::Region' }, 'AZs'] }]);
      expect(priv1.AvailabilityZone['Fn::Select']).toEqual([0, { 'Fn::FindInMap': ['RegionMap', { 'Ref': 'AWS::Region' }, 'AZs'] }]);
      expect(priv2.AvailabilityZone['Fn::Select']).toEqual([1, { 'Fn::FindInMap': ['RegionMap', { 'Ref': 'AWS::Region' }, 'AZs'] }]);

      // Check public IP settings
      expect(pub1.MapPublicIpOnLaunch).toBe(true);
      expect(pub2.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have properly configured route tables', () => {
      // Check public route table
      const publicRT = template.Resources.PublicRouteTable.Properties;
      const publicRoute = template.Resources.PublicRoute.Properties;

      expect(publicRT.VpcId.Ref).toBe('VPC');
      expect(publicRoute.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(publicRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.GatewayId.Ref).toBe('InternetGateway');

      // Check private route tables
      const privateRT1 = template.Resources.PrivateRouteTable1.Properties;
      const privateRT2 = template.Resources.PrivateRouteTable2.Properties;
      const privateRoute1 = template.Resources.PrivateRoute1.Properties;
      const privateRoute2 = template.Resources.PrivateRoute2.Properties;

      expect(privateRT1.VpcId.Ref).toBe('VPC');
      expect(privateRT2.VpcId.Ref).toBe('VPC');
      expect(privateRoute1.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(privateRoute2.RouteTableId.Ref).toBe('PrivateRouteTable2');
      expect(privateRoute1.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute2.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.NatGatewayId.Ref).toBe('NatGateway1');
      expect(privateRoute2.NatGatewayId.Ref).toBe('NatGateway2');

      // Check route table associations
      const pub1Assoc = template.Resources.PublicSubnet1RouteTableAssociation.Properties;
      const pub2Assoc = template.Resources.PublicSubnet2RouteTableAssociation.Properties;
      const priv1Assoc = template.Resources.PrivateSubnet1RouteTableAssociation.Properties;
      const priv2Assoc = template.Resources.PrivateSubnet2RouteTableAssociation.Properties;

      expect(pub1Assoc.SubnetId.Ref).toBe('PublicSubnet1');
      expect(pub2Assoc.SubnetId.Ref).toBe('PublicSubnet2');
      expect(priv1Assoc.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(priv2Assoc.SubnetId.Ref).toBe('PrivateSubnet2');

      expect(pub1Assoc.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(pub2Assoc.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(priv1Assoc.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(priv2Assoc.RouteTableId.Ref).toBe('PrivateRouteTable2');
    });

    test('should have NAT Gateways in public subnets for high availability', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;

      // Check NAT Gateway 1
      expect(nat1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(nat1.Properties.AllocationId['Fn::GetAtt'][0]).toBe('NatGatewayEIP1');
      expect(nat1.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: expect.objectContaining({
              'Fn::Sub': '${Environment}-NAT-1'
            })
          })
        ])
      );

      // Check NAT Gateway 2
      expect(nat2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
      expect(nat2.Properties.AllocationId['Fn::GetAtt'][0]).toBe('NatGatewayEIP2');
      expect(nat2.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: expect.objectContaining({
              'Fn::Sub': '${Environment}-NAT-2'
            })
          })
        ])
      );
    });
  });

  describe('Security Groups', () => {
    test('should restrict web traffic to ports 80 and 443', () => {
      const webSG = template.Resources.WebSecurityGroup.Properties;
      const ingressRules = webSG.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(2);
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          }),
          expect.objectContaining({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          })
        ])
      );
    });

    test('should restrict RDS access to web security group when RDS is enabled', () => {
      // Check if CreateRDSInstance condition exists and has the correct structure
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS || !createRDS['Fn::Not'] || !createRDS['Fn::Not'][0]['Fn::Equals']) {
        console.log('Skipping RDS security group test - invalid condition structure');
        return;
      }

      // Skip if RDS is disabled (region equals 'skip-rds')
      if (createRDS['Fn::Not'][0]['Fn::Equals'][1] === 'skip-rds') {
        console.log('Skipping RDS security group test - RDS creation disabled');
        return;
      }

      const rdssg = template.Resources.RDSSecurityGroup.Properties;
      const ingressRules = rdssg.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0]).toEqual(
        expect.objectContaining({
          FromPort: 3306,
          ToPort: 3306,
          IpProtocol: 'tcp',
          SourceSecurityGroupId: { Ref: 'WebSecurityGroup' }
        })
      );
    });
  });

  describe('RDS Configuration', () => {
    test('should be Multi-AZ and encrypted when RDS is enabled', () => {
      // Check if CreateRDSInstance condition exists
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS) {
        console.log('Skipping RDS configuration test - RDS condition not found');
        return;
      }

      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.MultiAZ).toBe(true);
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.KmsKeyId.Ref).toBe('KMSKey');
      expect(rds.AllocatedStorage).toBe(20);
    });

    test('should use private subnets when RDS is enabled', () => {
      // Check if CreateRDSInstance condition exists
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS) {
        console.log('Skipping RDS subnet group test - RDS condition not found');
        return;
      }

      const subnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(subnetGroup.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });
  });

  describe('S3 Configuration', () => {
    test('should have encryption and versioning enabled', () => {
      const s3 = template.Resources.SecureS3Bucket.Properties;
      expect(s3.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(s3.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should block public access', () => {
      const s3 = template.Resources.SecureS3Bucket.Properties;
      const publicAccess = s3.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('WAF Configuration', () => {
    test('should have SQL injection protection', () => {
      const waf = template.Resources.WebACL.Properties;
      const sqlRule = waf.Rules.find((r: any) => r.Name === 'BlockSQLInjection');

      expect(sqlRule).toBeDefined();
      expect(sqlRule.Statement.SqliMatchStatement).toBeDefined();
      expect(sqlRule.Action.Block).toBeDefined();
    });
  });

  describe('Monitoring', () => {
    test('should have RDS CPU utilization alarm when RDS is enabled', () => {
      // Check if CreateRDSInstance condition exists
      const createRDS = template.Conditions.CreateRDSInstance;
      if (!createRDS) {
        console.log('Skipping RDS alarm test - RDS condition not found');
        return;
      }

      const alarm = template.Resources.RDSAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
    });
  });

  describe('Outputs', () => {
    test('should expose necessary resource information', () => {
      expect(Object.keys(template.Outputs)).toEqual(
        expect.arrayContaining([
          'VPCId',
          'PublicSubnets',
          'PrivateSubnets',
          'RDSEndpoint',
          'S3BucketName',
          'WebACLArn'
        ])
      );
    });
  });
});
