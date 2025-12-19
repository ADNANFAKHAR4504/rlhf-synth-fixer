import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Secure Production Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Unit TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for secure production infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure Production Environment Infrastructure');
      expect(template.Description).toContain('comprehensive security controls');
    });

    test('should have conditions for deployment', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.UseCurrentAccountForLogs).toBeDefined();
      expect(template.Conditions.WAFSupported).toBeDefined();
      expect(template.Conditions.CreateShieldProtection).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters for secure infrastructure', () => {
      const requiredParams = [
        'CostCenterTag',
        'ProjectIDTag', 
        'LoggingAccountId',
        'VpcCIDR',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'DBSubnet1CIDR',
        'DBSubnet2CIDR',
        'DBInstanceClass',
        'DBBackupRetentionPeriod',
        'EnableShieldAdvanced'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBeDefined();
        expect(template.Parameters[param].Description).toBeDefined();
      });
    });

    test('EnableShieldAdvanced parameter should have correct allowed values', () => {
      const shieldParam = template.Parameters.EnableShieldAdvanced;
      expect(shieldParam.Type).toBe('String');
      expect(shieldParam.Default).toBe('false');
      expect(shieldParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('DB parameters should have correct constraints', () => {
      const dbInstanceClass = template.Parameters.DBInstanceClass;
      expect(dbInstanceClass.AllowedValues).toEqual(['db.t3.small', 'db.t3.medium', 'db.t3.large']);
      
      const dbRetention = template.Parameters.DBBackupRetentionPeriod;
      expect(dbRetention.Type).toBe('Number');
      expect(dbRetention.MinValue).toBe(7);
    });

    test('CIDR parameters should have correct defaults', () => {
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
    });
  });

  describe('Security and Compliance Resources', () => {
    test('should have centralized logging S3 bucket', () => {
      expect(template.Resources.CentralizedLoggingBucket).toBeDefined();
      const bucket = template.Resources.CentralizedLoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      // Bucket is now created in all regions, no condition
      expect(bucket.Condition).toBeUndefined();
    });

    test('should have CloudTrail for auditing', () => {
      expect(template.Resources.CloudTrailToS3).toBeDefined();
      const cloudtrail = template.Resources.CloudTrailToS3;
      expect(cloudtrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have AWS Config for compliance monitoring', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.IAMFullAccessRule).toBeDefined();
      
      const configRecorder = template.Resources.ConfigRecorder;
      expect(configRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('should have CloudWatch metric filters for threat detection', () => {
      const metricFilters = [
        'RootAccountUsageMetricFilter',
        'UnauthorizedAPICallsMetricFilter', 
        'IAMPolicyChangesMetricFilter',
        'ConsoleSigninFailureMetricFilter'
      ];
      
      metricFilters.forEach(filter => {
        expect(template.Resources[filter]).toBeDefined();
        expect(template.Resources[filter].Type).toBe('AWS::Logs::MetricFilter');
      });
    });

    test('should have CloudWatch alarms for security monitoring', () => {
      const alarms = [
        'RootAccountLoginAlarm',
        'UnauthorizedAPICallAlarm',
        'IAMPolicyChangeAlarm', 
        'ConsoleSigninFailureAlarm'
      ];
      
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC with proper configuration', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have public and private subnets', () => {
      const subnets = [
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 
        'DBSubnet1', 'DBSubnet2'
      ];
      
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have NAT Gateway for private subnet internet access', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('Security Groups', () => {
    test('should have security groups with least privilege access', () => {
      const securityGroups = [
        'WebServerSecurityGroup',
        'AppServerSecurityGroup', 
        'DBSecurityGroup'
      ];
      
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('web server security group should only allow HTTP/HTTPS', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const ingress = webSG.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should have security group ingress rules for app and DB tiers', () => {
      expect(template.Resources.AppServerSGIngressFromWeb).toBeDefined();
      expect(template.Resources.DBSecurityGroupIngress).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('should have RDS instance with security best practices', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS credentials in Secrets Manager', () => {
      expect(template.Resources.RDSSecret).toBeDefined();
      const secret = template.Resources.RDSSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('Application Layer Protection', () => {
    test('should have AWS WAF for application protection', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACLAssociation).toBeDefined();
      
      const waf = template.Resources.WebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('should have AWS Shield protection', () => {
      expect(template.Resources.ShieldProtection).toBeDefined();
      const shield = template.Resources.ShieldProtection;
      expect(shield.Type).toBe('AWS::Shield::Protection');
      expect(shield.Condition).toBe('CreateShieldProtection');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ALB).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBListener).toBeDefined();
      
      const alb = template.Resources.ALB;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });
  });

  describe('Auto Scaling and Compute', () => {
    test('should have Auto Scaling Group for scalability', () => {
      expect(template.Resources.WebServerAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebServerLaunchTemplate).toBeDefined();
      
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have IAM roles for EC2 instances', () => {
      expect(template.Resources.SSMInstanceRole).toBeDefined();
      expect(template.Resources.SSMInstanceProfile).toBeDefined();
      
      const role = template.Resources.SSMInstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Outputs', () => {
    test('should have all infrastructure outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'ALBDnsName', 
        'WebServerSecurityGroup',
        'AppServerSecurityGroup',
        'DBSecurityGroup',
        'PublicSubnets',
        'PrivateSubnets',
        'DBSubnets',
        'RDSEndpoint'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('VpcId output should reference VPC', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDnsName output should reference ALB DNS', () => {
      const output = template.Outputs.ALBDnsName;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ALB', 'DNSName'] });
    });

    test('RDSEndpoint output should reference RDS endpoint', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have comprehensive security infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Expect significant infrastructure
    });

    test('should have all required parameters for production infrastructure', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(13); // All infrastructure parameters (removed PrimaryRegion, added EnableShieldAdvanced)
    });

    test('should have infrastructure outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9); // VPC, ALB, Security Groups, Subnets, RDS
    });
  });

  describe('Security and Tagging Standards', () => {
    test('should have iac-rlhf-amazon tag on all taggable resources', () => {
      const taggedResources = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties?.Tags || 
                    resource.Properties?.TagSpecifications?.[0]?.Tags ||
                    [];
        return tags.some((tag: any) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true');
      });
      
      // Should have multiple tagged resources (not all resources support tags)
      expect(taggedResources.length).toBeGreaterThan(15);
    });

    test('should have cost-center and project-id tags on resources', () => {
      const taggedResources = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties?.Tags || 
                    resource.Properties?.TagSpecifications?.[0]?.Tags ||
                    [];
        const hasCostCenter = tags.some((tag: any) => tag.Key === 'cost-center');
        const hasProjectId = tags.some((tag: any) => tag.Key === 'project-id');
        return hasCostCenter && hasProjectId;
      });
      
      expect(taggedResources.length).toBeGreaterThan(15);
    });

    test('should have IAM roles following least privilege principle', () => {
      const iamRoles = Object.keys(template.Resources).filter(resourceName => {
        return template.Resources[resourceName].Type === 'AWS::IAM::Role';
      });
      
      expect(iamRoles.length).toBeGreaterThanOrEqual(4); // CloudTrail, VPCFlowLogs, Config, SSM
      
      // Check that each role has specific service principals
      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBeDefined();
      });
    });

    test('should have encryption enabled for data at rest', () => {
      // Check RDS encryption
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      
      // Check S3 encryption
      const s3Bucket = template.Resources.CentralizedLoggingBucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have configurable Shield Advanced protection', () => {
      // Check condition for Shield Advanced
      expect(template.Conditions.CreateShieldProtection).toBeDefined();
      
      // Check that Shield Protection is conditional on EnableShieldAdvanced parameter
      const shieldProtection = template.Resources.ShieldProtection;
      expect(shieldProtection.Condition).toBe('CreateShieldProtection');
      
      // Check that S3 bucket is now created in all regions
      const s3Bucket = template.Resources.CentralizedLoggingBucket;
      expect(s3Bucket.Condition).toBeUndefined();
    });

    test('should have comprehensive monitoring and alerting', () => {
      // Check CloudWatch alarms exist
      const alarms = Object.keys(template.Resources).filter(resourceName => {
        return template.Resources[resourceName].Type === 'AWS::CloudWatch::Alarm';
      });
      expect(alarms.length).toBeGreaterThanOrEqual(4);
      
      // Check metric filters exist
      const metricFilters = Object.keys(template.Resources).filter(resourceName => {
        return template.Resources[resourceName].Type === 'AWS::Logs::MetricFilter';
      });
      expect(metricFilters.length).toBeGreaterThanOrEqual(4);
      
      // Check SNS topic for alerts
      expect(template.Resources.SecurityAlertTopic).toBeDefined();
    });
  });
});
