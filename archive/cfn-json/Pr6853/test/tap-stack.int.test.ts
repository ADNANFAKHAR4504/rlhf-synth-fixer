import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
      expect(resources).toBeDefined();
      expect(parameters).toBeDefined();
      expect(outputs).toBeDefined();
    });

  });

  describe('VPC and Network Resources', () => {
    test('should have VPC with correct configuration', () => {
      expect(resources.VPC).toBeDefined();
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet2).toBeDefined();

      expect(resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.AttachGateway).toBeDefined();
      expect(resources.NATGateway1).toBeDefined();
      expect(resources.NATGateway1EIP).toBeDefined();
    });

    test('should have route tables configured', () => {
      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PublicRoute).toBeDefined();
      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRoute1).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('should have Aurora Global Database', () => {
      expect(resources.AuroraGlobalCluster).toBeDefined();
      expect(resources.AuroraGlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
      expect(resources.AuroraGlobalCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(resources.AuroraGlobalCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have Aurora PostgreSQL cluster linked to global database', () => {
      expect(resources.AuroraCluster).toBeDefined();
      expect(resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(resources.AuroraCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(resources.AuroraCluster.Properties.EngineVersion).toBe('15.8');
      expect(resources.AuroraCluster.DeletionPolicy).toBe('Delete');
      expect(resources.AuroraCluster.Properties.MasterUsername).toBe('dbadmin');
      expect(resources.AuroraCluster.Properties.GlobalClusterIdentifier).toBeDefined();
    });

    test('should have Aurora instance', () => {
      expect(resources.AuroraInstance1).toBeDefined();
      expect(resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
      expect(resources.AuroraInstance1.Properties.Engine).toBe('aurora-postgresql');
      expect(resources.AuroraInstance1.DeletionPolicy).toBe('Delete');
    });

    test('should have database security group with PostgreSQL port', () => {
      expect(resources.DatabaseSecurityGroup).toBeDefined();
      expect(resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
    });

    test('should have Secrets Manager for database password', () => {
      expect(resources.DBPasswordSecret).toBeDefined();
      expect(resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(resources.DBPasswordSecret.Properties.GenerateSecretString.SecretStringTemplate).toContain('dbadmin');
    });
  });

  describe('Storage Resources', () => {
    test('should have DynamoDB table with streams', () => {
      expect(resources.DynamoDBTable).toBeDefined();
      expect(resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::GlobalTable');
      expect(resources.DynamoDBTable.Properties.StreamSpecification).toBeDefined();
      expect(resources.DynamoDBTable.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      // GlobalTable has SSESpecification at table level
      expect(resources.DynamoDBTable.Properties.SSESpecification).toBeDefined();
      expect(resources.DynamoDBTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(resources.DynamoDBTable.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('should have S3 bucket with encryption', () => {
      expect(resources.S3Bucket).toBeDefined();
      expect(resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(resources.S3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(resources.S3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(resources.S3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

  });

  describe('Compute Resources', () => {
    test('should have Primary API Gateway', () => {
      expect(resources.PrimaryApiGateway).toBeDefined();
      expect(resources.PrimaryApiGateway.Type).toBe('AWS::ApiGatewayV2::Api');
      expect(resources.PrimaryApiGateway.Properties.ProtocolType).toBe('HTTP');
      expect(resources.PrimaryApiStage).toBeDefined();
      expect(resources.PrimaryLambdaFunction).toBeDefined();
      expect(resources.PrimaryLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have ECS cluster', () => {
      expect(resources.ECSCluster).toBeDefined();
      expect(resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
      expect(resources.ECSCluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(resources.ECSCluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should have ECS IAM roles', () => {
      expect(resources.ECSTaskExecutionRole).toBeDefined();
      expect(resources.ECSTaskRole).toBeDefined();
      expect(resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
      expect(resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS topic', () => {
      expect(resources.SNSTopic).toBeDefined();
      expect(resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
      expect(resources.SNSSubscription).toBeDefined();
      expect(resources.SNSSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('should have CloudWatch log group', () => {
      expect(resources.LogGroup).toBeDefined();
      expect(resources.LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(resources.LogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Production-only Resources', () => {
    test('should have Transit Gateway for production', () => {
      expect(resources.TransitGateway).toBeDefined();
      expect(resources.TransitGateway.Condition).toBe('IsProduction');
      expect(resources.TransitGateway.Type).toBe('AWS::EC2::TransitGateway');

      expect(resources.TransitGatewayAttachment).toBeDefined();
      expect(resources.TransitGatewayAttachment.Condition).toBe('IsProduction');
    });

    test('should have second NAT Gateway for production', () => {
      expect(resources.NATGateway2).toBeDefined();
      expect(resources.NATGateway2.Condition).toBe('IsProduction');
      expect(resources.NATGateway2EIP).toBeDefined();
      expect(resources.NATGateway2EIP.Condition).toBe('IsProduction');
    });
  });

  describe('Outputs', () => {
    test('should expose VPC and network outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Value.Ref).toBe('VPC');
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
    });

    test('should expose Aurora endpoints', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint.Value['Fn::GetAtt'][0]).toBe('AuroraCluster');
    });

    test('should expose DynamoDB outputs', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName.Value.Ref).toBe('DynamoDBTable');
      expect(outputs.DynamoDBStreamArn).toBeDefined();
      expect(outputs.DynamoDBStreamArn.Value['Fn::GetAtt'][0]).toBe('DynamoDBTable');
      expect(outputs.DynamoDBStreamArn.Value['Fn::GetAtt'][1]).toBe('StreamArn');
    });

    test('should expose S3 bucket name', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName.Value.Ref).toBe('S3Bucket');
    });

    test('should expose ECS cluster name', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSClusterName.Value.Ref).toBe('ECSCluster');
    });

    test('should expose SNS topic ARN', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn.Value.Ref).toBe('SNSTopic');
    });

    test('should expose Primary API Gateway endpoint', () => {
      expect(outputs.PrimaryApiGatewayEndpoint).toBeDefined();
      expect(outputs.PrimaryApiGatewayEndpoint.Description).toContain('Primary API Gateway');
    });

    test('should expose Aurora Global Cluster ID', () => {
      expect(outputs.AuroraGlobalClusterId).toBeDefined();
      expect(outputs.AuroraGlobalClusterId.Value.Ref).toBe('AuroraGlobalCluster');
    });

    test('should have export names with environment suffix', () => {
      const outputKeys = Object.keys(outputs);
      outputKeys.forEach(key => {
        if (outputs[key].Export) {
          expect(outputs[key].Export.Name).toBeDefined();
          const exportName = outputs[key].Export.Name;
          if (exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Tags', () => {
    test('should have consistent tagging strategy', () => {
      const taggedResources = ['VPC', 'PublicSubnet1', 'PrivateSubnet1', 'S3Bucket', 'DynamoDBTable', 'ECSCluster'];

      taggedResources.forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          expect(Array.isArray(tags)).toBe(true);

          const hasNameTag = tags.some((tag: any) => tag.Key === 'Name');
          const hasOwnerTag = tags.some((tag: any) => tag.Key === 'Owner');
          const hasProjectTag = tags.some((tag: any) => tag.Key === 'Project');

          expect(hasNameTag).toBe(true);
          expect(hasOwnerTag).toBe(true);
          expect(hasProjectTag).toBe(true);
        }
      });
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals'][0].Ref).toBe('Environment');
      expect(template.Conditions.IsProduction['Fn::Equals'][1]).toBe('prod');
    });
  });
});