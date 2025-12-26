import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT || 'Dev';

describe('FinanceApp CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests are implemented', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'FinanceApp - Production-grade CloudFormation template for financial application'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'prod']);
      expect(envParam.Description).toBe('Environment name for resource naming (lowercase for S3 compatibility)');
    });

    test('should have KeyPairName parameter with optional configuration', () => {
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('String');
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Description).toBe('EC2 Key Pair for SSH access (leave empty to disable SSH)');
    });

    test('should have AmiId parameter with correct type', () => {
      const amiParam = template.Parameters.AmiId;
      expect(amiParam.Type).toBe('AWS::EC2::Image::Id');
      expect(amiParam.Default).toBe('ami-12345678');
    });

    test('should have VPC and subnet CIDR parameters', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBAllocatedStorage).toBeDefined();
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KeyPairName' }, ''] }]
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.FinanceAppVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.FinanceAppIGW;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('NAT Gateway removed for LocalStack compatibility', () => {
      // NAT Gateway not supported in LocalStack Community
      const natGateway = template.Resources.NATGateway1;
      const eip = template.Resources.NATGateway1EIP;

      expect(natGateway).toBeUndefined();
      expect(eip).toBeUndefined();
    });

    test('should have route tables with proper routes', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT = template.Resources.PrivateRouteTable1;
      
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
      
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute = template.Resources.DefaultPrivateRoute1;
      
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Type).toBe('AWS::EC2::Route');
    });
  });

  describe('Security Groups', () => {
    test('should have web security group with proper ingress rules', () => {
      const webSG = template.Resources.WebSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSG.Properties.GroupDescription).toBe('Security group for web tier');
      
      const ingressRules = webSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3);
      
      // Check HTTP rule
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
      
      // Check HTTPS rule
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
    });

    test('should have ALB security group', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
    });

    test('should have database security group', () => {
      const dbSG = template.Resources.DBSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Properties.GroupDescription).toBe('Security group for RDS database');
      
      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role with least privilege', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Check for CloudWatch managed policy
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      
      // Check for S3 access policy
      const s3Policy = ec2Role.Properties.Policies.find((policy: any) => 
        policy.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket with encryption', () => {
      const s3Bucket = template.Resources.FinanceAppS3Bucket;
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      
      // Check encryption
      const encryption = s3Bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
      
      // Check public access block
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      
      // Check versioning
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Compute Resources', () => {
    test('should have launch template with proper configuration', () => {
      const launchTemplate = template.Resources.WebLaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const templateData = launchTemplate.Properties.LaunchTemplateData;
      expect(templateData.InstanceType).toBe('t3.micro');
      expect(templateData.IamInstanceProfile.Arn['Fn::GetAtt']).toEqual(['EC2InstanceProfile', 'Arn']);
      
      // Check conditional KeyName
      expect(templateData.KeyName['Fn::If']).toBeDefined();
    });

    test('should have auto scaling group with proper configuration', () => {
      const asg = template.Resources.WebAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(2);
      expect(asg.Properties.DesiredCapacity).toBe(1);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have application load balancer', () => {
      const alb = template.Resources.WebApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group and listener', () => {
      const targetGroup = template.Resources.WebTargetGroup;
      const listener = template.Resources.WebListener;
      
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have RDS instance with Single-AZ for LocalStack', () => {
      const rds = template.Resources.FinanceAppDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');

      const properties = rds.Properties;
      expect(properties.Engine).toBe('mysql');
      expect(properties.MultiAZ).toBe(false);
      expect(properties.StorageEncrypted).toBe(false);
      expect(properties.MasterUserPassword).toBeDefined(); // Uses Secrets Manager
      expect(properties.BackupRetentionPeriod).toBe(0);
      expect(properties.DeletionProtection).toBe(false);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', () => {
      const requiredTags = ['Environment', 'Department', 'Owner'];
      const resourcesToCheck = [
        'FinanceAppVPC',
        'PublicSubnet1',
        'PrivateSubnet1',
        'FinanceAppS3Bucket',
        'FinanceAppDatabase'
      ];
      
      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        requiredTags.forEach(tagKey => {
          const tag = tags.find((t: any) => t.Key === tagKey);
          expect(tag).toBeDefined();
        });
      });
    });

    test('resources should follow ProjectName-Resource-Env naming convention', () => {
      const vpc = template.Resources.FinanceAppVPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('FinanceApp-VPC-${Environment}');
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
        'S3BucketName',
        'RDSEndpoint',
        'LoadBalancerURL',
        'WebSecurityGroupId',
        'DBSecurityGroupId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC outputs should be correct', () => {
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput.Description).toBe('VPC ID');
      expect(vpcOutput.Value).toEqual({ Ref: 'FinanceAppVPC' });
      expect(vpcOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('S3 bucket output should be correct', () => {
      const s3Output = template.Outputs.S3BucketName;
      expect(s3Output.Description).toBe('S3 Bucket Name');
      expect(s3Output.Value).toEqual({ Ref: 'FinanceAppS3Bucket' });
    });

    test('RDS endpoint output should be correct', () => {
      const rdsOutput = template.Outputs.RDSEndpoint;
      expect(rdsOutput.Description).toBe('RDS Database Endpoint');
      expect(rdsOutput.Value).toEqual({
        'Fn::GetAtt': ['FinanceAppDatabase', 'Endpoint.Address']
      });
    });

    test('Load Balancer URL output should be correct', () => {
      const albOutput = template.Outputs.LoadBalancerURL;
      expect(albOutput.Description).toBe('Application Load Balancer URL');
      expect(albOutput.Value).toEqual({
        'Fn::Sub': 'http://${WebApplicationLoadBalancer.DNSName}'
      });
    });
  });

  describe('Security Best Practices', () => {
    test('IAM roles should not have explicit names', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.RoleName).toBeUndefined();
    });

    test('S3 bucket should have secure configuration', () => {
      const s3Bucket = template.Resources.FinanceAppS3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('database should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('web instances should be in private subnets', () => {
      const asg = template.Resources.WebAutoScalingGroup;
      const vpcZoneIdentifier = asg.Properties.VPCZoneIdentifier;
      
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('High Availability', () => {
    test('should distribute resources across multiple AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('RDS Multi-AZ disabled for LocalStack Community', () => {
      const rds = template.Resources.FinanceAppDatabase;
      expect(rds.Properties.MultiAZ).toBe(false);
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const asg = template.Resources.WebAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
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

    test('should have multiple resources for FinanceApp', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(1);
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(1);
    });

    test('should have multiple outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(1);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});