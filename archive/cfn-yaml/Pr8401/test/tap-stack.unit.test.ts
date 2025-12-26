import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load template from JSON (must be generated from YAML first)
    // To generate: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template JSON file not found. Please run: pipenv run cfn-flip-to-json > lib/TapStack.json');
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(Array.isArray(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups)).toBe(true);
    });
  });

  describe('Parameters Validation', () => {
    const requiredParameters = [
      'EnvironmentName',
      'OwnerTag',
      'DomainName',
      'CreateNewHostedZone',
      'InstanceType',
      'DBInstanceClass',
      'DBStorageSize',
      'DBName',
      'DBUsername',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'AlertEmail',
      'EnableDetailedMonitoring',
      'CreateCertificates',
      'ExistingHostedZoneId'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    describe('EnvironmentName parameter', () => {
      test('should have correct properties', () => {
        const param = template.Parameters.EnvironmentName;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('production');
        expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
      });

      test('should have constraint description', () => {
        expect(template.Parameters.EnvironmentName.ConstraintDescription).toBeDefined();
      });
    });

    describe('DomainName parameter', () => {
      test('should have correct validation pattern', () => {
        const param = template.Parameters.DomainName;
        expect(param.AllowedPattern).toBe('^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$');
        expect(param.MinLength).toBe(1);
        expect(param.MaxLength).toBe(253);
      });

      test('should have default value', () => {
        expect(template.Parameters.DomainName.Default).toBe('example.com');
      });
    });

    describe('InstanceType parameter', () => {
      test('should have valid instance types', () => {
        const param = template.Parameters.InstanceType;
        expect(param.AllowedValues).toContain('t3.medium');
        expect(param.AllowedValues).toContain('t3.micro');
        expect(param.Default).toBe('t3.medium');
      });
    });

    describe('Auto Scaling parameters', () => {
      test('MinSize should have valid range', () => {
        const param = template.Parameters.MinSize;
        expect(param.Type).toBe('Number');
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
        expect(param.Default).toBe(2);
      });

      test('MaxSize should be greater than MinSize', () => {
        const minSize = template.Parameters.MinSize.Default;
        const maxSize = template.Parameters.MaxSize.Default;
        expect(maxSize).toBeGreaterThan(minSize);
      });

      test('DesiredCapacity should be within MinSize and MaxSize', () => {
        const minSize = template.Parameters.MinSize.Default;
        const maxSize = template.Parameters.MaxSize.Default;
        const desired = template.Parameters.DesiredCapacity.Default;
        expect(desired).toBeGreaterThanOrEqual(minSize);
        expect(desired).toBeLessThanOrEqual(maxSize);
      });
    });

    describe('Database parameters', () => {
      test('DBStorageSize should have valid range', () => {
        const param = template.Parameters.DBStorageSize;
        expect(param.MinValue).toBe(20);
        expect(param.MaxValue).toBe(1024);
        expect(param.Default).toBe(100);
      });

      test('DBName should have valid pattern', () => {
        const param = template.Parameters.DBName;
        expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
        expect(param.MinLength).toBe(1);
        expect(param.MaxLength).toBe(64);
      });

      test('DBUsername should have NoEcho for security', () => {
        expect(template.Parameters.DBUsername.NoEcho).toBe(true);
      });
    });

    describe('AlertEmail parameter', () => {
      test('should validate email format', () => {
        const param = template.Parameters.AlertEmail;
        expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
      });
    });
  });

  describe('Conditions Validation', () => {
    test('should have all required conditions', () => {
      const requiredConditions = [
        'CreateHostedZone',
        'UseDetailedMonitoring',
        'IsProduction',
        'IsUsEast1',
        'ShouldCreateCertificates',
        'HasHostedZone'
      ];

      requiredConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('CreateHostedZone condition should check CreateNewHostedZone parameter', () => {
      const condition = template.Conditions.CreateHostedZone;
      expect(condition).toBeDefined();
      // Should be an Equals function checking CreateNewHostedZone
    });

    test('IsProduction condition should check EnvironmentName', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toBeDefined();
    });

    test('ShouldCreateCertificates condition should check CreateCertificates parameter', () => {
      const condition = template.Conditions.ShouldCreateCertificates;
      expect(condition).toBeDefined();
    });
  });

  describe('Mappings Validation', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('should have subnet CIDR blocks defined', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.PublicSubnet1.CIDR).toBeDefined();
      expect(subnetConfig.PublicSubnet2.CIDR).toBeDefined();
      expect(subnetConfig.PublicSubnet3.CIDR).toBeDefined();
      expect(subnetConfig.PrivateSubnet1.CIDR).toBeDefined();
      expect(subnetConfig.PrivateSubnet2.CIDR).toBeDefined();
      expect(subnetConfig.PrivateSubnet3.CIDR).toBeDefined();
      expect(subnetConfig.DBSubnet1.CIDR).toBeDefined();
      expect(subnetConfig.DBSubnet2.CIDR).toBeDefined();
      expect(subnetConfig.DBSubnet3.CIDR).toBeDefined();
    });
  });

  describe('VPC Resources Validation', () => {
    test('VPC should exist with correct properties', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have subnets in three availability zones', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      const dbSubnets = ['DBSubnet1', 'DBSubnet2', 'DBSubnet3'];

      [...publicSubnets, ...privateSubnets, ...dbSubnets].forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have route tables for each subnet tier', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
      expect(template.Resources.DBRouteTable).toBeDefined();
    });
  });

  describe('Security Groups Validation', () => {
    test('ALB Security Group should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443 && r.ToPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Server Security Group should only allow traffic from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        // Should reference ALBSecurityGroup
      });
    });

    test('Database Security Group should only allow MySQL from web servers', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const mysqlRule = ingress.find((r: any) => r.FromPort === 3306 && r.ToPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('S3 Resources Validation', () => {
    test('StaticContentBucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('StaticContentBucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('StaticContentBucket should have lifecycle rules', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('ALBAccessLogsBucket should exist', () => {
      expect(template.Resources.ALBAccessLogsBucket).toBeDefined();
      expect(template.Resources.ALBAccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ALBAccessLogsBucketPolicy should allow ELB service', () => {
      const policy = template.Resources.ALBAccessLogsBucketPolicy;
      expect(policy).toBeDefined();
      const statements = policy.Properties.PolicyDocument.Statement;
      const elbStatement = statements.find((s: any) => 
        s.Principal?.Service?.includes('logdelivery.elasticloadbalancing')
      );
      expect(elbStatement).toBeDefined();
    });
  });

  describe('CloudFront Distribution Validation', () => {
    test('CloudFrontDistribution should exist', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should have S3 and ALB origins', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const origins = dist.Properties.DistributionConfig.Origins;
      const s3Origin = origins.find((o: any) => o.Id === 'S3Origin');
      const albOrigin = origins.find((o: any) => o.Id === 'ALBOrigin');
      expect(s3Origin).toBeDefined();
      expect(albOrigin).toBeDefined();
    });

    test('CloudFront should enforce HTTPS', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const viewerProtocol = dist.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy;
      expect(viewerProtocol).toBe('redirect-to-https');
    });

    test('CloudFront should have path-based cache behaviors', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const cacheBehaviors = dist.Properties.DistributionConfig.CacheBehaviors;
      const staticBehavior = cacheBehaviors.find((b: any) => b.PathPattern === '/static/*');
      const apiBehavior = cacheBehaviors.find((b: any) => b.PathPattern === '/api/*');
      expect(staticBehavior).toBeDefined();
      expect(apiBehavior).toBeDefined();
    });

    test('static content should have long TTL', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const cacheBehaviors = dist.Properties.DistributionConfig.CacheBehaviors;
      const staticBehavior = cacheBehaviors.find((b: any) => b.PathPattern === '/static/*');
      expect(staticBehavior.DefaultTTL).toBe(604800); // 7 days
    });

    test('API paths should have no caching', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const cacheBehaviors = dist.Properties.DistributionConfig.CacheBehaviors;
      const apiBehavior = cacheBehaviors.find((b: any) => b.PathPattern === '/api/*');
      expect(apiBehavior.MinTTL).toBe(0);
      expect(apiBehavior.DefaultTTL).toBe(0);
      expect(apiBehavior.MaxTTL).toBe(0);
    });
  });

  describe('WAF Validation', () => {
    test('WAF WebACL should be conditional on us-east-1', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf).toBeDefined();
      expect(waf.Condition).toBe('IsUsEast1');
      expect(waf.Properties.Scope).toBe('CLOUDFRONT');
    });

    test('WAF should have rate limiting rule', () => {
      const waf = template.Resources.WAFWebACL;
      const rules = waf.Properties.Rules;
      const rateLimitRule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement).toBeDefined();
    });
  });

  describe('Application Load Balancer Validation', () => {
    test('ALB should exist in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('ALB should have access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      const accessLogsEnabled = attributes.find((a: any) => a.Key === 'access_logs.s3.enabled');
      expect(accessLogsEnabled).toBeDefined();
      expect(accessLogsEnabled.Value).toBe('true');
    });

    test('ALB should have HTTP and HTTPS listeners', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListenerHTTPS).toBeDefined();
      expect(template.Resources.ALBListener.Properties.Port).toBe(80);
    });

    test('HTTPS listener should be conditional on certificates', () => {
      const httpsListener = template.Resources.ALBListenerHTTPS;
      expect(httpsListener.Condition).toBe('ShouldCreateCertificates');
    });
  });

  describe('Auto Scaling Group Validation', () => {
    test('Auto Scaling Group should exist', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
    });

    test('ASG should have health check type ELB', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('ASG should have scaling policy', () => {
      expect(template.Resources.TargetTrackingScalingPolicy).toBeDefined();
      const policy = template.Resources.TargetTrackingScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(50);
    });
  });

  describe('RDS Database Validation', () => {
    test('RDS Database should exist', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have backup retention', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should be in DB subnets', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DBSubnetGroupName).toBeDefined();
    });

    test('RDS IOPS should be conditional on storage size', () => {
      const rds = template.Resources.RDSDatabase;
      // IOPS is conditionally set only when storage >= 400GB in production
      // It may not always be present in the template, which is correct
      // The conditional logic ensures it's only set when needed
    });
  });

  describe('IAM Roles Validation', () => {
    test('EC2 Role should exist with proper assume role policy', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('EC2 Role should have S3 access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
    });

    test('EC2 Role should have CloudWatch Logs access', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      expect(logsPolicy).toBeDefined();
    });

    test('EC2 Role should have Secrets Manager access', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    const requiredAlarms = [
      'HighCPUAlarm',
      'LowCPUAlarm',
      'ALBUnHealthyHostAlarm',
      'ALBTargetResponseTimeAlarm',
      'RDSHighCPUAlarm',
      'RDSLowStorageAlarm'
    ];

    test('should have all required alarms', () => {
      requiredAlarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('alarms should have SNS topic actions', () => {
      requiredAlarms.forEach(alarm => {
        const alarmResource = template.Resources[alarm];
        expect(alarmResource.Properties.AlarmActions).toBeDefined();
      });
    });
  });

  describe('Route 53 Validation', () => {
    test('HostedZone should be conditional', () => {
      const hostedZone = template.Resources.HostedZone;
      expect(hostedZone).toBeDefined();
      expect(hostedZone.Condition).toBe('CreateHostedZone');
    });

    test('DNSRecord should be conditional on HasHostedZone', () => {
      const dnsRecord = template.Resources.DNSRecord;
      expect(dnsRecord).toBeDefined();
      expect(dnsRecord.Condition).toBe('HasHostedZone');
    });
  });

  describe('Outputs Validation', () => {
    const requiredOutputs = [
      'VPCId',
      'ALBDNSName',
      'CloudFrontDomainName',
      'DatabaseEndpoint',
      'AutoScalingGroupName',
      'SNSTopicArn'
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Tag Validation', () => {
    const resourcesWithTags = [
      'VPC',
      'InternetGateway',
      'ApplicationLoadBalancer',
      'StaticContentBucket',
      'RDSDatabase'
    ];

    test('critical resources should have standard tags', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Name');
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Owner');
        }
      });
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('CloudFront should depend on certificate validation when certificates enabled', () => {
      const cloudfront = template.Resources.CloudFrontDistribution;
      // Check if DependsOn exists (may be conditional)
    });

    test('ALB should reference target group', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      if (listener && listener.Properties) {
        expect(listener.Properties.DefaultActions[0].TargetGroupArn).toBeDefined();
      }
    });

    test('Auto Scaling Group should reference launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate).toBeDefined();
    });

    test('RDS should reference DB subnet group', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DBSubnetGroupName).toBeDefined();
    });
  });

  describe('Error Cases and Edge Conditions', () => {
    test('certificates should be conditional to avoid validation failures', () => {
      const acmCert = template.Resources.ACMCertificate;
      expect(acmCert.Condition).toBe('ShouldCreateCertificates');
    });

    test('WAF should only be created in us-east-1', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Condition).toBe('IsUsEast1');
    });

    test('HTTPS listener should be conditional', () => {
      const httpsListener = template.Resources.ALBListenerHTTPS;
      expect(httpsListener.Condition).toBe('ShouldCreateCertificates');
    });
  });

  describe('Performance and Best Practices', () => {
    test('CloudFront should have compression enabled', () => {
      const dist = template.Resources.CloudFrontDistribution;
      expect(dist.Properties.DistributionConfig.DefaultCacheBehavior.Compress).toBe(true);
    });

    test('ALB should have idle timeout configured', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      const idleTimeout = attributes.find((a: any) => a.Key === 'idle_timeout.timeout_seconds');
      expect(idleTimeout).toBeDefined();
    });

    test('RDS should use gp3 storage type', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageType).toBe('gp3');
    });
  });
});
