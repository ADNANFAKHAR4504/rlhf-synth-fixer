import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('PaymentProcessing CloudFormation Template - Unit Tests', () => {
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
      expect(template.Description).toContain('payment processing');
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
    test('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.Default).toBe('dev');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('dev');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('prod');
    });

    test('should have DBUsername parameter with constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(4);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionAMIs mapping', () => {
      expect(template.Mappings.RegionAMIs).toBeDefined();
      expect(template.Mappings.RegionAMIs['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionAMIs['eu-west-1']).toBeDefined();
      expect(template.Mappings.RegionAMIs['us-east-1'].AMI).toMatch(/^ami-/);
    });

    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('EnvironmentConfig dev should have correct instance type', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.MinSize).toBe(1);
      expect(devConfig.MaxSize).toBe(2);
      expect(devConfig.S3LifecycleDays).toBe(30);
    });

    test('EnvironmentConfig prod should have correct instance type', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.InstanceType).toBe('m5.large');
      expect(prodConfig.MinSize).toBe(2);
      expect(prodConfig.MaxSize).toBe(10);
      expect(prodConfig.S3LifecycleDays).toBe(90);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have IsDevelopment condition', () => {
      expect(template.Conditions.IsDevelopment).toBeDefined();
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route table and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const ports = ingress.map((rule: any) => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have Instance security group', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
    });
  });

  describe('IAM Resources', () => {
    test('should have Instance Role', () => {
      const role = template.Resources.InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('Instance Role should have S3 access policy', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.Policies).toBeDefined();
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3TransactionLogsAccess'
      );
      expect(s3Policy).toBeDefined();
    });

    test('should have Instance Profile', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('EC2 Launch Template and Auto Scaling', () => {
    test('should have Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use mappings for AMI and instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId['Fn::FindInMap']).toBeDefined();
      expect(data.InstanceType['Fn::FindInMap']).toBeDefined();
    });

    test('Launch Template should have UserData', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should use mappings for sizing', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize['Fn::FindInMap']).toBeDefined();
      expect(asg.Properties.MaxSize['Fn::FindInMap']).toBeDefined();
    });

    test('ASG should have ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have Target Group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('Target Group should have correct health check settings', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
    });

    test('should have Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
    });
  });

  describe('RDS Aurora Resources', () => {
    test('should have DB Subnet Group', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have Aurora Cluster', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('Aurora Cluster should use RDS-managed password', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.MasterUsername.Ref).toBe('DBUsername');
      expect(cluster.Properties.ManageMasterUserPassword).toBe(true);
    });

    test('Aurora Cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('Aurora Cluster should have conditional backup retention', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod['Fn::If']).toBeDefined();
    });

    test('should have primary Aurora Instance', () => {
      const instance = template.Resources.AuroraInstance1;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should have conditional second Aurora Instance', () => {
      const instance = template.Resources.AuroraInstance2;
      expect(instance).toBeDefined();
      expect(instance.Condition).toBe('IsProduction');
    });

    test('Aurora Instance should have conditional instance class', () => {
      const instance = template.Resources.AuroraInstance1;
      expect(instance.Properties.DBInstanceClass['Fn::If']).toBeDefined();
    });
  });

  describe('Secrets Manager and Key Pair Resources', () => {
    test('should have DBPasswordSecret resource', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('DBPasswordSecret should generate password automatically', () => {
      const secret = template.Resources.DBPasswordSecret;
      const generateSecret = secret.Properties.GenerateSecretString;
      expect(generateSecret.GenerateStringKey).toBe('password');
      expect(generateSecret.PasswordLength).toBe(16);
    });

    test('should have EC2KeyPair resource', () => {
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair).toBeDefined();
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
      expect(keyPair.Properties.KeyType).toBe('rsa');
    });
  });

  describe('S3 Resources', () => {
    test('should have Transaction Logs Bucket', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy using mappings', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.ExpirationInDays['Fn::FindInMap']).toBeDefined();
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      const config = bucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
    });

    test('should have S3 Bucket Policy', () => {
      const policy = template.Resources.TransactionLogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3 Bucket Policy should deny insecure transport', () => {
      const policy = template.Resources.TransactionLogsBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC should use EnvironmentType in name', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentType}');
    });

    test('security groups should use EnvironmentSuffix in names', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('IAM role should use EnvironmentSuffix in name', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Launch Template should use EnvironmentSuffix in name', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALB should use EnvironmentSuffix in name', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('RDS cluster should use EnvironmentSuffix in identifier', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 bucket should use EnvironmentSuffix in name', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Resource Tags', () => {
    test('VPC should have consistent tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Application')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
    });

    test('S3 bucket should have consistent tags', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      const tags = bucket.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Application').Value).toBe('PaymentProcessing');
    });
  });

  describe('Outputs', () => {
    test('should have ALBDNSName output', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('should have RDSEndpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt'][0]).toBe('AuroraCluster');
    });

    test('should have RDSPort output', () => {
      const output = template.Outputs.RDSPort;
      expect(output).toBeDefined();
    });

    test('should have S3BucketArn output', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['TransactionLogsBucket', 'Arn']);
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('TransactionLogsBucket');
    });

    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('VPC');
    });

    test('should have EnvironmentType output', () => {
      const output = template.Outputs.EnvironmentType;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('EnvironmentType');
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(key => {
        const output = template.Outputs[key];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should not have DeletionProtection enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DeletionProtection).toBeUndefined();
    });

    test('should have valid resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
      expect(resourceCount).toBeLessThan(35);
    });

    test('should use intrinsic functions for all resource references', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
      expect(cluster.Properties.VpcSecurityGroupIds[0].Ref).toBe('DatabaseSecurityGroup');
    });

    test('Launch Template should reference Instance Profile correctly', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn['Fn::GetAtt']).toEqual([
        'InstanceProfile',
        'Arn',
      ]);
    });
  });

  describe('Dependencies', () => {
    test('PublicRoute should depend on AttachGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('IAM resources should have proper references', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile.Properties.Roles[0].Ref).toBe('InstanceRole');
    });
  });
});
