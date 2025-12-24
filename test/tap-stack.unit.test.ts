import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: Record<string, any>;
  let parameters: Record<string, any>;
  let resources: Record<string, any>;
  let outputs: Record<string, any>;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const fileContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(fileContent) as Record<string, any>;
    parameters = template.Parameters;
    resources = template.Resources;
    outputs = template.Outputs;
  });

  describe('Template structure', () => {
    test('includes version, description, and metadata', () => {
      // Arrange
      const expectedDescription =
        'Production-ready infrastructure with EC2, S3, IAM, and security configurations - Region-locked to us-west-2';

      // Act
      const iface = template.Metadata['AWS::CloudFormation::Interface'];

      // Assert
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(expectedDescription);
      expect(iface.ParameterGroups).toBeDefined();
      expect(iface.ParameterLabels).toBeDefined();
    });
  });

  describe('Parameter definitions', () => {
    test('AllowedSSHIP enforces CIDR constraints', () => {
      // Arrange
      const param = parameters.AllowedSSHIP;
      const pattern = new RegExp(param.AllowedPattern);

      // Act
      const validValueMatches = pattern.test('203.0.113.10/32');
      const invalidValueMatches = pattern.test('999.0.0.1/40');

      // Assert
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.1/32');
      expect(validValueMatches).toBe(true);
      expect(invalidValueMatches).toBe(false);
    });

    test('InstanceType restricts to supported t3 classes', () => {
      // Arrange
      const param = parameters.InstanceType;

      // Act
      const allowedValues = param.AllowedValues;

      // Assert
      expect(allowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      expect(param.Default).toBe('t3.micro');
    });

    test('S3BucketNameSuffix maintains naming boundaries', () => {
      // Arrange
      const param = parameters.S3BucketNameSuffix;
      const pattern = new RegExp(param.AllowedPattern);

      // Act
      const validName = pattern.test('prod-data');
      const invalidName = pattern.test('Prod_Data');

      // Assert
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(20);
      expect(validName).toBe(true);
      expect(invalidName).toBe(false);
    });

    test('LatestAmiId pulls from SSM parameter store', () => {
      // Arrange
      const param = parameters.LatestAmiId;

      // Act & Assert
      expect(param.Type).toBe("AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>");
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('S3 storage layer', () => {
    test('ProdS3Bucket enforces versioning, encryption, and lifecycle', () => {
      // Arrange
      const bucket = resources.ProdS3Bucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      // Act
      const deleteRule = lifecycleRules.find((rule: any) => rule.Id === 'DeleteOldVersions');
      const transitionRule = lifecycleRules.find((rule: any) => rule.Id === 'TransitionToIA');

      // Assert
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(deleteRule.NoncurrentVersionExpirationInDays).toBe(90);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
    });

    test('ProdS3BucketPolicy denies insecure transport', () => {
      // Arrange
      const policy = resources.ProdS3BucketPolicy.Properties.PolicyDocument.Statement[0];

      // Act & Assert
      expect(policy.Effect).toBe('Deny');
      expect(policy.Condition.Bool['aws:SecureTransport']).toBe(false);
      expect(policy.Resource).toHaveLength(2);
    });
  });

  describe('IAM configuration', () => {
    test('ProdEC2Role grants least-privilege read access to bucket', () => {
      // Arrange
      const role = resources.ProdEC2Role;
      const policyStatements = role.Properties.Policies[0].PolicyDocument.Statement;
      const bucketStatement = policyStatements.find(
        (statement: any) => statement.Sid === 'S3BucketReadAccess'
      );

      // Act
      const actions = bucketStatement.Action;

      // Assert
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:ListBucket');
      expect(bucketStatement.Resource).toEqual([
        { 'Fn::GetAtt': ['ProdS3Bucket', 'Arn'] },
        { 'Fn::Sub': '${ProdS3Bucket.Arn}/*' },
      ]);
    });

    test('Instance profile attaches the role before EC2 launch', () => {
      // Arrange
      const profile = resources.ProdEC2InstanceProfile;

      // Act & Assert
      expect(profile.Properties.Roles).toEqual([{ Ref: 'ProdEC2Role' }]);
    });
  });

  describe('Networking and security', () => {
    test('VPC, subnet, and routing form a public network path', () => {
      // Arrange
      const vpc = resources.ProdVPC;
      const subnet = resources.ProdPublicSubnet;
      const route = resources.ProdPublicRoute;

      // Act & Assert
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'ProdVPC' });
      expect(route.Properties.GatewayId).toEqual({ Ref: 'ProdInternetGateway' });
    });

    test('Security group restricts SSH and opens required outbound traffic', () => {
      // Arrange
      const sg = resources.ProdSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];

      // Act
      const outboundPorts = sg.Properties.SecurityGroupEgress.map(
        (rule: any) => `${rule.IpProtocol}-${rule.FromPort}`
      );

      // Assert
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.CidrIp).toEqual({ Ref: 'AllowedSSHIP' });
      expect(outboundPorts).toEqual(['tcp-443', 'tcp-80', 'tcp-53', 'udp-53']);
    });
  });

  describe('Compute layer', () => {
    test('EC2 instance wiring uses IAM profile, key pair, and monitoring', () => {
      // Arrange
      const instance = resources.ProdEC2Instance;

      // Act & Assert
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'ProdEC2InstanceProfile' });
      expect(instance.Properties.KeyName).toEqual({ Ref: 'ProdKeyPair' });
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('Block device mapping provisions encrypted gp3 volume with IOPS', () => {
      // Arrange
      const ebs = resources.ProdEC2Instance.Properties.BlockDeviceMappings[0].Ebs;

      // Act & Assert
      expect(ebs.VolumeType).toBe('gp3');
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.Iops).toBe(3000);
    });
  });

  describe('Outputs', () => {
    test('exports expose bucket identity and ARN', () => {
      // Arrange
      const bucketNameOutput = outputs.S3BucketName;
      const bucketArnOutput = outputs.S3BucketArn;

      // Act & Assert
      expect(bucketNameOutput.Value).toEqual({ Ref: 'ProdS3Bucket' });
      expect(bucketArnOutput.Value).toEqual({ 'Fn::GetAtt': ['ProdS3Bucket', 'Arn'] });
    });

    test('SSH command output references prod key pair and instance DNS', () => {
      // Arrange
      const sshOutput = outputs.SSHCommand;

      // Act & Assert
      expect(sshOutput.Value).toEqual({
        'Fn::Sub': 'ssh -i ~/.ssh/${ProdKeyPair}.pem ec2-user@${ProdEC2Instance.PublicDnsName}',
      });
    });
  });
});
