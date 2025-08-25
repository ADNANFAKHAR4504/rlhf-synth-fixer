import * as fs from 'fs';
import * as path from 'path';

interface Statement {
  Sid: string;
  Effect: string;
  Principal: any;
  Action: string | string[];
  Resource: string;
}

interface IngressRule {
  IpProtocol: string;
  FromPort: number;
  ToPort: number;
  CidrIp: string;
  Description: string;
}

interface Template {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: {
    SecurityKMSKey: {
      Type: string;
      Properties: {
        EnableKeyRotation: boolean;
        KeyPolicy: {
          Statement: Statement[];
        };
      };
    };
    WebSecurityGroup: {
      Type: string;
      Properties: {
        SecurityGroupIngress: IngressRule[];
        SecurityGroupEgress: any[];
      };
    };
    [key: string]: any;
  };
  Outputs: Record<string, any>;
}

describe('TapStack Template', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const jsonTemplate = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(jsonTemplate) as Template;
  });

  describe('Template Structure', () => {
    test('should have valid template format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('Comprehensive Security Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters with correct configurations', () => {
      const params = template.Parameters;

      expect(params.EnvironmentSuffix).toBeDefined();
      expect(params.EnvironmentSuffix.Type).toBe('String');
      expect(params.EnvironmentSuffix.Default).toBe('dev');
      expect(params.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');

      expect(params.TrustedAccountId).toBeDefined();
      expect(params.TrustedAccountId.Type).toBe('String');
      expect(params.TrustedAccountId.AllowedPattern).toBe('^[0-9]{12}$');

      expect(params.AdminIPRange).toBeDefined();
      expect(params.AdminIPRange.Type).toBe('String');
      expect(params.AdminIPRange.Default).toBe('10.0.0.0/16');
    });
  });

  describe('KMS Resources', () => {
    test('should have properly configured KMS key', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(4);
      
      // Test key policy statements
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      expect(statements.some((s: Statement) => s.Sid === 'Enable IAM User Permissions')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow CloudTrail to encrypt logs')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow Config to encrypt data')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow CloudWatch Logs to encrypt logs')).toBe(true);
    });

    test('should have proper KMS alias', () => {
      const alias = template.Resources.SecurityKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toBe('alias/security-key-${EnvironmentSuffix}');
    });
  });

  describe('VPC Resources', () => {
    test('should have properly configured VPC', () => {
      const vpc = template.Resources.SecurityVPC;
      
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have properly configured subnets', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet = template.Resources.PrivateSubnet;

      expect(publicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should have properly configured web security group', () => {
      const sg = template.Resources.WebSecurityGroup;
      
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      // Test ingress rules
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.find((r: IngressRule) => r.FromPort === 80)).toBeDefined();
      expect(ingress.find((r: IngressRule) => r.FromPort === 443)).toBeDefined();
      expect(ingress.find((r: IngressRule) => r.FromPort === 22)).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have properly configured VPC Flow Log role', () => {
      const role = template.Resources.VPCFlowLogRole;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('vpc-flow-logs.amazonaws.com');
    });

    test('should have properly configured trusted service role', () => {
      const role = template.Resources.TrustedServiceRole;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns)
        .toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
    });
  });

  describe('Logging Resources', () => {
    test('should have properly configured VPC flow logs', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      const logGroup = template.Resources.VPCFlowLogGroup;
      
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have properly configured S3 bucket for logs', () => {
      const bucket = template.Resources.SecurityLogsBucket;
      
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have properly configured CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.DependsOn).toBe('SecurityLogsBucketPolicy');
    });
  });

  describe('AWS Config Resources', () => {
    test('should have required config rules', () => {
      const rules = [
        'S3BucketPublicReadProhibitedRule',
        'S3BucketPublicWriteProhibitedRule',
        'SecurityGroupSSHRestrictedRule',
        'CloudTrailEnabledRule'
      ];

      rules.forEach(rule => {
        expect(template.Resources[rule]).toBeDefined();
        expect(template.Resources[rule].Type).toBe('AWS::Config::ConfigRule');
      });
    });

    test('should have properly configured recorder', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });
  });

  describe('SecurityHub', () => {
    test('should have properly configured SecurityHub', () => {
      const hub = template.Resources.SecurityHub;
      
      expect(hub.Type).toBe('AWS::SecurityHub::Hub');
      expect(hub.DeletionPolicy).toBe('Delete');
      expect(hub.Properties.Tags).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs with exports', () => {
      const requiredOutputs = [
        'SecurityKMSKeyId',
        'SecurityKMSKeyArn',
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebSecurityGroupId',
        'SecurityLogsBucketName',
        'CloudTrailArn',
        'TrustedServiceRoleArn'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
        expect(template.Outputs[output].Export.Name['Fn::Sub']).toContain(output);
      });
    });
  });
});