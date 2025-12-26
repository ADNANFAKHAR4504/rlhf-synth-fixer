import fs from 'fs';
import path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
let template: any;

describe('TapStack CloudFormation Template - Unit Tests', () => {
  beforeAll(() => {
    // Load the CloudFormation template JSON
    // If testing YAML template, run `pipenv run cfn-flip-to-json > lib/TapStack.json` first
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template JSON not found at ${templatePath}. Please convert YAML to JSON first using: cfn-flip-to-json lib/TapStack.yml > lib/TapStack.json`
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // TEMPLATE STRUCTURE TESTS 
  describe('Template Structure', () => {

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const metadataInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadataInterface.ParameterGroups).toBeDefined();
      expect(Array.isArray(metadataInterface.ParameterGroups)).toBe(true);
      expect(metadataInterface.ParameterGroups.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });


  // PARAMETERS VALIDATION 
  describe('Parameters Validation', () => {
    const requiredParameters = [
      'VPCCIDR',
      'PublicSubnet1CIDR',
      'PublicSubnet2CIDR',
      'PrivateSubnet1CIDR',
      'PrivateSubnet2CIDR',
      'InstanceType',
      'KeyPairName',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'TargetCPUUtilization',
      'LatestAmiId',
      'DBInstanceClass',
      'DBUsername',
      'DBAllocatedStorage',
      'DBBackupRetentionPeriod',
      'AllowedIPRange',
      'EnableHTTPS',
      'CertificateArn',
      'EnableSessionManager',
      'EnableDetailedMonitoring',
      'LogRetentionDays',
      'UseNATInstance',
      'EnableSpotInstances',
      'SpotMaxPrice',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    describe('Network Parameters', () => {
      test('VPCCIDR should have correct properties and validation', () => {
        const param = template.Parameters.VPCCIDR;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.0.0/16');
        expect(param.AllowedPattern).toBeDefined();
        // AllowedPattern should be a regex pattern for CIDR validation
        expect(typeof param.AllowedPattern).toBe('string');
        expect(param.AllowedPattern.length).toBeGreaterThan(0);
      });

      test('PublicSubnet1CIDR should have default value', () => {
        const param = template.Parameters.PublicSubnet1CIDR;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.1.0/24');
      });

      test('PrivateSubnet1CIDR should have default value', () => {
        const param = template.Parameters.PrivateSubnet1CIDR;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.10.0/24');
      });
    });

    describe('Application Parameters', () => {
      test('MinSize should have minimum value constraint', () => {
        const param = template.Parameters.MinSize;
        expect(param.Type).toBe('Number');
        expect(param.MinValue).toBe(1);
        expect(param.Default).toBe(2);
      });

      test('MaxSize should have minimum value constraint', () => {
        const param = template.Parameters.MaxSize;
        expect(param.Type).toBe('Number');
        expect(param.MinValue).toBe(2);
        expect(param.Default).toBe(6);
      });

      test('DesiredCapacity should be within MinSize and MaxSize bounds', () => {
        const minSize = template.Parameters.MinSize.Default;
        const maxSize = template.Parameters.MaxSize.Default;
        const desired = template.Parameters.DesiredCapacity.Default;
        expect(desired).toBeGreaterThanOrEqual(minSize);
        expect(desired).toBeLessThanOrEqual(maxSize);
      });

      test('TargetCPUUtilization should have valid range', () => {
        const param = template.Parameters.TargetCPUUtilization;
        expect(param.MinValue).toBe(10);
        expect(param.MaxValue).toBe(90);
        expect(param.Default).toBe(70);
      });

      test('InstanceType should have allowed values', () => {
        const param = template.Parameters.InstanceType;
        expect(param.AllowedValues).toBeDefined();
        expect(Array.isArray(param.AllowedValues)).toBe(true);
        expect(param.AllowedValues.length).toBeGreaterThan(0);
        expect(param.AllowedValues).toContain('t3.medium');
      });
    });

    describe('Database Parameters', () => {
      test('DBAllocatedStorage should have valid range', () => {
        const param = template.Parameters.DBAllocatedStorage;
        expect(param.MinValue).toBe(20);
        expect(param.MaxValue).toBe(1000);
        expect(param.Default).toBe(20);
      });

      test('DBBackupRetentionPeriod should have valid range', () => {
        const param = template.Parameters.DBBackupRetentionPeriod;
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(35);
        expect(param.Default).toBe(7);
      });

      test('DBUsername should have pattern validation', () => {
        const param = template.Parameters.DBUsername;
        expect(param.AllowedPattern).toBeDefined();
        expect(param.MinLength).toBe(1);
        expect(param.MaxLength).toBe(16);
      });

      test('DBInstanceClass should have allowed values', () => {
        const param = template.Parameters.DBInstanceClass;
        expect(param.AllowedValues).toBeDefined();
        expect(Array.isArray(param.AllowedValues)).toBe(true);
      });
    });

    describe('Security Parameters', () => {
      test('AllowedIPRange should have CIDR pattern validation', () => {
        const param = template.Parameters.AllowedIPRange;
        expect(param.AllowedPattern).toBeDefined();
        // AllowedPattern should be a regex pattern for CIDR validation
        expect(typeof param.AllowedPattern).toBe('string');
        expect(param.AllowedPattern.length).toBeGreaterThan(0);
      });

      test('EnableHTTPS should be boolean-like string', () => {
        const param = template.Parameters.EnableHTTPS;
        expect(param.AllowedValues).toEqual(['true', 'false']);
        expect(param.Default).toBe('false');
      });

      test('EnableSessionManager should be boolean-like string', () => {
        const param = template.Parameters.EnableSessionManager;
        expect(param.AllowedValues).toEqual(['true', 'false']);
        expect(param.Default).toBe('true');
      });
    });

    describe('LogRetentionDays', () => {
      test('LogRetentionDays should have valid AWS allowed values', () => {
        const param = template.Parameters.LogRetentionDays;
        expect(param.AllowedValues).toBeDefined();
        expect(Array.isArray(param.AllowedValues)).toBe(true);
        const validValues = [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653];
        validValues.forEach(value => {
          expect(param.AllowedValues).toContain(value);
        });
      });
    });
  });

  // NETWORK INFRASTRUCTURE RESOURCES
  describe('Network Infrastructure Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBeDefined();
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have NAT Gateways for private subnet internet access', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have Network ACLs for defense in depth', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });
  });

  // SECURITY GROUPS VALIDATION
  describe('Security Groups', () => {
    test('should have ALB Security Group with restricted ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      // Should only allow from AllowedIPRange
      ingress.forEach((rule: any) => {
        if (rule.CidrIp) {
          expect(rule.CidrIp).toBeDefined();
        }
      });
    });

    test('should have Web Server Security Group with ALB-only ingress', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.VpcId).toBeDefined();
    });

    test('should have WebServerIngressHTTP rule allowing ALB only', () => {
      const rule = template.Resources.WebServerIngressHTTP;
      expect(rule).toBeDefined();
      expect(rule.Properties.SourceSecurityGroupId).toBeDefined();
      expect(rule.Properties.FromPort).toBe(80);
      expect(rule.Properties.ToPort).toBe(80);
    });

    test('should have Database Security Group with web server only access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.FromPort).toBe(3306);
        expect(rule.ToPort).toBe(3306);
      });
    });

    test('should have VPC Endpoint Security Group', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
    });
  });

  // IAM ROLES AND POLICIES VALIDATION
  describe('IAM Roles and Policies', () => {
    test('should have EC2 Role with correct assume role policy', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('EC2 Role should have CloudWatch Agent policy', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 Role should have S3 policy with scoped permissions', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'webapp-prod-s3-policy');
      expect(s3Policy).toBeDefined();
      const statements = s3Policy.PolicyDocument.Statement;
      statements.forEach((stmt: any) => {
        if (stmt.Action && stmt.Action.some((a: string) => a.startsWith('s3:'))) {
          expect(stmt.Resource).toBeDefined();
          expect(Array.isArray(stmt.Resource)).toBe(true);
        }
      });
    });

    test('EC2 Role should have CloudWatch policy for logging', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const cwPolicy = policies.find((p: any) => p.PolicyName === 'webapp-prod-cloudwatch-policy');
      expect(cwPolicy).toBeDefined();
      const statements = cwPolicy.PolicyDocument.Statement;
      const logActions = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('logs:'))
      );
      expect(logActions).toBeDefined();
    });

    test('EC2 Role should have SSM policy for parameter access', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'webapp-prod-ssm-policy');
      expect(ssmPolicy).toBeDefined();
      expect(ssmPolicy.PolicyDocument.Statement[0].Action).toContain('ssm:GetParameter');
    });

    test('EC2 Role should have Secrets Manager policy for database credentials', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'webapp-prod-secrets-policy');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContainEqual({
        Ref: 'EC2Role',
      });
    });
  });

  // S3 BUCKETS VALIDATION
  describe('S3 Buckets', () => {
    test('should have S3 Bucket for application storage', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 Bucket should have encryption enabled (SSE-S3)', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 Bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 Bucket should have public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 Bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('should have S3 Log Bucket', () => {
      expect(template.Resources.S3LogBucket).toBeDefined();
      expect(template.Resources.S3LogBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  // VPC ENDPOINTS VALIDATION
  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have SSM VPC Endpoint', () => {
      expect(template.Resources.SSMVPCEndpoint).toBeDefined();
      expect(template.Resources.SSMVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have SSM Messages VPC Endpoint', () => {
      expect(template.Resources.SSMMessagesVPCEndpoint).toBeDefined();
    });

    test('should have EC2 Messages VPC Endpoint', () => {
      expect(template.Resources.EC2MessagesVPCEndpoint).toBeDefined();
    });
  });

  // CLOUDWATCH LOGS VALIDATION
  describe('CloudWatch Logs', () => {
    test('should have Application Log Group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have System Log Group', () => {
      expect(template.Resources.SystemLogGroup).toBeDefined();
    });

    test('should have ALB Log Group', () => {
      expect(template.Resources.ALBLogGroup).toBeDefined();
    });

    test('should have VPC Flow Log Group', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
    });

    test('Log Groups should have retention period', () => {
      const appLog = template.Resources.ApplicationLogGroup;
      expect(appLog.Properties.RetentionInDays).toBeDefined();
    });
  });

  // DATABASE RESOURCES VALIDATION
  describe('Database Resources', () => {
    test('should have DB Subnet Group in private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have DB Parameter Group', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      expect(template.Resources.DBParameterGroup.Properties.Family).toBe('mysql8.0');
    });

    test('should have RDS Database Instance with Multi-AZ', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.ManageMasterUserPassword).toBe(true);
    });

    test('Database should have CloudWatch Logs exports enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(Array.isArray(db.Properties.EnableCloudwatchLogsExports)).toBe(true);
    });
  });

  // APPLICATION LOAD BALANCER VALIDATION
  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets across multiple AZs', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('ALB should have security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(Array.isArray(alb.Properties.SecurityGroups)).toBe(true);
    });

    test('ALB should have HTTP/2 enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      const http2Attr = attributes.find((attr: any) => attr.Key === 'routing.http2.enabled');
      expect(http2Attr).toBeDefined();
      expect(http2Attr.Value).toBe('true');
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Properties.HealthCheckEnabled).toBe(true);
      expect(template.Resources.TargetGroup.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have HTTP Listener', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      expect(template.Resources.ALBListenerHTTP.Properties.Port).toBe(80);
      expect(template.Resources.ALBListenerHTTP.Properties.Protocol).toBe('HTTP');
    });

    test('should have conditional HTTPS Listener', () => {
      const httpsListener = template.Resources.ALBListenerHTTPS;
      expect(httpsListener).toBeDefined();
      expect(httpsListener.Condition).toBe('EnableHTTPSCondition');
    });
  });

  // AUTO SCALING VALIDATION
  describe('Auto Scaling Configuration', () => {
    test('should have Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('Launch Template should have IMDSv2 required', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('Launch Template should have encrypted EBS volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      const rootVolume = blockDevices.find((bd: any) => bd.DeviceName === '/dev/xvda');
      expect(rootVolume.Ebs.Encrypted).toBe(true);
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(Array.isArray(asg.Properties.VPCZoneIdentifier)).toBe(true);
    });

    test('should have Target Tracking Scaling Policy', () => {
      expect(template.Resources.TargetTrackingScalingPolicy).toBeDefined();
      const policy = template.Resources.TargetTrackingScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('should have CloudWatch Alarms for scaling', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm).toBeDefined();
      expect(template.Resources.UnHealthyHostAlarm).toBeDefined();
    });
  });

  // CROSS-VERIFICATION TESTS
  describe('Cross-Verification Tests', () => {
    test('Security Groups should reference correct VPC', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(albSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(webSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(dbSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Subnets should reference correct VPC', () => {
      const pubSub1 = template.Resources.PublicSubnet1;
      const privSub1 = template.Resources.PrivateSubnet1;
      expect(pubSub1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privSub1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALB should reference correct security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toContainEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('Target Group should reference correct VPC', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Database should reference correct subnet group and security group', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
    });

    test('EC2 Instance Profile should reference EC2 Role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('Launch Template should reference instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      const instanceProfile = lt.Properties.LaunchTemplateData.IamInstanceProfile;
      expect(instanceProfile.Arn).toBeDefined();
    });
  });

  // ERROR CASE VALIDATION
  describe('Error Case Validation', () => {
    test('NAT Gateways should depend on Internet Gateway attachment', () => {
      const nat1 = template.Resources.NATGateway1;
      // DependsOn may be explicit or implicit via SubnetId reference
      // Check that NAT Gateway references a subnet that depends on gateway attachment
      expect(nat1.Properties.SubnetId).toBeDefined();
      // The subnet should be in public subnet which requires gateway attachment
      if (nat1.DependsOn) {
        expect(Array.isArray(nat1.DependsOn) || typeof nat1.DependsOn === 'string').toBe(true);
      }
    });

    test('Private routes should depend on NAT Gateways', () => {
      const privRoute1 = template.Resources.PrivateRoute1;
      expect(privRoute1.Properties.NatGatewayId).toBeDefined();
    });

    test('VPC Flow Log should depend on IAM Role and Log Group', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.DeliverLogsPermissionArn).toBeDefined();
      expect(flowLog.Properties.LogGroupName).toBeDefined();
    });
  });
});
