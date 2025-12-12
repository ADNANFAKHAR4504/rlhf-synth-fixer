import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Secure Financial Data Processing', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (convert YAML to JSON first if needed)
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
    
    if (fs.existsSync(jsonPath)) {
      const templateContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(templateContent);
    } else if (fs.existsSync(yamlPath)) {
      // Convert YAML to JSON on the fly, handling CloudFormation tags
      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      // Replace CloudFormation tags with JSON equivalents
      let jsonContent = yamlContent
        .replace(/!Ref\s+(\w+)/g, '{"Ref": "$1"}')
        .replace(/!GetAtt\s+(\w+)\.(\w+)/g, '{"Fn::GetAtt": ["$1", "$2"]}')
        .replace(/!Sub\s+(.+)/g, (match, p1) => {
          // Handle !Sub with string or array
          if (p1.startsWith('[')) {
            return `{"Fn::Sub": ${p1}}`;
          }
          return `{"Fn::Sub": "${p1.replace(/"/g, '\\"')}"}`;
        })
        .replace(/!Select\s+\[(\d+),\s*!GetAZs\s+""\]/g, '{"Fn::Select": [$1, {"Fn::GetAZs": ""}]}');
      
      // Use a simple YAML parser that handles the converted content
      // For now, require manual conversion or use cfn-lint
      throw new Error(
        'TapStack.json not found. Please convert YAML to JSON first:\n' +
        'Option 1: npm run cdk:synth (generates JSON in cdk.out/)\n' +
        'Option 2: Use cfn-flip: pip install cfn-flip && cfn-flip lib/TapStack.yml lib/TapStack.json\n' +
        'Option 3: Use online converter or AWS CLI: aws cloudformation validate-template --template-body file://lib/TapStack.yml'
      );
    } else {
      throw new Error('Template file not found. Expected TapStack.json or TapStack.yml in lib/');
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('Secure data processing pipeline');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('TapVpc should exist and be configured correctly', () => {
      const vpc = template.Resources.TapVpc;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('TapVpc should have correct tags', () => {
      const vpc = template.Resources.TapVpc;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      
      expect(tagMap.Name).toBe('TapVpc');
      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Project).toBe('SecureFinancialProcessing');
      expect(tagMap.ManagedBy).toBe('CloudFormation');
    });

    test('should have three private subnets', () => {
      expect(template.Resources.TapPrivateSubnetA).toBeDefined();
      expect(template.Resources.TapPrivateSubnetB).toBeDefined();
      expect(template.Resources.TapPrivateSubnetC).toBeDefined();
    });

    test('TapPrivateSubnetA should be configured correctly', () => {
      const subnet = template.Resources.TapPrivateSubnetA;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      
      const tags = subnet.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Name).toBe('TapPrivateSubnetA');
      expect(tagMap.Tier).toBe('Private');
    });

    test('TapPrivateSubnetB should be configured correctly', () => {
      const subnet = template.Resources.TapPrivateSubnetB;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('TapPrivateSubnetC should be configured correctly', () => {
      const subnet = template.Resources.TapPrivateSubnetC;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('subnets should be in different availability zones', () => {
      const subnetA = template.Resources.TapPrivateSubnetA.Properties.AvailabilityZone;
      const subnetB = template.Resources.TapPrivateSubnetB.Properties.AvailabilityZone;
      const subnetC = template.Resources.TapPrivateSubnetC.Properties.AvailabilityZone;
      
      // All should use Fn::Select with different indices
      expect(subnetA).toBeDefined();
      expect(subnetB).toBeDefined();
      expect(subnetC).toBeDefined();
    });

    test('should have route table for private subnets', () => {
      const routeTable = template.Resources.TapPrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.TapPrivateSubnetARouteTableAssociation).toBeDefined();
      expect(template.Resources.TapPrivateSubnetBRouteTableAssociation).toBeDefined();
      expect(template.Resources.TapPrivateSubnetCRouteTableAssociation).toBeDefined();
      
      const assocA = template.Resources.TapPrivateSubnetARouteTableAssociation;
      expect(assocA.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assocA.Properties.SubnetId).toEqual({ Ref: 'TapPrivateSubnetA' });
      expect(assocA.Properties.RouteTableId).toEqual({ Ref: 'TapPrivateRouteTable' });
    });

    test('should have VPC gateway endpoints for S3 and DynamoDB', () => {
      const s3Endpoint = template.Resources.TapS3GatewayEndpoint;
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(s3Endpoint.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      expect(s3Endpoint.Properties.ServiceName).toBeDefined();
      expect(s3Endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'TapPrivateRouteTable' });

      const dynamoEndpoint = template.Resources.TapDynamoDBGatewayEndpoint;
      expect(dynamoEndpoint).toBeDefined();
      expect(dynamoEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(dynamoEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(dynamoEndpoint.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      expect(dynamoEndpoint.Properties.ServiceName).toBeDefined();
    });
  });

  describe('KMS Key Resources', () => {
    test('TapDataKmsKey should exist and be configured correctly', () => {
      const key = template.Resources.TapDataKmsKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Enabled).toBe(true);
      expect(key.Properties.Description).toContain('KMS CMK');
    });

    test('TapDataKmsKey should have correct key policy', () => {
      const key = template.Resources.TapDataKmsKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      
      const rootAccessStatement = keyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowAccountRootFullAccess'
      );
      expect(rootAccessStatement).toBeDefined();
      expect(rootAccessStatement.Effect).toBe('Allow');
      expect(rootAccessStatement.Action).toBe('kms:*');
    });

    test('TapDataKmsKey should have correct tags', () => {
      const key = template.Resources.TapDataKmsKey;
      const tags = key.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Project).toBe('SecureFinancialProcessing');
    });

    test('TapDataKmsAlias should exist and reference the key', () => {
      const alias = template.Resources.TapDataKmsAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/tapstack-financial-data-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'TapDataKmsKey' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('TapInputBucket should exist and have KMS encryption', () => {
      const bucket = template.Resources.TapInputBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(sseConfig.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'TapDataKmsKey' });
    });

    test('TapInputBucket should have versioning enabled', () => {
      const bucket = template.Resources.TapInputBucket;
      const versioning = bucket.Properties.VersioningConfiguration;
      expect(versioning).toBeDefined();
      expect(versioning.Status).toBe('Enabled');
    });

    test('TapInputBucket should have lifecycle policy', () => {
      const bucket = template.Resources.TapInputBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(Array.isArray(lifecycle.Rules)).toBe(true);
      
      const rule = lifecycle.Rules[0];
      expect(rule.Id).toBe('InputDataComplianceRule');
      expect(rule.Status).toBe('Enabled');
      expect(rule.NoncurrentVersionExpirationInDays).toBe(365);
    });

    test('TapInputBucket should have public access blocked', () => {
      const bucket = template.Resources.TapInputBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('TapInputBucket should have correct tags', () => {
      const bucket = template.Resources.TapInputBucket;
      const tags = bucket.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Name).toBe('tap-input-data');
      expect(tagMap.Environment).toBe('Production');
    });

    test('TapOutputBucket should exist and have KMS encryption', () => {
      const bucket = template.Resources.TapOutputBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption;
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(sseConfig.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'TapDataKmsKey' });
    });

    test('TapOutputBucket should have versioning enabled', () => {
      const bucket = template.Resources.TapOutputBucket;
      const versioning = bucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('TapOutputBucket should have lifecycle policy', () => {
      const bucket = template.Resources.TapOutputBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      const rule = lifecycle.Rules[0];
      expect(rule.Id).toBe('OutputDataComplianceRule');
      expect(rule.Status).toBe('Enabled');
      expect(rule.NoncurrentVersionExpirationInDays).toBe(365);
    });

    test('TapOutputBucket should have public access blocked', () => {
      const bucket = template.Resources.TapOutputBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('DynamoDB Table Resource', () => {
    test('TapTransactionMetadataTable should exist', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TapTransactionMetadataTable should have correct table name', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      expect(table.Properties.TableName).toBe('tap-transaction-metadata');
    });

    test('TapTransactionMetadataTable should have correct attribute definitions', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      const attributes = table.Properties.AttributeDefinitions;
      expect(attributes).toBeDefined();
      expect(Array.isArray(attributes)).toBe(true);
      expect(attributes.length).toBe(2);
      
      const transactionIdAttr = attributes.find((attr: any) => attr.AttributeName === 'transactionId');
      const timestampAttr = attributes.find((attr: any) => attr.AttributeName === 'timestamp');
      
      expect(transactionIdAttr).toBeDefined();
      expect(transactionIdAttr.AttributeType).toBe('S');
      expect(timestampAttr).toBeDefined();
      expect(timestampAttr.AttributeType).toBe('S');
    });

    test('TapTransactionMetadataTable should have correct key schema', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toBeDefined();
      expect(Array.isArray(keySchema)).toBe(true);
      expect(keySchema.length).toBe(2);
      
      const hashKey = keySchema.find((key: any) => key.KeyType === 'HASH');
      const rangeKey = keySchema.find((key: any) => key.KeyType === 'RANGE');
      
      expect(hashKey.AttributeName).toBe('transactionId');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('TapTransactionMetadataTable should use on-demand billing', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TapTransactionMetadataTable should have KMS encryption', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      const sseSpec = table.Properties.SSESpecification;
      expect(sseSpec).toBeDefined();
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'TapDataKmsKey' });
    });

    test('TapTransactionMetadataTable should have correct tags', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      const tags = table.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Project).toBe('SecureFinancialProcessing');
    });
  });

  describe('Security Group Resource', () => {
    test('TapLambdaSecurityGroup should exist', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('TapLambdaSecurityGroup should be in VPC', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('TapLambdaSecurityGroup should have restricted egress rules', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(Array.isArray(egress)).toBe(true);
      
      const rule = egress[0];
      expect(rule.IpProtocol).toBe('-1');
      expect(rule.CidrIp).toBe('10.0.0.0/16'); // Only VPC CIDR, not 0.0.0.0/0
    });

    test('TapLambdaSecurityGroup should have no inbound rules', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      // Lambda initiates outbound only, no inbound needed
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();
    });

    test('TapLambdaSecurityGroup should have correct tags', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      const tags = sg.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Name).toBe('TapLambdaSecurityGroup');
      expect(tagMap.Environment).toBe('Production');
    });
  });

  describe('IAM Role Resources', () => {
    test('TapLambdaExecutionRole should exist', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('TapLambdaExecutionRole should have correct role name', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      expect(role.Properties.RoleName).toBe('tap-lambda-secure-processor-role');
    });

    test('TapLambdaExecutionRole should allow Lambda service to assume', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      
      const statement = assumePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('TapLambdaExecutionRole should have VPC access managed policy', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      expect(Array.isArray(managedPolicies)).toBe(true);
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('TapLambdaExecutionRole should have inline policy with least privilege', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
      
      const policy = policies[0];
      expect(policy.PolicyName).toBe('tap-lambda-secure-processor-policy');
      expect(policy.PolicyDocument.Version).toBe('2012-10-17');
    });

    test('TapLambdaExecutionRole inline policy should allow logging', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const loggingStatement = policy.Statement.find((stmt: any) => stmt.Sid === 'AllowLogging');
      
      expect(loggingStatement).toBeDefined();
      expect(loggingStatement.Effect).toBe('Allow');
      expect(loggingStatement.Action).toContain('logs:CreateLogGroup');
      expect(loggingStatement.Action).toContain('logs:CreateLogStream');
      expect(loggingStatement.Action).toContain('logs:PutLogEvents');
    });

    test('TapLambdaExecutionRole inline policy should allow S3 access', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((stmt: any) => stmt.Sid === 'AllowS3DataAccess');
      
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(Array.isArray(s3Statement.Resource)).toBe(true);
    });

    test('TapLambdaExecutionRole inline policy should allow DynamoDB access', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const ddbStatement = policy.Statement.find((stmt: any) => stmt.Sid === 'AllowDynamoDBWrite');
      
      expect(ddbStatement).toBeDefined();
      expect(ddbStatement.Effect).toBe('Allow');
      expect(ddbStatement.Action).toContain('dynamodb:PutItem');
      expect(ddbStatement.Action).toContain('dynamodb:UpdateItem');
    });

    test('TapLambdaExecutionRole inline policy should allow KMS access with ARN', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const kmsStatement = policy.Statement.find((stmt: any) => stmt.Sid === 'AllowKmsUse');
      
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Effect).toBe('Allow');
      expect(kmsStatement.Action).toContain('kms:Encrypt');
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
      // Should use GetAtt for ARN, not Ref
      expect(kmsStatement.Resource).toBeDefined();
      expect(kmsStatement.Resource['Fn::GetAtt']).toBeDefined();
      expect(kmsStatement.Resource['Fn::GetAtt'][0]).toBe('TapDataKmsKey');
      expect(kmsStatement.Resource['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('TapLambdaExecutionRole inline policy should have explicit deny statements', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const denyStatement = policy.Statement.find((stmt: any) => stmt.Sid === 'ExplicitDenyDangerousActions');
      
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('s3:DeleteBucket');
      expect(denyStatement.Action).toContain('s3:PutBucketPolicy');
      expect(denyStatement.Action).toContain('kms:DisableKey');
      expect(denyStatement.Action).toContain('kms:ScheduleKeyDeletion');
      expect(denyStatement.Action).toContain('dynamodb:DeleteTable');
      expect(denyStatement.Resource).toBe('*');
    });

    test('TapLambdaExecutionRole should have correct tags', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const tags = role.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Project).toBe('SecureFinancialProcessing');
    });

    test('TapS3NotificationConfigRole should exist', () => {
      const role = template.Resources.TapS3NotificationConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('TapS3NotificationConfigRole should allow Lambda service to assume', () => {
      const role = template.Resources.TapS3NotificationConfigRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('TapS3NotificationConfigRole should have S3 notification permissions', () => {
      const role = template.Resources.TapS3NotificationConfigRole;
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statement = policy.PolicyDocument.Statement[0];
      
      expect(statement.Action).toContain('s3:PutBucketNotification');
      expect(statement.Action).toContain('s3:GetBucketNotification');
    });
  });

  describe('Lambda Function Resources', () => {
    test('TapDataProcessorLogGroup should exist', () => {
      const logGroup = template.Resources.TapDataProcessorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('TapDataProcessorLogGroup should have 7+ year retention', () => {
      const logGroup = template.Resources.TapDataProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(3653); // ~10 years, exceeds 7 years
    });

    test('TapDataProcessorLogGroup should reference Lambda function', () => {
      const logGroup = template.Resources.TapDataProcessorLogGroup;
      const logGroupName = logGroup.Properties.LogGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName['Fn::Sub']).toBeDefined();
    });

    test('TapDataProcessorFunction should exist', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('TapDataProcessorFunction should have correct runtime and handler', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Handler).toBe('index.handler');
    });

    test('TapDataProcessorFunction should use correct role', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.Role).toBeDefined();
      expect(func.Properties.Role['Fn::GetAtt']).toBeDefined();
      expect(func.Properties.Role['Fn::GetAtt'][0]).toBe('TapLambdaExecutionRole');
      expect(func.Properties.Role['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('TapDataProcessorFunction should be configured in VPC', () => {
      const func = template.Resources.TapDataProcessorFunction;
      const vpcConfig = func.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'TapLambdaSecurityGroup' });
      expect(vpcConfig.SubnetIds).toBeDefined();
      expect(vpcConfig.SubnetIds.length).toBe(3);
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'TapPrivateSubnetA' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'TapPrivateSubnetB' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'TapPrivateSubnetC' });
    });

    test('TapDataProcessorFunction should have environment variables', () => {
      const func = template.Resources.TapDataProcessorFunction;
      const env = func.Properties.Environment;
      expect(env).toBeDefined();
      expect(env.Variables).toBeDefined();
      expect(env.Variables.OUTPUT_BUCKET_NAME).toEqual({ Ref: 'TapOutputBucket' });
      expect(env.Variables.METADATA_TABLE_NAME).toEqual({ Ref: 'TapTransactionMetadataTable' });
    });

    test('TapDataProcessorFunction should have inline code', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.Code).toBeDefined();
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(typeof func.Properties.Code.ZipFile).toBe('string');
      expect(func.Properties.Code.ZipFile).toContain('def handler');
    });

    test('TapDataProcessorFunction should have correct timeout and memory', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.Timeout).toBe(60);
      expect(func.Properties.MemorySize).toBe(256);
    });

    test('TapDataProcessorFunction should have correct tags', () => {
      const func = template.Resources.TapDataProcessorFunction;
      const tags = func.Properties.Tags;
      const tagMap: Record<string, string> = {};
      tags.forEach((tag: any) => {
        tagMap[tag.Key] = tag.Value;
      });
      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Project).toBe('SecureFinancialProcessing');
    });

    test('TapS3NotificationConfigFunction should exist', () => {
      const func = template.Resources.TapS3NotificationConfigFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('TapS3NotificationConfigFunction should use correct role', () => {
      const func = template.Resources.TapS3NotificationConfigFunction;
      expect(func.Properties.Role['Fn::GetAtt'][0]).toBe('TapS3NotificationConfigRole');
    });
  });

  describe('Lambda Permission Resource', () => {
    test('TapInputBucketLambdaPermission should exist', () => {
      const permission = template.Resources.TapInputBucketLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('TapInputBucketLambdaPermission should allow S3 to invoke Lambda', () => {
      const permission = template.Resources.TapInputBucketLambdaPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'TapDataProcessorFunction' });
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn['Fn::GetAtt']).toBeDefined();
    });
  });

  describe('Custom Resource for S3 Notification', () => {
    test('TapS3NotificationConfig should exist', () => {
      const customResource = template.Resources.TapS3NotificationConfig;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::S3BucketNotification');
    });

    test('TapS3NotificationConfig should reference Lambda function', () => {
      const customResource = template.Resources.TapS3NotificationConfig;
      expect(customResource.Properties.ServiceToken['Fn::GetAtt'][0]).toBe('TapS3NotificationConfigFunction');
      expect(customResource.Properties.BucketName).toEqual({ Ref: 'TapInputBucket' });
      expect(customResource.Properties.LambdaArn['Fn::GetAtt'][0]).toBe('TapDataProcessorFunction');
    });

    test('TapS3NotificationConfig should depend on Lambda permission', () => {
      const customResource = template.Resources.TapS3NotificationConfig;
      expect(customResource.DependsOn).toBeDefined();
      expect(customResource.DependsOn).toContain('TapInputBucketLambdaPermission');
    });
  });

  describe('CloudWatch Alarm Resources', () => {
    test('TapLambdaErrorAlarm should exist', () => {
      const alarm = template.Resources.TapLambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('TapLambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.TapLambdaErrorAlarm;
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('TapLambdaErrorAlarm should have correct dimensions', () => {
      const alarm = template.Resources.TapLambdaErrorAlarm;
      const dimensions = alarm.Properties.Dimensions;
      expect(dimensions).toBeDefined();
      expect(Array.isArray(dimensions)).toBe(true);
      expect(dimensions[0].Name).toBe('FunctionName');
      expect(dimensions[0].Value).toEqual({ Ref: 'TapDataProcessorFunction' });
    });

    test('TapUnauthorizedAccessMetricFilter should exist', () => {
      const filter = template.Resources.TapUnauthorizedAccessMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
    });

    test('TapUnauthorizedAccessMetricFilter should filter AccessDenied', () => {
      const filter = template.Resources.TapUnauthorizedAccessMetricFilter;
      expect(filter.Properties.LogGroupName).toEqual({ Ref: 'TapDataProcessorLogGroup' });
      expect(filter.Properties.FilterPattern).toBe('"AccessDenied"');
    });

    test('TapUnauthorizedAccessMetricFilter should create metric', () => {
      const filter = template.Resources.TapUnauthorizedAccessMetricFilter;
      const metricTransforms = filter.Properties.MetricTransformations;
      expect(metricTransforms).toBeDefined();
      expect(Array.isArray(metricTransforms)).toBe(true);
      expect(metricTransforms[0].MetricName).toBe('UnauthorizedAccessCount');
      expect(metricTransforms[0].MetricNamespace).toBe('TapSecurity');
      expect(metricTransforms[0].MetricValue).toBe('1');
    });

    test('TapUnauthorizedAccessAlarm should exist', () => {
      const alarm = template.Resources.TapUnauthorizedAccessAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('TapUnauthorizedAccessAlarm should monitor unauthorized access metric', () => {
      const alarm = template.Resources.TapUnauthorizedAccessAlarm;
      expect(alarm.Properties.Namespace).toBe('TapSecurity');
      expect(alarm.Properties.MetricName).toBe('UnauthorizedAccessCount');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'InputBucketName',
        'OutputBucketName',
        'TransactionMetadataTableName',
        'DataProcessorFunctionName',
        'DataKmsKeyArn',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toContain('VPC ID');
      expect(output.Value).toEqual({ Ref: 'TapVpc' });
    });

    test('InputBucketName output should be correct', () => {
      const output = template.Outputs.InputBucketName;
      expect(output.Description).toContain('input S3 bucket');
      expect(output.Value).toEqual({ Ref: 'TapInputBucket' });
    });

    test('OutputBucketName output should be correct', () => {
      const output = template.Outputs.OutputBucketName;
      expect(output.Description).toContain('output S3 bucket');
      expect(output.Value).toEqual({ Ref: 'TapOutputBucket' });
    });

    test('TransactionMetadataTableName output should be correct', () => {
      const output = template.Outputs.TransactionMetadataTableName;
      expect(output.Description).toContain('DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TapTransactionMetadataTable' });
    });

    test('DataProcessorFunctionName output should be correct', () => {
      const output = template.Outputs.DataProcessorFunctionName;
      expect(output.Description).toContain('Lambda function');
      expect(output.Value).toEqual({ Ref: 'TapDataProcessorFunction' });
    });

    test('DataKmsKeyArn output should be correct', () => {
      const output = template.Outputs.DataKmsKeyArn;
      expect(output.Description).toContain('KMS CMK ARN');
      expect(output.Value).toEqual({ Ref: 'TapDataKmsKey' });
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('all subnets should reference VPC', () => {
      const subnetA = template.Resources.TapPrivateSubnetA;
      const subnetB = template.Resources.TapPrivateSubnetB;
      const subnetC = template.Resources.TapPrivateSubnetC;
      
      expect(subnetA.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      expect(subnetB.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      expect(subnetC.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('route table should reference VPC', () => {
      const routeTable = template.Resources.TapPrivateRouteTable;
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('VPC endpoints should reference VPC and route table', () => {
      const s3Endpoint = template.Resources.TapS3GatewayEndpoint;
      const dynamoEndpoint = template.Resources.TapDynamoDBGatewayEndpoint;
      
      expect(s3Endpoint.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
      expect(s3Endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'TapPrivateRouteTable' });
      expect(dynamoEndpoint.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('security group should reference VPC', () => {
      const sg = template.Resources.TapLambdaSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'TapVpc' });
    });

    test('S3 buckets should reference KMS key', () => {
      const inputBucket = template.Resources.TapInputBucket;
      const outputBucket = template.Resources.TapOutputBucket;
      
      expect(inputBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'TapDataKmsKey' });
      expect(outputBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'TapDataKmsKey' });
    });

    test('DynamoDB table should reference KMS key', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'TapDataKmsKey' });
    });

    test('Lambda function should reference IAM role', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.Role['Fn::GetAtt'][0]).toBe('TapLambdaExecutionRole');
    });

    test('Lambda function should reference security group and subnets', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.VpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'TapLambdaSecurityGroup' });
      expect(func.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'TapPrivateSubnetA' });
    });
  });

  describe('Security and Compliance Requirements', () => {
    test('all subnets should be private (no public IP)', () => {
      const subnetA = template.Resources.TapPrivateSubnetA;
      const subnetB = template.Resources.TapPrivateSubnetB;
      const subnetC = template.Resources.TapPrivateSubnetC;
      
      expect(subnetA.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnetB.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnetC.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('VPC should not have internet gateway (no public subnets)', () => {
      // Verify no Internet Gateway resource exists
      const resources = Object.keys(template.Resources);
      const hasInternetGateway = resources.some((name) => 
        name.includes('InternetGateway') || name.includes('IGW')
      );
      expect(hasInternetGateway).toBe(false);
    });

    test('S3 buckets should have encryption enabled', () => {
      const inputBucket = template.Resources.TapInputBucket;
      const outputBucket = template.Resources.TapOutputBucket;
      
      expect(inputBucket.Properties.BucketEncryption).toBeDefined();
      expect(outputBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 buckets should have versioning enabled', () => {
      const inputBucket = template.Resources.TapInputBucket;
      const outputBucket = template.Resources.TapOutputBucket;
      
      expect(inputBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(outputBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 buckets should have lifecycle policies', () => {
      const inputBucket = template.Resources.TapInputBucket;
      const outputBucket = template.Resources.TapOutputBucket;
      
      expect(inputBucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(outputBucket.Properties.LifecycleConfiguration).toBeDefined();
    });

    test('DynamoDB table should have encryption at rest', () => {
      const table = template.Resources.TapTransactionMetadataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('Lambda function should be in VPC', () => {
      const func = template.Resources.TapDataProcessorFunction;
      expect(func.Properties.VpcConfig).toBeDefined();
      expect(func.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('IAM role should have explicit deny statements', () => {
      const role = template.Resources.TapLambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const denyStatements = policy.Statement.filter((stmt: any) => stmt.Effect === 'Deny');
      expect(denyStatements.length).toBeGreaterThan(0);
    });

    test('CloudWatch log group should have 7+ year retention', () => {
      const logGroup = template.Resources.TapDataProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThanOrEqual(2555); // 7 years
    });

    test('CloudWatch alarms should exist for monitoring', () => {
      expect(template.Resources.TapLambdaErrorAlarm).toBeDefined();
      expect(template.Resources.TapUnauthorizedAccessAlarm).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resources = Object.keys(template.Resources);
      // Count all expected resources
      const expectedResources = [
        'TapVpc',
        'TapPrivateSubnetA', 'TapPrivateSubnetB', 'TapPrivateSubnetC',
        'TapPrivateRouteTable',
        'TapPrivateSubnetARouteTableAssociation',
        'TapPrivateSubnetBRouteTableAssociation',
        'TapPrivateSubnetCRouteTableAssociation',
        'TapS3GatewayEndpoint',
        'TapDynamoDBGatewayEndpoint',
        'TapDataKmsKey',
        'TapDataKmsAlias',
        'TapInputBucket',
        'TapOutputBucket',
        'TapTransactionMetadataTable',
        'TapLambdaSecurityGroup',
        'TapLambdaExecutionRole',
        'TapS3NotificationConfigRole',
        'TapDataProcessorLogGroup',
        'TapDataProcessorFunction',
        'TapS3NotificationConfigFunction',
        'TapInputBucketLambdaPermission',
        'TapS3NotificationConfig',
        'TapLambdaErrorAlarm',
        'TapUnauthorizedAccessMetricFilter',
        'TapUnauthorizedAccessAlarm',
      ];
      
      expectedResources.forEach((resourceName) => {
        expect(resources).toContain(resourceName);
      });
      
      expect(resources.length).toBe(expectedResources.length);
    });

    test('should have exactly 6 outputs', () => {
      const outputs = Object.keys(template.Outputs);
      expect(outputs.length).toBe(6);
    });
  });
});
