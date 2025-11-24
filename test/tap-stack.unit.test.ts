import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template metadata', () => {

    test('exposes well-formed UI metadata', () => {
      // Arrange
      const metadata = template.Metadata?.['AWS::CloudFormation::Interface'];
      // Act
      const parameterGroups = metadata?.ParameterGroups ?? [];
      const parameterLabels = metadata?.ParameterLabels ?? {};
      // Assert
      expect(parameterGroups).toHaveLength(4);
      expect(parameterLabels.EnvironmentName).toEqual({
        default: 'Environment Name',
      });
      expect(parameterLabels.AlertEmail).toEqual({
        default: 'Alert Email Address',
      });
    });
  });

  describe('Parameter definitions', () => {
    test('EnvironmentName parameter enforces enumerated values', () => {
      // Arrange
      const param = template.Parameters.EnvironmentName;
      // Act
      const { AllowedValues, Default } = param;
      // Assert
      expect(Default).toBe('Production');
      expect(AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('KeyPairName parameter allows blank or valid EC2 key names', () => {
      // Arrange
      const param = template.Parameters.KeyPairName;
      // Act
      const { Type, Default, AllowedPattern } = param;
      // Assert
      expect(Type).toBe('String');
      expect(Default).toBe('');
      expect(AllowedPattern).toBe('^$|[A-Za-z0-9._-]+$');
    });

    test('DBMasterPassword parameter satisfies security constraints', () => {
      // Arrange
      const param = template.Parameters.DBMasterPassword;
      // Act
      const { NoEcho, Default, MinLength, AllowedPattern } = param;
      // Assert
      expect(NoEcho).toBe(true);
      expect(Default).toBe('ChangeMe123!');
      expect(MinLength).toBeGreaterThanOrEqual(8);
      expect(AllowedPattern).toBe(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$'
      );
    });
  });

  describe('Mappings and conditions', () => {
    test('SubnetConfig mapping covers public and private CIDRs', () => {
      // Arrange
      const subnetConfig = template.Mappings.SubnetConfig;
      // Act
      const cidrBlocks = Object.values(subnetConfig).map(
        (entry: any) => entry.CIDR
      );
      // Assert
      expect(cidrBlocks).toEqual(
        expect.arrayContaining([
          '10.0.0.0/16',
          '10.0.1.0/24',
          '10.0.2.0/24',
          '10.0.11.0/24',
          '10.0.12.0/24',
        ])
      );
    });

    test('HasKeyPair condition mirrors optional SSH access', () => {
      // Arrange
      const hasKeyPair = template.Conditions.HasKeyPair;
      // Act
      const equalsClause = hasKeyPair?.['Fn::Not']?.[0]?.['Fn::Equals'];
      // Assert
      expect(equalsClause).toEqual([{ Ref: 'KeyPairName' }, '']);
    });
  });

  describe('Core networking resources', () => {
    test('VPC is tagged and DNS-enabled', () => {
      // Arrange
      const vpc = template.Resources.VPC;
      // Act
      const { Properties } = vpc;
      // Assert
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(Properties.EnableDnsHostnames).toBe(true);
      expect(Properties.EnableDnsSupport).toBe(true);
      expect(Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Name' }),
          expect.objectContaining({ Key: 'Environment' }),
        ])
      );
    });

    test('Public subnets map to AZ indices 0 and 1 with public IP mapping', () => {
      // Arrange
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      // Act
      const azSelection1 = publicSubnet1.Properties.AvailabilityZone;
      const azSelection2 = publicSubnet2.Properties.AvailabilityZone;
      // Assert
      expect(azSelection1).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(azSelection2).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private route tables send egress through NAT gateways', () => {
      // Arrange
      const privateRoute1 =
        template.Resources.DefaultPrivateRoute1.Properties;
      const privateRoute2 =
        template.Resources.DefaultPrivateRoute2.Properties;
      // Act
      const natGatewayRefs = [
        privateRoute1.NatGatewayId.Ref,
        privateRoute2.NatGatewayId.Ref,
      ];
      // Assert
      expect(privateRoute1.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute2.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(natGatewayRefs).toEqual(
        expect.arrayContaining(['NatGateway1', 'NatGateway2'])
      );
    });
  });

  describe('Compute and security resources', () => {
    test('Launch template enforces IMDSv2 and optional KeyPair usage', () => {
      // Arrange
      const launchTemplate =
        template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      // Act
      const { MetadataOptions, KeyName } = launchTemplate;
      // Assert
      expect(MetadataOptions).toEqual({
        HttpEndpoint: 'enabled',
        HttpTokens: 'required',
      });
      expect(KeyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { Ref: 'KeyPairName' },
          { Ref: 'AWS::NoValue' },
        ],
      });
    });

    test('Security groups enforce tiered access controls', () => {
      // Arrange
      const webSg = template.Resources.WebServerSecurityGroup.Properties;
      const dbSg = template.Resources.DatabaseSecurityGroup.Properties;
      // Act
      const webIngress = webSg.SecurityGroupIngress;
      const dbIngress = dbSg.SecurityGroupIngress;
      // Assert
      expect(webIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' },
          }),
          expect.objectContaining({
            FromPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ])
      );
      expect(dbIngress).toEqual([
        expect.objectContaining({
          FromPort: 3306,
          SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' },
        }),
      ]);
    });

    test('Auto Scaling group attaches the ALB target group and spans AZs', () => {
      // Arrange
      const asgProps = template.Resources.AutoScalingGroup.Properties;
      // Act
      const { VPCZoneIdentifier, TargetGroupARNs, MinSize, MaxSize } =
        asgProps;
      // Assert
      expect(VPCZoneIdentifier).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
      expect(TargetGroupARNs).toEqual([{ Ref: 'ALBTargetGroup' }]);
      expect(MinSize).toBe(2);
      expect(MaxSize).toBe(6);
    });
  });

  describe('Data, monitoring and storage resources', () => {
    test('RDS instance stays private, encrypted, and Multi-AZ', () => {
      // Arrange
      const rds = template.Resources.RDSDatabase.Properties;
      // Act
      const {
        MultiAZ,
        PubliclyAccessible,
        StorageEncrypted,
        EngineVersion,
        VPCSecurityGroups,
      } = rds;
      // Assert
      expect(MultiAZ).toBe(true);
      expect(PubliclyAccessible).toBe(false);
      expect(StorageEncrypted).toBe(true);
      expect(EngineVersion).toBe('8.0.43');
      expect(VPCSecurityGroups).toEqual([{ Ref: 'DatabaseSecurityGroup' }]);
    });

    test('Template storage bucket blocks public access and enforces SSE', () => {
      // Arrange
      const bucket = template.Resources.TemplateStorageBucket.Properties;
      // Act
      const encryption =
        bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      // Assert
      expect(encryption.SSEAlgorithm).toBe('AES256');
      expect(publicAccess).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    test('Secrets Manager resource wraps DB credentials', () => {
      // Arrange
      const secret = template.Resources.DBMasterSecret;
      // Act
      const secretString = secret.Properties.SecretString?.['Fn::Sub'];
      // Assert
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secretString).toContain('"username":"${DBMasterUsername}"');
      expect(secretString).toContain('"password":"${DBMasterPassword}"');
    });
  });

  describe('Outputs', () => {
    test('exports key identifiers for downstream automation', () => {
      // Arrange
      const outputKeys = Object.keys(template.Outputs);
      // Act
      const required = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ApplicationLoadBalancerDNS',
        'DatabaseEndpoint',
        'TemplateBucketName',
      ];
      // Assert
      expect(outputKeys).toEqual(expect.arrayContaining(required));
    });

    test('RDS output masks password data in connection string', () => {
      // Arrange
      const connectionString =
        template.Outputs.DatabaseConnectionString.Value?.['Fn::Sub'];
      // Act
      const placeholder =
        '${DBMasterUsername}:****@${RDSDatabase.Endpoint.Address}';
      const containsPasswordPlaceholder =
        typeof connectionString === 'string' &&
        connectionString.includes(placeholder);
      // Assert
      expect(containsPasswordPlaceholder).toBe(true);
      expect(connectionString).toMatch(/^mysql:\/\/\$\{DBMasterUsername}/);
    });
  });
});
