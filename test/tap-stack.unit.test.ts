import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests (YAML validation)', () => {
  let content: string;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    content = fs.readFileSync(templatePath, 'utf8');
  });

  const expectMatch = (re: RegExp) => {
    expect(re.test(content)).toBe(true);
  };

  describe('Template Structure', () => {
    test('has valid format version', () => {
      expectMatch(/AWSTemplateFormatVersion:\s*'2010-09-09'/);
    });
    test('has a meaningful description', () => {
      expectMatch(/Description:\s*>[\s\S]*Healthcare Application Infrastructure/);
    });
    test('has metadata interface with parameter groups', () => {
      expectMatch(/Metadata:\s*[\s\S]*AWS::CloudFormation::Interface/);
      expectMatch(/ParameterGroups:[\s\S]*EnvironmentSuffix/);
      expectMatch(/ParameterGroups:[\s\S]*ApplicationName[\s\S]*DatabaseInstanceClass[\s\S]*VpcCidr/);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix', () => {
      expectMatch(/Parameters:[\s\S]*EnvironmentSuffix:[\s\S]*Type:\s*String/);
      expectMatch(/EnvironmentSuffix:[\s\S]*Default:\s*'prod'/);
      expectMatch(/EnvironmentSuffix:[\s\S]*AllowedPattern:\s*'\^\[a-zA-Z0-9\]\+\$'/);
      expectMatch(/EnvironmentSuffix:[\s\S]*ConstraintDescription:/);
    });
    test('ApplicationName', () => {
      expectMatch(/ApplicationName:[\s\S]*Type:\s*String/);
      expectMatch(/ApplicationName:[\s\S]*Default:\s*'healthapp'/);
    });
    test('DatabaseInstanceClass', () => {
      expectMatch(/DatabaseInstanceClass:[\s\S]*Type:\s*String/);
      expectMatch(/AllowedValues:[\s\S]*db\.t3\.medium[\s\S]*db\.t3\.large[\s\S]*db\.r5\.large[\s\S]*db\.r5\.xlarge/);
    });
    test('VpcCidr', () => {
      expectMatch(/VpcCidr:[\s\S]*Default:\s*10\.0\.0\.0\/16/);
    });
  });

  describe('Conditions', () => {
    test('IsProd condition exists and references EnvironmentSuffix', () => {
      expectMatch(/Conditions:[\s\S]*IsProd:\s*!Equals\s*\[\s*!Ref\s*EnvironmentSuffix\s*,\s*'prod'\s*\]/);
    });
  });

  describe('KMS and Secrets', () => {
    test('KMS Key with rotation and alias', () => {
      expectMatch(/HealthcareKMSKey:\s*[\s\S]*Type:\s*AWS::KMS::Key/);
      expectMatch(/HealthcareKMSKey:[\s\S]*EnableKeyRotation:\s*true/);
      expectMatch(/HealthcareKMSKeyAlias:[\s\S]*Type:\s*AWS::KMS::Alias/);
      expectMatch(/HealthcareKMSKeyAlias:[\s\S]*TargetKeyId:\s*!Ref\s*HealthcareKMSKey/);
    });
    test('Secrets Manager for DB with KMS', () => {
      expectMatch(/DatabaseSecret:[\s\S]*Type:\s*AWS::SecretsManager::Secret/);
      expectMatch(/DatabaseSecret:[\s\S]*KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/GenerateSecretString:[\s\S]*GenerateStringKey:\s*password[\s\S]*PasswordLength:\s*32/);
    });
    test('API Secret with KMS', () => {
      expectMatch(/ApplicationAPISecret:[\s\S]*Type:\s*AWS::SecretsManager::Secret/);
      expectMatch(/ApplicationAPISecret:[\s\S]*KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/ApplicationAPISecret:[\s\S]*SecretString:[\s\S]*api_key/);
      expectMatch(/ApplicationAPISecret:[\s\S]*SecretString:[\s\S]*jwt_secret/);
    });
  });

  describe('Networking', () => {
    test('VPC and subnets', () => {
      expectMatch(/HealthcareVPC:[\s\S]*Type:\s*AWS::EC2::VPC/);
      expectMatch(/PrivateSubnet1:[\s\S]*Type:\s*AWS::EC2::Subnet/);
      expectMatch(/PrivateSubnet2:[\s\S]*Type:\s*AWS::EC2::Subnet/);
      expectMatch(/PublicSubnet1:[\s\S]*MapPublicIpOnLaunch:\s*true/);
      expectMatch(/PublicSubnet2:[\s\S]*MapPublicIpOnLaunch:\s*true/);
    });
    test('IGW, route table and default route', () => {
      expectMatch(/InternetGateway:[\s\S]*Type:\s*AWS::EC2::InternetGateway/);
      expectMatch(/AttachGateway:[\s\S]*Type:\s*AWS::EC2::VPCGatewayAttachment/);
      expectMatch(/PublicRouteTable:[\s\S]*Type:\s*AWS::EC2::RouteTable/);
      expectMatch(/PublicRoute:[\s\S]*Type:\s*AWS::EC2::Route[\s\S]*DestinationCidrBlock:\s*0\.0\.0\.0\/0/);
      expectMatch(/PublicSubnetRouteTableAssociation1:[\s\S]*Type:\s*AWS::EC2::SubnetRouteTableAssociation/);
      expectMatch(/PublicSubnetRouteTableAssociation2:[\s\S]*Type:\s*AWS::EC2::SubnetRouteTableAssociation/);
    });
  });

  describe('S3 Buckets', () => {
    test('Data bucket encryption, PAB, versioning, logging, tags', () => {
      expectMatch(/HealthcareDataBucket:[\s\S]*Type:\s*AWS::S3::Bucket/);
      expectMatch(/HealthcareDataBucket:[\s\S]*DeletionPolicy:\s*Delete/);
      expectMatch(/HealthcareDataBucket:[\s\S]*BucketName:\s*!Sub/);
      expectMatch(/HealthcareDataBucket:[\s\S]*SSEAlgorithm:\s*aws:kms/);
      expectMatch(/HealthcareDataBucket:[\s\S]*KMSMasterKeyID:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/HealthcareDataBucket:[\s\S]*BucketKeyEnabled:\s*true/);
      expectMatch(/HealthcareDataBucket:[\s\S]*PublicAccessBlockConfiguration:[\s\S]*BlockPublicAcls:\s*true/);
      expectMatch(/HealthcareDataBucket:[\s\S]*RestrictPublicBuckets:\s*true/);
      expectMatch(/HealthcareDataBucket:[\s\S]*VersioningConfiguration:[\s\S]*Status:\s*Enabled/);
      expectMatch(/HealthcareDataBucket:[\s\S]*LoggingConfiguration:[\s\S]*DestinationBucketName:\s*!Ref\s*HealthcareLogsBucket/);
      expectMatch(/HealthcareDataBucket:[\s\S]*DataClassification[\s\S]*PHI-Sensitive/);
    });
    test('Logs bucket encryption and PAB', () => {
      expectMatch(/HealthcareLogsBucket:[\s\S]*Type:\s*AWS::S3::Bucket/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*DeletionPolicy:\s*Delete/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*BucketName:\s*!Sub/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*SSEAlgorithm:\s*aws:kms/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*KMSMasterKeyID:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*PublicAccessBlockConfiguration:[\s\S]*BlockPublicAcls:\s*true/);
    });
  });

  describe('RDS', () => {
    test('Subnet group and SG ingress', () => {
      expectMatch(/DatabaseSubnetGroup:[\s\S]*Type:\s*AWS::RDS::DBSubnetGroup/);
      expectMatch(/DatabaseSecurityGroup:[\s\S]*Type:\s*AWS::EC2::SecurityGroup/);
      expectMatch(/DatabaseSecurityGroup:[\s\S]*FromPort:\s*5432[\s\S]*SourceSecurityGroupId:\s*!Ref\s*ApplicationSecurityGroup/);
    });
    test('DB instance config, encryption, PI, tags', () => {
      expectMatch(/HealthcareDatabase:[\s\S]*Type:\s*AWS::RDS::DBInstance/);
      expectMatch(/HealthcareDatabase:[\s\S]*DeletionPolicy:\s*Delete/);
      expectMatch(/UpdateReplacePolicy:\s*Delete/);
      expectMatch(/Engine:\s*postgres/);
      expectMatch(/EngineVersion:\s*13\.21/);
      expectMatch(/AllocatedStorage:\s*100/);
      expectMatch(/StorageType:\s*gp2/);
      expectMatch(/StorageEncrypted:\s*true/);
      expectMatch(/KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/MasterUsername:\s*"healthapp_admin"/);
      expectMatch(/MasterUserPassword:\s*!Sub\s*"\{\{resolve:secretsmanager:\$\{DatabaseSecret\}:SecretString:password\}\}"/);
      expectMatch(/VPCSecurityGroups:[\s\S]*!Ref\s*DatabaseSecurityGroup/);
      expectMatch(/DBSubnetGroupName:\s*!Ref\s*DatabaseSubnetGroup/);
      expectMatch(/BackupRetentionPeriod:\s*30/);
      expectMatch(/PreferredBackupWindow:/);
      expectMatch(/PreferredMaintenanceWindow:/);
      expectMatch(/MonitoringInterval:\s*60/);
      expectMatch(/EnablePerformanceInsights:\s*true/);
      expectMatch(/PerformanceInsightsKMSKeyId:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/DeletionProtection:\s*false/);
      expectMatch(/DataClassification[\s\S]*PHI-Sensitive/);
    });
  });

  describe('Security Groups', () => {
    test('ApplicationSecurityGroup ingress from LoadBalancerSecurityGroup', () => {
      expectMatch(/ApplicationSecurityGroup:[\s\S]*Type:\s*AWS::EC2::SecurityGroup/);
      expectMatch(/ApplicationSecurityGroup:[\s\S]*FromPort:\s*80[\s\S]*SourceSecurityGroupId:\s*!Ref\s*LoadBalancerSecurityGroup/);
      expectMatch(/ApplicationSecurityGroup:[\s\S]*FromPort:\s*443[\s\S]*SourceSecurityGroupId:\s*!Ref\s*LoadBalancerSecurityGroup/);
    });
    test('LoadBalancerSecurityGroup ingress from internet', () => {
      expectMatch(/LoadBalancerSecurityGroup:[\s\S]*Type:\s*AWS::EC2::SecurityGroup/);
      expectMatch(/LoadBalancerSecurityGroup:[\s\S]*FromPort:\s*80[\s\S]*CidrIp:\s*0\.0\.0\.0\/0/);
      expectMatch(/LoadBalancerSecurityGroup:[\s\S]*FromPort:\s*443[\s\S]*CidrIp:\s*0\.0\.0\.0\/0/);
    });
  });

  describe('IAM and Logs', () => {
    test('RDS Enhanced Monitoring role', () => {
      expectMatch(/RDSEnhancedMonitoringRole:[\s\S]*Type:\s*AWS::IAM::Role/);
      expectMatch(/AssumeRolePolicyDocument:[\s\S]*monitoring\.rds\.amazonaws\.com/);
      expectMatch(/ManagedPolicyArns:[\s\S]*AmazonRDSEnhancedMonitoringRole/);
    });
    test('ApplicationRole inline policy with S3, Secrets Manager, KMS', () => {
      expectMatch(/ApplicationRole:[\s\S]*Type:\s*AWS::IAM::Role/);
      expectMatch(/Policies:[\s\S]*HealthcareAppPolicy/);
      expectMatch(/Statement:[\s\S]*s3:GetObject/);
      expectMatch(/Statement:[\s\S]*s3:ListBucket/);
      expectMatch(/Statement:[\s\S]*secretsmanager:GetSecretValue/);
      expectMatch(/Statement:[\s\S]*kms:Decrypt/);
    });
    test('Instance profile and log group with KMS + retention', () => {
      expectMatch(/ApplicationInstanceProfile:[\s\S]*Type:\s*AWS::IAM::InstanceProfile/);
      expectMatch(/ApplicationLogGroup:[\s\S]*Type:\s*AWS::Logs::LogGroup/);
      expectMatch(/ApplicationLogGroup:[\s\S]*RetentionInDays:\s*!If\s*\[\s*IsProd\s*,\s*2557\s*,\s*365\s*\]/);
      expectMatch(/ApplicationLogGroup:[\s\S]*KmsKeyId:\s*!GetAtt\s*HealthcareKMSKey\.Arn/);
    });
  });

  describe('Outputs', () => {
    test('VPC and Subnets outputs', () => {
      expectMatch(/Outputs:[\s\S]*VPCId:[\s\S]*Value:\s*!Ref\s*HealthcareVPC/);
      expectMatch(/VPCId:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-VPC-ID"/);
      expectMatch(/PrivateSubnetIds:[\s\S]*!Join\s*\[/);
      expectMatch(/PrivateSubnetIds:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Private-Subnet-IDs"/);
      expectMatch(/PublicSubnetIds:[\s\S]*!Join\s*\[/);
      expectMatch(/PublicSubnetIds:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Public-Subnet-IDs"/);
    });
    test('Database, KMS, S3, Secrets, IAM, SG outputs', () => {
      expectMatch(/DatabaseEndpoint:[\s\S]*Value:\s*!GetAtt\s*HealthcareDatabase\.Endpoint\.Address/);
      expectMatch(/DatabaseEndpoint:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Database-Endpoint"/);
      expectMatch(/KMSKeyId:[\s\S]*Value:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/KMSKeyId:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-KMS-Key-ID"/);
      expectMatch(/PatientDataBucket:[\s\S]*Value:\s*!Ref\s*HealthcareDataBucket/);
      expectMatch(/PatientDataBucket:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Patient-Data-Bucket"/);
      expectMatch(/LogsBucket:[\s\S]*Value:\s*!Ref\s*HealthcareLogsBucket/);
      expectMatch(/LogsBucket:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Logs-Bucket"/);
      expectMatch(/DatabaseSecretArn:[\s\S]*Value:\s*!Ref\s*DatabaseSecret/);
      expectMatch(/DatabaseSecretArn:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Database-Secret-ARN"/);
      expectMatch(/ApplicationAPISecretArn:[\s\S]*Value:\s*!Ref\s*ApplicationAPISecret/);
      expectMatch(/ApplicationAPISecretArn:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-API-Secret-ARN"/);
      expectMatch(/ApplicationRoleArn:[\s\S]*Value:\s*!GetAtt\s*ApplicationRole\.Arn/);
      expectMatch(/ApplicationRoleArn:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Application-Role-ARN"/);
      expectMatch(/ApplicationSecurityGroupId:[\s\S]*Value:\s*!Ref\s*ApplicationSecurityGroup/);
      expectMatch(/ApplicationSecurityGroupId:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-Application-SG-ID"/);
      expectMatch(/LoadBalancerSecurityGroupId:[\s\S]*Value:\s*!Ref\s*LoadBalancerSecurityGroup/);
      expectMatch(/LoadBalancerSecurityGroupId:[\s\S]*Export:[\s\S]*Name:\s*!Sub\s*"\$\{AWS::StackName}-LoadBalancer-SG-ID"/);
    });
  });

  describe('HIPAA Compliance Requirements', () => {
    test('All resources use KMS encryption', () => {
      // S3 buckets
      expectMatch(/HealthcareDataBucket:[\s\S]*KMSMasterKeyID:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*KMSMasterKeyID:\s*!Ref\s*HealthcareKMSKey/);
      // RDS
      expectMatch(/HealthcareDatabase:[\s\S]*StorageEncrypted:\s*true/);
      expectMatch(/HealthcareDatabase:[\s\S]*KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      // Secrets
      expectMatch(/DatabaseSecret:[\s\S]*KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      expectMatch(/ApplicationAPISecret:[\s\S]*KmsKeyId:\s*!Ref\s*HealthcareKMSKey/);
      // CloudWatch Logs
      expectMatch(/ApplicationLogGroup:[\s\S]*KmsKeyId:\s*!GetAtt\s*HealthcareKMSKey\.Arn/);
    });
    test('All sensitive data stored in Secrets Manager', () => {
      expectMatch(/DatabaseSecret:[\s\S]*Type:\s*AWS::SecretsManager::Secret/);
      expectMatch(/ApplicationAPISecret:[\s\S]*Type:\s*AWS::SecretsManager::Secret/);
      expectMatch(/MasterUserPassword:\s*!Sub\s*"\{\{resolve:secretsmanager/);
    });
    test('All resources tagged with required tags', () => {
      // Check Project tag
      expectMatch(/Tags:[\s\S]*-\s*Key:\s*Project[\s\S]*Value:\s*HealthApp/);
      // Check Environment tag is Production (not EnvironmentSuffix)
      expectMatch(/Tags:[\s\S]*-\s*Key:\s*Environment[\s\S]*Value:\s*Production/);
    });
    test('No Retain policies (resources must be destroyable)', () => {
      // Should not find any Retain policies
      expect(content.match(/DeletionPolicy:\s*Retain/g)).toBeNull();
      // Should have Delete policies instead
      expectMatch(/HealthcareDataBucket:[\s\S]*DeletionPolicy:\s*Delete/);
      expectMatch(/HealthcareLogsBucket:[\s\S]*DeletionPolicy:\s*Delete/);
      expectMatch(/HealthcareDatabase:[\s\S]*DeletionPolicy:\s*Delete/);
    });
    test('Environment suffix used in resource names', () => {
      expectMatch(/BucketName:\s*!Sub\s*'\$\{ApplicationName\}-patient-data-\$\{EnvironmentSuffix\}/);
      expectMatch(/BucketName:\s*!Sub\s*'\$\{ApplicationName\}-logs-\$\{EnvironmentSuffix\}/);
      expectMatch(/DBInstanceIdentifier:\s*!Sub\s*"\$\{ApplicationName\}-\$\{EnvironmentSuffix\}-database"/);
      expectMatch(/RoleName:\s*!Sub\s*"\$\{ApplicationName\}-\$\{EnvironmentSuffix\}-/);
    });
    test('Public access blocked on S3 buckets', () => {
      expectMatch(/PublicAccessBlockConfiguration:[\s\S]*BlockPublicAcls:\s*true/);
      expectMatch(/PublicAccessBlockConfiguration:[\s\S]*BlockPublicPolicy:\s*true/);
      expectMatch(/PublicAccessBlockConfiguration:[\s\S]*IgnorePublicAcls:\s*true/);
      expectMatch(/PublicAccessBlockConfiguration:[\s\S]*RestrictPublicBuckets:\s*true/);
    });
  });
});
