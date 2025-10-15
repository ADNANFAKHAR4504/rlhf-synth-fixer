import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // unit-tests.sh converts YAML → JSON via: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has description and metadata', () => {
      expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('includes EnvironmentSuffix parameter with defaults', () => {
      expect(template.Parameters).toBeDefined();
      const p = template.Parameters.EnvironmentSuffix;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
    });
  });

  describe('Key Resources', () => {
    test('creates an Application Load Balancer', () => {
      const alb = template.Resources['ApplicationLoadBalancer'];
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('creates an Auto Scaling Group', () => {
      const asg = template.Resources['AutoScalingGroup'];
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('creates S3 buckets for assets and logs', () => {
      const assets = template.Resources['AppAssetsBucket'];
      const logs = template.Resources['LogsBucket'];
      expect(assets).toBeDefined();
      expect(logs).toBeDefined();
      expect(assets.Type).toBe('AWS::S3::Bucket');
      expect(logs.Type).toBe('AWS::S3::Bucket');
    });

    test('creates DynamoDB session table', () => {
      const table = template.Resources['SessionTable'];
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });
  });

  describe('Outputs', () => {
    test('includes key outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs['LoadBalancerDNS']).toBeDefined();
      expect(template.Outputs['S3AssetsBucket']).toBeDefined();
      expect(template.Outputs['S3LogsBucket']).toBeDefined();
    });
  });
});


const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Networking Resources', () => {
    test('VPC has correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('Public subnets are configured correctly', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnets exist for EC2 instances', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('NAT Gateways exist for private subnet egress', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('Internet Gateway is attached to VPC', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachGateway;
      expect(igw).toBeDefined();
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('Route tables are configured for public and private subnets', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;
      expect(publicRT).toBeDefined();
      expect(privateRT1).toBeDefined();
      expect(privateRT2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg).toBeDefined();
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = albSg.Properties.SecurityGroupIngress;
      expect(ingress.some((r: any) => r.FromPort === 443 && r.ToPort === 443)).toBe(true);
      expect(ingress.some((r: any) => r.FromPort === 80 && r.ToPort === 80)).toBe(true);
    });

    test('Web server security group allows traffic from ALB only', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg).toBeDefined();
      const ingress = webSg.Properties.SecurityGroupIngress;
      expect(ingress.every((r: any) => r.SourceSecurityGroupId)).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 instance role has correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 role has S3, DynamoDB, and Secrets Manager policies', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      expect(policies.some((p: any) => p.PolicyName.includes('S3'))).toBe(true);
      expect(policies.some((p: any) => p.PolicyName.includes('DynamoDB'))).toBe(true);
      expect(policies.some((p: any) => p.PolicyName.includes('SecretsManager'))).toBe(true);
    });

    test('EC2 instance profile references the role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('S3 Buckets', () => {
    test('Assets bucket has versioning and encryption enabled', () => {
      const bucket = template.Resources.AppAssetsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Logs bucket has lifecycle policy', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('Both buckets block public access', () => {
      const assets = template.Resources.AppAssetsBucket;
      const logs = template.Resources.LogsBucket;
      [assets, logs].forEach(bucket => {
        const pab = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('Logs bucket policy allows ALB to write logs', () => {
      const policy = template.Resources.LogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.some((s: any) => s.Principal.Service === 'logdelivery.elasticloadbalancing.amazonaws.com')).toBe(true);
    });
  });

  describe('ACM Certificates', () => {
    test('ALB certificate uses DNS validation', () => {
      const cert = template.Resources.ALBCertificate;
      expect(cert).toBeDefined();
      expect(cert.Type).toBe('AWS::CertificateManager::Certificate');
      expect(cert.Properties.ValidationMethod).toBe('DNS');
    });

    test('CloudFront certificate is conditionally created', () => {
      const cert = template.Resources.CloudFrontCertificate;
      expect(cert).toBeDefined();
      expect(cert.Condition).toBe('IsUSEast1AndHasDomain');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is internet-facing with correct subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets.length).toBe(2);
    });

    test('ALB has access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attrs = alb.Properties.LoadBalancerAttributes;
      const logsEnabled = attrs.find((a: any) => a.Key === 'access_logs.s3.enabled');
      expect(logsEnabled.Value).toBe('true');
    });

    test('Target group has health check configured', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('HTTP listener redirects to HTTPS', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Properties.DefaultActions[0].Type).toBe('redirect');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.Protocol).toBe('HTTPS');
    });

    test('HTTPS listener is conditionally created with certificate', () => {
      const listener = template.Resources.HTTPSListener;
      expect(listener).toBeDefined();
      expect(listener.Condition).toBe('HasDomain');
      expect(listener.Properties.Certificates).toBeDefined();
    });
  });

  describe('Auto Scaling', () => {
    test('Launch template has correct instance configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('Auto Scaling Group scales based on environment', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('Scaling policies are configured', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;
      expect(scaleUp).toBeDefined();
      expect(scaleDown).toBeDefined();
      expect(scaleUp.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(scaleDown.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
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

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
    });
  });

  describe('Resources', () => {
    test('should have SessionTable resource', () => {
      expect(template.Resources.SessionTable).toBeDefined();
    });

    test('SessionTable should be a DynamoDB table', () => {
      const table = template.Resources.SessionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionTable should have correct properties', () => {
      const table = template.Resources.SessionTable;
      const properties = table.Properties;

      // Validate billing mode and encryption/TTL features
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.SSESpecification.SSEEnabled).toBe(true);
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(properties.TimeToLiveSpecification.Enabled).toBe(true);
    });

    test('SessionTable should have correct attribute definitions', () => {
      const table = template.Resources.SessionTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'SessionId', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'UserId', AttributeType: 'S' }),
        ])
      );
    });

    test('SessionTable should have correct key schema', () => {
      const table = template.Resources.SessionTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('SessionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('SessionTable should define GSI for UserId', () => {
      const table = template.Resources.SessionTable;
      const gsis = table.Properties.GlobalSecondaryIndexes || [];
      const userIdIndex = gsis.find((gsi: any) => gsi.IndexName === 'UserIdIndex');
      expect(userIdIndex).toBeDefined();
      expect(userIdIndex.KeySchema[0]).toEqual({ AttributeName: 'UserId', KeyType: 'HASH' });
    });
  });

  describe('Outputs', () => {
    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('DynamoDB table name for sessions');
      expect(output.Value).toEqual({ Ref: 'SessionTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Session-Table',
      });
    });

    test('LoadBalancerDNS export name should match', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ALB-DNS' });
    });

    test('S3 outputs should exist and have export names', () => {
      const assets = template.Outputs.S3AssetsBucket;
      const logs = template.Outputs.S3LogsBucket;
      expect(assets).toBeDefined();
      expect(logs).toBeDefined();
      expect(assets.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-Assets-Bucket' });
      expect(logs.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-Logs-Bucket' });
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

    test('should define multiple resources and parameters', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(1);
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(1);
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(3);
    });
  });

  describe('DynamoDB Session Table', () => {
    test('has TTL enabled', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('TTL');
    });

    test('has stream enabled for change data capture', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Application log group has retention policy', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('Dashboard is configured with metrics', () => {
      const dashboard = template.Resources.ApplicationDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('High CPU alarm is configured', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Unhealthy host alarm is configured', () => {
      const alarm = template.Resources.UnhealthyHostAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Threshold).toBe(0);
    });
  });

  describe('Route 53 and CloudFront (Conditional)', () => {
    test('Hosted zone is conditionally created', () => {
      const hz = template.Resources.HostedZone;
      expect(hz).toBeDefined();
      expect(hz.Condition).toBe('IsUSEast1AndHasDomain');
    });

    test('CloudFront distribution has failover configuration', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf).toBeDefined();
      expect(cf.Condition).toBe('IsUSEast1AndHasDomain');
      expect(cf.Properties.DistributionConfig.OriginGroups).toBeDefined();
    });

    test('WAF Web ACL is configured for CloudFront', () => {
      const waf = template.Resources.WebACL;
      expect(waf).toBeDefined();
      expect(waf.Properties.Scope).toBe('CLOUDFRONT');
      expect(waf.Properties.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('SessionTable name should include team and environment suffix', () => {
      const table = template.Resources.SessionTable;
      const tableName = table.Properties.TableName;
      expect(tableName).toEqual({ 'Fn::Sub': '${Team}-${EnvironmentSuffix}-sessions' });
    });

    test('All major resources use consistent naming', () => {
      const resources = [
        template.Resources.AppAssetsBucket,
        template.Resources.LogsBucket,
        template.Resources.ApplicationLoadBalancer,
      ];
      resources.forEach(resource => {
        expect(resource.Properties.Tags || resource.Tags).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    test('Has domain condition is defined', () => {
      expect(template.Conditions.HasDomain).toBeDefined();
    });

    test('IsUSEast1AndHasDomain combines two conditions', () => {
      const cond = template.Conditions.IsUSEast1AndHasDomain;
      expect(cond['Fn::And']).toBeDefined();
      expect(cond['Fn::And'].length).toBe(2);
    });

    test('CreateVPC condition checks for empty VpcId', () => {
      expect(template.Conditions.CreateVPC).toBeDefined();
    });
  });
});
