import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Web Application Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAtt': data.split('.') }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
    ]);

    // Update this path to point to your CloudFormation template file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Parameters & Structure', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Production-ready stack for a highly available web application'
      );
    });

    test('should define all required parameters', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(2);
      expect(params.DBMasterUsername).toBeDefined();
      expect(params.DynamoDBTableArnParameter).toBeDefined();
    });
  });

  describe('Networking & VPC Configuration', () => {
    test('VPC should be created with the correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should create two public and two private subnets', () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBe(4);

      const publicSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch !== true
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('Subnets should be dynamically assigned to Availability Zones', () => {
      const azsInUse = Object.values(template.Resources)
        .filter((r: any) => r.Type === 'AWS::EC2::Subnet')
        .map((s: any) => s.Properties.AvailabilityZone);

      expect(azsInUse).toContainEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(azsInUse).toContainEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('Private Route Tables should route internet traffic through NAT Gateways', () => {
      const privateRouteA = template.Resources.PrivateRouteA;
      expect(privateRouteA.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRouteA.Properties.NatGatewayId).toEqual({
        Ref: 'NatGatewayA',
      });

      const privateRouteB = template.Resources.PrivateRouteB;
      expect(privateRouteB.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRouteB.Properties.NatGatewayId).toEqual({
        Ref: 'NatGatewayB',
      });
    });
  });

  describe('Security Groups (Least Privilege)', () => {
    test('ALB Security Group should allow inbound HTTP from the internet', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ingressRule = albSg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Server Security Group should only allow traffic from the ALB', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      const ingressRule = webSg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        'Fn::GetAtt': ['ALBSecurityGroup', 'GroupId'],
      });
    });

    test('Database Security Group should only allow traffic from the Web Server', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingressRule = dbSg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        'Fn::GetAtt': ['WebServerSecurityGroup', 'GroupId'],
      });
    });
  });

  describe('Database (RDS) & Secrets', () => {
    test('RDS instance should have encryption and Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toBe('16.3');
    });

    test('should create a secret in Secrets Manager for the DB password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      const secretTemplate =
        secret.Properties.GenerateSecretString.SecretStringTemplate;
      expect(secretTemplate).toEqual({
        'Fn::Sub': '{"username": "${DBMasterUsername}"}',
      });
    });

    test('RDS instance password should use a dynamic reference to Secrets Manager', () => {
      const rds = template.Resources.RDSInstance;
      const passwordRef = rds.Properties.MasterUserPassword;
      const expectedRef = {
        'Fn::Join': [
          '',
          [
            '{{resolve:secretsmanager:',
            { Ref: 'DBSecret' },
            ':SecretString:password}}',
          ],
        ],
      };
      expect(passwordRef).toEqual(expectedRef);
    });
  });

  describe('Storage (S3)', () => {
    test('S3 Bucket should have versioning and block public access enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM & Lambda', () => {
    test('Lambda Execution Role should be assumable by the Lambda service', () => {
      const role = template.Resources.LambdaExecutionRole;
      const principal =
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service;
      expect(principal).toBe('lambda.amazonaws.com');
    });

    test('Lambda IAM Policy should grant read-only access to the specified DynamoDB table', () => {
      const policy = template.Resources.LambdaDynamoDBPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:Scan');
      expect(statement.Resource).toEqual({ Ref: 'DynamoDBTableArnParameter' });
    });

    test('Lambda function should be configured with inline code', () => {
      const lambda = template.Resources.PlaceholderLambda;
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
      // Check that inline code is provided
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('exports.handler');

      // Also verify the Lambda has proper VPC configuration
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toContainEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });

    test('Lambda function should have proper configuration settings', () => {
      const lambda = template.Resources.PlaceholderLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });
  });

  describe('Monitoring & Outputs', () => {
    test('CloudWatch Alarm should monitor RDS CPU Utilization', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should define all required outputs', () => {
      const outputs = template.Outputs;
      expect(Object.keys(outputs).length).toBe(5);
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.DBSecretARN).toBeDefined();
    });
  });

  describe('Tagging', () => {
    test('all taggable resources should have proper tags', () => {
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::SecurityGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::RDS::DBSubnetGroup',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::SecretsManager::Secret',
      ];

      const resources = Object.values(template.Resources).filter((r: any) =>
        taggableResourceTypes.includes(r.Type)
      );

      resources.forEach((resource: any) => {
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const ownerTag = tags.find((t: any) => t.Key === 'Owner');

          expect(envTag).toBeDefined();
          expect(envTag?.Value).toBe('Production');
          expect(ownerTag).toBeDefined();
          expect(ownerTag?.Value).toBe('WebAppTeam');
        }
      });
    });
  });
});
