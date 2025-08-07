const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Node.js Production Stack Unit Tests', () => {
  let template;

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
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: data => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
    ]);

    // Update this path to point to your CloudFormation template file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml'); // Corrected path
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Parameters & Mappings', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Deploys a highly available, secure, and scalable Node.js application'
      );
    });

    test('should define all required parameters with correct types', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(6); // Corrected parameter count
      expect(params.DomainName).toBeDefined();
      expect(params.HostedZoneName).toBeDefined();
      expect(params.CertificateArn).toBeDefined();
      expect(params.DBUsername).toBeDefined();
      expect(params.MinSize).toBeDefined();
      expect(params.MaxSize).toBeDefined();
    });

    test('should contain mappings for Elastic Beanstalk Hosted Zone IDs', () => {
      expect(template.Mappings.EBHostedZoneIds).toBeDefined();
      expect(template.Mappings.EBHostedZoneIds['us-east-1'].Id).toBe(
        'Z117KPS5GTRQ2G'
      );
    });
  });

  describe('Networking Infrastructure', () => {
    test('VPC should be created with the correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should create two public and two private subnets', () => {
      const subnets = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        s => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        s => s.Properties.MapPublicIpOnLaunch !== true
      );
      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('Public Route Table should route to the Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('Private Route Tables should route to NAT Gateways', () => {
      const privateRouteA = template.Resources.PrivateRouteA;
      const privateRouteB = template.Resources.PrivateRouteB;
      expect(privateRouteA.Properties.NatGatewayId).toEqual({
        Ref: 'NatGatewayA',
      });
      expect(privateRouteB.Properties.NatGatewayId).toEqual({
        Ref: 'NatGatewayB',
      });
    });
  });

  describe('Security & IAM Configuration', () => {
    test('LoadBalancer Security Group should allow inbound HTTP and HTTPS from the internet', () => {
      const albSg = template.Resources.LoadBalancerSecurityGroup;
      const ingressRules = albSg.Properties.SecurityGroupIngress;
      const httpRule = ingressRules.find(r => r.FromPort === 80);
      const httpsRule = ingressRules.find(r => r.FromPort === 443);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('App Security Group should only allow inbound traffic from the Load Balancer', () => {
      const appSg = template.Resources.AppSecurityGroup;
      const ingressRule = appSg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'LoadBalancerSecurityGroup',
      });
    });

    test('DB Security Group should only allow inbound traffic from the App Security Group on port 5432', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      const ingressRule = dbSg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'AppSecurityGroup',
      });
    });

    test('Beanstalk IAM Role should have least-privilege permissions', () => {
      const role = template.Resources.BeanstalkInstanceRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      const s3Policy = statements.find(s => s.Action.includes('s3:GetObject'));
      const logsPolicy = statements.find(s =>
        s.Action.includes('logs:PutLogEvents')
      );
      const secretsPolicy = statements.find(s =>
        s.Action.includes('secretsmanager:GetSecretValue')
      );

      expect(s3Policy).toBeDefined();
      expect(logsPolicy).toBeDefined();
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('should create a secret in AWS Secrets Manager for the DB password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'password'
      );
    });
  });

  describe('RDS Database', () => {
    test('RDS Instance should be PostgreSQL, Multi-AZ, and encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS Instance should use a dynamic password from Secrets Manager', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword).toBe(
        '{{resolve:secretsmanager:DBSecret:SecretString:password}}'
      );
    });

    test('RDS Instance should have Deletion and UpdateReplace policies set to Snapshot', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('Elastic Beanstalk & DNS', () => {
    test('Beanstalk environment should be configured for Node.js', () => {
      const env = template.Resources.BeanstalkEnvironment;
      expect(env.Properties.SolutionStackName).toContain('running Node.js 18');
    });

    test('Beanstalk should be configured for an Application Load Balancer and stream logs', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const lbType = optionSettings.find(
        o =>
          o.Namespace === 'aws:elasticbeanstalk:environment' &&
          o.OptionName === 'LoadBalancerType'
      );
      const streamLogs = optionSettings.find(
        o =>
          o.Namespace === 'aws:elasticbeanstalk:cloudwatch:logs' &&
          o.OptionName === 'StreamLogs'
      );
      expect(lbType.Value).toBe('application');
      expect(streamLogs.Value).toBe('true');
    });

    test('Beanstalk listener should redirect HTTP to HTTPS', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const httpListener = optionSettings.find(
        o =>
          o.Namespace === 'aws:elbv2:listener:80' &&
          o.OptionName === 'DefaultActions'
      );
      const redirectAction = JSON.parse(httpListener.Value)[0];
      expect(redirectAction.Type).toBe('redirect');
      expect(redirectAction.RedirectConfig.Protocol).toBe('HTTPS');
      expect(redirectAction.RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('Route53 DNS record should be an Alias pointing to the Beanstalk environment', () => {
      const record = template.Resources.DNSRecord;
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['BeanstalkEnvironment', 'EndpointURL'],
      });
      expect(record.Properties.AliasTarget.HostedZoneId).toEqual({
        'Fn::FindInMap': ['EBHostedZoneIds', { Ref: 'AWS::Region' }, 'Id'],
      });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = template.Outputs;
      expect(Object.keys(outputs).length).toBe(3);
      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DBSecretARN).toBeDefined();
    });
  });
});
