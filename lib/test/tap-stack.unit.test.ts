import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Educational Content Platform', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for educational content platform', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Educational Content Delivery Platform');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have deletion policy set to Delete', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.KMSKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS key should have key rotation enabled', () => {
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Buckets', () => {
    test('should have artifact bucket for pipeline', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('artifact bucket should have encryption enabled with KMS', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('artifact bucket should have deletion policy set to Delete', () => {
      expect(template.Resources.ArtifactBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ArtifactBucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('artifact bucket should block public access', () => {
      const bucket = template.Resources.ArtifactBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have content bucket for educational content', () => {
      expect(template.Resources.ContentBucket).toBeDefined();
      expect(template.Resources.ContentBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('content bucket should have versioning enabled', () => {
      const bucket = template.Resources.ContentBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('content bucket should have CORS configuration', () => {
      const bucket = template.Resources.ContentBucket;
      expect(bucket.Properties.CorsConfiguration).toBeDefined();
      expect(bucket.Properties.CorsConfiguration.CorsRules).toHaveLength(1);
    });
  });

  describe('CloudFront Distribution', () => {
    test('should have CloudFront Origin Access Identity', () => {
      expect(template.Resources.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFront distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront distribution should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront distribution should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have S3 bucket policy allowing CloudFront OAI access', () => {
      expect(template.Resources.ContentBucketPolicy).toBeDefined();
      expect(template.Resources.ContentBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have UserProgress table', () => {
      expect(template.Resources.UserProgressTable).toBeDefined();
      expect(template.Resources.UserProgressTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('UserProgress table should use PAY_PER_REQUEST billing', () => {
      expect(template.Resources.UserProgressTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('UserProgress table should have encryption enabled', () => {
      const table = template.Resources.UserProgressTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('UserProgress table should have point-in-time recovery enabled', () => {
      const table = template.Resources.UserProgressTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('UserProgress table should have correct key schema', () => {
      const table = template.Resources.UserProgressTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('courseId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should have CourseMetadata table', () => {
      expect(template.Resources.CourseMetadataTable).toBeDefined();
      expect(template.Resources.CourseMetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('CourseMetadata table should have deletion policy set to Delete', () => {
      expect(template.Resources.CourseMetadataTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.CourseMetadataTable.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR block', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC endpoints for S3 and DynamoDB', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('ECS Resources', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings).toBeDefined();
      expect(cluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('ECS task definition should use Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should have desired count of 2 for high availability', () => {
      expect(template.Resources.ECSService.Properties.DesiredCount).toBe(2);
    });

    test('should have security group for ECS tasks', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules.length).toBeGreaterThanOrEqual(2);
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have application load balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have ALB target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('IAM Roles', () => {
    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role with DynamoDB access', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      const taskRole = template.Resources.ECSTaskRole;
      expect(taskRole.Properties.Policies).toBeDefined();
      const dynamoPolicy = taskRole.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');
      expect(dynamoPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
    });

    test('log groups should have retention configured', () => {
      const ecsLogGroup = template.Resources.ECSLogGroup;
      expect(ecsLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('log groups should be encrypted with KMS', () => {
      const ecsLogGroup = template.Resources.ECSLogGroup;
      expect(ecsLogGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('log groups should have deletion policy set to Delete', () => {
      expect(template.Resources.ECSLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ECSServiceCPUAlarm).toBeDefined();
      expect(template.Resources.ALBTargetResponseTimeAlarm).toBeDefined();
    });

    test('alarms should send notifications to SNS', () => {
      const alarm = template.Resources.ECSServiceCPUAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
    });
  });

  describe('SNS Notifications', () => {
    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should be encrypted with KMS', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources with names should include EnvironmentSuffix', () => {
      const resourcesToCheck = [
        'ArtifactBucket',
        'ContentBucket',
        'UserProgressTable',
        'CourseMetadataTable',
        'ECSCluster',
        'ApplicationLoadBalancer'
      ];

      resourcesToCheck.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.BucketName) {
          expect(JSON.stringify(resource.Properties.BucketName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.ClusterName) {
          expect(JSON.stringify(resource.Properties.ClusterName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.Name) {
          expect(JSON.stringify(resource.Properties.Name)).toContain('EnvironmentSuffix');
        }
      });
    });

    test('all resources should have Environment tag', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      resourcesWithTags.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudFrontDomainName',
        'ContentBucketName',
        'ArtifactBucketName',
        'ECSClusterName',
        'ECSServiceName',
        'UserProgressTableName',
        'CourseMetadataTableName',
        'KMSKeyId',
        'SNSTopicArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should block public access', () => {
      const buckets = ['ArtifactBucket', 'ContentBucket'];
      buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessConfig.BlockPublicAcls).toBe(true);
        expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
        expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
        expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['ArtifactBucket', 'ContentBucket'];
      buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all DynamoDB tables should have encryption enabled', () => {
      const tables = ['UserProgressTable', 'CourseMetadataTable'];
      tables.forEach(tableKey => {
        const table = template.Resources[tableKey];
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });

    test('CloudWatch log groups should be encrypted', () => {
      const logGroups = ['ECSLogGroup'];
      logGroups.forEach(lgKey => {
        const lg = template.Resources[lgKey];
        expect(lg.Properties.KmsKeyId).toBeDefined();
      });
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have multiple resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Educational platform has 40+ resources
    });

    test('should have proper parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and AlertEmail
    });
  });

  describe('High Availability Configuration', () => {
    test('resources should span multiple availability zones', () => {
      // Check that subnets use different AZs
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('ECS service should run multiple tasks', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBeGreaterThanOrEqual(2);
    });

    test('DynamoDB tables should have point-in-time recovery', () => {
      const tables = ['UserProgressTable', 'CourseMetadataTable'];
      tables.forEach(tableKey => {
        const table = template.Resources[tableKey];
        expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });
  });
});
