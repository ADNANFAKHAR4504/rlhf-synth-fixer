import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Run `pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json` to create JSON from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Multi-Environment Infrastructure Template - Dev/Staging/Production');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'ProjectName',
        'OwnerName',
        'SSHAllowedCIDR'
      ];

      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment name');
    });

    test('SSHAllowedCIDR parameter should have correct validation', () => {
      const param = template.Parameters.SSHAllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toMatch(/^\^.*\$$/); // Should be a regex pattern
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have all environment configurations', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      const expectedEnvs = ['default', 'dev', 'staging', 'production'];

      expectedEnvs.forEach(env => {
        expect(envConfig[env]).toBeDefined();
      });
    });

    test('each environment should have required configuration properties', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      const requiredProps = ['InstanceType', 'DBInstanceClass', 'MultiAZ', 'ScheduleEnabled', 'MinSize', 'MaxSize', 'DesiredCapacity'];

      Object.keys(envConfig).forEach(env => {
        requiredProps.forEach(prop => {
          expect(envConfig[env][prop]).toBeDefined();
        });
      });
    });
  });

  describe('Conditions', () => {
    test('should have environment-specific conditions', () => {
      const expectedConditions = ['IsProduction', 'IsDev', 'IsStaging', 'EnableScheduling'];

      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC and networking components', () => {
      const networkingResources = [
        'VPC',
        'InternetGateway',
        'AttachGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'PublicRoute',
        'NATGateway1',
        'NATGateway2',
        'PrivateRouteTable1',
        'PrivateRouteTable2'
      ];

      networkingResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets should have correct CIDR blocks', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should have correct CIDR blocks', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      const securityGroups = [
        'ALBSecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup'
      ];

      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ALB security group should allow HTTP and HTTPS from anywhere', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ingressRules = albSg.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(2);

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServer security group should have SSH and HTTP rules', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      const ingressRules = webSg.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(2);

      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);

      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('Database security group should only allow MySQL from WebServer SG', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = dbSg.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('IAM Resources', () => {
    test('should have required IAM roles', () => {
      const iamRoles = [
        'EC2Role',
        'LambdaExecutionRole',
        'InstanceSchedulerRole'
      ];

      iamRoles.forEach(role => {
        expect(template.Resources[role]).toBeDefined();
        expect(template.Resources[role].Type).toBe('AWS::IAM::Role');
      });
    });

    test('EC2Role should have correct policies', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(ec2Role.Properties.Policies).toHaveLength(4);

      const policyNames = ec2Role.Properties.Policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('SSMParameterAccess');
      expect(policyNames).toContain('LambdaInvokePolicy');
      expect(policyNames).toContain('SecretsManagerReadAccess');
      expect(policyNames).toContain('KMSAccess');
    });

    test('should have EC2InstanceProfile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have EC2 key pair', () => {
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair).toBeDefined();
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
      expect(keyPair.Properties.KeyType).toBe('rsa');
      expect(keyPair.Properties.KeyFormat).toBe('pem');
    });

    test('should have launch template', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');

      const templateData = launchTemplate.Properties.LaunchTemplateData;
      expect(templateData.ImageId).toBeDefined();
      expect(templateData.KeyName).toEqual({ Ref: 'EC2KeyPair' });
      expect(templateData.SecurityGroupIds).toContainEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer components', () => {
      const albResources = [
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'ALBListener'
      ];

      albResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('target group should have health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('RDS Database', () => {
    test('should have RDS components', () => {
      const rdsResources = [
        'RDSDatabase',
        'DbSecret',
        'DbParameterGroup',
        'DBSubnetGroup'
      ];

      rdsResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('RDS instance should have correct configuration', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('DB secret should be properly configured', () => {
      const secret = template.Resources.DbSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });
  });

  describe('S3 Buckets', () => {
    test('should have S3 buckets', () => {
      const s3Resources = [
        'S3Bucket',
        'CloudTrailBucket',
        'CloudTrailBucketPolicy'
      ];

      s3Resources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('S3 bucket should have encryption and versioning', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have Lambda functions', () => {
      const lambdaFunctions = [
        'RDSSnapshotLambda',
        'StopInstancesLambda',
        'StartInstancesLambda'
      ];

      lambdaFunctions.forEach(func => {
        expect(template.Resources[func]).toBeDefined();
        expect(template.Resources[func].Type).toBe('AWS::Lambda::Function');
      });
    });

    test('RDS Snapshot Lambda should have correct configuration', () => {
      const lambda = template.Resources.RDSSnapshotLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.Environment.Variables.DB_INSTANCE_ID).toEqual({ Ref: 'RDSDatabase' });
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch alarms', () => {
      const alarms = [
        'CPUAlarmHigh',
        'DatabaseCPUAlarm'
      ];

      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have SNS topic for alerts', () => {
      const snsTopic = template.Resources.SNSTopic;
      expect(snsTopic).toBeDefined();
      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudTrail', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Event Rules and Scheduling', () => {
    test('should have EventBridge rules', () => {
      const eventRules = [
        'SnapshotScheduleRule',
        'StopInstancesSchedule',
        'StartInstancesSchedule'
      ];

      eventRules.forEach(rule => {
        expect(template.Resources[rule]).toBeDefined();
        expect(template.Resources[rule].Type).toBe('AWS::Events::Rule');
      });
    });

    test('snapshot schedule should run daily', () => {
      const rule = template.Resources.SnapshotScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
      expect(rule.Properties.State).toBe('ENABLED');
    });
  });

  describe('Systems Manager Parameters', () => {
    test('should have SSM parameters', () => {
      const ssmParams = [
        'AMIParameter',
        'DBEndpointParameter',
        'DBSecretParameter'
      ];

      ssmParams.forEach(param => {
        expect(template.Resources[param]).toBeDefined();
        expect(template.Resources[param].Type).toBe('AWS::SSM::Parameter');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EC2KeyPairName',
        'VPCId',
        'ALBDNSName',
        'RDSEndpoint',
        'S3BucketName',
        'CloudTrailBucketName',
        'Environment',
        'ProjectName',
        'DBSecretArn'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-VPC-ID'
      });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address']
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // Should have many resources for full infrastructure
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Conditional Resources', () => {
    test('scheduling resources should have conditions', () => {
      const conditionalResources = [
        'StopInstancesSchedule',
        'StartInstancesSchedule',
        'StopLambdaPermission',
        'StartLambdaPermission'
      ];

      conditionalResources.forEach(resource => {
        expect(template.Resources[resource].Condition).toBe('EnableScheduling');
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tagging', () => {
      const taggedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        if (taggedResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();

          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);

          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Project');
          expect(tagKeys).toContain('Owner');
        }
      });
    });
  });

  describe('UserData Script Validation', () => {
    test('launch template should have UserData with connection tests', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData;

      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toBeDefined();

      const userDataScript = userData['Fn::Base64']['Fn::Sub'];
      expect(userDataScript).toContain('test_rds_connection');
      expect(userDataScript).toContain('test_s3_connection');
      expect(userDataScript).toContain('trigger_rds_snapshot');
    });
  });
});
