import fs from 'fs';
import path from 'path';

describe('SecureApp CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing (assuming you have both formats)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('SecureApp infrastructure');
    });

    test('should have required top-level sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should not have parameters section (as requested)', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.SecureAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'secureapp-vpc-${AWS::AccountId}' }
      });
    });

    test('should have Internet Gateway with proper attachment', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have subnets in multiple AZs with correct CIDR blocks', () => {
      const subnets = [
        { name: 'PublicSubnet1', cidr: '10.0.1.0/24', public: true },
        { name: 'PublicSubnet2', cidr: '10.0.2.0/24', public: true },
        { name: 'PrivateSubnet1', cidr: '10.0.3.0/24', public: false },
        { name: 'PrivateSubnet2', cidr: '10.0.4.0/24', public: false },
        { name: 'DatabaseSubnet1', cidr: '10.0.5.0/24', public: false },
        { name: 'DatabaseSubnet2', cidr: '10.0.6.0/24', public: false }
      ];

      subnets.forEach((subnet, index) => {
        const resource = template.Resources[subnet.name];
        expect(resource.Type).toBe('AWS::EC2::Subnet');
        expect(resource.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });
        expect(resource.Properties.CidrBlock).toBe(subnet.cidr);
        expect(resource.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index % 2, { 'Fn::GetAZs': '' }]
        });
        
        if (subnet.public) {
          expect(resource.Properties.MapPublicIpOnLaunch).toBe(true);
        }
      });
    });

    test('should have NAT Gateway with EIP in public subnet', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');

      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
      });
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should have route tables with correct routes', () => {
      // Public route table
      const publicRT = template.Resources.PublicRouteTable;
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRT.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      // Private route table
      const privateRT = template.Resources.PrivateRouteTable;
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');

      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnetRouteTableAssociation1',
        'PublicSubnetRouteTableAssociation2',
        'PrivateSubnetRouteTableAssociation1',
        'PrivateSubnetRouteTableAssociation2',
        'DatabaseSubnetRouteTableAssociation1',
        'DatabaseSubnetRouteTableAssociation2'
      ];

      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Properties.SubnetId).toBeDefined();
        expect(association.Properties.RouteTableId).toBeDefined();
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should have web server security group with proper rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for web servers');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      // Ingress rules
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      
      // HTTP rule
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      // SSH rule
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');

      // Egress rule
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].IpProtocol).toBe(-1);
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have database security group with restricted access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for RDS database');

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      
      const mysqlRule = ingressRules[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with security settings', () => {
      const bucket = template.Resources.SecureAppS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'secureapp-storage-v2-${AWS::AccountId}'
      });

      // Encryption
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      // Public access block
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);

      // Versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have bucket policy denying insecure transport', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'SecureAppS3Bucket' });

      const statements = policy.Properties.PolicyDocument.Statement;
      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with minimal permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Assume role policy
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');

      // Managed policies
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );

      // Inline policies
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('BasicS3Access');

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements).toHaveLength(2);

      // S3 access statement
      const s3Statement = statements[0];
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');

      // Secrets Manager statement
      const secretsStatement = statements[1];
      expect(secretsStatement.Effect).toBe('Allow');
      expect(secretsStatement.Action).toContain('secretsmanager:GetSecretValue');
      expect(secretsStatement.Resource).toEqual({ Ref: 'DBPasswordSecret' });
    });

    test('should have instance profile referencing the role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContain({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should have database password secret with secure generation', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Description).toBe('Database credentials for SecureApp');

      const generateString = secret.Properties.GenerateSecretString;
      expect(generateString.SecretStringTemplate).toBe('{"username":"dbadmin"}');
      expect(generateString.GenerateStringKey).toBe('password');
      expect(generateString.PasswordLength).toBe(32);
      expect(generateString.ExcludeCharacters).toBe('"@/\\\'');
    });
  });

  describe('RDS Database Configuration', () => {
    test('should have database subnet group with proper subnets', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for SecureApp database');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'DatabaseSubnet1' },
        { Ref: 'DatabaseSubnet2' }
      ]);
    });

    test('should have RDS instance with security settings', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');
      
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.Properties.MultiAZ).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);

      // Security
      expect(db.Properties.VPCSecurityGroups).toContain({ Ref: 'DatabaseSecurityGroup' });
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DatabaseSubnetGroup' });
      
      // Credentials
      expect(db.Properties.MasterUsername).toBe('dbadmin');
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      });
    });
  });

  describe('EC2 Instances Configuration', () => {
    test('should have web server instances with proper configuration', () => {
      const instances = ['WebServerInstance1', 'WebServerInstance2'];
      
      instances.forEach((instanceName, index) => {
        const instance = template.Resources[instanceName];
        expect(instance.Type).toBe('AWS::EC2::Instance');
        
        expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
        expect(instance.Properties.InstanceType).toBe('t3.micro');
        expect(instance.Properties.SecurityGroupIds).toContain({ Ref: 'WebServerSecurityGroup' });
        expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
        
        // Subnet placement
        const expectedSubnet = index === 0 ? 'PrivateSubnet1' : 'PrivateSubnet2';
        expect(instance.Properties.SubnetId).toEqual({ Ref: expectedSubnet });
        
        // User data
        expect(instance.Properties.UserData).toBeDefined();
        const userData = instance.Properties.UserData['Fn::Base64'];
        expect(userData).toContain('yum update -y');
        expect(userData).toContain('yum install -y httpd');
        expect(userData).toContain('systemctl enable httpd');
        expect(userData).toContain('echo "OK" > /var/www/html/health');
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs with descriptions', () => {
      const requiredOutputs = [
        'VPCId',
        'ExistingCloudTrailBucket',
        'DatabaseEndpoint',
        'S3BucketName',
        'WebServerInstance1Id',
        'WebServerInstance2Id'
      ];

      requiredOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputName.replace('Id', '-ID')}`
        });
      });
    });

    test('should have correct output values', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureAppVPC' });
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address']
      });
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'SecureAppS3Bucket' });
      expect(template.Outputs.WebServerInstance1Id.Value).toEqual({ Ref: 'WebServerInstance1' });
      expect(template.Outputs.WebServerInstance2Id.Value).toEqual({ Ref: 'WebServerInstance2' });
    });
  });

  describe('Security Compliance Validation', () => {
    test('should enforce HTTPS-only access for S3', () => {
      const policy = template.Resources.S3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      const httpsOnlyStatement = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(httpsOnlyStatement).toBeDefined();
      expect(httpsOnlyStatement.Effect).toBe('Deny');
      expect(httpsOnlyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have encryption enabled for all storage', () => {
      // S3 encryption
      const s3Bucket = template.Resources.SecureAppS3Bucket;
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      // RDS encryption
      const rdsInstance = template.Resources.DatabaseInstance;
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper network isolation', () => {
      // EC2 instances in private subnets
      expect(template.Resources.WebServerInstance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.WebServerInstance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });

      // Database in dedicated subnets
      const dbSubnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'DatabaseSubnet1' },
        { Ref: 'DatabaseSubnet2' }
      ]);

      // Database not publicly accessible
      expect(template.Resources.DatabaseInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have least privilege IAM policies', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      // Should only have necessary S3 and Secrets Manager permissions
      expect(statements).toHaveLength(2);
      
      const s3Statement = statements[0];
      const allowedS3Actions = ['s3:GetObject', 's3:PutObject'];
      s3Statement.Action.forEach((action: string) => {
        expect(allowedS3Actions).toContain(action);
      });

      const secretsStatement = statements[1];
      expect(secretsStatement.Action).toEqual(['secretsmanager:GetSecretValue']);
    });
  });

  describe('Resource Dependencies and References', () => {
    test('should have correct resource dependencies', () => {
      // NAT Gateway depends on Internet Gateway attachment
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
      
      // Public route depends on Internet Gateway attachment
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have proper resource references', () => {
      // VPC references in subnets
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Type === 'AWS::EC2::Subnet') {
          expect(resource.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });
        }
      });

      // Security group references
      expect(template.Resources.DatabaseInstance.Properties.VPCSecurityGroups).toContain({
        Ref: 'DatabaseSecurityGroup'
      });
    });
  });

  describe('Template Best Practices', () => {
    test('should use CloudFormation functions appropriately', () => {
      // Check for proper use of Fn::Sub for unique naming
      const s3Bucket = template.Resources.SecureAppS3Bucket;
      expect(s3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'secureapp-storage-v2-${AWS::AccountId}'
      });

      // Check for proper use of Fn::GetAZs for AZ selection
      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should have consistent tagging strategy', () => {
      const taggedResources = [
        'SecureAppVPC',
        'InternetGateway', 
        'PublicSubnet1',
        'NATGatewayEIP',
        'WebServerSecurityGroup',
        'WebServerInstance1'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });

    test('should not use hardcoded values where CloudFormation functions are appropriate', () => {
      // Should use Fn::GetAZs instead of hardcoded AZs
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Type === 'AWS::EC2::Subnet') {
          expect(resource.Properties.AvailabilityZone).toEqual(
            expect.objectContaining({ 'Fn::Select': expect.any(Array) })
          );
        }
      });
    });
  });
});