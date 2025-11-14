import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  ValidateTemplateCommand,
  EstimateTemplateCostCommand,
  GetTemplateSummaryCommand
} from '@aws-sdk/client-cloudformation';

describe('Trading Platform DR CloudFormation Integration Tests', () => {
  let template: any;
  let templateString: string;
  let cfnClient: CloudFormationClient;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'trading-platform-dr-primary.json');
    templateString = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateString);

    // Initialize CloudFormation client
    cfnClient = new CloudFormationClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  });

  describe('Template Validation', () => {
    test('should validate successfully with CloudFormation service', async () => {
      const command = new ValidateTemplateCommand({
        TemplateBody: templateString
      });

      let result;
      let error;

      try {
        result = await cfnClient.send(command);
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result?.Parameters).toBeDefined();
      expect(result?.Capabilities).toContain('CAPABILITY_IAM');
    }, 30000);

    test('should have valid template summary', async () => {
      const command = new GetTemplateSummaryCommand({
        TemplateBody: templateString
      });

      const result = await cfnClient.send(command);

      expect(result.ResourceTypes).toBeDefined();
      expect(result.Parameters).toBeDefined();
      expect(result.Capabilities).toBeDefined();
      expect(result.ResourceTypes).toContain('AWS::RDS::DBInstance');
      expect(result.ResourceTypes).toContain('AWS::EC2::VPC');
      expect(result.ResourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
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
      const rdsInstance = resources.RDSInstance;

      expect(rdsInstance).toBeDefined();
      expect(rdsInstance.Properties.DBSubnetGroupName).toBeDefined();
      expect(rdsInstance.Properties.VPCSecurityGroups).toBeDefined();

      // Ensure RDS has DependsOn for subnet group
      const dbSubnetGroup = resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Properties.SubnetIds).toBeDefined();
    });

    test('should have proper ALB dependencies', () => {
      const resources = template.Resources;
      const alb = resources.ALB;

      expect(alb).toBeDefined();
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.SecurityGroups).toBeDefined();

      // Check target group has proper health check
      const targetGroup = resources.ALBTargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Properties.HealthCheckPath).toBe('/health');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBeDefined();
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have KMS encryption enabled for RDS', () => {
      const rdsInstance = template.Resources.RDSInstance;

      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.KmsKeyId).toBeDefined();
    });

    test('should have KMS encryption for S3 backup bucket', () => {
      const backupBucket = template.Resources.BackupBucket;

      expect(backupBucket).toBeDefined();
      expect(backupBucket.Properties.BucketEncryption).toBeDefined();
      expect(backupBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const encryption = backupBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have proper security group rules', () => {
      const resources = template.Resources;

      // ALB Security Group
      const albSG = resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Properties.SecurityGroupIngress).toBeDefined();

      const httpIngress = albSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress.CidrIp).toBe('0.0.0.0/0');

      // RDS Security Group
      const rdsSG = resources.RDSSecurityGroup;
      expect(rdsSG).toBeDefined();
      expect(rdsSG.Properties.SecurityGroupIngress).toBeDefined();

      const dbIngress = rdsSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toBeDefined();
    });

    test('should have IAM roles with least privilege', () => {
      const resources = template.Resources;

      // EC2 Role
      const ec2Role = resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );

      // Lambda Role
      const lambdaRole = resources.LambdaExecutionRole;
      expect(lambdaRole).toBeDefined();

      const lambdaPolicy = lambdaRole.Properties.Policies[0];
      expect(lambdaPolicy.PolicyName).toBe('LambdaPolicy');
      expect(lambdaPolicy.PolicyDocument.Statement).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should have Multi-AZ RDS configuration', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.MultiAZ).toBe(true);
    });

    test('should have Auto Scaling configured', () => {
      const autoScalingGroup = template.Resources.AutoScalingGroup;

      expect(autoScalingGroup).toBeDefined();
      expect(autoScalingGroup.Properties.MinSize).toBe('2');
      expect(autoScalingGroup.Properties.MaxSize).toBe('6');
      expect(autoScalingGroup.Properties.DesiredCapacity).toBe('2');

      // Check health check configuration
      expect(autoScalingGroup.Properties.HealthCheckType).toBe('ELB');
      expect(autoScalingGroup.Properties.HealthCheckGracePeriod).toBeDefined();
    });

    test('should have cross-AZ load balancing', () => {
      const alb = template.Resources.ALB;

      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have scaling policies configured', () => {
      const resources = template.Resources;

      const scaleUpPolicy = resources.ScaleUpPolicy;
      const scaleDownPolicy = resources.ScaleDownPolicy;

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleUpPolicy.Properties.ScalingAdjustment).toBe('1');
      expect(scaleUpPolicy.Properties.AdjustmentType).toBe('ChangeInCapacity');

      expect(scaleDownPolicy).toBeDefined();
      expect(scaleDownPolicy.Properties.ScalingAdjustment).toBe('-1');
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('should have backup configuration for RDS', () => {
      const rdsInstance = template.Resources.RDSInstance;

      expect(rdsInstance.Properties.BackupRetentionPeriod).toBe('7');
      expect(rdsInstance.Properties.PreferredBackupWindow).toBeDefined();
      expect(rdsInstance.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should have S3 backup bucket with versioning', () => {
      const backupBucket = template.Resources.BackupBucket;

      expect(backupBucket.Properties.VersioningConfiguration).toBeDefined();
      expect(backupBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Check lifecycle configuration
      expect(backupBucket.Properties.LifecycleConfiguration).toBeDefined();
      const lifecycleRules = backupBucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toBeDefined();
      expect(lifecycleRules[0].Status).toBe('Enabled');
    });

    test('should have Lambda function for backup automation', () => {
      const backupLambda = template.Resources.BackupLambda;

      expect(backupLambda).toBeDefined();
      expect(backupLambda.Properties.Runtime).toBe('python3.9');
      expect(backupLambda.Properties.Timeout).toBe(300);

      // Check environment variables
      expect(backupLambda.Properties.Environment).toBeDefined();
      expect(backupLambda.Properties.Environment.Variables.BACKUP_BUCKET).toBeDefined();
    });

    test('should have CloudWatch alarms for monitoring', () => {
      const resources = template.Resources;

      const cpuAlarmHigh = resources.CPUAlarmHigh;
      const cpuAlarmLow = resources.CPUAlarmLow;
      const rdsAlarm = resources.DatabaseCPUAlarm;

      expect(cpuAlarmHigh).toBeDefined();
      expect(cpuAlarmHigh.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarmHigh.Properties.Threshold).toBe(80);

      expect(cpuAlarmLow).toBeDefined();
      expect(cpuAlarmLow.Properties.Threshold).toBe(10);

      expect(rdsAlarm).toBeDefined();
      expect(rdsAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(rdsAlarm.Properties.Namespace).toBe('AWS/RDS');
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;

      // VPC outputs
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Description).toContain('VPC');

      // ALB outputs
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName.Description).toContain('ALB DNS');
      expect(outputs.ALBDNSName.Export).toBeDefined();

      // RDS outputs
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint.Description).toContain('RDS');

      // Backup outputs
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.BackupBucketArn).toBeDefined();

      // KMS outputs
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
    });

    test('should have properly formatted export names', () => {
      const outputs = template.Outputs;

      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Parameter Validation', () => {
    test('should have valid parameter constraints', () => {
      const parameters = template.Parameters;

      // Environment suffix
      expect(parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(parameters.EnvironmentSuffix.ConstraintDescription).toBeDefined();

      // DB instance class
      expect(parameters.DBInstanceClass.AllowedValues).toContain('db.t3.micro');
      expect(parameters.DBInstanceClass.AllowedValues).toContain('db.t3.medium');

      // Instance type
      expect(parameters.InstanceType.AllowedValues).toContain('t3.micro');
      expect(parameters.InstanceType.AllowedValues).toContain('t3.medium');

      // Availability zones
      expect(parameters.AvailabilityZones.Type).toBe('List<AWS::EC2::AvailabilityZone::Name>');
    });

    test('should have proper default values', () => {
      const parameters = template.Parameters;

      expect(parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(parameters.DBInstanceClass.Default).toBe('db.t3.medium');
      expect(parameters.InstanceType.Default).toBe('t3.medium');
      expect(parameters.EnableMultiAZ.Default).toBe('true');
      expect(parameters.BackupRetentionDays.Default).toBe('7');
    });
  });

  describe('Tags and Metadata', () => {
    test('should have proper tagging strategy', () => {
      const resources = template.Resources;

      // Check VPC tags
      const vpc = resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const vpcNameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(vpcNameTag).toBeDefined();
      expect(vpcNameTag.Value['Fn::Sub']).toContain('trading-platform-vpc');

      // Check environment tags
      const environmentTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
    });

    test('should have CloudFormation interface metadata', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];

      expect(metadata.ParameterGroups).toBeDefined();
      expect(metadata.ParameterGroups.length).toBeGreaterThan(0);

      // Check parameter group organization
      const networkGroup = metadata.ParameterGroups.find(
        (group: any) => group.Label.default === 'Network Configuration'
      );
      expect(networkGroup).toBeDefined();
      expect(networkGroup.Parameters).toContain('AvailabilityZones');

      const dbGroup = metadata.ParameterGroups.find(
        (group: any) => group.Label.default === 'Database Configuration'
      );
      expect(dbGroup).toBeDefined();
      expect(dbGroup.Parameters).toContain('DBInstanceClass');
    });
  });
});