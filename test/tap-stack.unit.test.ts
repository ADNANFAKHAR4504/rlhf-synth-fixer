import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

describe('TapStack CloudFormation Template Validation', () => {
  let template: any;

  beforeAll(() => {
    try {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      // Extend schema with CloudFormation intrinsics
      const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
        new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ Ref: data }) }),
        new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
        new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data.split('.') }) }),
        new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
        new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) })
      ]);

      template = yaml.load(templateContent, { schema: CFN_SCHEMA });
      console.log('Successfully loaded CloudFormation template');
    } catch (e) {
      console.error('Error loading template:', e);
      template = { Resources: {}, Outputs: {} }; // fallback
    }
  });

  // --- Structure Tests ---
  describe('Template Structure', () => {
    test('should have Resources and Outputs sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // --- Networking Tests ---
  describe('VPC and Subnets', () => {
    test('MyVPC should exist with correct CIDR', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public and Private subnets should exist', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });
  });

  // --- Security Group Tests ---
  describe('Security Groups', () => {
    test('ALBSecurityGroup should only allow HTTP (80)', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = albSg.Properties.SecurityGroupIngress;
      expect(ingress).toContainEqual({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' });
      // Ensure no HTTPS 443 rule
      ingress.forEach((rule: any) => {
        expect(rule.FromPort).not.toBe(443);
      });
    });

    test('RDSSecurityGroup should allow MySQL from EC2 SG', () => {
      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      const rule = rdsSg.Properties.SecurityGroupIngress[0];
      expect(rule.IpProtocol).toBe('tcp');
      expect(rule.FromPort).toBe(3306);
      expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  // --- ALB Tests ---
  describe('Application Load Balancer', () => {
    test('ALB should be internet-facing in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
    });

    test('ALBListener should exist on port 80 (HTTP)', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('SSL resources should be removed', () => {
      const resources = template.Resources;
      expect(resources.SSLCertificate).toBeUndefined();
      expect(resources.ALBListenerHTTPS).toBeUndefined();
    });
  });

  // --- RDS & Secrets Tests ---
  describe('Database and Secrets', () => {
    test('DBSecret should exist and generate password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('RDSDatabase should use mysql engine', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
    });
  });

  // --- Outputs Tests ---
  describe('Outputs', () => {
    test('LoadBalancerDNS should output ALB DNSName', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('RDSInstanceEndpoint should output DB endpoint address', () => {
      const output = template.Outputs.RDSInstanceEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint', 'Address'] });
    });

    test('Should not output SSL Certificate Arn', () => {
      expect(template.Outputs.SSLCertificateArn).toBeUndefined();
    });
  });
});
