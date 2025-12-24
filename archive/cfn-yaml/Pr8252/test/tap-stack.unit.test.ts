import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure Multi-Tier Web Application Infrastructure with Security Configuration as Code'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should route private subnets (NAT Gateway removed for LocalStack)', () => {
      // NAT Gateway removed for LocalStack Community compatibility
      // Private subnets route through Internet Gateway for testing
      expect(template.Resources.NATGateway1).toBeUndefined();
      expect(template.Resources.NATGateway1EIP).toBeUndefined();
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute1.Properties.GatewayId).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have Load Balancer Security Group', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Load Balancer SG should only allow HTTPS (443) from internet', () => {
      const albSG = template.Resources.LoadBalancerSecurityGroup.Properties;
      expect(albSG.SecurityGroupIngress).toBeDefined();
      expect(albSG.SecurityGroupIngress).toHaveLength(1);
      expect(albSG.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(albSG.SecurityGroupIngress[0].ToPort).toBe(443);
      expect(albSG.SecurityGroupIngress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Web Server Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const webSG = template.Resources.WebServerSecurityGroup.Properties;
      expect(webSG.GroupDescription).toContain('web servers');
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      expect(dbSG.GroupDescription).toContain('database');
    });

    test('should have Lambda Security Group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const lambdaSG = template.Resources.LambdaSecurityGroup.Properties;
      expect(lambdaSG.GroupDescription).toContain('Lambda');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have Lambda Execution Role with least privilege', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
      
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Policies).toBeDefined();
      expect(role.Policies[0].PolicyName).toBe('LambdaMinimalAccess');
    });

    test('Lambda role should only assume from Lambda service', () => {
      const assumePolicy = template.Resources.LambdaExecutionRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have EC2 Instance Role with least privilege', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.Policies[0].PolicyName).toBe('EC2MinimalAccess');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Buckets', () => {
    test('should have Centralized Logging Bucket', () => {
      expect(template.Resources.CentralizedLoggingBucket).toBeDefined();
      expect(template.Resources.CentralizedLoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Logging Bucket should have SSE-S3 encryption', () => {
      const bucket = template.Resources.CentralizedLoggingBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have Application Assets Bucket', () => {
      expect(template.Resources.ApplicationAssetsBucket).toBeDefined();
      expect(template.Resources.ApplicationAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Assets Bucket should have SSE-S3 encryption', () => {
      const bucket = template.Resources.ApplicationAssetsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('All S3 buckets should block public access', () => {
      const loggingBucket = template.Resources.CentralizedLoggingBucket.Properties;
      const assetsBucket = template.Resources.ApplicationAssetsBucket.Properties;
      
      [loggingBucket, assetsBucket].forEach(bucket => {
        expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const loggingBucket = template.Resources.CentralizedLoggingBucket.Properties;
      const assetsBucket = template.Resources.ApplicationAssetsBucket.Properties;
      
      [loggingBucket, assetsBucket].forEach(bucket => {
        expect(bucket.VersioningConfiguration).toBeDefined();
        expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      });
    });
  });

  describe('RDS Database', () => {
    test('should have Database Instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Database Multi-AZ configuration (disabled for LocalStack)', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      // Multi-AZ disabled for LocalStack Community compatibility
      // LocalStack Community has limited Multi-AZ support causing deployment timeouts
      expect(db.MultiAZ).toBe(false);
    });

    test('Database encryption (disabled for LocalStack)', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      // Encryption disabled for LocalStack simplicity
      expect(db.StorageEncrypted).toBe(false);
    });

    test('Database should have backup configuration', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Database should use MySQL 8.0', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.Engine).toBe('mysql');
      expect(db.EngineVersion).toMatch(/^8\.0/);
    });

    test('should have Database Subnet Group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Lambda Function', () => {
    test('should have Background Processor Lambda', () => {
      expect(template.Resources.BackgroundProcessorLambda).toBeDefined();
      expect(template.Resources.BackgroundProcessorLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should be configured with VPC', () => {
      const lambda = template.Resources.BackgroundProcessorLambda.Properties;
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda should have environment variables', () => {
      const lambda = template.Resources.BackgroundProcessorLambda.Properties;
      expect(lambda.Environment).toBeDefined();
      expect(lambda.Environment.Variables).toBeDefined();
      expect(lambda.Environment.Variables.LOG_LEVEL).toBe('INFO');
    });

    test('Lambda should have appropriate timeout', () => {
      const lambda = template.Resources.BackgroundProcessorLambda.Properties;
      expect(lambda.Timeout).toBe(30);
    });

    test('Lambda should have reserved concurrent executions', () => {
      const lambda = template.Resources.BackgroundProcessorLambda.Properties;
      expect(lambda.ReservedConcurrentExecutions).toBe(10);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have Application Log Group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have Lambda Log Group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log Groups should have retention policy', () => {
      const appLogGroup = template.Resources.ApplicationLogGroup.Properties;
      const lambdaLogGroup = template.Resources.LambdaLogGroup.Properties;
      
      expect(appLogGroup.RetentionInDays).toBe(30);
      expect(lambdaLogGroup.RetentionInDays).toBe(30);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toBeDefined();
      expect(alb.Subnets).toHaveLength(2);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.CentralizedLoggingBucketName).toBeDefined();
      expect(template.Outputs.ApplicationAssetsBucketName).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.LoadBalancerDNSName).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('outputs should have export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Description).toBeDefined();
      });
    });
  });

  describe('Security Requirements Verification', () => {
    test('Requirement 1: IAM roles should follow least privilege', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      const ec2Role = template.Resources.EC2InstanceRole.Properties;
      
      // Check Lambda role has specific actions only
      const lambdaPolicy = lambdaRole.Policies[0].PolicyDocument.Statement;
      lambdaPolicy.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBeDefined();
        expect(statement.Resource).toBeDefined();
        // Ensure no wildcard actions
        if (Array.isArray(statement.Action)) {
          statement.Action.forEach((action: string) => {
            expect(action).not.toContain('*');
          });
        }
      });
      
      // Check EC2 role has specific actions only
      const ec2Policy = ec2Role.Policies[0].PolicyDocument.Statement;
      ec2Policy.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBeDefined();
        expect(statement.Resource).toBeDefined();
      });
    });

    test('Requirement 2: All S3 buckets must be encrypted with SSE-S3', () => {
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');
      
      expect(s3Resources.length).toBeGreaterThan(0);
      
      s3Resources.forEach(([name, resource]: [string, any]) => {
        expect(resource.Properties.BucketEncryption).toBeDefined();
        const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('Requirement 3: VPC deployment is configured', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      
      // Check subnets are in the VPC
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Properties.VpcId).toBeDefined();
      });
    });

    test('Requirement 4: Lambda has CloudWatch logging configured', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      const policies = lambdaRole.Policies[0].PolicyDocument.Statement;
      const loggingPolicy = policies.find((p: any) => 
        p.Action && (p.Action.includes('logs:PutLogEvents') || 
        (Array.isArray(p.Action) && p.Action.includes('logs:PutLogEvents')))
      );
      expect(loggingPolicy).toBeDefined();
    });

    test('Requirement 5: RDS configuration (simplified for LocalStack)', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      // Multi-AZ and encryption disabled for LocalStack Community compatibility
      // In production AWS, both should be true for high availability and security
      expect(db.MultiAZ).toBe(false);
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Requirement 6: Centralized logging bucket exists', () => {
      expect(template.Resources.CentralizedLoggingBucket).toBeDefined();
      const bucket = template.Resources.CentralizedLoggingBucket.Properties;
      expect(bucket.BucketName).toBeDefined();
    });

    test('Requirement 7: Security Groups restrict traffic (only 443 from internet)', () => {
      const albSG = template.Resources.LoadBalancerSecurityGroup.Properties;
      const ingressRules = albSG.SecurityGroupIngress;
      
      // Check that only HTTPS (443) is allowed from internet
      const internetRules = ingressRules.filter((rule: any) => rule.CidrIp === '0.0.0.0/0');
      expect(internetRules).toHaveLength(1);
      expect(internetRules[0].FromPort).toBe(443);
      expect(internetRules[0].ToPort).toBe(443);
      
      // Check other security groups don't allow internet access
      const webSG = template.Resources.WebServerSecurityGroup.Properties;
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      
      // Web SG should not have 0.0.0.0/0 in ingress
      if (webSG.SecurityGroupIngress) {
        webSG.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        });
      }
      
      // DB SG should not have 0.0.0.0/0 in ingress
      if (dbSG.SecurityGroupIngress) {
        dbSG.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        });
      }
    });
  });
});