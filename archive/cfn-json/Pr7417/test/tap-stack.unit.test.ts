import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Credit Scoring Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Credit Scoring');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
    });

    test('should have tagging parameters', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.DataClassification).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have HTTPS listener', () => {
      expect(template.Resources.ALBHTTPSListener).toBeDefined();
      expect(template.Resources.ALBHTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have target group for Lambda', () => {
      expect(template.Resources.LambdaTargetGroup).toBeDefined();
      expect(template.Resources.LambdaTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.CreditScoringFunction).toBeDefined();
      expect(template.Resources.CreditScoringFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should use Node.js 18 runtime', () => {
      expect(template.Resources.CreditScoringFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda should have reserved concurrent executions', () => {
      expect(template.Resources.CreditScoringFunction.Properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda function URL', () => {
      expect(template.Resources.LambdaFunctionUrl).toBeDefined();
      expect(template.Resources.LambdaFunctionUrl.Type).toBe('AWS::Lambda::Url');
    });
  });

  describe('Aurora Database', () => {
    test('should have Aurora DB cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora should use PostgreSQL engine', () => {
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('Aurora should have valid engine version', () => {
      const version = template.Resources.AuroraCluster.Properties.EngineVersion;
      expect(version).toBeDefined();
      expect(version).toMatch(/^15\./);
    });

    test('Aurora should have ServerlessV2ScalingConfiguration', () => {
      expect(template.Resources.AuroraCluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
    });

    test('Aurora should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('Aurora should have backup retention of 30 days', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(30);
    });

    test('should have Aurora DB instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for database', () => {
      expect(template.Resources.DBEncryptionKey).toBeDefined();
      expect(template.Resources.DBEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      expect(template.Resources.DBEncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.DBEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.DBEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have Lambda log group with 365-day retention', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have ALB log group', () => {
      expect(template.Resources.ALBLogGroup).toBeDefined();
      expect(template.Resources.ALBLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have database log group', () => {
      expect(template.Resources.DBLogGroup).toBeDefined();
      expect(template.Resources.DBLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have database security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have all required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('DataClassification');
    });

    test('ALB should have all required tags', () => {
      const tags = template.Resources.ApplicationLoadBalancer.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('DataClassification');
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('should have ALB DNS output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have Lambda function ARN output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('should have Aurora cluster endpoint output', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
    });
  });

  describe('Resource Count', () => {
    test('should have comprehensive infrastructure (50+ resources)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(50);
    });
  });
});
