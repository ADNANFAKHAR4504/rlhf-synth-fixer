import fs from 'fs';
import path from 'path';


describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure and Compliant Cloud Infrastructure - Production Ready Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    it('should have all required parameters', () => {
      const requiredParams = [
        'Environment', 'VPCCIDRBlock', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'DBInstanceClass', 'DBAllocatedStorage',
        'EC2InstanceType', 'KeyPairName', 'MaxEC2Instances', 'CPUAlarmThreshold',
        'MemoryAlarmThreshold', 'SNSEmailEndpoint', 'KMSKeyArn'
      ];
      requiredParams.forEach(param => {
        expect(template['Parameters'][param]).toBeDefined();
      });
    });
    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.Description).toBe(
        'Deployment environment (e.g., Development, Staging, Production)'
      );
    });
  });

  describe('Resources', () => {

    describe('Conditions', () => {
      it('should define UseCustomKMSKey condition', () => {
        expect(template.Conditions).toBeDefined();
        expect(template.Conditions.UseCustomKMSKey).toBeDefined();
        expect(template.Conditions.UseCustomKMSKey).toEqual({
          'Fn::Not': [
            { 'Fn::Equals': [{ Ref: 'KMSKeyArn' }, ''] }
          ]
        });
      });
    });

    describe('Cloudwatch Logs Resource', () => {
      it('should define CloudWatch Logs resource for VPC Flow Logs', () => {
        const logGroup = template.Resources.VPCFlowLogGroup;
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });

      it('should configure CloudWatch alarms for CPU and memory', () => {
        expect(template['Resources']['CPUAlarmHigh']).toBeDefined();
        expect(template['Resources']['MemoryAlarmHigh']).toBeDefined();
      });


    });

    // VPC and Networking
    describe('VPC and Networking Resources', () => {
      it('defines a VPC with DNS support enabled', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        expect(vpc.Properties.CidrBlock).toBeDefined();
      });

      it('creates two public and two private subnets with correct tagging', () => {
        ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(key => {
          const subnet = template.Resources[key];
          expect(subnet.Type).toBe('AWS::EC2::Subnet');
          expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
          expect(subnet.Properties.CidrBlock).toBeDefined();
          expect(subnet.Properties.Tags.some((tag: any) => tag.Key === 'Name')).toBe(true);
        });
      });

      it('attaches an Internet Gateway to the VPC', () => {
        const attachment = template.Resources.AttachGateway;
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      it('defines NAT Gateways with elastic IP dependencies', () => {
        ['NATGateway1', 'NATGateway2'].forEach((key, idx) => {
          const nat = template.Resources[key];
          expect(nat.Type).toBe('AWS::EC2::NatGateway');
          const eipRef = `NATGateway${idx + 1}EIP`;
          expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': [eipRef, 'AllocationId'] });
          expect(nat.Properties.SubnetId).toBeDefined();
        });
      });

      it('creates route tables and routes for public and private traffic', () => {
        ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'].forEach(key => {
          expect(template.Resources[key].Type).toBe('AWS::EC2::RouteTable');
        });
        const publicRoute = template.Resources.PublicRoute;
        expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
        ['PrivateRoute1', 'PrivateRoute2'].forEach(key => {
          expect(template.Resources[key].Properties.NatGatewayId).toBeDefined();
        });
      });
    });

    // Security Groups
    describe('Security Groups and Rules', () => {
      it('defines ALB, WebServer, Database, and Lambda security groups', () => {
        ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup', 'LambdaSecurityGroup']
          .forEach(key => {
            expect(template.Resources[key].Type).toBe('AWS::EC2::SecurityGroup');
            expect(template.Resources[key].Properties.VpcId).toEqual({ Ref: 'VPC' });
          });
      });

      it('configures ALB ingress for HTTP and HTTPS', () => {
        const alb = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
        expect(alb.some((rule: any) => rule.FromPort === 443 && rule.IpProtocol === 'tcp')).toBe(true);
        expect(alb.some((rule: any) => rule.FromPort === 80 && rule.IpProtocol === 'tcp')).toBe(true);
      });

      it('links ALB and WebServer SGs via egress/ingress rules', () => {
        const egress = template.Resources.ALBToWebServerEgress.Properties;
        expect(egress.GroupId).toEqual({ Ref: 'ALBSecurityGroup' });
        expect(egress.DestinationSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });

        const ingress = template.Resources.WebServerFromALBIngress.Properties;
        expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    // IAM Roles and Policies
    describe('IAM Roles and Policies', () => {
      it('defines EC2 and Lambda roles with correct assume policies', () => {
        const ec2Role = template.Resources.EC2InstanceRole;
        expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
          .toContain('ec2.amazonaws.com');

        const lambdaRole = template.Resources.LambdaExecutionRole;
        expect(lambdaRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
          .toContain('lambda.amazonaws.com');
      });

      it('attaches S3 access policy to EC2 role referencing SecureS3Bucket', () => {
        const statements = template.Resources.EC2InstanceRole.Properties.Policies[0].PolicyDocument.Statement;
        const hasS3GetPolicy = statements.some((s: any) => {
          if (!Array.isArray(s.Resource)) return false;
          return s.Action.includes('s3:GetObject')
            && s.Action.includes('s3:ListBucket')
            && s.Resource.some((r: any) =>
              r['Fn::GetAtt'] &&
              Array.isArray(r['Fn::GetAtt']) &&
              r['Fn::GetAtt'][0] === 'SecureS3Bucket' &&
              r['Fn::GetAtt'][1] === 'Arn'
            );
        });
        expect(hasS3GetPolicy).toBe(true);
      });


      it('grants RDS describe permissions to Lambda role', () => {
        const lambdaPolicies = template.Resources.LambdaExecutionRole.Properties.Policies;
        expect(lambdaPolicies.some((p: any) =>
          p.PolicyDocument.Statement.some((s: any) =>
            s.Action.includes('rds:DescribeDBInstances')
          )
        )).toBe(true);
      });
    });

    // RDS Database
    describe('RDS Database Resource', () => {

      it('should apply the UseCustomKMSKey condition where needed', () => {
        const rdsProps = template['Resources']['RDSDatabase']['Properties'];
        expect(rdsProps['KmsKeyId']).toBeDefined();
      });

      it('creates RDS instance with encryption and KMS condition', () => {
        const db = template.Resources.RDSDatabase;
        expect(db.Type).toBe('AWS::RDS::DBInstance');
        expect(db.Properties.StorageEncrypted).toBe(true);
        expect(db.Properties.KmsKeyId).toEqual({
          'Fn::If': [
            'UseCustomKMSKey',
            { Ref: 'KMSKeyArn' },
            { Ref: 'AWS::NoValue' }
          ]
        });
      });

      it('uses MultiAZ and snapshot deletion policies', () => {
        expect(template.Resources.RDSDatabase.Properties.MultiAZ).toBe(true);
        expect(template.Resources.RDSDatabase.DeletionPolicy).toBe('Snapshot');
        expect(template.Resources.RDSDatabase.UpdateReplacePolicy).toBe('Snapshot');
      });
    });

    // S3 Bucket and Policy
    describe('Secure S3 Bucket and Policy', () => {

      it('should block public access on S3 buckets', () => {
        const bucket = template['Resources']['SecureS3Bucket']['Properties'];
        expect(bucket['PublicAccessBlockConfiguration']['BlockPublicAcls']).toBe(true);
        expect(bucket['PublicAccessBlockConfiguration']['BlockPublicPolicy']).toBe(true);
        expect(bucket['PublicAccessBlockConfiguration']['IgnorePublicAcls']).toBe(true);
        expect(bucket['PublicAccessBlockConfiguration']['RestrictPublicBuckets']).toBe(true);
      });

      it('enforces bucket encryption and versioning', () => {
        const bucket = template.Resources.SecureS3Bucket.Properties;
        expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      });

      it('denies insecure transport and unencrypted uploads via policy', () => {
        const stmts = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument.Statement;
        expect(stmts.some((s: any) =>
          s.Sid === 'DenyInsecureConnections' &&
          s.Condition.Bool['aws:SecureTransport'] === 'false'
        )).toBe(true);
        expect(stmts.some((s: any) =>
          s.Sid === 'DenyUnencryptedObjectUploads' &&
          s.Condition.StringNotEquals['s3:x-amz-server-side-encryption'] === 'AES256'
        )).toBe(true);
      });
    });

    // Lambda Function
    describe('Lambda Function and Logging', () => {
      it('defines a Lambda with correct runtime, handler, and VPC config', () => {
        const fn = template.Resources.SampleLambdaFunction.Properties;
        expect(fn.Runtime).toBe('python3.11');
        expect(fn.Handler).toBe('index.lambda_handler');
        expect(fn.VpcConfig.SubnetIds).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
        expect(fn.VpcConfig.SecurityGroupIds).toEqual([{ Ref: 'LambdaSecurityGroup' }]);
      });

      it('creates a CloudWatch Log Group for the Lambda', () => {
        const lg = template.Resources.LambdaLogGroup;
        expect(lg.Type).toBe('AWS::Logs::LogGroup');
        expect(lg.Properties.RetentionInDays).toBe(14);
      });
    });

    // Auto Scaling and Load Balancer
    describe('AutoScaling Group and Load Balancer', () => {
      it('links ASG to LaunchTemplate and target group', () => {
        const asg = template.Resources.AutoScalingGroup.Properties;
        expect(asg.LaunchTemplate.LaunchTemplateId.Ref).toBe('EC2LaunchTemplate');
        expect(asg.TargetGroupARNs).toEqual([{ Ref: 'ALBTargetGroup' }]);
        expect(asg.MaxSize.Ref).toBe('MaxEC2Instances');
      });

      it('defines an Application Load Balancer with HTTPS target group', () => {
        const alb = template.Resources.ApplicationLoadBalancer;
        expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
        const tg = template.Resources.ALBTargetGroup.Properties;
        expect(tg.Protocol).toBe('HTTPS');
        expect(tg.HealthCheckPath).toBe('/health');
      });
    });

    // CloudWatch Alarms and SNS
    describe('CloudWatch Alarms and SNS Topic', () => {
      it('creates SNS topic with email subscription', () => {
        const topic = template.Resources.AlarmSNSTopic.Properties;
        expect(topic.Subscription[0].Protocol).toBe('email');
        expect(topic.Subscription[0].Endpoint.Ref).toBe('SNSEmailEndpoint');
      });

      it('defines CPU, Memory, and RDS alarms', () => {
        ['CPUAlarmHigh', 'MemoryAlarmHigh', 'RDSCPUAlarm'].forEach(key => {
          const alarm = template.Resources[key];
          expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
          expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'AlarmSNSTopic' }]);
        });
      });
    });

    // AWS Config, Backup, and WAF
    describe('AWS Config Rules, Backup, and WAF Resources', () => {
      it('sets up Config bucket with encryption and lifecycle', () => {
        const cb = template.Resources.ConfigBucket.Properties;
        expect(cb.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        expect(cb.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
      });

      it('defines a Backup Plan with daily schedule and vault', () => {
        const plan = template.Resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
        expect(plan.ScheduleExpression).toContain('cron');
        expect(plan.TargetBackupVault.Ref).toBe('BackupVault');
      });

      it('creates a WAF WebACL with rate limit and managed rules', () => {
        const waf = template.Resources.WebACL.Properties;
        expect(waf.Rules.some((r: any) => r.Statement.RateBasedStatement)).toBe(true);
        expect(waf.Rules.some((r: any) => r.Statement.ManagedRuleGroupStatement)).toBe(true);
      });
    });


  });

  describe('Outputs', () => {



    it('defines VPCId output referencing VPC', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    it('defines PublicSubnet1Id and PublicSubnet2Id outputs referencing subnets', () => {
      const outputs = template.Outputs;
      expect(outputs.PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(outputs.PublicSubnet2Id.Value).toEqual({ Ref: 'PublicSubnet2' });
    });

    it('defines PrivateSubnet1Id and PrivateSubnet2Id outputs referencing subnets', () => {
      const outputs = template.Outputs;
      expect(outputs.PrivateSubnet1Id.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(outputs.PrivateSubnet2Id.Value).toEqual({ Ref: 'PrivateSubnet2' });
    });

    it('defines RDSEndpoint and RDSPort outputs using GetAtt on RDSDatabase', () => {
      const outputs = template.Outputs;
      expect(outputs.RDSEndpoint.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'] });
      expect(outputs.RDSPort.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Port'] });
    });

    it('defines ALBDNSName and ALBURL outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.ALBDNSName.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(outputs.ALBURL.Value).toEqual({
        'Fn::Sub': 'https://${ApplicationLoadBalancer.DNSName}'
      });
    });

    it('defines S3BucketName output referencing SecureS3Bucket', () => {
      const outputs = template.Outputs;
      expect(outputs.S3BucketName.Value).toEqual({ Ref: 'SecureS3Bucket' });
    });

    it('defines LambdaFunctionArn, EC2InstanceRoleArn, and LambdaExecutionRoleArn outputs using GetAtt', () => {
      const outputs = template.Outputs;
      expect(outputs.LambdaFunctionArn.Value).toEqual({ 'Fn::GetAtt': ['SampleLambdaFunction', 'Arn'] });
      expect(outputs.EC2InstanceRoleArn.Value).toEqual({ 'Fn::GetAtt': ['EC2InstanceRole', 'Arn'] });
      expect(outputs.LambdaExecutionRoleArn.Value).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    it('defines BackupVaultArn output using GetAtt on BackupVault', () => {
      const outputs = template.Outputs;
      expect(outputs.BackupVaultArn.Value).toEqual({ 'Fn::GetAtt': ['BackupVault', 'BackupVaultArn'] });
    });

    it('defines WebACLArn output using GetAtt on WebACL', () => {
      const outputs = template.Outputs;
      expect(outputs.WebACLArn.Value).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
    });

    it('defines DBMasterSecretArn output using Sub with secretsmanager dynamic reference', () => {
      const outputs = template.Outputs;
      expect(outputs.DBMasterSecretArn.Value).toMatchObject({
        'Fn::GetAtt': ['RDSDatabase', 'MasterUserSecret.SecretArn']
      });
    });
  });

});
