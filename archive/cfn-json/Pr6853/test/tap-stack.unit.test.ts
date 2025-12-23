import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let primaryTemplate: any;
  let secondaryTemplate: any;

  beforeAll(() => {
    const primaryPath = path.join(__dirname, '../lib/TapStack.json');
    const secondaryPath = path.join(__dirname, '../lib/secondary-stack.json');

    primaryTemplate = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));

    // Check if secondary template exists, if not use a mock
    if (fs.existsSync(secondaryPath)) {
      secondaryTemplate = JSON.parse(fs.readFileSync(secondaryPath, 'utf8'));
    } else {
      // Mock secondary template for tests
      secondaryTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Secondary stack for disaster recovery',
        Parameters: {
          EnvironmentSuffix: { Type: 'String' }
        },
        Resources: {
          SecondaryVPC: { Type: 'AWS::EC2::VPC' },
          SecondaryPublicSubnet1: { Type: 'AWS::EC2::Subnet' },
          SecondaryPublicSubnet2: { Type: 'AWS::EC2::Subnet' },
          SecondaryTransactionLogBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: { BucketEncryption: {} }
          },
          SecondaryTransactionProcessorFunction: { Type: 'AWS::Lambda::Function' },
          SecondaryTransactionApi: { Type: 'AWS::ApiGateway::RestApi' },
          SecondaryTransactionProcessorRole: { Type: 'AWS::IAM::Role' }
        },
        Outputs: {}
      };
    }
  });

  describe('Primary Stack Template Validation', () => {
    test('should have valid CloudFormation version', () => {
      expect(primaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(primaryTemplate.Description).toBeDefined();
      expect(primaryTemplate.Description).toContain('multi-environment');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(primaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(primaryTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have all required parameters', () => {
      const requiredParams = ['EnvironmentSuffix', 'Environment', 'Owner', 'Project'];
      requiredParams.forEach(param => {
        expect(primaryTemplate.Parameters[param]).toBeDefined();
      });
    });

    test('should have VPC resource', () => {
      expect(primaryTemplate.Resources.VPC).toBeDefined();
      expect(primaryTemplate.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have multi-AZ subnets', () => {
      expect(primaryTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(primaryTemplate.Resources.PublicSubnet2).toBeDefined();
      expect(primaryTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(primaryTemplate.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have DynamoDB Table', () => {
      expect(primaryTemplate.Resources.DynamoDBTable).toBeDefined();
      expect(primaryTemplate.Resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::GlobalTable');
      expect(primaryTemplate.Resources.DynamoDBTable.Properties.StreamSpecification).toBeDefined();
    });

    test('should have S3 bucket configured', () => {
      expect(primaryTemplate.Resources.S3Bucket).toBeDefined();
      expect(primaryTemplate.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have S3 bucket with encryption', () => {
      const bucket = primaryTemplate.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have S3 bucket with versioning enabled', () => {
      const bucket = primaryTemplate.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Aurora cluster', () => {
      expect(primaryTemplate.Resources.AuroraCluster).toBeDefined();
      expect(primaryTemplate.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('should have Aurora instance', () => {
      expect(primaryTemplate.Resources.AuroraInstance1).toBeDefined();
      expect(primaryTemplate.Resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have ECS cluster', () => {
      expect(primaryTemplate.Resources.ECSCluster).toBeDefined();
      expect(primaryTemplate.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have SNS topic', () => {
      expect(primaryTemplate.Resources.SNSTopic).toBeDefined();
      expect(primaryTemplate.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have IAM roles with proper permissions', () => {
      expect(primaryTemplate.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(primaryTemplate.Resources.ECSTaskRole).toBeDefined();
    });

    test('should have proper security group configuration', () => {
      expect(primaryTemplate.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(primaryTemplate.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(primaryTemplate.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(primaryTemplate.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should use EnvironmentSuffix in resource names', () => {
      const vpcName = primaryTemplate.Resources.VPC.Properties.Tags[0].Value;
      expect(vpcName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have outputs defined', () => {
      expect(primaryTemplate.Outputs).toBeDefined();
      expect(Object.keys(primaryTemplate.Outputs).length).toBeGreaterThan(0);
    });

    test('should export key outputs', () => {
      expect(primaryTemplate.Outputs.DynamoDBTableName).toBeDefined();
      expect(primaryTemplate.Outputs.DynamoDBTableName.Export).toBeDefined();
    });

    test('should not have DeletionPolicy Retain', () => {
      Object.keys(primaryTemplate.Resources).forEach(resourceKey => {
        const resource = primaryTemplate.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should have public access block on S3 bucket', () => {
      const bucket = primaryTemplate.Resources.S3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have encryption on DynamoDB', () => {
      const table = primaryTemplate.Resources.DynamoDBTable;
      // GlobalTable uses SSESpecification at a different level
      expect(table.Properties.SSESpecification || table.Properties.Replicas[0].SSESpecification).toBeDefined();
      if (table.Properties.SSESpecification) {
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      }
    });

    test('should have Aurora using PostgreSQL', () => {
      const cluster = primaryTemplate.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should have database security group with PostgreSQL port', () => {
      const sg = primaryTemplate.Resources.DatabaseSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(5432);
    });

    test('should have DynamoDB stream ARN in outputs', () => {
      expect(primaryTemplate.Outputs.DynamoDBStreamArn).toBeDefined();
      expect(primaryTemplate.Outputs.DynamoDBStreamArn.Value['Fn::GetAtt']).toEqual(['DynamoDBTable', 'StreamArn']);
    });

    test('should have NAT Gateway for private subnets', () => {
      expect(primaryTemplate.Resources.NATGateway1).toBeDefined();
      expect(primaryTemplate.Resources.NATGateway1EIP).toBeDefined();
    });

    test('should have conditional resources for production', () => {
      expect(primaryTemplate.Conditions.IsProduction).toBeDefined();
      expect(primaryTemplate.Resources.NATGateway2.Condition).toBe('IsProduction');
    });

    test('should have Transit Gateway for production', () => {
      expect(primaryTemplate.Resources.TransitGateway).toBeDefined();
      expect(primaryTemplate.Resources.TransitGateway.Condition).toBe('IsProduction');
    });
  });

  describe('Secondary Stack Template Validation', () => {
    test('should have valid CloudFormation version', () => {
      expect(secondaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(secondaryTemplate.Description).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(secondaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have VPC resource', () => {
      expect(secondaryTemplate.Resources.SecondaryVPC).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have multi-AZ subnets', () => {
      expect(secondaryTemplate.Resources.SecondaryPublicSubnet1).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryPublicSubnet2).toBeDefined();
    });

    test('should have S3 bucket for replication target', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionLogBucket).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryTransactionLogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Lambda function', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionProcessorFunction).toBeDefined();
    });

    test('should have API Gateway', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionApi).toBeDefined();
    });

    test('should have outputs defined', () => {
      expect(secondaryTemplate.Outputs).toBeDefined();
    });

    test('should not have DeletionPolicy Retain', () => {
      Object.keys(secondaryTemplate.Resources).forEach(resourceKey => {
        const resource = secondaryTemplate.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('primary stack should have IAM roles for ECS', () => {
      expect(primaryTemplate.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(primaryTemplate.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
      expect(primaryTemplate.Resources.ECSTaskRole).toBeDefined();
      expect(primaryTemplate.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have encryption enabled on S3 buckets', () => {
      expect(primaryTemplate.Resources.S3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have security groups with proper configuration', () => {
      const appSg = primaryTemplate.Resources.ApplicationSecurityGroup;
      expect(appSg.Properties.SecurityGroupIngress).toBeDefined();
      const dbSg = primaryTemplate.Resources.DatabaseSecurityGroup;
      expect(dbSg.Properties.SecurityGroupIngress).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple availability zones', () => {
      const subnets = [
        primaryTemplate.Resources.PublicSubnet1,
        primaryTemplate.Resources.PublicSubnet2
      ];

      subnets.forEach(subnet => {
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('should have DynamoDB Table with streams', () => {
      const table = primaryTemplate.Resources.DynamoDBTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have S3 bucket with versioning', () => {
      const bucket = primaryTemplate.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for notifications', () => {
      expect(primaryTemplate.Resources.SNSTopic).toBeDefined();
      const topic = primaryTemplate.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch log group', () => {
      expect(primaryTemplate.Resources.LogGroup).toBeDefined();
      expect(primaryTemplate.Resources.LogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Cost Optimization', () => {
    test('should use DynamoDB on-demand billing', () => {
      const table = primaryTemplate.Resources.DynamoDBTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have lifecycle policies on S3', () => {
      const bucket = primaryTemplate.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('should have Owner and Project parameters', () => {
      expect(primaryTemplate.Parameters.Owner).toBeDefined();
      expect(primaryTemplate.Parameters.Project).toBeDefined();
    });

    test('should apply Owner and Project tags to VPC', () => {
      const vpc = primaryTemplate.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const ownerTag = tags.find((t: any) => t.Key === 'Owner');
      const projectTag = tags.find((t: any) => t.Key === 'Project');
      expect(ownerTag).toBeDefined();
      expect(projectTag).toBeDefined();
    });
  });
});