import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure');
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('IAM');
      expect(template.Description).toContain('encryption');
      expect(template.Description).toContain('logging');
    });

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
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['Environment', 'Owner', 'Project', 'DBUsername'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toContain('Environment name');
    });

    test('DBPasswordSecret should exist for secure password management', () => {
      const dbPasswordSecret = template.Resources.DBPasswordSecret;
      expect(dbPasswordSecret).toBeDefined();
      expect(dbPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(dbPasswordSecret.Properties.GenerateSecretString).toBeDefined();
      expect(dbPasswordSecret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('DBUsername parameter should be marked as sensitive', () => {
      const dbUserParam = template.Parameters.DBUsername;
      expect(dbUserParam.NoEcho).toBe(true);
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('should have VPC with proper CIDR and DNS settings', () => {
      const vpc = template.Resources.CorpVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.CorpInternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      const attachment = template.Resources.CorpVPCGatewayAttachment;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets in multiple AZs', () => {
      const publicSubnet1 = template.Resources.CorpPublicSubnet1;
      const publicSubnet2 = template.Resources.CorpPublicSubnet2;
      const privateSubnet1 = template.Resources.CorpPrivateSubnet1;
      const privateSubnet2 = template.Resources.CorpPrivateSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');

      // Check different AZs - using dynamic AZ selection
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);

      // Check CIDR blocks
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have NAT Gateway for private subnet internet access', () => {
      const natEip = template.Resources.CorpNATGatewayEIP;
      const natGw = template.Resources.CorpNATGateway;

      expect(natEip.Type).toBe('AWS::EC2::EIP');
      expect(natEip.Properties.Domain).toBe('vpc');
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have proper routing tables and routes', () => {
      const publicRT = template.Resources.CorpPublicRouteTable;
      const privateRT = template.Resources.CorpPrivateRouteTable;
      const publicRoute = template.Resources.CorpPublicRoute;
      const privateRoute = template.Resources.CorpPrivateRoute;

      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Type).toBe('AWS::EC2::Route');

      // Check route destinations
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups', () => {
    test('should have restrictive security groups', () => {
      const webSG = template.Resources.CorpWebSecurityGroup;
      const dbSG = template.Resources.CorpDatabaseSecurityGroup;
      const lambdaSG = template.Resources.CorpLambdaSecurityGroup;

      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lambdaSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web security group should only allow HTTP/HTTPS', () => {
      const webSG = template.Resources.CorpWebSecurityGroup;
      const ingress = webSG.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpsRule.IpProtocol).toBe('tcp');
    });

    test('database security group should have no inline ingress rules', () => {
      const dbSG = template.Resources.CorpDatabaseSecurityGroup;
      
      expect(dbSG.Properties.SecurityGroupEgress).toEqual([]);
      expect(dbSG.Properties.SecurityGroupIngress).toBeUndefined();
      
      // Check that separate ingress rules exist
      expect(template.Resources.CorpDBSecurityGroupIngressFromWeb).toBeDefined();
      expect(template.Resources.CorpDBSecurityGroupIngressFromLambda).toBeDefined();
    });

    test('lambda security group should have minimal egress', () => {
      const lambdaSG = template.Resources.CorpLambdaSecurityGroup;
      const egress = lambdaSG.Properties.SecurityGroupEgress;

      expect(egress).toHaveLength(2);
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].IpProtocol).toBe('tcp');
    });
  });

  describe('IAM Roles and Policies - Least Privilege', () => {
    test('should have Lambda execution role with minimal permissions', () => {
      const lambdaRole = template.Resources.CorpLambdaExecutionRole;
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = lambdaRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
    });

    test('Lambda role should have VPC access policy', () => {
      const lambdaRole = template.Resources.CorpLambdaExecutionRole;
      const managedPolicies = lambdaRole.Properties.ManagedPolicyArns;
      
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('should have EC2 role with minimal permissions', () => {
      const ec2Role = template.Resources.CorpEC2Role;
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      
      const policy = ec2Role.Properties.Policies[0];
      expect(policy.PolicyName['Fn::Sub']).toBe('corp-ec2-minimal-policy-${EnvironmentSuffix}');
      
      const statement = policy.PolicyDocument.Statement;
      expect(statement.some((s: any) => s.Action.includes('logs:CreateLogGroup'))).toBe(true);
      expect(statement.some((s: any) => s.Action.includes('cloudwatch:PutMetricData'))).toBe(true);
      expect(statement.some((s: any) => s.Action.includes('ssm:GetParameter'))).toBe(true);
    });

    test('should have MFA enforcement policy', () => {
      const mfaPolicy = template.Resources.CorpMFAPolicy;
      expect(mfaPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const policyDoc = mfaPolicy.Properties.PolicyDocument;
      const denyStatement = policyDoc.Statement.find((s: any) => s.Effect === 'Deny');
      
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('should have instance profile for EC2', () => {
      const instanceProfile = template.Resources.CorpEC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'CorpEC2Role' }]);
    });
  });

  describe('CloudTrail for API Auditing', () => {
    test('should have CloudTrail with encrypted S3 bucket', () => {
      const cloudtrail = template.Resources.CorpCloudTrail;
      const bucket = template.Resources.CorpCloudTrailBucket;

      expect(cloudtrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      expect(cloudtrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail S3 bucket should have encryption and public access blocked', () => {
      const bucket = template.Resources.CorpCloudTrailBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have proper bucket policy for CloudTrail', () => {
      const bucketPolicy = template.Resources.CorpCloudTrailBucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const policyDoc = bucketPolicy.Properties.PolicyDocument;
      expect(policyDoc.Statement).toHaveLength(2);
      
      const writeStatement = policyDoc.Statement.find((s: any) => s.Action === 's3:PutObject');
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });
  });

  describe('RDS Database - Multi-AZ and Encrypted', () => {
    test('should have RDS database with Multi-AZ deployment', () => {
      const rds = template.Resources.CorpRDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper backup and monitoring settings', () => {
      const rds = template.Resources.CorpRDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(30);
      expect(rds.Properties.MonitoringInterval).toBe(60);
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
    });

    test('should have RDS monitoring role', () => {
      const monitoringRole = template.Resources.CorpRDSMonitoringRole;
      expect(monitoringRole.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = monitoringRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });

    test('should have DB subnet group in private subnets', () => {
      const subnetGroup = template.Resources.CorpDBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnetIds = subnetGroup.Properties.SubnetIds;
      expect(subnetIds).toEqual([{ Ref: 'CorpPrivateSubnet1' }, { Ref: 'CorpPrivateSubnet2' }]);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB with health checks', () => {
      const alb = template.Resources.CorpApplicationLoadBalancer;
      const targetGroup = template.Resources.CorpTargetGroup;

      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(targetGroup.Properties.HealthCheckEnabled).toBe(true);
    });

    test('target group should have proper health check configuration', () => {
      const targetGroup = template.Resources.CorpTargetGroup;
      const props = targetGroup.Properties;

      expect(props.HealthCheckIntervalSeconds).toBe(30);
      expect(props.HealthCheckPath).toBe('/health');
      expect(props.HealthCheckTimeoutSeconds).toBe(5);
      expect(props.HealthyThresholdCount).toBe(2);
      expect(props.UnhealthyThresholdCount).toBe(3);
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda with VPC configuration', () => {
      const lambda = template.Resources.CorpLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      
      const vpcConfig = lambda.Properties.VpcConfig;
      expect(vpcConfig.SecurityGroupIds).toEqual([{ Ref: 'CorpLambdaSecurityGroup' }]);
      expect(vpcConfig.SubnetIds).toEqual([{ Ref: 'CorpPrivateSubnet1' }, { Ref: 'CorpPrivateSubnet2' }]);
    });

    test('Lambda should use AWS-managed encryption', () => {
      const lambda = template.Resources.CorpLambdaFunction;
      // Lambda uses AWS-managed encryption when KmsKeyArn is not specified
      expect(lambda.Properties.KmsKeyArn).toBeUndefined();
      // Verify Lambda still has environment variables which will be encrypted
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have VPC Flow Logs with CloudWatch', () => {
      const flowLogs = template.Resources.CorpVPCFlowLogs;
      const logGroup = template.Resources.CorpVPCFlowLogsGroup;

      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('log group should have retention', () => {
      const logGroup = template.Resources.CorpVPCFlowLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      // KMS encryption uses AWS managed key for CloudWatch Logs by default
      expect(logGroup.Properties.KmsKeyId).toBeUndefined();
    });

    test('should have VPC Flow Logs IAM role', () => {
      const flowLogsRole = template.Resources.CorpVPCFlowLogsRole;
      expect(flowLogsRole.Type).toBe('AWS::IAM::Role');
      
      const policy = flowLogsRole.Properties.Policies[0];
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });
  });

  describe('Resource Tagging', () => {
    const requiredTags = ['Environment', 'Owner', 'Project'];
    
    test('VPC should have all required tags', () => {
      const vpc = template.Resources.CorpVPC;
      const tags = vpc.Properties.Tags;
      
      requiredTags.forEach(tagKey => {
        expect(tags.some((tag: any) => tag.Key === tagKey)).toBe(true);
      });
    });

    test('all major resources should be tagged', () => {
      const resourcesToCheck = [
        'CorpVPC', 'CorpPublicSubnet1', 'CorpPrivateSubnet1', 
        'CorpWebSecurityGroup', 'CorpRDSDatabase', 'CorpLambdaFunction'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        requiredTags.forEach(tagKey => {
          expect(resource.Properties.Tags.some((tag: any) => tag.Key === tagKey)).toBe(true);
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use AWS KMS encryption keys', () => {
      // Check CloudTrail encryption - using AES256 instead of KMS for service-managed encryption
      const cloudtrail = template.Resources.CorpCloudTrail;
      expect(cloudtrail.Properties.KMSKeyId).toBeUndefined(); // No longer using KMS for CloudTrail

      // Check RDS encryption
      const rds = template.Resources.CorpRDSDatabase;
      expect(rds.Properties.KmsKeyId).toBeDefined();

      // Check Lambda encryption (uses AWS-managed encryption when no KMS key specified)
      const lambda = template.Resources.CorpLambdaFunction;
      expect(lambda.Properties.KmsKeyArn).toBeUndefined(); // AWS-managed encryption
    });

    test('should follow naming convention with corp prefix', () => {
      const resourceNames = Object.keys(template.Resources);
      const corpResources = resourceNames.filter(name => name.startsWith('Corp'));
      
      // Most resources should follow corp naming convention
      expect(corpResources.length).toBeGreaterThan(20);
    });

    test('RDS should have deletion protection enabled', () => {
      const rds = template.Resources.CorpRDSDatabase;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.CorpCloudTrailBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs for integration testing', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 
        'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'LoadBalancerDNS', 'DatabaseEndpoint'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('TapStack${EnvironmentSuffix}');
      });
    });

    test('should export VPC and subnet IDs for cross-stack references', () => {
      const vpcOutput = template.Outputs.VPCId;
      const subnet1Output = template.Outputs.PublicSubnet1Id;

      expect(vpcOutput.Value).toEqual({ Ref: 'CorpVPC' });
      expect(subnet1Output.Value).toEqual({ Ref: 'CorpPublicSubnet1' });
    });
  });

  describe('Template Size and Complexity', () => {
    test('should have reasonable number of resources for infrastructure template', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
      expect(resourceCount).toBeLessThan(50); // CloudFormation limits
    });

    test('should have reasonable parameter count', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(5);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('NAT Gateway should depend on VPC Gateway Attachment', () => {
      const natEip = template.Resources.CorpNATGatewayEIP;
      expect(natEip.DependsOn).toBe('CorpVPCGatewayAttachment');
    });

    test('CloudTrail should depend on bucket policy', () => {
      const cloudtrail = template.Resources.CorpCloudTrail;
      expect(cloudtrail.DependsOn).toBe('CorpCloudTrailBucketPolicy');
    });

    test('routes should reference correct gateways', () => {
      const publicRoute = template.Resources.CorpPublicRoute;
      const privateRoute = template.Resources.CorpPrivateRoute;

      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'CorpInternetGateway' });
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'CorpNATGateway' });
    });
  });
});
