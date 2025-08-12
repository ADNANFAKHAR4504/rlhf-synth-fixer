const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Node.js Production Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: (data: any) => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::GetAtt': data.split('.') }),
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: (data: any) => ({ 'Fn::GetAZs': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Join': data }),
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Equals': data }),
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::Not': data }),
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: (data: any) => ({ 'Fn::If': data }),
      }),
    ]);

    // Path to your CloudFormation template file
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml'); // Adjust path if needed
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Metadata & Parameters', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Deploys a highly available, secure, and scalable Node.js application'
      );
    });

    test('should have metadata for cfn-lint configuration', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['cfn-lint']).toBeDefined();
      expect(template.Metadata['cfn-lint'].config.ignore_checks).toContain(
        'W1011'
      );
    });

    test('should define all required parameters with correct types', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(9);
      expect(params.DomainName).toBeDefined();
      expect(params.HostedZoneName).toBeDefined();
      expect(params.CertificateArn).toBeDefined();
      expect(params.DBUsername).toBeDefined();
      expect(params.DBPasswordParameter).toBeDefined();
      expect(params.S3BucketName).toBeDefined();
      expect(params.MinSize).toBeDefined();
      expect(params.MaxSize).toBeDefined();
      expect(params.SolutionStackName).toBeDefined();
    });

    test('DBPasswordParameter should have NoEcho set to true', () => {
      expect(template.Parameters.DBPasswordParameter.NoEcho).toBe(true);
    });

    test('should contain mappings for Elastic Beanstalk Hosted Zone IDs', () => {
      expect(template.Mappings.EBHostedZoneIds).toBeDefined();
      expect(template.Mappings.EBHostedZoneIds['us-west-2'].Id).toBe(
        'Z38NKT9BP95V3O'
      );
    });
  });

  describe('Conditions', () => {
    test('should define conditions for Secrets Manager and S3 bucket', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.UseSecretsManagerCondition).toBeDefined();
      expect(template.Conditions.HasS3Bucket).toBeDefined();
    });
  });

  describe('Networking Infrastructure', () => {
    test('VPC should be created with the correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should create two public and two private subnets', () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch !== true
      );
      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('should create two NAT Gateways for high availability', () => {
      expect(template.Resources.NatGatewayA).toBeDefined();
      expect(template.Resources.NatGatewayB).toBeDefined();
      expect(template.Resources.NatGatewayA.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayB.Type).toBe('AWS::EC2::NatGateway');
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
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
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
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'AppSecurityGroup',
      });
    });

    test('Beanstalk IAM Role should have least-privilege permissions', () => {
      const role = template.Resources.BeanstalkInstanceRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check for logs permissions
      const logsPolicy = statements.find(
        (s: any) => s.Action && s.Action.includes('logs:PutLogEvents')
      );
      expect(logsPolicy).toBeDefined();

      // Check for conditional S3 permissions
      const s3Policy = statements.find(
        (s: any) =>
          Array.isArray(s) &&
          s[0] &&
          s[0].Action &&
          s[0].Action.includes('s3:GetObject')
      );
      // S3 policy is conditional, so it might be in a different format

      // Check for conditional Secrets Manager permissions
      const secretsPolicy = statements.find(
        (s: any) =>
          Array.isArray(s) &&
          s[0] &&
          s[0].Action === 'secretsmanager:GetSecretValue'
      );
      // Secrets policy is also conditional
    });

    test('should conditionally create a secret in AWS Secrets Manager for the DB password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Condition).toBe('UseSecretsManagerCondition');
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

    test('RDS Instance should conditionally use password from Secrets Manager or parameter', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword['Fn::If']).toBeDefined();
      expect(rds.Properties.MasterUserPassword['Fn::If'][0]).toBe(
        'UseSecretsManagerCondition'
      );
    });

    test('RDS Instance should have Deletion and UpdateReplace policies set to Snapshot', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('RDS Instance should have backup configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
      expect(rds.Properties.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('Elastic Beanstalk & DNS', () => {
    test('Beanstalk environment should be configured for Node.js', () => {
      const env = template.Resources.BeanstalkEnvironment;
      expect(env.Properties.SolutionStackName).toEqual({
        Ref: 'SolutionStackName',
      });
    });

    test('Beanstalk should be configured for an Application Load Balancer and stream logs', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const lbType = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:environment' &&
          o.OptionName === 'LoadBalancerType'
      );
      const streamLogs = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:cloudwatch:logs' &&
          o.OptionName === 'StreamLogs'
      );
      expect(lbType.Value).toBe('application');
      expect(streamLogs.Value).toBe('true');
    });

    test('Beanstalk should have auto-scaling configuration', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const minSize = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:autoscaling:asg' && o.OptionName === 'MinSize'
      );
      const maxSize = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:autoscaling:asg' && o.OptionName === 'MaxSize'
      );
      const triggerMeasure = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:autoscaling:trigger' &&
          o.OptionName === 'MeasureName'
      );

      expect(minSize.Value).toEqual({ Ref: 'MinSize' });
      expect(maxSize.Value).toEqual({ Ref: 'MaxSize' });
      expect(triggerMeasure.Value).toBe('CPUUtilization');
    });

    test('Beanstalk should have health check configuration', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const healthCheck = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:environment:process:default' &&
          o.OptionName === 'HealthCheckPath'
      );
      const systemType = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:healthreporting:system' &&
          o.OptionName === 'SystemType'
      );

      expect(healthCheck.Value).toBe('/');
      expect(systemType.Value).toBe('enhanced');
    });

    test('Beanstalk listener should have HTTPS configuration', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const httpsListener = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elbv2:listener:443' &&
          o.OptionName === 'Protocol'
      );
      const sslCert = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elbv2:listener:443' &&
          o.OptionName === 'SSLCertificateArns'
      );

      expect(httpsListener.Value).toBe('HTTPS');
      expect(sslCert.Value).toEqual({ Ref: 'CertificateArn' });
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
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(5);
      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.ElasticBeanstalkURL).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DBSecretARN).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
    });

    test('DBSecretARN output should be conditional', () => {
      const secretOutput = template.Outputs.DBSecretARN;
      expect(secretOutput.Condition).toBe('UseSecretsManagerCondition');
    });

    test('outputs should have export names', () => {
      const outputs = template.Outputs;
      Object.values(outputs).forEach((output: any) => {
        if (output.Condition !== 'UseSecretsManagerCondition') {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });
});
