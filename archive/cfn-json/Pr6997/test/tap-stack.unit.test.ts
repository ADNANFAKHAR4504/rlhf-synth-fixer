import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Credit Scoring Application', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure ====================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless credit scoring');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 43 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(43);
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have exactly 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  // ==================== Parameters ====================
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
      expect(template.Parameters.CertificateArn.Default).toBeDefined();
    });

    test('should have DatabaseMasterUsername parameter', () => {
      expect(template.Parameters.DatabaseMasterUsername).toBeDefined();
      expect(template.Parameters.DatabaseMasterUsername.Type).toBe('String');
      expect(template.Parameters.DatabaseMasterUsername.Default).toBe('dbadmin');
      expect(template.Parameters.DatabaseMasterUsername.NoEcho).toBe(true);
    });

    test('should have DatabaseMasterPasswordSecret resource', () => {
      expect(template.Resources.DatabaseMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DatabaseMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DatabaseMasterPasswordSecret.Properties.GenerateSecretString).toBeDefined();
      expect(template.Resources.DatabaseMasterPasswordSecret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(template.Resources.DatabaseMasterPasswordSecret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });
  });

  // ==================== VPC Resources ====================
  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should enable DNS', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('DataClassification');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  // ==================== Subnets ====================
  describe('Subnets', () => {
    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnets should map public IPs on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      const subnet3AZ = template.Resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0];
      expect(subnet1AZ).toBe(0);
      expect(subnet2AZ).toBe(1);
      expect(subnet3AZ).toBe(2);
    });
  });

  // ==================== NAT Gateway ====================
  describe('NAT Gateway', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway EIP should depend on VPC Gateway Attachment', () => {
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateway should be in public subnet', () => {
      expect(template.Resources.NATGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  // ==================== Route Tables ====================
  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route should go through Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private route should go through NAT Gateway', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(template.Resources.PrivateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  // ==================== KMS ====================
  describe('KMS Resources', () => {
    test('should have KMS Key', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should enable rotation', () => {
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS Key should have proper key policy', () => {
      const policy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);
    });

    test('KMS Key policy should allow RDS service', () => {
      const policy = template.Resources.KMSKey.Properties.KeyPolicy;
      const rdsStatement = policy.Statement.find((s: any) => s.Principal?.Service === 'rds.amazonaws.com');
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Action).toContain('kms:Decrypt');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  // ==================== Aurora Resources ====================
  describe('Aurora Database', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should use all 3 private subnets', () => {
      const subnetIds = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet3' });
    });

    test('should have Aurora Security Group', () => {
      expect(template.Resources.AuroraSecurityGroup).toBeDefined();
      expect(template.Resources.AuroraSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Aurora Security Group Ingress rule (separate resource)', () => {
      expect(template.Resources.AuroraSecurityGroupIngress).toBeDefined();
      expect(template.Resources.AuroraSecurityGroupIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(template.Resources.AuroraSecurityGroupIngress.Properties.FromPort).toBe(5432);
      expect(template.Resources.AuroraSecurityGroupIngress.Properties.ToPort).toBe(5432);
    });

    test('should have Aurora Cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora Cluster should use PostgreSQL engine', () => {
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(template.Resources.AuroraCluster.Properties.EngineMode).toBe('provisioned');
      expect(template.Resources.AuroraCluster.Properties.EngineVersion).toBe('15.8');
    });

    test('Aurora Cluster should be encrypted', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.AuroraCluster.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('Aurora Cluster should have Serverless v2 scaling', () => {
      const scaling = template.Resources.AuroraCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(2);
    });

    test('Aurora Cluster should have backup configuration', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(30);
      expect(template.Resources.AuroraCluster.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('Aurora Cluster should export logs to CloudWatch', () => {
      const logs = template.Resources.AuroraCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('postgresql');
    });

    test('should have Aurora Instance', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Aurora Instance should use serverless class', () => {
      expect(template.Resources.AuroraInstance1.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('Aurora Instance should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('Aurora Instance should have Performance Insights enabled', () => {
      expect(template.Resources.AuroraInstance1.Properties.EnablePerformanceInsights).toBe(true);
      expect(template.Resources.AuroraInstance1.Properties.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('should have Aurora Log Group', () => {
      expect(template.Resources.AuroraLogGroup).toBeDefined();
      expect(template.Resources.AuroraLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.AuroraLogGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  // ==================== Lambda Resources ====================
  describe('Lambda Function', () => {
    test('should have Lambda Security Group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda Security Group should allow egress to Aurora', () => {
      const egress = template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress;
      const auroraEgress = egress.find((e: any) => e.FromPort === 5432);
      expect(auroraEgress).toBeDefined();
      expect(auroraEgress.DestinationSecurityGroupId).toEqual({ Ref: 'AuroraSecurityGroup' });
    });

    test('Lambda Security Group should allow egress to HTTPS', () => {
      const egress = template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress;
      const httpsEgress = egress.find((e: any) => e.FromPort === 443);
      expect(httpsEgress).toBeDefined();
      expect(httpsEgress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Lambda Execution Role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda Execution Role should have VPC access policy', () => {
      const managedPolicies = template.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda Execution Role should have inline policies', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      expect(policies).toHaveLength(2);
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('AuroraAccess');
      expect(policyNames).toContain('CloudWatchLogs');
    });

    test('should have Lambda Function', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda Function should use Node.js 22 runtime', () => {
      expect(template.Resources.LambdaFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda Function should NOT have reserved concurrency', () => {
      expect(template.Resources.LambdaFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('Lambda Function should be in VPC', () => {
      const vpcConfig = template.Resources.LambdaFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'LambdaSecurityGroup' });
      expect(vpcConfig.SubnetIds).toHaveLength(3);
    });

    test('Lambda Function should have environment variables', () => {
      const env = template.Resources.LambdaFunction.Properties.Environment.Variables;
      expect(env.DB_CLUSTER_ARN).toBeDefined();
      expect(env.DB_NAME).toBe('creditscoring');
    });

    test('Lambda Function should have proper timeout and memory', () => {
      expect(template.Resources.LambdaFunction.Properties.Timeout).toBe(30);
      expect(template.Resources.LambdaFunction.Properties.MemorySize).toBe(512);
    });

    test('should have Lambda Log Group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have Lambda Function URL', () => {
      expect(template.Resources.LambdaFunctionUrl).toBeDefined();
      expect(template.Resources.LambdaFunctionUrl.Type).toBe('AWS::Lambda::Url');
      expect(template.Resources.LambdaFunctionUrl.Properties.AuthType).toBe('AWS_IAM');
    });

    test('should have Lambda Invoke Permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  // ==================== ALB Resources ====================
  describe('Application Load Balancer', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB Security Group should allow HTTPS ingress', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ALB Logs S3 Bucket', () => {
      expect(template.Resources.ALBLogsBucket).toBeDefined();
      expect(template.Resources.ALBLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ALB Logs Bucket should be encrypted', () => {
      const encryption = template.Resources.ALBLogsBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ALB Logs Bucket should block public access', () => {
      const publicAccess = template.Resources.ALBLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('ALB Logs Bucket should have lifecycle policy', () => {
      const lifecycle = template.Resources.ALBLogsBucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(365);
    });

    test('should have ALB Logs Bucket Policy', () => {
      expect(template.Resources.ALBLogsBucketPolicy).toBeDefined();
      expect(template.Resources.ALBLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Type).toBe('application');
    });

    test('ALB should be in all 3 public subnets', () => {
      const subnets = template.Resources.ApplicationLoadBalancer.Properties.Subnets;
      expect(subnets).toHaveLength(3);
    });

    test('ALB should have access logs enabled', () => {
      const attrs = template.Resources.ApplicationLoadBalancer.Properties.LoadBalancerAttributes;
      const logsEnabled = attrs.find((a: any) => a.Key === 'access_logs.s3.enabled');
      expect(logsEnabled.Value).toBe('true');
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB Target Group should target Lambda', () => {
      expect(template.Resources.ALBTargetGroup.Properties.TargetType).toBe('lambda');
      const targets = template.Resources.ALBTargetGroup.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Id).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB Listener should use HTTPS', () => {
      expect(template.Resources.ALBListener.Properties.Port).toBe(443);
      expect(template.Resources.ALBListener.Properties.Protocol).toBe('HTTPS');
      expect(template.Resources.ALBListener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });

    test('ALB Listener should have certificate', () => {
      const certs = template.Resources.ALBListener.Properties.Certificates;
      expect(certs).toHaveLength(1);
      expect(certs[0].CertificateArn).toEqual({ Ref: 'CertificateArn' });
    });

    test('should have ALB Listener Rule', () => {
      expect(template.Resources.ALBListenerRule).toBeDefined();
      expect(template.Resources.ALBListenerRule.Type).toBe('AWS::ElasticLoadBalancingV2::ListenerRule');
    });

    test('ALB Listener Rule should route /score path', () => {
      const conditions = template.Resources.ALBListenerRule.Properties.Conditions;
      expect(conditions).toHaveLength(1);
      expect(conditions[0].Field).toBe('path-pattern');
      expect(conditions[0].Values).toContain('/score');
    });
  });

  // ==================== Resource Naming ====================
  describe('Resource Naming Convention', () => {
    test('all resources with names should include environmentSuffix', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'NATGatewayEIP',
        'NATGateway', 'PublicRouteTable', 'PrivateRouteTable', 'KMSKey',
        'DBSubnetGroup', 'AuroraSecurityGroup', 'AuroraCluster', 'AuroraInstance1',
        'LambdaSecurityGroup', 'LambdaExecutionRole', 'LambdaFunction',
        'ALBSecurityGroup', 'ALBLogsBucket', 'ApplicationLoadBalancer',
        'ALBTargetGroup'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          // Check various naming properties
          const nameProps = [
            'Name', 'FunctionName', 'RoleName', 'GroupName', 'BucketName',
            'DBSubnetGroupName', 'DBClusterIdentifier', 'DBInstanceIdentifier'
          ];

          nameProps.forEach(prop => {
            if (resource.Properties[prop]) {
              const nameValue = resource.Properties[prop];
              if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
                expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
              }
            }
          });
        }
      });
    });
  });

  // ==================== Tags ====================
  describe('Resource Tags', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'CostCenter', 'DataClassification'];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];

        // Resources that support tags
        const taggableTypes = [
          'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
          'AWS::EC2::NatGateway', 'AWS::EC2::RouteTable', 'AWS::EC2::SecurityGroup',
          'AWS::EC2::EIP', 'AWS::KMS::Key', 'AWS::RDS::DBSubnetGroup',
          'AWS::RDS::DBCluster', 'AWS::RDS::DBInstance', 'AWS::Logs::LogGroup',
          'AWS::Lambda::Function', 'AWS::IAM::Role', 'AWS::S3::Bucket',
          'AWS::ElasticLoadBalancingV2::LoadBalancer', 'AWS::ElasticLoadBalancingV2::TargetGroup',
          'AWS::SecretsManager::Secret'
        ];

        if (taggableTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          const tagKeys = resource.Properties.Tags.map((t: any) => t.Key);
          requiredTags.forEach(requiredTag => {
            expect(tagKeys).toContain(requiredTag);
          });
        }
      });
    });
  });

  // ==================== Outputs ====================
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'LambdaFunctionArn',
        'LambdaFunctionUrl',
        'AuroraClusterEndpoint',
        'AuroraClusterArn',
        'KMSKeyId',
        'ALBLogsBucket'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName output should get ALB DNS name', () => {
      expect(template.Outputs.ALBDNSName.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('LambdaFunctionArn output should get Lambda ARN', () => {
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn']
      });
    });

    test('AuroraClusterEndpoint output should get cluster endpoint', () => {
      expect(template.Outputs.AuroraClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
      });
    });
  });

  // ==================== Security ====================
  describe('Security Best Practices', () => {
    test('database should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should be encrypted at rest', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should block public access', () => {
      const publicAccess = template.Resources.ALBLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });

    test('ALB should only allow HTTPS traffic', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.FromPort).toBe(443);
      });
    });

    test('Lambda should have minimal IAM permissions', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      expect(policies.length).toBeLessThanOrEqual(2);
    });
  });

  // ==================== High Availability ====================
  describe('High Availability', () => {
    test('resources should be distributed across 3 AZs', () => {
      // Public subnets
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);

      // Private subnets
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('Aurora should have automated backups configured', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('ALB should be in multiple subnets', () => {
      const subnets = template.Resources.ApplicationLoadBalancer.Properties.Subnets;
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });
});
