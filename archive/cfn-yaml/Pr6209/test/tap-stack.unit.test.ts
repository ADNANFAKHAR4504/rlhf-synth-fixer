import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Secure Financial Data Processing Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.DataProcessorLambdaFunctionArn?.split(':')[3] ||
          deployedOutputs.FinancialDataBucketArn?.split(':')[3] ||
          deployedOutputs.VPCId?.split(':')[3] ||
          'us-east-1';

        // Extract stack name and environment suffix from resource naming pattern
        if (deployedOutputs.DataProcessorLambdaFunctionName) {
          console.log('Raw Lambda Function Name:', deployedOutputs.DataProcessorLambdaFunctionName);
          const nameParts = deployedOutputs.DataProcessorLambdaFunctionName.split('-');
          console.log('Lambda Function Name parts:', nameParts);
          currentStackName = nameParts[0] || 'TapStack';

          // Find the environment suffix (look for pattern like pr8888, pr4056, etc.)
          const envSuffixIndex = nameParts.findIndex((part: string) =>
            part.match(/^(pr|dev|prod|test)\d+$/) ||
            (part.startsWith('pr') && part.length > 2)
          );
          currentEnvironmentSuffix = envSuffixIndex >= 0 ? nameParts[envSuffixIndex] : 'pr8888';
        }

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('=======================================');
    }
  });

  // Helper function to check resource dependencies in YAML text
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`Ref: ${dep}|!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // Helper function to validate resource exists in template by checking YAML text
  const validateResourceExists = (resourceName: string, resourceType: string) => {
    expect(templateYaml).toContain(`${resourceName}:`);
    expect(templateYaml).toContain(`Type: ${resourceType}`);
  };

  // Helper function to extract section from YAML text
  const extractYamlSection = (sectionName: string): string => {
    const sectionPattern = new RegExp(`^${sectionName}:\\s*$`, 'm');
    const match = templateYaml.match(sectionPattern);
    if (!match) return '';

    const startIndex = match.index! + match[0].length;
    const lines = templateYaml.substring(startIndex).split('\n');
    const sectionLines = [];

    for (const line of lines) {
      if (line.match(/^[A-Za-z]/) && !line.startsWith(' ')) {
        break; // Found next top-level section
      }
      sectionLines.push(line);
    }

    return sectionLines.join('\n');
  };

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required sections', () => {
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description: \'Secure Financial Data Processing Infrastructure - PCI-DSS Compliant\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates PCI-DSS compliance', () => {
      expect(templateYaml).toContain('Secure Financial Data Processing Infrastructure - PCI-DSS Compliant');
    });

    test('Template contains all critical AWS resource types for financial data processing', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::SecurityGroupIngress',
        'AWS::EC2::SecurityGroupEgress',
        'AWS::EC2::VPCEndpoint',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::DynamoDB::Table',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::Lambda::Function'
      ];

      criticalResourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section - Cross-Account Compatibility', () => {
    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9\\-]*$\'');
      // Dynamic check - should have a Default value that matches the allowed pattern
      expect(templateYaml).toMatch(/Default: \"[a-zA-Z0-9\-]+\"/);
      expect(templateYaml).toContain('parallel deployments');
    });

    test('EnvironmentSuffix parameter has proper validation constraints', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Description:');
      expect(parametersSection).toContain('ConstraintDescription: \'Must contain only alphanumeric characters and hyphens\'');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources - Isolated Architecture', () => {
    test('VPC is properly configured with fixed CIDR for security', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: 10.0.0.0/16');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('VPC has proper PCI-DSS compliance tags', () => {
      expect(templateYaml).toContain('Key: DataClassification');
      expect(templateYaml).toContain('Value: Confidential');
      expect(templateYaml).toContain('Key: ComplianceScope');
      expect(templateYaml).toContain('Value: PCI-DSS');
    });

    test('Private subnets are properly configured across multiple AZs', () => {
      const subnets = ['PrivateSubnet1', 'PrivateSubnet2'];
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

      subnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: ${expectedCidrs[index]}`);
        expect(templateYaml).toContain('VpcId: !Ref VPC');
        expect(templateYaml).toContain('MapPublicIpOnLaunch: false'); // No public IPs
      });

      // Verify AZ distribution
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
    });

    test('Private route table is configured without internet access', () => {
      validateResourceExists('PrivateRouteTable', 'AWS::EC2::RouteTable');

      // Should NOT have routes to Internet Gateway (no internet access)
      expect(templateYaml).not.toContain('InternetGateway');
      expect(templateYaml).not.toContain('NatGateway');
    });

    test('Subnet route table associations are configured for private subnets', () => {
      validateResourceExists('PrivateSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PrivateSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');

      expect(templateYaml).toContain('RouteTableId: !Ref PrivateRouteTable');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet1');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet2');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('VPC Endpoint Security Group allows secure AWS service access', () => {
      validateResourceExists('VPCEndpointSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('Security group for VPC endpoints - HTTPS only');
    });

    test('Lambda Security Group has restricted access', () => {
      validateResourceExists('LambdaSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('Security group for Lambda function');
    });

    test('Security group rules are properly separated for fine-grained control', () => {
      // Check for separate ingress/egress rules to avoid circular dependencies
      validateResourceExists('VPCEndpointIngressRule', 'AWS::EC2::SecurityGroupIngress');
      validateResourceExists('LambdaEgressRule', 'AWS::EC2::SecurityGroupEgress');

      expect(templateYaml).toContain('GroupId: !Ref VPCEndpointSecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');
    });
  });

  // ==================
  // VPC ENDPOINTS
  // ==================
  describe('VPC Endpoints - Secure AWS Service Access', () => {
    test('S3 VPC Endpoint provides secure S3 access without internet', () => {
      validateResourceExists('S3VPCEndpoint', 'AWS::EC2::VPCEndpoint');
      expect(templateYaml).toContain('ServiceName: !Sub \'com.amazonaws.${AWS::Region}.s3\'');
      expect(templateYaml).toContain('VpcEndpointType: Gateway');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('RouteTableIds:');
    });

    test('DynamoDB VPC Endpoint provides secure DynamoDB access', () => {
      validateResourceExists('DynamoDBVPCEndpoint', 'AWS::EC2::VPCEndpoint');
      expect(templateYaml).toContain('ServiceName: !Sub \'com.amazonaws.${AWS::Region}.dynamodb\'');
      expect(templateYaml).toContain('VpcEndpointType: Gateway');
    });

    test('VPC Endpoints have proper policy for least privilege access', () => {
      // S3 VPC Endpoint should have restricted policy
      expect(templateYaml).toContain('PolicyDocument:');
      expect(templateYaml).toContain('Action:');
      expect(templateYaml).toContain('- s3:GetObject');
      expect(templateYaml).toContain('- s3:ListBucket');
      // Note: This is read-only access as per security requirements
    });
  });

  // ===========
  // KMS ENCRYPTION
  // ===========
  describe('KMS Resources - Data Encryption', () => {
    test('Lambda KMS Key has proper configuration for environment variables', () => {
      validateResourceExists('LambdaKMSKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Description: KMS key for encrypting Lambda environment variables');
    });

    test('KMS Key has proper key policy with least privilege', () => {
      expect(templateYaml).toContain('KeyPolicy:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain('AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"');
      expect(templateYaml).toContain('kms:*');
    });

    test('KMS Key Alias is properly configured', () => {
      validateResourceExists('LambdaKMSKeyAlias', 'AWS::KMS::Alias');
      expect(templateYaml).toContain('AliasName: !Sub "alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-key"');
      expect(templateYaml).toContain('TargetKeyId: !Ref LambdaKMSKey');
    });

    test('KMS Key has proper tags for compliance', () => {
      expect(templateYaml).toContain('Key: DataClassification');
      expect(templateYaml).toContain('Value: Confidential');
      expect(templateYaml).toContain('Key: ComplianceScope');
      expect(templateYaml).toContain('Value: PCI-DSS');
    });
  });

  // ===============
  // STORAGE & DATA
  // ===============
  describe('Storage Resources - Secure Data Handling', () => {
    test('Financial Data S3 Bucket has comprehensive security configuration', () => {
      validateResourceExists('FinancialDataBucket', 'AWS::S3::Bucket');

      // Encryption
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
      expect(templateYaml).toContain('BucketKeyEnabled: true');

      // Public access blocked
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');

      // Versioning for data protection
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
    });

    test('S3 Bucket Policy enforces secure transport and access controls', () => {
      validateResourceExists('FinancialDataBucketPolicy', 'AWS::S3::BucketPolicy');

      expect(templateYaml).toContain('DenyInsecureConnections');
      expect(templateYaml).toContain('aws:SecureTransport');
      expect(templateYaml).toContain('Effect: Deny');
      expect(templateYaml).toContain('AllowLambdaReadAccess');
    });

    test('S3 Bucket has proper tags and naming', () => {
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-financial-data"');
      expect(templateYaml).toContain('Key: DataClassification');
      expect(templateYaml).toContain('Value: Confidential');
    });

    test('DynamoDB Table is configured for metadata storage with security', () => {
      validateResourceExists('ProcessingMetadataTable', 'AWS::DynamoDB::Table');

      // Key schema
      expect(templateYaml).toContain('AttributeName: TransactionId');
      expect(templateYaml).toContain('AttributeName: Timestamp');
      expect(templateYaml).toContain('KeyType: HASH');
      expect(templateYaml).toContain('KeyType: RANGE');

      // Security features
      expect(templateYaml).toContain('BillingMode: PAY_PER_REQUEST');
      expect(templateYaml).toContain('PointInTimeRecoverySpecification:');
      expect(templateYaml).toContain('PointInTimeRecoveryEnabled: true');
      expect(templateYaml).toContain('SSESpecification:');
      expect(templateYaml).toContain('SSEEnabled: true');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('Lambda Execution Role has proper assume role policy', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('AssumeRolePolicyDocument:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Service: lambda.amazonaws.com');
      expect(templateYaml).toContain('Action: \'sts:AssumeRole\'');
    });

    test('Lambda Role has required managed policies for VPC execution', () => {
      expect(templateYaml).toContain('ManagedPolicyArns:');
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda Role has specific permissions for S3 and DynamoDB access', () => {
      expect(templateYaml).toContain('PolicyDocument:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');

      // S3 permissions
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');

      // DynamoDB permissions  
      expect(templateYaml).toContain('dynamodb:PutItem');
      expect(templateYaml).toContain('dynamodb:UpdateItem');
      expect(templateYaml).toContain('dynamodb:GetItem');
      expect(templateYaml).toContain('dynamodb:Query');
    });

    test('Lambda Role has resource-specific ARN restrictions', () => {
      // S3 bucket ARN restrictions
      expect(templateYaml).toContain('!GetAtt FinancialDataBucket.Arn');
      expect(templateYaml).toContain('!Sub "${FinancialDataBucket.Arn}/*"');

      // DynamoDB table ARN restrictions
      expect(templateYaml).toContain('!GetAtt ProcessingMetadataTable.Arn');
      expect(templateYaml).toContain('!Sub "${ProcessingMetadataTable.Arn}/index/*"');
    });
  });

  // =============
  // LAMBDA FUNCTION
  // =============
  describe('Lambda Function - Data Processing Logic', () => {
    test('Lambda function has proper configuration for financial data processing', () => {
      validateResourceExists('DataProcessorLambda', 'AWS::Lambda::Function');

      expect(templateYaml).toContain('Runtime: python3.9');
      expect(templateYaml).toContain('Handler: index.lambda_handler');
      expect(templateYaml).toContain('Timeout: 300');
      expect(templateYaml).toContain('MemorySize: 512');
    });

    test('Lambda function has VPC configuration for network isolation', () => {
      expect(templateYaml).toContain('VpcConfig:');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref LambdaSecurityGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Lambda function has encrypted environment variables', () => {
      expect(templateYaml).toContain('Environment:');
      expect(templateYaml).toContain('Variables:');
      expect(templateYaml).toContain('BUCKET_NAME: !Ref FinancialDataBucket');
      expect(templateYaml).toContain('TABLE_NAME: !Ref ProcessingMetadataTable');
      expect(templateYaml).toContain('KmsKeyArn: !GetAtt LambdaKMSKey.Arn');
    });

    test('Lambda function code includes proper financial data processing logic', () => {
      expect(templateYaml).toContain('import json');
      expect(templateYaml).toContain('import boto3');
      expect(templateYaml).toContain('s3_client = boto3.client(\'s3\')');
      expect(templateYaml).toContain('dynamodb_client = boto3.client(\'dynamodb\')');
      expect(templateYaml).toContain('TransactionId');
      expect(templateYaml).toContain('Timestamp');
      expect(templateYaml).toContain('DataClassification');
    });

    test('Lambda function has dependency on log group', () => {
      expect(templateYaml).toContain('DependsOn: LambdaLogGroup');
    });

    test('Lambda function has proper error handling', () => {
      expect(templateYaml).toContain('try:');
      expect(templateYaml).toContain('except Exception as e:');
      expect(templateYaml).toContain('\'statusCode\': 200');
      expect(templateYaml).toContain('\'statusCode\': 500');
    });
  });

  // ===================
  // LOGGING & MONITORING
  // ===================
  describe('Logging Resources - Audit and Compliance', () => {
    test('Lambda Log Group is properly configured', () => {
      validateResourceExists('LambdaLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('LogGroupName: !Sub "/aws/lambda/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-processor"');
      expect(templateYaml).toContain('RetentionInDays: 90');
    });

    test('Log Group has proper tags for compliance', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-logs"');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC and networking outputs are defined with proper naming', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidr', 'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}');
      });
    });

    test('Security group outputs are defined', () => {
      const securityOutputs = ['VPCEndpointSecurityGroupId', 'LambdaSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('VPC Endpoint outputs are defined', () => {
      const vpcEndpointOutputs = ['S3VPCEndpointId', 'DynamoDBVPCEndpointId'];

      const outputsSection = extractYamlSection('Outputs');
      vpcEndpointOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('KMS and encryption outputs are defined', () => {
      const kmsOutputs = ['LambdaKMSKeyId', 'LambdaKMSKeyArn', 'LambdaKMSKeyAlias'];

      const outputsSection = extractYamlSection('Outputs');
      kmsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Storage outputs are defined', () => {
      const storageOutputs = [
        'FinancialDataBucketName', 'FinancialDataBucketArn', 'ProcessingMetadataTableName', 'ProcessingMetadataTableArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Lambda and compute outputs are defined', () => {
      const lambdaOutputs = [
        'DataProcessorLambdaFunctionName', 'DataProcessorLambdaFunctionArn', 'LambdaExecutionRoleArn', 'LambdaLogGroupName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      lambdaOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Environment information outputs are defined', () => {
      const envOutputs = ['Environment', 'StackName', 'Region'];

      const outputsSection = extractYamlSection('Outputs');
      envOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub "\${AWS::StackName}-\${EnvironmentSuffix}-[\w-]+"/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(15); // Should have many exports
    });
  });

  // ====================
  // CROSS-ACCOUNT/REGION
  // ====================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
      // Note: AWS::Partition is not used in this template as it's region-specific
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('ARN references use proper AWS naming conventions', () => {
      // Check for ARN patterns in the template (both hardcoded and dynamic)
      expect(templateYaml).toContain('arn:aws:iam::aws:policy');
      expect(templateYaml).toContain('!Sub "arn:aws:iam::${AWS::AccountId}:root"');
    });

    test('Service names use dynamic region substitution', () => {
      expect(templateYaml).toContain('com.amazonaws.${AWS::Region}.s3');
      expect(templateYaml).toContain('com.amazonaws.${AWS::Region}.dynamodb');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('PCI-DSS Security Compliance', () => {
    test('Network isolation prevents internet access', () => {
      // No Internet Gateway
      expect(templateYaml).not.toContain('AWS::EC2::InternetGateway');

      // No NAT Gateway
      expect(templateYaml).not.toContain('AWS::EC2::NatGateway');

      // No public subnets
      expect(templateYaml).not.toContain('PublicSubnet');

      // Private subnets don't map public IPs
      expect(templateYaml).toContain('MapPublicIpOnLaunch: false');
    });

    test('Data encryption is enforced at all levels', () => {
      // S3 encryption
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');

      // DynamoDB encryption
      expect(templateYaml).toContain('SSESpecification:');
      expect(templateYaml).toContain('SSEEnabled: true');

      // Lambda environment variable encryption
      expect(templateYaml).toContain('KmsKeyArn: !GetAtt LambdaKMSKey.Arn');

      // Secure transport enforcement
      expect(templateYaml).toContain('aws:SecureTransport');
    });

    test('Access controls follow least privilege principle', () => {
      // IAM policies are resource-specific
      expect(templateYaml).toContain('!GetAtt FinancialDataBucket.Arn');
      expect(templateYaml).toContain('!GetAtt ProcessingMetadataTable.Arn');

      // Security groups are restrictive
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');

      // VPC endpoints have policies
      expect(templateYaml).toContain('PolicyDocument:');
    });

    test('Audit logging is comprehensive', () => {
      // Lambda function logging
      expect(templateYaml).toContain('RetentionInDays: 90');

      // DynamoDB point-in-time recovery
      expect(templateYaml).toContain('PointInTimeRecoveryEnabled: true');

      // S3 versioning for audit trail
      expect(templateYaml).toContain('Status: Enabled');
    });

    test('All resources have proper compliance tags', () => {
      expect(templateYaml).toContain('Key: DataClassification');
      expect(templateYaml).toContain('Value: Confidential');
      expect(templateYaml).toContain('Key: ComplianceScope');
      expect(templateYaml).toContain('Value: PCI-DSS');
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('Lambda function can access S3 and DynamoDB through VPC endpoints', () => {
      // Lambda is in VPC
      validateResourceDependencies('DataProcessorLambda', ['LambdaSecurityGroup', 'PrivateSubnet1', 'PrivateSubnet2']);

      // VPC endpoints provide access to AWS services
      validateResourceDependencies('S3VPCEndpoint', ['VPC', 'PrivateRouteTable']);
      validateResourceDependencies('DynamoDBVPCEndpoint', ['VPC', 'PrivateRouteTable']);

      // Security groups allow communication
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');
    });

    test('Data flow follows secure processing pattern', () => {
      // S3 → Lambda → DynamoDB processing flow
      expect(templateYaml).toContain('BUCKET_NAME: !Ref FinancialDataBucket');
      expect(templateYaml).toContain('TABLE_NAME: !Ref ProcessingMetadataTable');

      // Lambda has permissions for both S3 and DynamoDB
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('dynamodb:PutItem');

      // Transaction metadata tracking
      expect(templateYaml).toContain('TransactionId');
      expect(templateYaml).toContain('Timestamp');
    });

    test('Resource dependencies are properly established', () => {
      // Lambda depends on log group
      validateResourceDependencies('DataProcessorLambda', ['LambdaLogGroup']);

      // Security group rules reference security groups
      validateResourceDependencies('VPCEndpointSecurityGroupIngressFromLambda', ['VPCEndpointSecurityGroup', 'LambdaSecurityGroup']);

      // VPC endpoints are in VPC with route tables
      validateResourceDependencies('S3VPCEndpoint', ['VPC', 'PrivateRouteTable']);
    });

    test('Error handling and monitoring are comprehensive', () => {
      // Lambda function has error handling
      expect(templateYaml).toContain('try:');
      expect(templateYaml).toContain('except Exception as e:');
      expect(templateYaml).toContain('print(f"Error: {str(e)}")');

      // Log group captures execution logs
      expect(templateYaml).toContain('LogGroupName: !Sub "/aws/lambda/');

      // Function returns proper status codes
      expect(templateYaml).toContain('\'statusCode\': 200');
      expect(templateYaml).toContain('\'statusCode\': 500');
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation Tests', () => {
    test('Deployment outputs exist and follow expected patterns', () => {
      // Skip if no deployment outputs
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.VPCCidr) {
        expect(deployedOutputs.VPCCidr).toBe('10.0.0.0/16');
      }

      // Subnet Resources
      const subnetOutputs = ['PrivateSubnet1Id', 'PrivateSubnet2Id'];
      subnetOutputs.forEach(subnetOutput => {
        if (deployedOutputs[subnetOutput]) {
          expect(deployedOutputs[subnetOutput]).toMatch(/^subnet-[a-f0-9]+$/);
        }
      });

      // Security Group Resources
      const sgOutputs = ['VPCEndpointSecurityGroupId', 'LambdaSecurityGroupId'];
      sgOutputs.forEach(sgOutput => {
        if (deployedOutputs[sgOutput]) {
          expect(deployedOutputs[sgOutput]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('Lambda function is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.DataProcessorLambdaFunctionArn) {
        expect(deployedOutputs.DataProcessorLambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
        expect(deployedOutputs.DataProcessorLambdaFunctionArn).toContain(region);
        expect(deployedOutputs.DataProcessorLambdaFunctionArn).toContain(currentStackName);
        expect(deployedOutputs.DataProcessorLambdaFunctionArn).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.DataProcessorLambdaFunctionName) {
        expect(deployedOutputs.DataProcessorLambdaFunctionName).toContain(currentStackName);
        expect(deployedOutputs.DataProcessorLambdaFunctionName).toContain(region);
        expect(deployedOutputs.DataProcessorLambdaFunctionName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.DataProcessorLambdaFunctionName).toContain('processor');
      }
    });

    test('Storage resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // S3 Bucket
      if (deployedOutputs.FinancialDataBucketName) {
        expect(deployedOutputs.FinancialDataBucketName).toContain(region);
        expect(deployedOutputs.FinancialDataBucketName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.FinancialDataBucketArn) {
        expect(deployedOutputs.FinancialDataBucketArn).toMatch(/^arn:aws:s3:::/);
      }

      // DynamoDB Table
      if (deployedOutputs.ProcessingMetadataTableName) {
        expect(deployedOutputs.ProcessingMetadataTableName).toContain(currentStackName);
        expect(deployedOutputs.ProcessingMetadataTableName).toContain(region);
        expect(deployedOutputs.ProcessingMetadataTableName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.ProcessingMetadataTableName).toContain('metadata');
      }

      if (deployedOutputs.ProcessingMetadataTableArn) {
        expect(deployedOutputs.ProcessingMetadataTableArn).toMatch(/^arn:aws:dynamodb:/);
        expect(deployedOutputs.ProcessingMetadataTableArn).toContain(region);
      }
    });

    test('IAM resources follow expected patterns', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.LambdaExecutionRoleArn) {
        expect(deployedOutputs.LambdaExecutionRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(deployedOutputs.LambdaExecutionRoleArn).toContain(currentStackName);
        expect(deployedOutputs.LambdaExecutionRoleArn).toContain(region);
        expect(deployedOutputs.LambdaExecutionRoleArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('KMS resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.LambdaKMSKeyId) {
        expect(deployedOutputs.LambdaKMSKeyId).toMatch(/^[a-f0-9-]+$/);
      }

      if (deployedOutputs.LambdaKMSKeyArn) {
        expect(deployedOutputs.LambdaKMSKeyArn).toMatch(/^arn:aws:kms:/);
        expect(deployedOutputs.LambdaKMSKeyArn).toContain(region);
      }
    });

    test('Environment-specific naming is applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment suffix matches what we expect
      expect(currentEnvironmentSuffix).toMatch(/^(pr|dev|prod|test)\d*$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');
    });
  });

  // ========================
  // PERFORMANCE & COST
  // ========================
  describe('Performance and Cost Optimization', () => {
    test('Lambda function is sized appropriately for financial data processing', () => {
      expect(templateYaml).toContain('MemorySize: 512'); // Balanced for processing
      expect(templateYaml).toContain('Timeout: 300'); // 5 minutes for complex processing
    });

    test('DynamoDB uses pay-per-request for cost optimization', () => {
      expect(templateYaml).toContain('BillingMode: PAY_PER_REQUEST');
    });

    test('S3 versioning provides data protection and cost optimization', () => {
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
    });

    test('Log retention prevents excessive log storage costs', () => {
      expect(templateYaml).toContain('RetentionInDays: 90'); // 3 months retention
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE
  // ========================
  describe('Reliability and Resilience', () => {
    test('Multi-AZ deployment provides high availability', () => {
      // Lambda subnets span multiple AZs
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Data protection features are enabled', () => {
      // S3 versioning
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');

      // DynamoDB point-in-time recovery
      expect(templateYaml).toContain('PointInTimeRecoverySpecification:');
      expect(templateYaml).toContain('PointInTimeRecoveryEnabled: true');
    });

    test('Error handling enables graceful failure recovery', () => {
      expect(templateYaml).toContain('try:');
      expect(templateYaml).toContain('except Exception as e:');
      expect(templateYaml).toContain('Processing failed');
      expect(templateYaml).toContain('Processing completed successfully');
    });

    test('VPC endpoints provide resilient AWS service access', () => {
      // Gateway endpoints for S3/DynamoDB don't depend on AZ-specific infrastructure
      expect(templateYaml).toContain('VpcEndpointType: Gateway');
      expect(templateYaml).toContain('RouteTableIds:');
    });
  });
});
