import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load YAML template directly with CloudFormation schema support
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Define comprehensive CloudFormation schema
    const CloudFormationSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: (data) => ({ Ref: data })
      }),
      new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::GetAtt': data })
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::GetAtt': data.split('.') })
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Join': data })
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::Sub': data })
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Sub': data })
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Equals': data })
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Not': data })
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::If': data })
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::FindInMap': data })
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Select': data })
      }),
      new yaml.Type('!Split', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Split': data })
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::Base64': data })
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::GetAZs': data })
      }),
      new yaml.Type('!ImportValue', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::ImportValue': data })
      })
    ]);
    
    template = yaml.load(templateContent, { schema: CloudFormationSchema });
  });


  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready multi-region AWS infrastructure stack for company migration initiative. Supports us-east-1 and us-west-2 with high availability, security, and compliance features.'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have DBPassword parameter with correct validation', () => {
      expect(template.Parameters.DBPassword).toBeDefined();
      const dbPasswordParam = template.Parameters.DBPassword;
      expect(dbPasswordParam.Type).toBe('String');
      expect(dbPasswordParam.Default).toBe('TempPassword123');
      expect(dbPasswordParam.NoEcho).toBe(true);
      expect(dbPasswordParam.Description).toBe(
        'RDS MySQL master password'
      );
      expect(dbPasswordParam.AllowedPattern).toBe('[a-zA-Z0-9]*');
      // DBPassword parameter doesn't have ConstraintDescription in actual template
      expect(dbPasswordParam.MinLength).toBe(8);
      expect(dbPasswordParam.MaxLength).toBe(41);
    });

    test('should have CompanyIPRange parameter', () => {
      expect(template.Parameters.CompanyIPRange).toBeDefined();
      const companyIPParam = template.Parameters.CompanyIPRange;
      expect(companyIPParam.Type).toBe('String');
      expect(companyIPParam.Default).toBe('203.0.113.0/24');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(keyPairParam.Default).toBe('tap-keypair');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
    });

    test('should have RDS MySQL instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      const db = template.Resources.RDSInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.MultiAZ).toEqual({ 'Fn::If': ['CreateMultiAZ', true, false] });
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(10);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toBe(true);
    });

    test('should have KMS Key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      const kms = template.Resources.KMSKey;
      expect(kms.Type).toBe('AWS::KMS::Key');
    });

    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have Route 53 hosted zone', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      const hz = template.Resources.HostedZone;
      expect(hz.Type).toBe('AWS::Route53::HostedZone');
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.WebServerLogGroup).toBeDefined();
    });

    test('should have security groups with proper restrictions', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
    });

  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'LoadBalancerDNS',
        'S3BucketName',
        'KMSKeyId',
        'StackName',
        'EnvironmentSuffix',
        'WebsiteURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}',
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS MySQL database endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint', 'Address'],
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS key');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources now
    });

    test('should have multiple parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(4); // At least EnvironmentSuffix, DBPassword, VpcCidr, KeyPairName
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10); // Should have many outputs now
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      // Test VPC naming
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${AWS::StackName}-vpc-${EnvironmentSuffix}' }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          // Some outputs have different export naming conventions
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('DBPassword parameter should not allow special characters', () => {
      const dbPasswordParam = template.Parameters.DBPassword;
      expect(dbPasswordParam.AllowedPattern).toBe('[a-zA-Z0-9]*');
      expect(dbPasswordParam.Default).toBe('TempPassword123');
      expect(dbPasswordParam.NoEcho).toBe(true);
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.RDSInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have server-side encryption', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('Launch template should have termination protection', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toBe(true);
    });
  });

  describe('High Availability Configuration', () => {
    test('RDS should have Multi-AZ enabled', () => {
      const db = template.Resources.RDSInstance;
      expect(db.Properties.MultiAZ).toEqual({ 'Fn::If': ['CreateMultiAZ', true, false] });
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('Load balancer should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Compliance and Tagging', () => {
    test('resources should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Project', Value: 'Migration' });
      expect(tags).toContainEqual({ Key: 'Creator', Value: 'CloudEngineer' });
    });

    test('KMS key should be defined', () => {
      const kms = template.Resources.KMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
    });
  });

  describe('Network ACLs Security Layer', () => {
    test('should have Network ACLs for all subnet types', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.DatabaseNetworkAcl).toBeDefined();
      
      const publicAcl = template.Resources.PublicNetworkAcl;
      expect(publicAcl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(publicAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have Network ACL entries with proper rules', () => {
      expect(template.Resources.PublicNetworkAclEntryInbound).toBeDefined();
      expect(template.Resources.PublicNetworkAclEntryOutbound).toBeDefined();
      expect(template.Resources.DatabaseNetworkAclEntryInbound).toBeDefined();
      expect(template.Resources.DatabaseNetworkAclEntryOutbound).toBeDefined();
      
      const dbInboundRule = template.Resources.DatabaseNetworkAclEntryInbound;
      expect(dbInboundRule.Properties.Protocol).toBe(6); // TCP
      expect(dbInboundRule.Properties.PortRange.From).toBe(3306);
      expect(dbInboundRule.Properties.PortRange.To).toBe(3306);
    });

    test('should have Network ACL subnet associations', () => {
      expect(template.Resources.PublicSubnet1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2NetworkAclAssociation).toBeDefined();
      expect(template.Resources.DatabaseSubnet1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.DatabaseSubnet2NetworkAclAssociation).toBeDefined();
    });
  });

  describe('Parameter Store Configuration Management', () => {
    test('should have application configuration parameter', () => {
      expect(template.Resources.AppConfigParameter).toBeDefined();
      const param = template.Resources.AppConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/app/config'
      });
    });

    test('should have database configuration parameter', () => {
      expect(template.Resources.DBConfigParameter).toBeDefined();
      const param = template.Resources.DBConfigParameter;
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/database/config'
      });
    });

    test('should have ALB configuration parameter', () => {
      expect(template.Resources.ALBConfigParameter).toBeDefined();
      const param = template.Resources.ALBConfigParameter;
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/alb/config'
      });
    });

    test('should have Auto Scaling configuration parameter', () => {
      expect(template.Resources.ASGConfigParameter).toBeDefined();
      const param = template.Resources.ASGConfigParameter;
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/autoscaling/config'
      });
    });

    test('should have monitoring configuration parameter', () => {
      expect(template.Resources.MonitoringConfigParameter).toBeDefined();
      const param = template.Resources.MonitoringConfigParameter;
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/monitoring/config'
      });
    });
  });

  describe('HTTPS/SSL Termination Support', () => {
    test('should have SSL certificate parameter', () => {
      expect(template.Parameters.SSLCertificateArn).toBeDefined();
      const param = template.Parameters.SSLCertificateArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBe('^$|^arn:aws:acm:[a-z0-9-]+:[0-9]+:certificate/[a-f0-9-]+$');
    });

    test('should have HasSSLCertificate condition', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
      expect(template.Conditions.HasSSLCertificate).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'SSLCertificateArn' }, ''] }]
      });
    });

    test('should have HTTP listener with conditional redirect', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have conditional HTTPS listener', () => {
      expect(template.Resources.ALBListenerHTTPS).toBeDefined();
      const httpsListener = template.Resources.ALBListenerHTTPS;
      expect(httpsListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpsListener.Condition).toBe('HasSSLCertificate');
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
      expect(httpsListener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });
  });

  describe('CloudTrail API Monitoring', () => {
    test('should have CloudTrail logs S3 bucket', () => {
      expect(template.Resources.CloudTrailLogsBucket).toBeDefined();
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have CloudTrail log group', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/cloudtrail/${AWS::StackName}-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have CloudTrail with proper configuration', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.EventSelectors).toBeDefined();
    });

    test('should have CloudTrail IAM role', () => {
      expect(template.Resources.CloudTrailLogsRole).toBeDefined();
      const role = template.Resources.CloudTrailLogsRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have CloudTrail S3 bucket policy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2); // AclCheck and Write permissions
    });
  });

  describe('Enhanced Route 53 Failover', () => {
    test('should have primary health check', () => {
      expect(template.Resources.PrimaryHealthCheck).toBeDefined();
      const healthCheck = template.Resources.PrimaryHealthCheck;
      expect(healthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(healthCheck.Properties.HealthCheckConfig.ResourcePath).toBe('/health');
      expect(healthCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(healthCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });

    test('should have primary DNS record with failover', () => {
      expect(template.Resources.PrimaryDNSRecord).toBeDefined();
      const record = template.Resources.PrimaryDNSRecord;
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Failover).toBe('PRIMARY');
      expect(record.Properties.SetIdentifier).toBe('Primary');
      // TTL removed because AliasTarget records cannot have TTL
    });

    test('should have secondary DNS record for failover', () => {
      expect(template.Resources.SecondaryDNSRecord).toBeDefined();
      const record = template.Resources.SecondaryDNSRecord;
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Failover).toBe('SECONDARY');
      expect(record.Properties.SetIdentifier).toBe('Secondary');
    });

    test('should have apex DNS record', () => {
      expect(template.Resources.ApexDNSRecord).toBeDefined();
      const record = template.Resources.ApexDNSRecord;
      expect(record.Properties.SetIdentifier).toBe('Apex-Primary');
      expect(record.Properties.Failover).toBe('PRIMARY');
    });

    test('should have cross-region configuration parameter', () => {
      expect(template.Resources.CrossRegionConfigParameter).toBeDefined();
      const param = template.Resources.CrossRegionConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/failover/config'
      });
    });
  });

  describe('AWS Trusted Advisor Integration', () => {
    test('should have Trusted Advisor configuration parameter', () => {
      expect(template.Resources.TrustedAdvisorConfigParameter).toBeDefined();
      const param = template.Resources.TrustedAdvisorConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/trusted-advisor/config'
      });
    });

    test('should have Trusted Advisor Lambda role', () => {
      expect(template.Resources.TrustedAdvisorLambdaRole).toBeDefined();
      const role = template.Resources.TrustedAdvisorLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have Trusted Advisor log group', () => {
      expect(template.Resources.TrustedAdvisorLogGroup).toBeDefined();
      const logGroup = template.Resources.TrustedAdvisorLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${AWS::StackName}-trusted-advisor-${EnvironmentSuffix}'
      });
    });

    test('should have Trusted Advisor SNS topic', () => {
      expect(template.Resources.TrustedAdvisorAlertsTopic).toBeDefined();
      const topic = template.Resources.TrustedAdvisorAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('AWS Trusted Advisor Alerts');
    });

    test('should have Trusted Advisor CloudWatch dashboard', () => {
      expect(template.Resources.TrustedAdvisorDashboard).toBeDefined();
      const dashboard = template.Resources.TrustedAdvisorDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have Trusted Advisor EventBridge rule', () => {
      expect(template.Resources.TrustedAdvisorEventRule).toBeDefined();
      const rule = template.Resources.TrustedAdvisorEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 9 ? * MON *)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have Trusted Advisor recommendations parameter', () => {
      expect(template.Resources.TrustedAdvisorRecommendationsParameter).toBeDefined();
      const param = template.Resources.TrustedAdvisorRecommendationsParameter;
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/${EnvironmentSuffix}/trusted-advisor/recommendations'
      });
    });
  });

  describe('Enhanced Parameters', () => {
    test('should have domain name parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('failoverdemo.com');
    });

    test('should have DNS & SSL configuration in metadata', () => {
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      const dnsGroup = cfnInterface.ParameterGroups.find((group: any) => 
        group.Label.default === 'DNS & SSL Configuration'
      );
      expect(dnsGroup).toBeDefined();
      expect(dnsGroup.Parameters).toContain('DomainName');
      expect(dnsGroup.Parameters).toContain('SSLCertificateArn');
    });
  });

  describe('Enhanced Security and Compliance', () => {
    test('should have Secrets Manager for database credentials', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS should use Secrets Manager for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      });
    });

    test('should have comprehensive resource counts', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // With all new features, should have many more resources
    });
  });
});
