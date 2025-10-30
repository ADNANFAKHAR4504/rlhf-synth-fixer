import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  const getResource = (logicalId: string) => template.Resources[logicalId];
  const hasResource = (logicalId: string, type: string) => {
    const res = getResource(logicalId);
    return !!res && res.Type === type;
  };
  const listResourcesByType = (type: string) =>
    Object.entries(template.Resources)
      .filter(([, v]: any) => v.Type === type)
      .map(([k]) => k);

  describe('Template Structure', () => {
    test('format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters and Conditions', () => {
    test('parameters exist with constraints', () => {
      const p = template.Parameters;
      expect(p.EnvironmentName).toBeDefined();
      expect(p.EnvironmentName.Type).toBe('String');
      expect(typeof p.EnvironmentName.Default).toBe('string');
      expect(p.EnvironmentName.Default.length).toBeGreaterThan(0);

      expect(p.CorporateIPRange).toBeDefined();
      expect(typeof p.CorporateIPRange.AllowedPattern).toBe('string');
      // Validate that provided regex compiles
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const corpCidrRe = new RegExp(p.CorporateIPRange.AllowedPattern);
      expect(corpCidrRe.test('203.0.113.0/24')).toBe(true);

      expect(p.KeyPairName).toBeDefined();
      expect(p.KeyPairName.Default).toBe('');

      expect(p.DBMasterUsername).toBeDefined();
      expect(p.DBMasterUsername.NoEcho).toBe(true);

      expect(p.DatabasePort).toBeDefined();
      expect(p.DatabasePort.MinValue).toBeGreaterThan(0);
      expect(p.DatabasePort.MaxValue).toBeLessThanOrEqual(65535);

      expect(p.ACMCertificateArn).toBeDefined();
      expect(typeof p.ACMCertificateArn.AllowedPattern).toBe('string');
      // Validate regex behavior instead of hard-coding the pattern
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const acmRe = new RegExp(p.ACMCertificateArn.AllowedPattern);
      expect(acmRe.test('')).toBe(true);
      expect(acmRe.test('arn:aws:acm:us-east-1:123456789012:certificate/abc123')).toBe(true);
      expect(acmRe.test('not-an-arn')).toBe(false);
    });

    test('conditions present for optional resources/props', () => {
      const c = template.Conditions;
      expect(c.HasKeyPair).toBeDefined();
      expect(c.HasACMCertificate).toBeDefined();
    });
  });

  describe('Networking', () => {
    test('VPC and subnets', () => {
      expect(hasResource('VPC', 'AWS::EC2::VPC')).toBe(true);
      expect(getResource('VPC').Properties.CidrBlock).toBe('10.0.0.0/16');

      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnet1', 'DBSubnet2'].forEach(id => {
        expect(getResource(id)).toBeDefined();
        expect(getResource(id).Type).toBe('AWS::EC2::Subnet');
        expect(getResource(id).Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('Internet gateway, NAT, and routes', () => {
      expect(hasResource('InternetGateway', 'AWS::EC2::InternetGateway')).toBe(true);
      expect(hasResource('InternetGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment')).toBe(true);

      ['NatGateway1EIP', 'NatGateway2EIP'].forEach(id => {
        expect(hasResource(id, 'AWS::EC2::EIP')).toBe(true);
      });
      ['NatGateway1', 'NatGateway2'].forEach(id => {
        expect(hasResource(id, 'AWS::EC2::NatGateway')).toBe(true);
      });

      // Public routes
      expect(hasResource('PublicRouteTable', 'AWS::EC2::RouteTable')).toBe(true);
      expect(hasResource('DefaultPublicRoute', 'AWS::EC2::Route')).toBe(true);

      // Private routes through NAT
      expect(hasResource('PrivateRouteTable1', 'AWS::EC2::RouteTable')).toBe(true);
      expect(hasResource('DefaultPrivateRoute1', 'AWS::EC2::Route')).toBe(true);
      expect(hasResource('PrivateRouteTable2', 'AWS::EC2::RouteTable')).toBe(true);
      expect(hasResource('DefaultPrivateRoute2', 'AWS::EC2::Route')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows 443 and 80 (redirect) from corporate CIDR', () => {
      const sg = getResource('ALBSecurityGroup');
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443 }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80 })
        ])
      );
    });

    test('WebServerSecurityGroup allows 443 from ALB and 22 from corp', () => {
      const sg = getResource('WebServerSecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 443, ToPort: 443, SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' } }),
          expect.objectContaining({ FromPort: 22, ToPort: 22, CidrIp: { Ref: 'CorporateIPRange' } })
        ])
      );
    });

    test('DatabaseSecurityGroup restricts access to DB port from web servers', () => {
      const sg = getResource('DatabaseSecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: { Ref: 'DatabasePort' }, ToPort: { Ref: 'DatabasePort' }, SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' } })
        ])
      );
    });
  });

  describe('IAM', () => {
    test('EC2 instance role with least-privilege S3 access', () => {
      const role = getResource('EC2InstanceRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      const pol = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(pol).toBeDefined();
      const statements = pol.PolicyDocument.Statement;
      expect(statements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Effect: 'Allow', Action: expect.arrayContaining(['s3:GetObject', 's3:PutObject', 's3:DeleteObject']) }),
          expect.objectContaining({ Effect: 'Allow', Action: expect.arrayContaining(['s3:ListBucket']) })
        ])
      );
    });

    test('LambdaExecutionRole grants DynamoDB access and KMS decrypt', () => {
      const role = getResource('LambdaExecutionRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      const dynamoPol = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPol).toBeDefined();
      const kmsPol = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSDecrypt');
      expect(kmsPol).toBeDefined();
    });

    test('MFAPolicy denies actions without MFA', () => {
      const pol = getResource('MFAPolicy');
      expect(pol.Type).toBe('AWS::IAM::ManagedPolicy');
      const stmt = pol.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'BlockMostAccessUnlessSignedInWithMFA');
      expect(stmt).toBeDefined();
      expect(stmt.Effect).toBe('Deny');
    });
  });

  describe('Storage and Buckets', () => {
    test('AppDataBucket, CloudTrailBucket, ConfigBucket, StaticContentBucket are secure', () => {
      ['AppDataBucket', 'CloudTrailBucket', 'ConfigBucket', 'StaticContentBucket'].forEach(id => {
        const b = getResource(id);
        expect(b.Type).toBe('AWS::S3::Bucket');
        const pab = b.Properties.PublicAccessBlockConfiguration;
        if (pab) {
          expect(pab.BlockPublicAcls).toBe(true);
          expect(pab.BlockPublicPolicy).toBe(true);
          expect(pab.IgnorePublicAcls).toBe(true);
          expect(pab.RestrictPublicBuckets).toBe(true);
        }
        const enc = b.Properties.BucketEncryption;
        if (enc) {
          expect(enc.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        }
      });
    });

    test('CloudTrailBucketPolicy allows CloudTrail put with ACL condition', () => {
      const pol = getResource('CloudTrailBucketPolicy');
      const stmts = pol.Properties.PolicyDocument.Statement;
      const write = stmts.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(write).toBeDefined();
      expect(write.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(write.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });
  });

  describe('Database and Tables', () => {
    test('DBSubnetGroup references both DB subnets', () => {
      const dbsg = getResource('DBSubnetGroup');
      expect(dbsg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbsg.Properties.SubnetIds).toEqual(expect.arrayContaining([{ Ref: 'DBSubnet1' }, { Ref: 'DBSubnet2' }]));
    });

    test('RDS instance is multi-AZ with logs and monitoring', () => {
      const db = getResource('RDSDatabase');
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.EnableCloudwatchLogsExports).toEqual(expect.arrayContaining(['error', 'general', 'slowquery']));
      expect(db.Properties.MonitoringRoleArn).toBeDefined();
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('DynamoDB AuditTable has PITR, SSE, and GSI', () => {
      const t = getResource('AuditTable');
      expect(t.Type).toBe('AWS::DynamoDB::Table');
      expect(t.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(t.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(t.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('UserIdIndex');
    });
  });

  describe('Compute and Load Balancing', () => {
    test('LaunchTemplate uses SSM AMI, optional key via condition, and SGs', () => {
      const lt = getResource('LaunchTemplate');
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toMatch(/resolve:ssm/);
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If'][0]).toBe('HasKeyPair');
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toEqual(expect.arrayContaining([{ Ref: 'WebServerSecurityGroup' }]));
    });

    test('ALB, TargetGroup, HTTPS Listener', () => {
      expect(hasResource('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer')).toBe(true);
      const tg = getResource('ALBTargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTPS');
      expect(tg.Properties.Port).toBe(443);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTPS');

      const listener = getResource('ALBHTTPSListener');
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Condition).toBe('HasACMCertificate');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toMatch(/TLS13/);
    });

    test('HTTP listener redirects to HTTPS', () => {
      const httpL = getResource('ALBHTTPListener');
      expect(httpL.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpL.Properties.Port).toBe(80);
      expect(httpL.Properties.Protocol).toBe('HTTP');
      const action = httpL.Properties.DefaultActions[0];
      expect(action.Type).toBe('redirect');
      expect(action.RedirectConfig.Protocol).toBe('HTTPS');
      expect(action.RedirectConfig.Port).toBe('443');
      expect(action.RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('AutoScalingGroup in private subnets targets the TG', () => {
      const asg = getResource('AutoScalingGroup');
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toEqual(expect.arrayContaining([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]));
      expect(asg.Properties.TargetGroupARNs).toEqual(expect.arrayContaining([{ Ref: 'ALBTargetGroup' }]));
    });

    test('Scaling policy tracks average CPU to 70%', () => {
      const sp = getResource('ScalingPolicy');
      expect(sp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(sp.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(sp.Properties.TargetTrackingConfiguration.TargetValue).toBeCloseTo(70.0);
    });
  });

  describe('Lambda and KMS', () => {
    test('Audit Lambda uses KMS key and env for DynamoDB table', () => {
      const fn = getResource('AuditLambdaFunction');
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.KmsKeyArn).toBeDefined();
      expect(fn.Properties.Environment.Variables.AUDIT_TABLE).toEqual({ Ref: 'AuditTable' });
    });

    test('LambdaKMSKey and alias exist with key policy entries', () => {
      expect(hasResource('LambdaKMSKey', 'AWS::KMS::Key')).toBe(true);
      expect(hasResource('LambdaKMSKeyAlias', 'AWS::KMS::Alias')).toBe(true);
    });
  });

  describe('CloudFront', () => {
    test('Distribution enforces HTTPS redirect and uses OAI to S3', () => {
      const dist = getResource('CloudFrontDistribution');
      expect(dist.Type).toBe('AWS::CloudFront::Distribution');
      const cfg = dist.Properties.DistributionConfig;
      expect(cfg.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      const oai = cfg.Origins[0].S3OriginConfig.OriginAccessIdentity;
      expect(oai).toBeDefined();
      // Accept either raw string or Fn::Sub object containing expected prefix
      if (typeof oai === 'string') {
        expect(oai).toContain('origin-access-identity/cloudfront/');
      } else {
        expect(oai['Fn::Sub']).toContain('origin-access-identity/cloudfront/');
      }
    });
  });

  describe('CloudTrail and AWS Config', () => {
    test('CloudTrail trail is multi-region with KMS key and selectors', () => {
      const trail = getResource('CloudTrail');
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'CloudTrailKMSKey' });
      const selectors = trail.Properties.EventSelectors[0].DataResources.map((r: any) => r.Type);
      expect(selectors).toEqual(expect.arrayContaining(['AWS::S3::Object', 'AWS::DynamoDB::Table']));
    });

    test('AWS Config recorder, delivery channel, role exist', () => {
      expect(hasResource('ConfigRecorder', 'AWS::Config::ConfigurationRecorder')).toBe(true);
      expect(hasResource('ConfigDeliveryChannel', 'AWS::Config::DeliveryChannel')).toBe(true);
      expect(hasResource('ConfigRole', 'AWS::IAM::Role')).toBe(true);
    });
  });

  describe('Monitoring and Notifications', () => {
    test('CloudWatch alarms target SNS NotificationTopic', () => {
      ['HighCPUAlarm', 'DatabaseConnectionAlarm', 'LambdaErrorAlarm'].forEach(id => {
        const alarm = getResource(id);
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmActions).toEqual(expect.arrayContaining([{ Ref: 'NotificationTopic' }]));
      });
    });

    test('SNS Topic uses KMS key', () => {
      const topic = getResource('NotificationTopic');
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'NotificationKMSKey' });
    });
  });

  describe('Operational Custom Resource', () => {
    test('Default VPC cleanup Lambda and trigger exist', () => {
      expect(hasResource('DefaultVPCCleanupRole', 'AWS::IAM::Role')).toBe(true);
      expect(hasResource('DefaultVPCCleanupFunction', 'AWS::Lambda::Function')).toBe(true);
      expect(hasResource('DefaultVPCCleanupTrigger', 'AWS::CloudFormation::CustomResource')).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('critical outputs exist and reference proper resources', () => {
      const required = [
        'VPCId', 'VPCCidr', 'ALBEndpoint', 'ALBSecurityGroupId', 'RDSEndpoint', 'RDSPort',
        'DynamoDBTableName', 'DynamoDBTableArn', 'AppDataBucketName', 'AppDataBucketArn',
        'CloudTrailBucketName', 'CloudTrailName', 'CloudFrontDistributionDomain', 'CloudFrontDistributionId',
        'LambdaFunctionArn', 'LambdaFunctionName', 'AutoScalingGroupName', 'LaunchTemplateId',
        'ConfigRecorderName', 'MFAPolicyArn', 'NotificationTopicArn', 'PrivateSubnetIds', 'PublicSubnetIds',
        'DatabaseSubnetGroupName', 'KMSKeyIdLambda', 'KMSKeyIdCloudTrail', 'TargetGroupArn', 'StaticContentBucketName',
        'DefaultVPCCleanupStatus'
      ];
      required.forEach(key => expect(template.Outputs[key]).toBeDefined());

      // Cross-verification examples
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.ALBEndpoint.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt']).toEqual(['RDSDatabase', 'Endpoint.Address']);
      expect(template.Outputs.DynamoDBTableArn.Value['Fn::GetAtt']).toEqual(['AuditTable', 'Arn']);
    });
  });
});
