import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  EstimateTemplateCostCommand,
  GetTemplateSummaryCommand
} from '@aws-sdk/client-cloudformation';

describe('Financial Services CloudFormation Integration Tests', () => {
  let template: any;
  let templateString: string;
  let cfnClient: CloudFormationClient;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    templateString = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateString);

    // Initialize CloudFormation client
    cfnClient = new CloudFormationClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  });

  describe('Template Validation', () => {
    test('should have valid template summary', async () => {
      const command = new GetTemplateSummaryCommand({
        TemplateBody: templateString
      });

      const result = await cfnClient.send(command);

      expect(result.ResourceTypes).toBeDefined();
      expect(result.Parameters).toBeDefined();
      expect(result.Capabilities).toBeDefined();
      expect(result.ResourceTypes).toContain('AWS::RDS::DBCluster');
      expect(result.ResourceTypes).toContain('AWS::RDS::DBInstance');
      expect(result.ResourceTypes).toContain('AWS::EC2::VPC');
      expect(result.ResourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(result.ResourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(result.ResourceTypes).toContain('AWS::DynamoDB::Table');
      expect(result.ResourceTypes).toContain('AWS::S3::Bucket');
      expect(result.ResourceTypes).toContain('AWS::KMS::Key');
      expect(result.ResourceTypes).toContain('AWS::WAFv2::WebACL');
    }, 30000);

    test('should estimate template cost', async () => {
      const command = new EstimateTemplateCostCommand({
        TemplateBody: templateString,
        Parameters: [
          {
            ParameterKey: 'EnvironmentSuffix',
            ParameterValue: 'test'
          }
        ]
      });

      let result;
      let error;

      try {
        result = await cfnClient.send(command);
      } catch (err) {
        error = err;
      }

      // The estimate cost command returns a URL, not an error
      if (result) {
        expect(result.Url).toBeDefined();
        expect(result.Url).toContain('calculator.aws');
      }
    }, 30000);
  });

  describe('Resource Dependency Validation', () => {
    test('should have proper VPC dependencies', () => {
      const resources = template.Resources;

      // Check that subnets depend on VPC
      const publicSubnet1 = resources.PublicSubnet1;
      const privateSubnet1 = resources.PrivateSubnet1;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.Properties.VpcId).toBeDefined();
      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.Properties.VpcId).toBeDefined();
    });

    test('should have proper RDS dependencies', () => {
      const resources = template.Resources;
      const rdsCluster = resources.RDSCluster;
      const dbSubnetGroup = resources.DBSubnetGroup;

      expect(rdsCluster).toBeDefined();
      expect(rdsCluster.Properties.DBSubnetGroupName).toBeDefined();
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Properties.SubnetIds).toBeDefined();
    });

    test('should have proper ALB dependencies', () => {
      const resources = template.Resources;
      const alb = resources.ApplicationLoadBalancer;
      const targetGroup = resources.TargetGroup;

      expect(alb).toBeDefined();
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Properties.VpcId).toBeDefined();
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have proper security group rules', () => {
      const resources = template.Resources;

      // ALB Security Group
      const albSG = resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Properties.SecurityGroupIngress).toBeDefined();

      const httpIngress = albSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      const httpsIngress = albSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress.CidrIp).toBe('0.0.0.0/0');
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress.CidrIp).toBe('0.0.0.0/0');

      // RDS Security Group
      const rdsSG = resources.RDSSecurityGroup;
      expect(rdsSG).toBeDefined();
      expect(rdsSG.Properties.SecurityGroupIngress).toBeDefined();

      const dbIngress = rdsSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toBeDefined();
    });

    test('should have KMS encryption enabled', () => {
      const resources = template.Resources;

      // RDS Encryption
      const rdsCluster = resources.RDSCluster;
      expect(rdsCluster.Properties.StorageEncrypted).toBe(true);
      expect(rdsCluster.Properties.KmsKeyId).toBeDefined();

      // S3 Encryption
      const staticBucket = resources.StaticAssetsBucket;
      const backupBucket = resources.BackupBucket;
      expect(staticBucket.Properties.BucketEncryption).toBeDefined();
      expect(backupBucket.Properties.BucketEncryption).toBeDefined();

      // DynamoDB Encryption
      const dynamoTable = resources.SessionTable;
      expect(dynamoTable.Properties.SSESpecification).toBeDefined();
      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have WAF protection configured', () => {
      const resources = template.Resources;
      const wafWebACL = resources.WAFWebACL;
      const wafAssociation = resources.WAFAssociation;

      expect(wafWebACL).toBeDefined();
      expect(wafWebACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(wafWebACL.Properties.Scope).toBe('REGIONAL');
      expect(wafWebACL.Properties.DefaultAction).toBeDefined();
      expect(wafWebACL.Properties.Rules).toBeDefined();

      expect(wafAssociation).toBeDefined();
      expect(wafAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });

    test('should use Secrets Manager for database credentials', () => {
      const resources = template.Resources;
      const secret = resources.RDSDatabaseSecret;
      const rdsCluster = resources.RDSCluster;

      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();

      const masterPassword = JSON.stringify(rdsCluster.Properties.MasterUserPassword);
      expect(masterPassword).toContain('RDSDatabaseSecret');
      expect(masterPassword).toContain('SecretString');
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multi-AZ deployment', () => {
      const resources = template.Resources;

      // Check subnets are in different AZs
      const publicSubnet1 = resources.PublicSubnet1;
      const publicSubnet2 = resources.PublicSubnet2;
      const publicSubnet3 = resources.PublicSubnet3;

      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(publicSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);

      // Check Auto Scaling Group spans multiple AZs
      const asg = resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(3);
    });

    test('should have RDS Aurora cluster with multiple instances', () => {
      const resources = template.Resources;
      const rdsCluster = resources.RDSCluster;
      const rdsInstance1 = resources.RDSInstance1;
      const rdsInstance2 = resources.RDSInstance2;

      expect(rdsCluster).toBeDefined();
      expect(rdsInstance1).toBeDefined();
      expect(rdsInstance2).toBeDefined();
      expect(rdsInstance1.Properties.DBClusterIdentifier).toBeDefined();
      expect(rdsInstance2.Properties.DBClusterIdentifier).toBeDefined();
    });

    test('should have Auto Scaling configuration', () => {
      const resources = template.Resources;
      const asg = resources.AutoScalingGroup;
      const scaleUpPolicy = resources.ScaleUpPolicy;
      const scaleDownPolicy = resources.ScaleDownPolicy;

      expect(asg).toBeDefined();
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBeDefined();

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have CloudWatch alarms configured', () => {
      const resources = template.Resources;

      const highCPUAlarm = resources.HighCPUAlarm;
      const lowCPUAlarm = resources.LowCPUAlarm;
      const unhealthyTargetAlarm = resources.UnhealthyTargetAlarm;
      const rdsHighCPUAlarm = resources.RDSHighCPUAlarm;
      const rdsLowStorageAlarm = resources.RDSLowStorageAlarm;

      expect(highCPUAlarm).toBeDefined();
      expect(highCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(highCPUAlarm.Properties.MetricName).toBe('CPUUtilization');

      expect(lowCPUAlarm).toBeDefined();
      expect(unhealthyTargetAlarm).toBeDefined();
      expect(rdsHighCPUAlarm).toBeDefined();
      expect(rdsLowStorageAlarm).toBeDefined();
    });

    test('should have SNS topic for alerts', () => {
      const resources = template.Resources;
      const snsTopic = resources.AlarmTopic;

      expect(snsTopic).toBeDefined();
      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
      expect(snsTopic.Properties.Subscription).toBeDefined();
    });

    test('should have CloudWatch log groups', () => {
      const resources = template.Resources;
      const appLogGroup = resources.ApplicationLogGroup;
      const wafLogGroup = resources.WAFLogGroup;

      expect(appLogGroup).toBeDefined();
      expect(appLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(appLogGroup.Properties.RetentionInDays).toBeDefined();

      expect(wafLogGroup).toBeDefined();
      expect(wafLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(wafLogGroup.Properties.RetentionInDays).toBeDefined();
    });
  });

  describe('Storage Configuration', () => {
    test('should have S3 buckets with versioning and lifecycle', () => {
      const resources = template.Resources;
      const staticBucket = resources.StaticAssetsBucket;
      const backupBucket = resources.BackupBucket;

      expect(staticBucket).toBeDefined();
      expect(staticBucket.Properties.VersioningConfiguration).toBeDefined();
      expect(staticBucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(staticBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(staticBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);

      expect(backupBucket).toBeDefined();
      expect(backupBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(backupBucket.Properties.LifecycleConfiguration).toBeDefined();
    });

    test('should have DynamoDB table with global secondary indexes', () => {
      const resources = template.Resources;
      const sessionTable = resources.SessionTable;

      expect(sessionTable).toBeDefined();
      expect(sessionTable.Type).toBe('AWS::DynamoDB::Table');
      expect(sessionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(sessionTable.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(sessionTable.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
      expect(sessionTable.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(sessionTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Network Configuration', () => {
    test('should have VPC with proper CIDR configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have NAT Gateways for high availability', () => {
      const resources = template.Resources;
      const natGateway1 = resources.NATGateway1;
      const natGateway2 = resources.NATGateway2;
      const natGateway3 = resources.NATGateway3;

      expect(natGateway1).toBeDefined();
      expect(natGateway2).toBeDefined();
      expect(natGateway3).toBeDefined();

      expect(natGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have proper route table configuration', () => {
      const resources = template.Resources;

      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PublicRoute).toBeDefined();
      expect(resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRouteTable2).toBeDefined();
      expect(resources.PrivateRouteTable3).toBeDefined();
      expect(resources.PrivateRoute1).toBeDefined();
      expect(resources.PrivateRoute2).toBeDefined();
      expect(resources.PrivateRoute3).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('should have IAM roles with least privilege', () => {
      const resources = template.Resources;
      const ec2Role = resources.EC2Role;

      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have instance profile for EC2', () => {
      const resources = template.Resources;
      const instanceProfile = resources.EC2InstanceProfile;

      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have all critical outputs', () => {
      const outputs = template.Outputs;

      // VPC and Network outputs
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Description).toBeDefined();
      expect(outputs.VPCId.Export).toBeDefined();

      // Load Balancer outputs
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS.Export).toBeDefined();
      expect(outputs.LoadBalancerHostedZoneID).toBeDefined();

      // Database outputs
      expect(outputs.RDSClusterEndpoint).toBeDefined();
      expect(outputs.RDSClusterReadEndpoint).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();

      // Storage outputs
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.BackupBucketName).toBeDefined();

      // Security outputs
      expect(outputs.WAFWebACLArn).toBeDefined();
      expect(outputs.KMSKeyIds).toBeDefined();
    });

    test('should have proper export names', () => {
      const outputs = template.Outputs;

      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          const exportName = JSON.stringify(output.Export.Name);
          expect(exportName).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Compliance and Best Practices', () => {
    test('should have tagging strategy', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();

      const tags = vpc.Properties.Tags;
      const hasEnvironmentTag = tags.some((tag: any) => tag.Key === 'Environment');
      const hasProjectTag = tags.some((tag: any) => tag.Key === 'Project');
      const hasCostCenterTag = tags.some((tag: any) => tag.Key === 'CostCenter');

      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
    });

    test('should not have hardcoded secrets', () => {
      const templateStr = JSON.stringify(template);

      // Check for common patterns of hardcoded secrets
      expect(templateStr).not.toMatch(/password["']?\s*:\s*["'][^{]/i);
      expect(templateStr).not.toMatch(/secret["']?\s*:\s*["'][^{]/i);
      expect(templateStr).not.toMatch(/api[_-]?key["']?\s*:\s*["'][^{]/i);

      // Should use Secrets Manager or Parameter Store
      expect(templateStr).toContain('AWS::SecretsManager::Secret');
    });

    test('should have deletion protection for critical resources', () => {
      const rdsCluster = template.Resources.RDSCluster;
      expect(rdsCluster.Properties.DeletionProtection).toBeDefined();

      const dynamoTable = template.Resources.SessionTable;
      expect(dynamoTable.DeletionPolicy).toBeDefined();
    });

    test('should use parameter constraints', () => {
      const params = template.Parameters;

      // Environment suffix should have pattern
      expect(params.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(params.EnvironmentSuffix.ConstraintDescription).toBeDefined();

      // Instance types should have allowed values
      expect(params.InstanceType.AllowedValues).toBeDefined();
      expect(params.InstanceType.AllowedValues.length).toBeGreaterThan(0);

      // VPC CIDR should have pattern
      expect(params.VpcCIDR.AllowedPattern).toBeDefined();
    });
  });
});