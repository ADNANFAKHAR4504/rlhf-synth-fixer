import fs from 'fs';
import path from 'path';

describe('IaC-AWS-Nova-Model-Breaking CloudFormation Template', () => {
  let template;

  beforeAll(() => {
    // Ensure the template is in JSON format.
    // You can convert your YAML template to JSON using a tool like cfn-flip.
    // e.g., cfn-flip iac-template.yaml > iac-template.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust the path to your JSON template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Parameters', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a correct description', () => {
      expect(template.Description).toContain(
        'Secure multi-tier web application infrastructure'
      );
    });

    test('should define the ExistingCertificateArn parameter correctly', () => {
      const param = template.Parameters.ExistingCertificateArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe(
        'arn:aws:acm:us-east-1:718240086340:certificate/92b736bc-6abe-41ca-a07e-de76eee848b3'
      );
    });

    test('should define the SSHAccessCIDR parameter with a valid default', () => {
      const param = template.Parameters.SSHAccessCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toMatch(
        /^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/
      );
    });
  });

  describe('Networking Resources', () => {
    test('MainVPC should be defined with correct CIDR block', () => {
      const vpc = template.Resources.MainVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should define two public and four private subnets', () => {
      const resources = template.Resources;
      const subnets = Object.values(resources).filter(
        r => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        s => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        s => s.Properties.MapPublicIpOnLaunch !== true
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(4);
    });

    test('Private route tables should route to NAT Gateways', () => {
      const route1 = template.Resources.DefaultPrivateRoute1;
      const route2 = template.Resources.DefaultPrivateRoute2;
      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });
  });

  describe('Security Groups', () => {
    test('ALBSecurityGroup should allow public HTTP and HTTPS traffic', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 80 }),
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 443 }),
        ])
      );
    });

    test('WebSecurityGroup should only allow HTTPS from the ALB', () => {
      const sg = template.Resources.WebSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        r => r.FromPort === 443
      );
      expect(httpsRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('DatabaseSecurityGroup should only allow MySQL traffic from the WebSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'WebSecurityGroup' });
    });
  });

  describe('IAM and Data Security', () => {
    test('EC2InstanceRole should grant access to Secrets Manager and S3 based on tags', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find(p => p.PolicyName === 'SecretsManagerAccess');
      const s3Policy = policies.find(p => p.PolicyName === 'TagBasedS3Access');

      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'secretsmanager:GetSecretValue'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Condition.StringEquals['ec2:ResourceTag/S3Access']).toBe('Approved');
    });

    test('ApplicationDataBucket should have server-side encryption enabled', () => {
        const bucket = template.Resources.ApplicationDataBucket;
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Database Configuration', () => {
    test('DatabaseInstance should use a supported MySQL engine version', () => {
      const db = template.Resources.DatabaseInstance;
      // This test assumes 8.0.36 or higher is valid. Update if needed.
      expect(db.Properties.EngineVersion).toMatch(/^8\.0\.(3[6-9]|[4-9]\d|\d{3,})$/);
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('DatabaseParameterGroup should enforce SSL/TLS connections', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Properties.Parameters.require_secure_transport).toBe('ON');
    });
  });

  describe('ALB, WAF, and API Gateway', () => {
    test('ALBListener should use the existing certificate from parameters', () => {
      const listener = template.Resources.ALBListener;
      const certificate = listener.Properties.Certificates[0];
      expect(certificate.CertificateArn).toEqual({ Ref: 'ExistingCertificateArn' });
    });

    test('WebACL should include AWS Managed Rules for common vulnerabilities', () => {
      const waf = template.Resources.WebACL;
      const rules = waf.Properties.Rules;
      const commonRule = rules.find(r => r.Name === 'CommonRuleSet');
      const sqliRule = rules.find(r => r.Name === 'SQLiRuleSet');

      expect(commonRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
      expect(sqliRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    test('APIStage should have detailed logging configured', () => {
        const stage = template.Resources.APIStage;
        const logSettings = stage.Properties.AccessLogSetting;
        const methodSettings = stage.Properties.MethodSettings[0];

        expect(logSettings.DestinationArn).toEqual({'Fn::GetAtt': ['APIGatewayLogGroup', 'Arn']});
        expect(methodSettings.LoggingLevel).toBe('INFO');
        expect(methodSettings.DataTraceEnabled).toBe(true);
    });
  });
});