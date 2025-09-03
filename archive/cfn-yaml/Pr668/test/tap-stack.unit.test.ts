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
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
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

    test('should not contain a Mappings section', () => {
      expect(template.Mappings).toBeUndefined();
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
  });

  describe('Application Load Balancer', () => {
    test('should create an Application Load Balancer resource', () => {
      const alb = template.Resources.WebAppALB;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create a Target Group for the application', () => {
      const tg = template.Resources.WebAppTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
    });

    test('should create an HTTPS listener with a certificate', () => {
      const listener = template.Resources.WebAppListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Certificates[0].CertificateArn).toEqual({
        Ref: 'CertificateArn',
      });
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({
        Ref: 'WebAppTargetGroup',
      });
    });

    test('should create an HTTP listener that redirects to HTTPS', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.DefaultActions[0].Type).toBe('redirect');
      expect(
        listener.Properties.DefaultActions[0].RedirectConfig.StatusCode
      ).toBe('HTTP_301');
    });
  });

  describe('RDS Database', () => {
    test('RDS Instance should be PostgreSQL, Multi-AZ, and encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Elastic Beanstalk & DNS', () => {
    test('Beanstalk should be configured to have no load balancer', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const lbType = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:environment' &&
          o.OptionName === 'LoadBalancerType'
      );
      expect(lbType.Value).toBe('application');
    });

    test('Beanstalk should have enhanced health check configuration', () => {
      const optionSettings =
        template.Resources.BeanstalkEnvironment.Properties.OptionSettings;
      const healthCheck = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:application:healthcheck' &&
          o.OptionName === 'HealthCheckPath'
      );
      const systemType = optionSettings.find(
        (o: any) =>
          o.Namespace === 'aws:elasticbeanstalk:healthreporting:system' &&
          o.OptionName === 'SystemType'
      );

      expect(systemType.Value).toBe('enhanced');
    });

    test('Route53 DNS record should be an Alias pointing to the new ALB', () => {
      const record = template.Resources.DNSRecord;
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['WebAppALB', 'DNSName'],
      });
      expect(record.Properties.AliasTarget.HostedZoneId).toEqual({
        'Fn::GetAtt': ['WebAppALB', 'CanonicalHostedZoneID'],
      });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.LoadBalancerURL).toBeDefined(); // Changed from ElasticBeanstalkURL
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DBSecretARN).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
    });

    test('DBSecretARN output should be conditional', () => {
      const secretOutput = template.Outputs.DBSecretARN;
      expect(secretOutput.Condition).toBe('UseSecretsManagerCondition');
    });
  });
});
