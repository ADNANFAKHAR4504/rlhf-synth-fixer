import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Comprehensive Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs (from ARN format: arn:aws:service:region:account:resource)
        region = process.env.AWS_REGION ||
          deployedOutputs.DBSecretArn?.split(':')[3] ||
          deployedOutputs.Ec2RoleArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from resource naming pattern (e.g., TapStack-us-east-2-dev-ec2-role)
        if (deployedOutputs.Ec2RoleArn) {
          const roleName = deployedOutputs.Ec2RoleArn.split('/').pop();
          currentStackName = roleName?.split('-')[0] || 'unknown-stack';
        } else if (deployedOutputs.DBSecretArn) {
          const secretName = deployedOutputs.DBSecretArn.split(':').pop()?.split('-')[0];
          currentStackName = secretName || 'unknown-stack';
        }
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
    }
  });

  // Helper function to check resource dependencies
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`Ref: ${dep}|!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // =================
  // BASIC VALIDATION
  // =================
  test('Template has required sections', () => {
    expect(templateYaml).toContain('AWSTemplateFormatVersion:');
    expect(templateYaml).toContain('Description:');
    expect(templateYaml).toContain('Parameters:');
    expect(templateYaml).toContain('Resources:');
    expect(templateYaml).toContain('Outputs:');
    expect(templateYaml).toContain('Mappings:');
  });

  test('Template uses proper YAML format', () => {
    // Should contain YAML intrinsic functions
    expect(templateYaml).toContain('!Ref');
    expect(templateYaml).toContain('!Sub');
    expect(templateYaml).toContain('!GetAtt');

    // Note: Template may contain JSON strings for legitimate CloudFormation configurations
    // like Secrets Manager SecretStringTemplate, which is expected and valid
  });  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section', () => {
    test('Required parameters are defined with proper constraints', () => {
      const requiredParams = [
        'Environment',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'AdminSshCidr',
        'InstanceType',
        'DbEngine',
        'DbName',
        'DbUsername',
        'DbInstanceClass',
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'EnvironmentSuffix'
      ];

      requiredParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
      });

      // Verify parameter constraints
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('Description:');
      expect(templateYaml).toContain('Default:');
    });

    test('CIDR parameters have proper validation patterns', () => {
      const cidrParams = ['VpcCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr', 'AdminSshCidr'];

      cidrParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('AllowedPattern:');
      });

      // Check CIDR validation pattern
      expect(templateYaml).toContain('(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
    });

    test('Environment parameter has proper constraints', () => {
      expect(templateYaml).toMatch(/Environment:[\s\S]*?AllowedValues:[\s\S]*?- dev[\s\S]*?- staging[\s\S]*?- prod/);
    });

    test('Database parameters have security constraints', () => {
      expect(templateYaml).toMatch(/DbUsername:[\s\S]*?NoEcho: true/);
      expect(templateYaml).toMatch(/DbUsername:[\s\S]*?AllowedPattern:/);
      expect(templateYaml).toMatch(/DbEngine:[\s\S]*?AllowedValues:[\s\S]*?- mysql[\s\S]*?- postgres/);
    });
  });

  // ====================
  // MAPPINGS
  // ====================
  describe('Mappings Section', () => {
    test('Database engine mappings are properly defined', () => {
      expect(templateYaml).toContain('DbEngineMapping:');

      // MySQL configuration
      expect(templateYaml).toMatch(/mysql:[\s\S]*?Engine: 'mysql'/);
      expect(templateYaml).toMatch(/mysql:[\s\S]*?Port: 3306/);
      expect(templateYaml).toMatch(/mysql:[\s\S]*?Family: 'mysql8.0'/);

      // PostgreSQL configuration
      expect(templateYaml).toMatch(/postgres:[\s\S]*?Engine: 'postgres'/);
      expect(templateYaml).toMatch(/postgres:[\s\S]*?Port: 5432/);
      expect(templateYaml).toMatch(/postgres:[\s\S]*?Family: 'postgres15'/);
    });

    test('ELB account mapping includes major regions', () => {
      expect(templateYaml).toContain('ELBAccountMapping:');

      const majorRegions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1'];
      majorRegions.forEach(region => {
        expect(templateYaml).toContain(`${region}:`);
        expect(templateYaml).toMatch(new RegExp(`${region}:[\\s\\S]*?AccountId: '[0-9]{12}'`));
      });
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::VPC');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
    });

    test('Subnets are properly configured across AZs', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];

      subnets.forEach(subnet => {
        expect(templateYaml).toContain(`${subnet}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::Subnet');
      });

      // Verify AZ distribution
      expect(templateYaml).toMatch(/!Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[1, !GetAZs ''\]/);

      // Verify public subnets have auto-assign public IP
      expect(templateYaml).toMatch(/PublicSubnet[12]:[\s\S]*?MapPublicIpOnLaunch: true/);
    });

    test('Internet Gateway and NAT Gateway are properly configured', () => {
      // Internet Gateway
      expect(templateYaml).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateYaml).toContain('Type: AWS::EC2::VPCGatewayAttachment');

      // NAT Gateway with EIP
      expect(templateYaml).toContain('Type: AWS::EC2::NatGateway');
      expect(templateYaml).toContain('Type: AWS::EC2::EIP');
      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('DependsOn: AttachGateway');
    });

    test('Route tables are properly configured', () => {
      // Route Tables
      expect(templateYaml).toContain('PublicRouteTable:');
      expect(templateYaml).toContain('PrivateRouteTable:');
      expect(templateYaml).toContain('Type: AWS::EC2::RouteTable');
      expect(templateYaml).toContain('Type: AWS::EC2::Route');
      expect(templateYaml).toContain('Type: AWS::EC2::SubnetRouteTableAssociation');

      // Route configurations
      expect(templateYaml).toMatch(/DestinationCidrBlock: 0.0.0.0\/0/);
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway');
    });

    test('Subnets are properly associated with route tables', () => {
      expect(templateYaml).toContain('PublicSubnet1RouteTableAssociation:');
      expect(templateYaml).toContain('PublicSubnet2RouteTableAssociation:');
      expect(templateYaml).toContain('PrivateSubnet1RouteTableAssociation:');
      expect(templateYaml).toContain('PrivateSubnet2RouteTableAssociation:');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups', () => {
    test('ALB Security Group is properly configured', () => {
      expect(templateYaml).toMatch(/AlbSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/AlbSecurityGroup:[\s\S]*?FromPort: 80[\s\S]*?ToPort: 80/);
      expect(templateYaml).toMatch(/AlbSecurityGroup:[\s\S]*?CidrIp: 0.0.0.0\/0/);
      expect(templateYaml).toMatch(/AlbSecurityGroup:[\s\S]*?IpProtocol: -1/); // Egress rule
    });

    test('EC2 Security Group is properly configured', () => {
      expect(templateYaml).toMatch(/Ec2SecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/Ec2SecurityGroup:[\s\S]*?FromPort: 80[\s\S]*?ToPort: 80/);
      expect(templateYaml).toMatch(/Ec2SecurityGroup:[\s\S]*?FromPort: 22[\s\S]*?ToPort: 22/);
      expect(templateYaml).toMatch(/Ec2SecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref AlbSecurityGroup/);
    });

    test('Database Security Group is properly configured', () => {
      expect(templateYaml).toMatch(/DbSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/DbSecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref Ec2SecurityGroup/);
      expect(templateYaml).toMatch(/DbSecurityGroup:[\s\S]*?!FindInMap \[DbEngineMapping, !Ref DbEngine, Port\]/);
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources', () => {
    test('EC2 Role is properly configured', () => {
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?Type: AWS::IAM::Role/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?ec2.amazonaws.com/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?sts:AssumeRole/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?CloudWatchAgentServerPolicy/);

      // Check S3 permissions
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?s3:ListBucket/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?s3:GetObject/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?s3:PutObject/);

      // Check CloudWatch permissions
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?logs:CreateLogGroup/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?cloudwatch:PutMetricData/);
    });

    test('EC2 Instance Profile is properly configured', () => {
      expect(templateYaml).toMatch(/Ec2InstanceProfile:[\s\S]*?Type: AWS::IAM::InstanceProfile/);
      validateResourceDependencies('Ec2InstanceProfile', ['Ec2Role']);
    });

    test('RDS Enhanced Monitoring Role is properly configured', () => {
      expect(templateYaml).toMatch(/RdsEnhancedMonitoringRole:[\s\S]*?Type: AWS::IAM::Role/);
      expect(templateYaml).toMatch(/RdsEnhancedMonitoringRole:[\s\S]*?monitoring.rds.amazonaws.com/);
      expect(templateYaml).toMatch(/RdsEnhancedMonitoringRole:[\s\S]*?AmazonRDSEnhancedMonitoringRole/);
    });

    test('IAM resources follow naming convention', () => {
      expect(templateYaml).toMatch(/RoleName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-ec2-role'/);
      expect(templateYaml).toMatch(/InstanceProfileName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-ec2-profile'/);
      expect(templateYaml).toMatch(/RoleName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-rds-enhanced-monitoring'/);
    });
  });

  // ===============
  // STORAGE
  // ===============
  describe('Storage Resources', () => {
    test('S3 Log Bucket is properly configured', () => {
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?Type: AWS::S3::Bucket/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?VersioningConfiguration:[\s\S]*?Status: Enabled/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?BlockPublicAcls: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?BlockPublicPolicy: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?IgnorePublicAcls: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?RestrictPublicBuckets: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?SSEAlgorithm: AES256/);
    });

    test('S3 Bucket Policy is properly configured for ELB and CloudTrail', () => {
      expect(templateYaml).toMatch(/LogBucketPolicy:[\s\S]*?Type: AWS::S3::BucketPolicy/);
      expect(templateYaml).toMatch(/LogBucketPolicy:[\s\S]*?AllowELBLogDelivery/);
      expect(templateYaml).toMatch(/LogBucketPolicy:[\s\S]*?AllowCloudTrailWrite/);
      expect(templateYaml).toMatch(/LogBucketPolicy:[\s\S]*?!FindInMap \[ELBAccountMapping, !Ref 'AWS::Region', AccountId\]/);
      expect(templateYaml).toMatch(/LogBucketPolicy:[\s\S]*?cloudtrail.amazonaws.com/);
    });

    test('S3 bucket follows special naming convention', () => {
      expect(templateYaml).toMatch(/BucketName: !Sub '\${EnvironmentSuffix}-\${AWS::Region}-logs-\${AWS::AccountId}'/);
    });
  });

  // =================
  // LOAD BALANCER
  // =================
  describe('Load Balancer Resources', () => {
    test('Application Load Balancer is properly configured', () => {
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Type: AWS::ElasticLoadBalancingV2::LoadBalancer/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Type: application/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Scheme: internet-facing/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?DependsOn: LogBucketPolicy/);

      // Check access logs configuration
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?access_logs.s3.enabled[\s\S]*?Value: 'true'/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?access_logs.s3.bucket[\s\S]*?Value: !Ref LogBucket/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?access_logs.s3.prefix[\s\S]*?Value: 'alb-logs'/);
    });

    test('Target Group is properly configured', () => {
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Type: AWS::ElasticLoadBalancingV2::TargetGroup/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Port: 80/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Protocol: HTTP/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?HealthCheckEnabled: true/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?HealthCheckPath: '\/'/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?TargetType: instance/);
    });

    test('ALB Listener is properly configured', () => {
      expect(templateYaml).toMatch(/AlbListener:[\s\S]*?Type: AWS::ElasticLoadBalancingV2::Listener/);
      expect(templateYaml).toMatch(/AlbListener:[\s\S]*?Port: 80/);
      expect(templateYaml).toMatch(/AlbListener:[\s\S]*?Protocol: HTTP/);
      expect(templateYaml).toMatch(/AlbListener:[\s\S]*?Type: forward/);
      validateResourceDependencies('AlbListener', ['ApplicationLoadBalancer', 'TargetGroup']);
    });
  });

  // ===================
  // AUTO SCALING & EC2
  // ===================
  describe('Auto Scaling and EC2 Resources', () => {
    test('Launch Template is properly configured', () => {
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?Type: AWS::EC2::LaunchTemplate/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?ImageId: !Sub '\{\{resolve:ssm:\${SourceAmiIdSsmParameter}\}\}'/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?InstanceType: !Ref InstanceType/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?KeyName: !Ref KeyPair/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?Monitoring:[\s\S]*?Enabled: true/);
    });

    test('Launch Template has proper UserData script', () => {
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?UserData:[\s\S]*?Fn::Base64:/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?yum update -y/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?yum install -y httpd/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?amazon-cloudwatch-agent/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?systemctl start httpd/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?cfn-signal/);
    });

    test('Auto Scaling Group is properly configured', () => {
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?Type: AWS::AutoScaling::AutoScalingGroup/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?MinSize: !Ref MinSize/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?MaxSize: !Ref MaxSize/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?DesiredCapacity: !Ref DesiredCapacity/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?HealthCheckType: ELB/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?HealthCheckGracePeriod: 300/);
    });

    test('Auto Scaling Policy is properly configured', () => {
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?Type: AWS::AutoScaling::ScalingPolicy/);
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?PolicyType: TargetTrackingScaling/);
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?ASGAverageCPUUtilization/);
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?TargetValue: 60/);
    });

    test('Key Pair is properly configured', () => {
      expect(templateYaml).toMatch(/KeyPair:[\s\S]*?Type: AWS::EC2::KeyPair/);
      expect(templateYaml).toMatch(/KeyName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-keypair'/);
    });
  });

  // =================
  // DATABASE
  // =================
  describe('Database Resources', () => {
    test('DB Subnet Group is properly configured', () => {
      expect(templateYaml).toMatch(/DbSubnetGroup:[\s\S]*?Type: AWS::RDS::DBSubnetGroup/);
      validateResourceDependencies('DbSubnetGroup', ['PrivateSubnet1', 'PrivateSubnet2']);
    });

    test('DB Parameter Group is properly configured', () => {
      expect(templateYaml).toMatch(/DbParameterGroup:[\s\S]*?Type: AWS::RDS::DBParameterGroup/);
      expect(templateYaml).toMatch(/DbParameterGroup:[\s\S]*?Family: !FindInMap \[DbEngineMapping, !Ref DbEngine, Family\]/);
    });

    test('Database Secrets are properly configured', () => {
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?Type: AWS::SecretsManager::Secret/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?GenerateSecretString:/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?SecretStringTemplate: !Sub '\{"username": "\${DbUsername}"\}'/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?GenerateStringKey: 'password'/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?PasswordLength: 16/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?ExcludePunctuation: true/);
    });

    test('RDS Instance is properly configured', () => {
      expect(templateYaml).toMatch(/Database:[\s\S]*?Type: AWS::RDS::DBInstance/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?DeletionPolicy: Snapshot/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?UpdateReplacePolicy: Snapshot/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?StorageEncrypted: true/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?MultiAZ: true/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?StorageType: gp3/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?MonitoringInterval: 60/);
      expect(templateYaml).toMatch(/Database:[\s\S]*?BackupRetentionPeriod: 7/);

      // Verify password comes from secrets manager
      expect(templateYaml).toMatch(/Database:[\s\S]*?MasterUserPassword: !Sub '\{\{resolve:secretsmanager:\${DBMasterSecret}:SecretString:password\}\}'/);
    });
  });

  // =================
  // MONITORING
  // =================
  describe('Monitoring Resources', () => {
    test('CloudTrail is properly configured', () => {
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?Type: AWS::CloudTrail::Trail/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?DependsOn: LogBucketPolicy/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?S3BucketName: !Ref LogBucket/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?S3KeyPrefix: 'cloudtrail'/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?IsLogging: true/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?IsMultiRegionTrail: true/);
      expect(templateYaml).toMatch(/CloudTrail:[\s\S]*?EnableLogFileValidation: true/);
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section', () => {
    test('All required outputs are defined', () => {
      const requiredOutputs = [
        'VpcId',
        'AlbDnsName',
        'AlbUrl',
        'KeyPairName',
        'RdsEndpoint',
        'RdsPort',
        'LogBucketName',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DBSecretArn',
        // Additional comprehensive outputs
        'InternetGatewayId',
        'NatGatewayId',
        'AlbSecurityGroupId',
        'Ec2SecurityGroupId',
        'DbSecurityGroupId',
        'Ec2RoleArn',
        'ApplicationLoadBalancerArn',
        'TargetGroupArn',
        'LaunchTemplateId',
        'AutoScalingGroupName',
        'DatabaseId'
      ];

      requiredOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toContain('Export:');
      });
    });

    test('Outputs follow proper naming convention', () => {
      // Standard resources use StackName-Region-EnvironmentSuffix pattern in Export Names
      const exportNamePattern = /Export:[\s\S]*?Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportNamePattern) || [];
      expect(exportMatches.length).toBeGreaterThan(10);

      // S3 bucket uses special pattern
      expect(templateYaml).toMatch(/Name: !Sub '\${EnvironmentSuffix}-\${AWS::Region}-logbucket/);
    });

    test('Outputs provide comprehensive resource access', () => {
      // Network resources
      expect(templateYaml).toMatch(/VpcId:[\s\S]*?Value: !Ref Vpc/);
      expect(templateYaml).toMatch(/PublicSubnet1Id:[\s\S]*?Value: !Ref PublicSubnet1/);

      // Security resources
      expect(templateYaml).toMatch(/AlbSecurityGroupId:[\s\S]*?Value: !Ref AlbSecurityGroup/);

      // Application resources
      expect(templateYaml).toMatch(/ApplicationLoadBalancerArn:[\s\S]*?Value: !Ref ApplicationLoadBalancer/);
      expect(templateYaml).toMatch(/AutoScalingGroupName:[\s\S]*?Value: !Ref AutoScalingGroup/);

      // Database resources
      expect(templateYaml).toMatch(/DatabaseId:[\s\S]*?Value: !Ref Database/);
      expect(templateYaml).toMatch(/DBSecretArn:[\s\S]*?Value: !Ref DBMasterSecret/);
    });
  });

  // ====================
  // CROSS-ACCOUNT COMPATIBILITY
  // ====================
  describe('Cross-Account Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      // Should not contain account IDs except in mappings
      const accountIdPattern = /[^:]\d{12}[^']/;
      const templateWithoutMappings = templateYaml.replace(/ELBAccountMapping:[\s\S]*?(?=\n\w)/m, '');
      expect(templateWithoutMappings).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names outside mappings', () => {
      const regionPattern = /(?<!AccountMapping:[\s\S]{0,1000})\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic references for region and account', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('No hardcoded availability zones', () => {
      expect(templateYaml).toMatch(/!Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[1, !GetAZs ''\]/);
      expect(templateYaml).not.toMatch(/us-east-1[a-z]/);
    });

    test('Resource names are parameterized', () => {
      expect(templateYaml).toMatch(/Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/);
      expect(templateYaml).not.toMatch(/Name: '[^$]*TapStack[^$]*'/);
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation', () => {
    test('Deployed resources match expected formats', () => {
      // Skip if no deployment outputs
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VpcId) {
        expect(deployedOutputs.VpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }
      if (deployedOutputs.PublicSubnet1Id) {
        expect(deployedOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      }
      if (deployedOutputs.AlbSecurityGroupId) {
        expect(deployedOutputs.AlbSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      }

      // Load Balancer
      if (deployedOutputs.AlbDnsName) {
        expect(deployedOutputs.AlbDnsName).toMatch(/\.elb\./);
      }
      if (deployedOutputs.ApplicationLoadBalancerArn) {
        expect(deployedOutputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      }

      // Database
      if (deployedOutputs.RdsEndpoint) {
        expect(deployedOutputs.RdsEndpoint).toMatch(/\.rds\./);
      }
      if (deployedOutputs.DBSecretArn) {
        expect(deployedOutputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      }

      // IAM
      if (deployedOutputs.Ec2RoleArn) {
        expect(deployedOutputs.Ec2RoleArn).toMatch(/^arn:aws:iam::/);
      }

      // Auto Scaling
      if (deployedOutputs.AutoScalingGroupName) {
        expect(deployedOutputs.AutoScalingGroupName).toMatch(new RegExp(`${currentStackName}-${region}-`));
      }

      // Key Pair
      if (deployedOutputs.KeyPairName) {
        expect(deployedOutputs.KeyPairName).toMatch(new RegExp(`${currentStackName}-${region}-`));
      }
    });

    test('Resource naming follows deployment convention', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping naming convention validation - no outputs available');
        return;
      }

      // Check naming pattern for standard resources
      const namingPattern = new RegExp(`^${currentStackName}-${region}-[\\w]+-[\\w-]+`);

      if (deployedOutputs.Ec2RoleArn) {
        const roleName = deployedOutputs.Ec2RoleArn.split('/').pop();
        expect(roleName).toMatch(namingPattern);
      }

      if (deployedOutputs.KeyPairName) {
        expect(deployedOutputs.KeyPairName).toMatch(namingPattern);
      }

      // Check S3 bucket special naming (environmentSuffix-region-logs-accountId)
      if (deployedOutputs.LogBucketName) {
        expect(deployedOutputs.LogBucketName).toMatch(/^[\w]+-[\w-]+-logs-\d{12}$/);
      }
    });

    test('Cross-service integrations work properly', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping integration validation - no outputs available');
        return;
      }

      // ALB should have proper URL format
      if (deployedOutputs.AlbUrl) {
        expect(deployedOutputs.AlbUrl).toMatch(/^http:\/\//);
        expect(deployedOutputs.AlbUrl).toContain(deployedOutputs.AlbDnsName || '');
      }

      // Database endpoint should be accessible format
      if (deployedOutputs.RdsEndpoint && deployedOutputs.RdsPort) {
        expect(deployedOutputs.RdsPort).toMatch(/^(3306|5432)$/); // MySQL or PostgreSQL
      }
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('Security Configuration', () => {
    test('Database security is properly configured', () => {
      // Password stored in Secrets Manager
      expect(templateYaml).toMatch(/MasterUserPassword: !Sub '\{\{resolve:secretsmanager:\${DBMasterSecret}:SecretString:password\}\}'/);

      // Database in private subnets
      expect(templateYaml).toMatch(/Database:[\s\S]*?DBSubnetGroupName: !Ref DbSubnetGroup/);
      expect(templateYaml).toMatch(/DbSubnetGroup:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);

      // Database encryption enabled
      expect(templateYaml).toMatch(/Database:[\s\S]*?StorageEncrypted: true/);
    });

    test('S3 bucket security is properly configured', () => {
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?BlockPublicAcls: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?BlockPublicPolicy: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?IgnorePublicAcls: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?RestrictPublicBuckets: true/);
      expect(templateYaml).toMatch(/LogBucket:[\s\S]*?SSEAlgorithm: AES256/);
    });

    test('Network security is properly configured', () => {
      // Private subnets for database and app servers
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?VPCZoneIdentifier:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);

      // Security groups follow least privilege
      expect(templateYaml).toMatch(/DbSecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref Ec2SecurityGroup/);
      expect(templateYaml).toMatch(/Ec2SecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref AlbSecurityGroup/);
    });

    test('IAM follows least privilege principle', () => {
      // EC2 role has specific permissions, not admin
      expect(templateYaml).not.toMatch(/Ec2Role:[\s\S]*?\*:\*/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?logs:CreateLogGroup/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?s3:PutObject/);
      expect(templateYaml).toMatch(/Ec2Role:[\s\S]*?cloudwatch:PutMetricData/);
    });
  });
});
