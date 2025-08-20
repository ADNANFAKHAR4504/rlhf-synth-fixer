import fs from 'fs';
import path from 'path';

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
        'Robust and secure AWS environment with VPC, S3, Lambda, and RDS PostgreSQL'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('postgres');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have DBPassword parameter', () => {
      expect(template.Parameters.DBPassword).toBeDefined();
      const param = template.Parameters.DBPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('/myapp/database/password');
    });

    test('should have DBPasswordParameterName parameter', () => {
      expect(template.Parameters.DBPasswordParameterName).toBeDefined();
      const param = template.Parameters.DBPasswordParameterName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('/myapp/database/password');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9/_-]+$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.MyAppVPC).toBeDefined();
      const vpc = template.Resources.MyAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.MyAppInternetGateway).toBeDefined();
      const igw = template.Resources.MyAppInternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MyAppVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'MyAppInternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'MyAppVPC' });
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.VpcId).toEqual({ Ref: 'MyAppVPC' });
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should use parameter-based availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Ref': 'AZ1'
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Ref': 'AZ2'
      });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIPs', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
      
      const eip1 = template.Resources.NATGateway1EIP;
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip1.DependsOn).toBe('AttachGateway');
    });

    test('should have NAT Gateways with proper dependencies', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      
      const nat1 = template.Resources.NATGateway1;
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.DependsOn).toContain('PublicSubnet1RouteTableAssociation');
      expect(nat1.DependsOn).toContain('PublicSubnet2RouteTableAssociation');
    });
  });

  describe('Route Table Resources', () => {
    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });

    test('should have routes with proper dependencies', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute2).toBeDefined();
      
      const privateRoute1 = template.Resources.PrivateRoute1;
      const privateRoute2 = template.Resources.PrivateRoute2;
      
      // Routes reference NAT Gateways directly, no explicit DependsOn needed
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });
  });

  describe('S3 Resources', () => {
    test('should have access logs S3 bucket', () => {
      expect(template.Resources.MyAppS3AccessLogsBucket).toBeDefined();
      const bucket = template.Resources.MyAppS3AccessLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have primary S3 bucket with logging', () => {
      expect(template.Resources.MyAppS3Bucket).toBeDefined();
      const bucket = template.Resources.MyAppS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'MyAppS3AccessLogsBucket' });
    });

    test('should have proper bucket naming with environment', () => {
      const accessLogsBucket = template.Resources.MyAppS3AccessLogsBucket;
      const primaryBucket = template.Resources.MyAppS3Bucket;
      
      expect(accessLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'myapp-access-logs-${Environment}-${AWS::AccountId}'
      });
      expect(primaryBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'myapp-primary-${Environment}-${AWS::AccountId}'
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'MyAppVPC' });
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Lambda function', () => {
      expect(template.Resources.MyAppLambdaFunction).toBeDefined();
      const lambda = template.Resources.MyAppLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toEqual([{ Ref: 'LambdaSecurityGroup' }]);
      expect(lambda.Properties.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should have Lambda permission for S3', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceAccount).toEqual({ 'Ref': 'AWS::AccountId' });
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['MyAppS3Bucket', 'Arn'] });
    });
  });

  describe('SSM Parameter', () => {
    test('should reference existing SSM parameter', () => {
      // The template now references an existing SSM parameter instead of creating one
      expect(template.Parameters.DBPassword.Type).toBe('String');
      expect(template.Parameters.DBPassword.Default).toBe('/myapp/database/password');
    });
  });

  describe('RDS Resources', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'MyAppVPC' });
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('should have RDS instance with proper configuration', () => {
      expect(template.Resources.MyAppRDSInstance).toBeDefined();
      const rds = template.Resources.MyAppRDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Retain');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toBe('13.15');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should use SSM parameter for database password', () => {
      const rds = template.Resources.MyAppRDSInstance;
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:ssm-secure:${DBPassword}}}'
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use environment parameter in resource names', () => {
      const vpc = template.Resources.MyAppVPC;
      const lambda = template.Resources.MyAppLambdaFunction;
      const rds = template.Resources.MyAppRDSInstance;
      
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'MyApp-VPC-${Environment}'
      });
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'MyApp-S3-Event-Handler-${Environment}'
      });
      expect(rds.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'myapp-postgres-db-${Environment}'
      });
    });

    test('should have consistent environment tagging', () => {
      const resources = Object.values(template.Resources);
      resources.forEach((resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toEqual({ Ref: 'Environment' });
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PrimaryS3BucketName',
        'AccessLogsS3BucketName',
        'RDSInstanceEndpoint',
        'VPCId',
        'LambdaFunctionArn',
        'DatabasePasswordParameterName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have proper output descriptions and values', () => {
      const outputs = template.Outputs;
      
      expect(outputs.PrimaryS3BucketName.Description).toBe('Name of the primary S3 bucket');
      expect(outputs.PrimaryS3BucketName.Value).toEqual({ Ref: 'MyAppS3Bucket' });
      
      expect(outputs.RDSInstanceEndpoint.Description).toBe('RDS PostgreSQL instance endpoint');
      expect(outputs.RDSInstanceEndpoint.Value).toEqual({
        'Fn::GetAtt': ['MyAppRDSInstance', 'Endpoint.Address']
      });
      
      expect(outputs.VPCId.Description).toBe('VPC ID');
      expect(outputs.VPCId.Value).toEqual({ Ref: 'MyAppVPC' });
    });

    test('should have proper export names', () => {
      const outputs = template.Outputs;
      
      expect(outputs.PrimaryS3BucketName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PrimaryS3Bucket'
      });
      expect(outputs.AccessLogsS3BucketName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AccessLogsS3Bucket'
      });
      expect(outputs.RDSInstanceEndpoint.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-RDSEndpoint'
      });
      expect(outputs.VPCId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC'
      });
      expect(outputs.LambdaFunctionArn.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunction'
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('should have encryption enabled on S3 buckets', () => {
      const accessLogsBucket = template.Resources.MyAppS3AccessLogsBucket;
      const primaryBucket = template.Resources.MyAppS3Bucket;
      
      expect(accessLogsBucket.Properties.BucketEncryption).toBeDefined();
      expect(primaryBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have public access blocked on S3 buckets', () => {
      const accessLogsBucket = template.Resources.MyAppS3AccessLogsBucket;
      const primaryBucket = template.Resources.MyAppS3Bucket;
      
      expect(accessLogsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(primaryBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('should have RDS encryption enabled', () => {
      const rds = template.Resources.MyAppRDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should have RDS deletion protection disabled', () => {
      const rds = template.Resources.MyAppRDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should use private subnets for RDS', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should use private subnets for Lambda', () => {
      const lambda = template.Resources.MyAppLambdaFunction;
      expect(lambda.Properties.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper dependency chain for NAT Gateways', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      
      expect(nat1.DependsOn).toContain('PublicSubnet1RouteTableAssociation');
      expect(nat1.DependsOn).toContain('PublicSubnet2RouteTableAssociation');
      expect(nat2.DependsOn).toContain('PublicSubnet1RouteTableAssociation');
      expect(nat2.DependsOn).toContain('PublicSubnet2RouteTableAssociation');
    });

    test('should have proper dependency chain for routes', () => {
      const privateRoute1 = template.Resources.PrivateRoute1;
      const privateRoute2 = template.Resources.PrivateRoute2;
      
      // Routes reference NAT Gateways directly, no explicit DependsOn needed
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have proper dependency for Lambda permission', () => {
      const permission = template.Resources.LambdaInvokePermission;
      // Lambda permission references S3 bucket directly, no explicit DependsOn needed
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['MyAppS3Bucket', 'Arn'] });
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Expected: VPC, IGW, Attachment, 4 Subnets, 2 EIPs, 2 NATs, 3 RouteTables, 3 Routes, 4 Associations, 2 S3 buckets, IAM Role, Security Groups, Lambda, Permission, DB Subnet Group, RDS Instance
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6); // DBUsername, DBPassword, DBPasswordParameterName, AZ1, AZ2, Environment
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // PrimaryS3BucketName, AccessLogsS3BucketName, RDSInstanceEndpoint, VPCId, LambdaFunctionArn, DatabasePasswordParameterName
    });
  });
});
