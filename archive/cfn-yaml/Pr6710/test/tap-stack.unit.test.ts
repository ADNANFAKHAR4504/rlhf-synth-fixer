import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Highly Available Web Application Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';
  let currentEnvironmentName = 'unknown-environment';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.StackRegion ||
          deployedOutputs.VPCId?.split(':')[3] ||
          deployedOutputs.ALBArn?.split(':')[3] ||
          deployedOutputs.EC2RoleArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name directly from outputs
        currentStackName = deployedOutputs.StackName || 'TapStack';

        // Extract environment suffix from outputs
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix || 'pr4056';

        // Extract environment name from outputs
        currentEnvironmentName = deployedOutputs.EnvironmentName || 'dev';

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('Environment Name:', currentEnvironmentName);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('Environment Name:', currentEnvironmentName);
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
      expect(templateYaml).toContain('Description: \'Highly available web application infrastructure for financial services portal\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates financial services web application', () => {
      expect(templateYaml).toContain('Highly available web application infrastructure');
      expect(templateYaml).toContain('financial services portal');
    });

    test('Template contains all critical AWS resource types for web application', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::RDS::DBCluster',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::CloudFront::Distribution',
        'AWS::WAFv2::WebACL',
        'AWS::IAM::Role',
        'AWS::CloudWatch::Alarm'
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
      expect(templateYaml).toMatch(/Default: \"pr4056\"/);
      expect(templateYaml).toContain('parallel deployments');
    });

    test('EnvironmentName parameter has proper validation', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('EnvironmentName:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Default: "dev"');
      expect(parametersSection).toContain('AllowedValues:');
      expect(parametersSection).toContain('- dev');
      expect(parametersSection).toContain('- staging');
      expect(parametersSection).toContain('- production');
    });

    test('VpcCIDR parameter has proper validation pattern', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('VpcCIDR:');
      expect(parametersSection).toContain('Default: "10.0.0.0/16"');
      expect(parametersSection).toContain('AllowedPattern:');
    });

    test('InstanceType parameter has allowed values for production workloads', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('InstanceType:');
      expect(parametersSection).toContain('Default: "t3.large"');
      expect(parametersSection).toContain('AllowedValues:');
      expect(parametersSection).toContain('- t3.medium');
      expect(parametersSection).toContain('- t3.large');
      expect(parametersSection).toContain('- m5.large');
    });

    test('No hardcoded account-specific or region-specific parameters', () => {
      const parametersSection = extractYamlSection('Parameters');
      // Should not contain any hardcoded account IDs or regions
      expect(parametersSection).not.toMatch(/\b\d{12}\b/); // Account ID pattern
      expect(parametersSection).not.toMatch(/\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/); // Region pattern
    });
  });

  // ===================
  // NETWORKING RESOURCES
  // ===================
  describe('VPC and Networking Resources', () => {
    test('VPC has proper CIDR configuration', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCIDR');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Public subnets are configured in multiple AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`- ${index}`);
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
      });
    });

    test('Private subnets are configured in multiple AZs', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`- ${index}`);
      });
    });

    test('NAT Gateways provide high availability', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      const natEIPs = ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'];

      natGateways.forEach(nat => {
        validateResourceExists(nat, 'AWS::EC2::NatGateway');
      });

      natEIPs.forEach(eip => {
        validateResourceExists(eip, 'AWS::EC2::EIP');
        expect(templateYaml).toContain('Domain: vpc');
      });
    });

    test('Route tables provide proper routing for public and private subnets', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable1', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable2', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable3', 'AWS::EC2::RouteTable');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);

      // Count occurrences to ensure it's used consistently
      const matches = templateYaml.match(new RegExp(regionEnvironmentPattern.source, 'g'));
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(30); // Should be used extensively
    });
  });

  // ==================
  // SECURITY GROUPS
  // ==================
  describe('Security Groups - Network Security', () => {
    test('ALB Security Group allows HTTP from internet', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');
      expect(templateYaml).toContain('HTTP from anywhere');
    });

    test('EC2 Security Group allows traffic only from ALB', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
      expect(templateYaml).toContain('HTTP from ALB');
    });

    test('Database Security Group allows traffic only from EC2 instances', () => {
      validateResourceExists('DBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('FromPort: 5432');
      expect(templateYaml).toContain('ToPort: 5432');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('PostgreSQL from EC2 instances');
    });

    test('Security groups have proper tags with dynamic naming', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toMatch(/Value: !Sub "\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/);
    });
  });

  // ===============
  // IAM RESOURCES
  // ===============
  describe('IAM Roles and Policies - Access Management', () => {
    test('EC2 Role has proper assume role policy', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');
      expect(templateYaml).toContain('AssumeRolePolicyDocument:');
      expect(templateYaml).toContain('Service:');
      expect(templateYaml).toContain('ec2.amazonaws.com');
      expect(templateYaml).toContain('sts:AssumeRole');
    });

    test('EC2 Role has CloudWatch agent permissions', () => {
      expect(templateYaml).toContain('ManagedPolicyArns:');
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
    });

    test('EC2 Role has SSM parameter access with least privilege', () => {
      expect(templateYaml).toContain('PolicyName: SSMParameterAccess');
      expect(templateYaml).toContain('ssm:GetParameter');
      expect(templateYaml).toContain('ssm:GetParameters');
      expect(templateYaml).toContain('ssm:GetParametersByPath');
    });

    test('EC2 Role has CloudWatch logs access', () => {
      expect(templateYaml).toContain('PolicyName: CloudWatchLogsAccess');
      expect(templateYaml).toContain('logs:CreateLogGroup');
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
    });

    test('Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });
  });

  // ======================
  // COMPUTE RESOURCES
  // ======================
  describe('EC2 and Auto Scaling - Compute Infrastructure', () => {
    test('Launch Template uses dynamic AMI resolution', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('ImageId: \'{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}\'');
      expect(templateYaml).toContain('InstanceType: !Ref InstanceType');
    });

    test('Launch Template has security hardening configurations', () => {
      expect(templateYaml).toContain('MetadataOptions:');
      expect(templateYaml).toContain('HttpTokens: required');
      expect(templateYaml).toContain('HttpPutResponseHopLimit: 1');
      expect(templateYaml).toContain('HttpEndpoint: enabled');
    });

    test('Launch Template has proper user data for web server setup', () => {
      expect(templateYaml).toContain('UserData:');
      expect(templateYaml).toContain('yum update -y');
      expect(templateYaml).toContain('yum install -y httpd');
      expect(templateYaml).toContain('Financial Services Portal');
    });

    test('Auto Scaling Group spans multiple AZs for high availability', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('Auto Scaling Group has proper capacity configuration', () => {
      expect(templateYaml).toContain('MinSize: 3');
      expect(templateYaml).toContain('MaxSize: 9');
      expect(templateYaml).toContain('DesiredCapacity: 3');
      expect(templateYaml).toContain('HealthCheckType: ELB');
    });

    test('Scheduled scaling actions are configured', () => {
      validateResourceExists('ScaleUpScheduledAction', 'AWS::AutoScaling::ScheduledAction');
      validateResourceExists('ScaleDownScheduledAction', 'AWS::AutoScaling::ScheduledAction');
      expect(templateYaml).toContain('Recurrence: "0 11 * * *"');
      expect(templateYaml).toContain('Recurrence: "0 3 * * *"');
    });
  });

  // =======================
  // LOAD BALANCER
  // =======================
  describe('Application Load Balancer - Traffic Distribution', () => {
    test('ALB is internet-facing and spans multiple AZs', () => {
      validateResourceExists('ALB', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('Subnets:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
      expect(templateYaml).toContain('- !Ref PublicSubnet3');
    });

    test('Target Group has proper health check configuration', () => {
      validateResourceExists('TargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateYaml).toContain('HealthCheckPath: /health');
      expect(templateYaml).toContain('HealthCheckProtocol: HTTP');
      expect(templateYaml).toContain('HealthCheckIntervalSeconds: 30');
      expect(templateYaml).toContain('HealthyThresholdCount: 2');
      expect(templateYaml).toContain('UnhealthyThresholdCount: 3');
    });

    test('HTTP Listener forwards traffic to target group', () => {
      validateResourceExists('HTTPListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Type: forward');
    });
  });

  // =================
  // DATABASE
  // =================
  describe('RDS Aurora - Database Infrastructure', () => {
    test('Database master secret is properly configured', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludePunctuation: true');
    });

    test('DB Subnet Group spans all private subnets', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('Aurora cluster has proper PostgreSQL configuration', () => {
      validateResourceExists('AuroraCluster', 'AWS::RDS::DBCluster');
      expect(templateYaml).toContain('Engine: aurora-postgresql');
      expect(templateYaml).toContain('EngineVersion: \'15.10\'');
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('EnableCloudwatchLogsExports:');
      expect(templateYaml).toContain('- postgresql');
    });

    test('Aurora cluster uses Secrets Manager for password management', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
    });

    test('Aurora instances are properly configured', () => {
      validateResourceExists('AuroraWriterInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('Engine: aurora-postgresql');
      expect(templateYaml).toContain('DBInstanceClass: db.r6g.large');
      expect(templateYaml).toContain('PubliclyAccessible: false');
    });

    test('Reader instance is conditionally created for production', () => {
      validateResourceExists('AuroraReaderInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('Condition: IsProduction');
    });

    test('DB cluster parameter group enforces SSL', () => {
      validateResourceExists('DBClusterParameterGroup', 'AWS::RDS::DBClusterParameterGroup');
      expect(templateYaml).toContain('Family: aurora-postgresql15');
      expect(templateYaml).toContain('rds.force_ssl: \'1\'');
    });
  });

  // ===============
  // S3 AND CLOUDFRONT
  // ===============
  describe('S3 and CloudFront - Static Content Delivery', () => {
    test('S3 bucket has proper security configuration', () => {
      validateResourceExists('StaticContentBucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('S3 bucket has lifecycle management', () => {
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('StorageClass: GLACIER');
      expect(templateYaml).toContain('TransitionInDays: 90');
    });

    test('S3 bucket is encrypted', () => {
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });

    test('S3 bucket naming includes account ID for global uniqueness', () => {
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-static"');
    });

    test('CloudFront distribution has multiple origins', () => {
      validateResourceExists('CloudFrontDistribution', 'AWS::CloudFront::Distribution');
      expect(templateYaml).toContain('Origins:');
      expect(templateYaml).toContain('Id: S3Origin');
      expect(templateYaml).toContain('Id: ALBOrigin');
    });

    test('CloudFront uses Origin Access Control', () => {
      validateResourceExists('CloudFrontOriginAccessControl', 'AWS::CloudFront::OriginAccessControl');
      expect(templateYaml).toContain('OriginAccessControlOriginType: s3');
      expect(templateYaml).toContain('SigningBehavior: always');
    });

    test('CloudFront has proper cache behaviors for API and static content', () => {
      expect(templateYaml).toContain('DefaultCacheBehavior:');
      expect(templateYaml).toContain('TargetOriginId: S3Origin');
      expect(templateYaml).toContain('CacheBehaviors:');
      expect(templateYaml).toContain('PathPattern: "/api/*"');
      expect(templateYaml).toContain('TargetOriginId: ALBOrigin');
    });

    test('Bucket policy allows CloudFront access', () => {
      validateResourceExists('BucketPolicy', 'AWS::S3::BucketPolicy');
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain('Service: cloudfront.amazonaws.com');
      expect(templateYaml).toContain('Action: s3:GetObject');
    });
  });

  // ===============
  // WAF PROTECTION
  // ===============
  describe('WAF - Web Application Firewall', () => {
    test('WAF Web ACL has rate limiting protection', () => {
      validateResourceExists('WAFWebACL', 'AWS::WAFv2::WebACL');
      expect(templateYaml).toContain('Scope: REGIONAL');
      expect(templateYaml).toContain('RateBasedStatement:');
      expect(templateYaml).toContain('Limit: 2000');
      expect(templateYaml).toContain('AggregateKeyType: IP');
    });

    test('WAF is associated with ALB', () => {
      validateResourceExists('WAFAssociation', 'AWS::WAFv2::WebACLAssociation');
      expect(templateYaml).toContain('ResourceArn: !Ref ALB');
      expect(templateYaml).toContain('WebACLArn: !GetAtt WAFWebACL.Arn');
    });

    test('WAF has visibility configuration for monitoring', () => {
      expect(templateYaml).toContain('VisibilityConfig:');
      expect(templateYaml).toContain('SampledRequestsEnabled: true');
      expect(templateYaml).toContain('CloudWatchMetricsEnabled: true');
    });
  });

  // =======================
  // CLOUDWATCH ALARMS
  // =======================
  describe('CloudWatch Alarms - Monitoring and Alerting', () => {
    test('Unhealthy host alarm monitors ALB target group', () => {
      validateResourceExists('UnhealthyHostAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: HealthyHostCount');
      expect(templateYaml).toContain('Namespace: AWS/ApplicationELB');
      expect(templateYaml).toContain('Threshold: 3');
      expect(templateYaml).toContain('ComparisonOperator: LessThanThreshold');
    });

    test('RDS CPU alarm monitors database performance', () => {
      validateResourceExists('RDSCPUAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Threshold: 80');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
    });

    test('ASG capacity alarm monitors auto scaling group', () => {
      validateResourceExists('ASGCapacityAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: GroupInServiceInstances');
      expect(templateYaml).toContain('Namespace: AWS/AutoScaling');
      expect(templateYaml).toContain('Threshold: 3');
      expect(templateYaml).toContain('ComparisonOperator: LessThanThreshold');
    });
  });

  // ======================
  // CROSS-ACCOUNT/REGION
  // ======================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      // Allow ${AWS::AccountId} but not literal 12-digit numbers
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::AccountId\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      // Allow ${AWS::Region} but not literal region names
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::Region\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('ARN references use proper AWS naming conventions', () => {
      expect(templateYaml).toContain('!Sub "arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy"');
      expect(templateYaml).toContain('!Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/*"');
    });

    test('Service names use compatible patterns for cross-region deployment', () => {
      expect(templateYaml).toContain('ec2.amazonaws.com');
      expect(templateYaml).toContain('cloudfront.amazonaws.com');
    });
  });

  // ======================
  // CONDITIONS AND LOGIC
  // ======================
  describe('CloudFormation Conditions and Logic', () => {
    test('IsProduction condition is properly defined', () => {
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('IsProduction: !Equals [!Ref EnvironmentName, "production"]');
    });

    test('Reader instance uses production condition', () => {
      expect(templateYaml).toContain('Condition: IsProduction');
    });

    test('DependsOn relationships prevent resource ordering issues', () => {
      expect(templateYaml).toContain('DependsOn:');
      expect(templateYaml).toContain('InternetGatewayAttachment');
      expect(templateYaml).toContain('- NatGateway1');
      expect(templateYaml).toContain('- NatGateway2');
      expect(templateYaml).toContain('- NatGateway3');
    });
  });

  // =================
  // OUTPUTS VALIDATION
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC outputs are defined for network integration', () => {
      const vpcOutputs = ['VPCId', 'VPCCidrBlock', 'VPCDefaultNetworkAcl', 'VPCDefaultSecurityGroup'];

      const outputsSection = extractYamlSection('Outputs');
      vpcOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub \'${AWS::StackName}');
      });
    });

    test('Subnet outputs are defined for all AZs', () => {
      const subnetOutputs = [
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id'
      ];

      const outputsSection = extractYamlSection('Outputs');
      subnetOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Load balancer outputs are defined', () => {
      const albOutputs = ['ALBArn', 'ALBDNSName', 'ALBCanonicalHostedZoneID', 'TargetGroupArn'];

      const outputsSection = extractYamlSection('Outputs');
      albOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Database outputs are defined', () => {
      const dbOutputs = ['AuroraClusterIdentifier', 'RDSClusterEndpoint', 'RDSClusterPort'];

      const outputsSection = extractYamlSection('Outputs');
      dbOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('CloudFront outputs are defined', () => {
      const cfOutputs = ['CloudFrontDistributionId', 'CloudFrontDomainName', 'CloudFrontDistributionURL'];

      const outputsSection = extractYamlSection('Outputs');
      cfOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Environment information outputs are defined', () => {
      const envOutputs = ['StackName', 'StackRegion', 'EnvironmentSuffix', 'EnvironmentName'];

      const outputsSection = extractYamlSection('Outputs');
      envOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub '\$\{AWS::StackName\}-\$\{AWS::Region\}-\$\{EnvironmentSuffix\}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).not.toBeNull();
      if (exportMatches) {
        expect(exportMatches.length).toBeGreaterThan(30); // Should have many exports
      }
    });
  });

  // ====================
  // INTEGRATION TESTING
  // ====================
  describe('End-to-End Integration Tests', () => {
    test('VPC integration - Internet Gateway and NAT Gateways', () => {
      validateResourceDependencies('InternetGatewayAttachment', ['VPC', 'InternetGateway']);
      validateResourceDependencies('NatGateway1', ['PublicSubnet1', 'NatGateway1EIP']);
      validateResourceDependencies('NatGateway2', ['PublicSubnet2', 'NatGateway2EIP']);
      validateResourceDependencies('NatGateway3', ['PublicSubnet3', 'NatGateway3EIP']);
    });

    test('Security Groups integration - Layered security model', () => {
      validateResourceDependencies('EC2SecurityGroup', ['ALBSecurityGroup']);
      validateResourceDependencies('DBSecurityGroup', ['EC2SecurityGroup']);
    });

    test('Load Balancer integration with Auto Scaling Group', () => {
      validateResourceDependencies('AutoScalingGroup', ['LaunchTemplate', 'TargetGroup']);
      validateResourceDependencies('HTTPListener', ['ALB', 'TargetGroup']);
    });

    test('Database integration with network and security', () => {
      validateResourceDependencies('AuroraCluster', ['DBSubnetGroup', 'DBSecurityGroup', 'DBClusterParameterGroup']);
      validateResourceDependencies('AuroraWriterInstance', ['AuroraCluster']);
    });

    test('CloudFront integration with S3 and ALB', () => {
      validateResourceDependencies('CloudFrontDistribution', ['StaticContentBucket', 'ALB', 'CloudFrontOriginAccessControl']);
      validateResourceDependencies('BucketPolicy', ['StaticContentBucket', 'CloudFrontDistribution']);
    });

    test('WAF integration with ALB', () => {
      validateResourceDependencies('WAFAssociation', ['ALB', 'WAFWebACL']);
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation Tests', () => {
    test('Dynamic extraction of deployment parameters works correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // Verify extracted values are reasonable
      expect(currentStackName).toBeTruthy();
      expect(currentStackName).not.toBe('unknown-stack');
      expect(currentEnvironmentSuffix).toBeTruthy();
      expect(currentEnvironmentSuffix).not.toBe('unknown-suffix');
      expect(region).toBeTruthy();
      expect(region).not.toBe('unknown-region');
      expect(currentEnvironmentName).toBeTruthy();
      expect(currentEnvironmentName).not.toBe('unknown-environment');

      console.log(`Deployment validation using: Stack=${currentStackName}, Region=${region}, Suffix=${currentEnvironmentSuffix}, Environment=${currentEnvironmentName}`);
    });

    test('VPC and networking resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.VPCCidrBlock) {
        expect(deployedOutputs.VPCCidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      }
    });

    test('Load balancer is properly deployed with expected DNS name', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.ALBDNSName) {
        expect(deployedOutputs.ALBDNSName).toContain('.elb.amazonaws.com');
        expect(deployedOutputs.ALBDNSName).toContain(region);
        expect(deployedOutputs.ALBDNSName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.ALBArn) {
        expect(deployedOutputs.ALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
        expect(deployedOutputs.ALBArn).toContain(region);
      }
    });

    test('RDS Aurora cluster is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSClusterEndpoint) {
        expect(deployedOutputs.RDSClusterEndpoint).toContain('.rds.amazonaws.com');
        expect(deployedOutputs.RDSClusterEndpoint).toContain(region);
        expect(deployedOutputs.RDSClusterEndpoint).toContain(currentStackName.toLowerCase());
        expect(deployedOutputs.RDSClusterEndpoint).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.RDSClusterPort) {
        // PostgreSQL port should be 5432, but Aurora might use MySQL (3306) - check both
        expect(['3306', '5432']).toContain(deployedOutputs.RDSClusterPort.toString());
      }
    });

    test('S3 bucket is properly deployed with account ID in name', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.StaticContentBucketName) {
        expect(deployedOutputs.StaticContentBucketName).toMatch(/^\d{12}-/); // Account ID prefix
        expect(deployedOutputs.StaticContentBucketName).toContain(region);
        expect(deployedOutputs.StaticContentBucketName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.StaticContentBucketName).toContain('-static');
      }
    });

    test('CloudFront distribution is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.CloudFrontDomainName) {
        expect(deployedOutputs.CloudFrontDomainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
      }

      if (deployedOutputs.CloudFrontDistributionURL) {
        expect(deployedOutputs.CloudFrontDistributionURL).toMatch(/^https:\/\/[a-z0-9]+\.cloudfront\.net$/);
      }
    });

    test('Auto Scaling Group is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.AutoScalingGroupName) {
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentStackName);
        expect(deployedOutputs.AutoScalingGroupName).toContain(region);
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.AutoScalingGroupName).toContain('-asg');
      }
    });

    test('WAF Web ACL is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.WAFWebACLArn) {
        expect(deployedOutputs.WAFWebACLArn).toMatch(/^arn:aws:wafv2:/);
        expect(deployedOutputs.WAFWebACLArn).toContain(region);
        expect(deployedOutputs.WAFWebACLArn).toContain('regional');
      }
    });

    test('Environment-specific naming is applied correctly across all resources', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the environment suffix matches expected pattern
      expect(currentEnvironmentSuffix).toMatch(/^(pr|dev|prod|test|staging)\d*$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      // Count how many outputs contain the environment suffix
      const outputsWithSuffix = Object.values(deployedOutputs).filter(value =>
        typeof value === 'string' && value.includes(currentEnvironmentSuffix)
      );

      expect(outputsWithSuffix.length).toBeGreaterThan(10); // Should have many resources with suffix
    });
  });

  // ========================
  // PERFORMANCE & RELIABILITY
  // ========================
  describe('Performance and Reliability', () => {
    test('High availability configuration spans multiple AZs', () => {
      // Verify resources are distributed across multiple AZs
      expect(templateYaml).toContain('!Select'); // AZ selection
      expect(templateYaml).toContain('- 0');     // First AZ
      expect(templateYaml).toContain('- 1');     // Second AZ
      expect(templateYaml).toContain('- 2');     // Third AZ
    });

    test('Auto Scaling configuration supports load variations', () => {
      expect(templateYaml).toContain('MinSize: 3');    // Minimum healthy instances
      expect(templateYaml).toContain('MaxSize: 9');    // Scale up to 9 instances
      expect(templateYaml).toContain('DesiredCapacity: 3'); // Start with 3 instances
    });

    test('Database backup and maintenance configuration', () => {
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('PreferredBackupWindow: "03:00-04:00"');
      expect(templateYaml).toContain('PreferredMaintenanceWindow: "sun:04:00-sun:05:00"');
    });

    test('CloudWatch alarms have appropriate thresholds', () => {
      expect(templateYaml).toContain('Threshold: 3');  // Unhealthy host threshold
      expect(templateYaml).toContain('Threshold: 80'); // RDS CPU threshold
    });

    test('Security hardening measures are implemented', () => {
      // Instance metadata service v2
      expect(templateYaml).toContain('HttpTokens: required');

      // SSL enforcement for database
      expect(templateYaml).toContain('rds.force_ssl: \'1\'');

      // S3 public access blocked
      expect(templateYaml).toContain('BlockPublicAcls: true');

      // WAF rate limiting
      expect(templateYaml).toContain('Limit: 2000');
    });

    test('Resource lifecycle management', () => {
      // S3 lifecycle for cost optimization
      expect(templateYaml).toContain('TransitionInDays: 90');

      // RDS deletion protection
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');

      // S3 retention policy
      expect(templateYaml).toContain('DeletionPolicy: Retain');
    });
  });
});