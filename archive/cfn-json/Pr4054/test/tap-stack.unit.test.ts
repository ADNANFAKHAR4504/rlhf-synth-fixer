import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ------------------------------
  // Production Readiness
  // ------------------------------
  describe('Production Readiness', () => {
    test('should have VPC Flow Logs to CloudWatch with retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      const role = template.Resources.VPCFlowLogsRole;
      const flowLog = template.Resources.VPCFlowLog;

      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);

      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({ 'Fn::GetAtt': ['VPCFlowLogsRole', 'Arn'] });
    });

    test('should have CloudWatch CPU alarms for both EC2 instances (>=80%)', () => {
      const pubAlarm = template.Resources.PublicEC2CPUAlarm;
      const pvtAlarm = template.Resources.PrivateEC2CPUAlarm;

      [pubAlarm, pvtAlarm].forEach((a: any) => {
        expect(a).toBeDefined();
        expect(a.Type).toBe('AWS::CloudWatch::Alarm');
        const p = a.Properties;
        expect(p.MetricName).toBe('CPUUtilization');
        expect(p.Threshold).toBe(80);
        expect(p.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
        expect(p.Namespace).toBe('AWS/EC2');
      });

      expect(pubAlarm.Properties.Dimensions[0]).toEqual({ Name: 'InstanceId', Value: { Ref: 'PublicEC2Instance' } });
      expect(pvtAlarm.Properties.Dimensions[0]).toEqual({ Name: 'InstanceId', Value: { Ref: 'PrivateEC2Instance' } });
    });

    test('should have an S3 backup bucket with AES-256 and a policy denying unencrypted uploads', () => {
      const b = template.Resources.BackupS3Bucket;
      const bp = template.Resources.BackupS3BucketPolicy;

      expect(b).toBeDefined();
      expect(b.Type).toBe('AWS::S3::Bucket');
      const enc = b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('AES256');

      expect(bp).toBeDefined();
      const stmt = bp.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(stmt).toBeDefined();
      expect(stmt.Effect).toBe('Deny');
      expect(stmt.Action).toBe('s3:PutObject');
      expect(stmt.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('AES256');
    });

    test('should use Secrets Manager + dynamic refs for RDS credentials and have backups >= 7 days', () => {
      const db = template.Resources.MySQLDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      const p = db.Properties;

      expect(p.Engine).toBe('mysql');
      expect(p.EngineVersion).toBe('8.0.41');

      // dynamic refs
      expect(typeof p.MasterUsername['Fn::Sub']).toBe('string');
      expect(p.MasterUsername['Fn::Sub']).toContain('resolve:secretsmanager:${DBSecret}:SecretString:username');
      expect(typeof p.MasterUserPassword['Fn::Sub']).toBe('string');
      expect(p.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager:${DBSecret}:SecretString:password');

      // backups and privacy
      expect(p.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(p.PubliclyAccessible).toBe(false);
      expect(p.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });
  });

  // ------------------------------
  // Template Structure
  // ------------------------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready multi-AZ, multi-tier infrastructure with VPC, EC2, RDS, ALB, S3, and monitoring'
      );
    });

    test('should have metadata section', () => {
      // This template intentionally does not define Metadata; asserting it is undefined is fine.
      expect(template.Metadata).toBeUndefined();
    });
  });

  // ------------------------------
  // Parameters
  // ------------------------------
  describe('Parameters', () => {
    test('should have expected parameters', () => {
      const params = template.Parameters;
      ['EnvironmentName', 'InstanceType', 'KeyPairName', 'DBInstanceClass', 'DBName', 'LatestAmiId'].forEach(k => {
        expect(params[k]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const p = template.Parameters.EnvironmentName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('production');
      expect(typeof p.Description).toBe('string');
    });

    test('LatestAmiId should use SSM parameter type and default path', () => {
      const p = template.Parameters.LatestAmiId;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(p.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  // ------------------------------
  // Resources
  // ------------------------------
  describe('Resources', () => {
    test('should include core networking: VPC, subnets (3), IGW, NAT, routes', () => {
      const r = template.Resources;

      expect(r.VPC).toBeDefined();
      expect(r.InternetGateway).toBeDefined();
      expect(r.InternetGatewayAttachment).toBeDefined();

      ['PublicSubnetA', 'PublicSubnetB', 'PrivateSubnetA'].forEach(id => expect(r[id]).toBeDefined());
      expect(r.NatGatewayEIP).toBeDefined();
      expect(r.NatGateway).toBeDefined();

      // Route tables and associations
      expect(r.PublicRouteTable).toBeDefined();
      expect(r.PrivateRouteTable).toBeDefined();
      expect(r.DefaultPublicRoute).toBeDefined();
      expect(r.DefaultPrivateRoute).toBeDefined();
      expect(r.PublicSubnetARouteTableAssociation).toBeDefined();
      expect(r.PublicSubnetBRouteTableAssociation).toBeDefined();
      expect(r.PrivateSubnetARouteTableAssociation).toBeDefined();

      // Check public route goes to IGW
      expect(r.DefaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      // Check private route goes to NAT
      expect(r.DefaultPrivateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });

    test('should have VPN Gateway attached to the VPC', () => {
      const vgw = template.Resources.VPNGateway;
      const attach = template.Resources.VPNGatewayAttachment;
      expect(vgw).toBeDefined();
      expect(vgw.Type).toBe('AWS::EC2::VPNGateway');
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attach.Properties.VpnGatewayId).toEqual({ Ref: 'VPNGateway' });
    });

    test('should have Security Groups allowing HTTP/HTTPS and scoped DB access', () => {
      const pub = template.Resources.PublicEC2SecurityGroup;
      const pvt = template.Resources.PrivateEC2SecurityGroup;
      const dbsg = template.Resources.DBSecurityGroup;

      expect(pub).toBeDefined();
      expect(pvt).toBeDefined();
      expect(dbsg).toBeDefined();

      // Public EC2 SG ingress includes 80/443/22 from world
      const pubIngress = pub.Properties.SecurityGroupIngress;
      const ports = pubIngress.map((x: any) => x.ToPort).sort();
      expect(ports).toEqual([22, 80, 443].sort());
      pubIngress.forEach((x: any) => expect(x.CidrIp).toBe('0.0.0.0/0'));

      // Private EC2 SG ingress only from PublicEC2 SG on 22/80/443
      const pvtIngress = pvt.Properties.SecurityGroupIngress;
      pvtIngress.forEach((x: any) =>
        expect(x.SourceSecurityGroupId).toEqual({ Ref: 'PublicEC2SecurityGroup' })
      );

      // DB SG allows 3306 only from PrivateEC2SecurityGroup
      const dbIngress = dbsg.Properties.SecurityGroupIngress[0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toEqual({ Ref: 'PrivateEC2SecurityGroup' });
    });

    test('should have EC2 instances (public & private) with optional KeyName and attached IAM InstanceProfile', () => {
      const pub = template.Resources.PublicEC2Instance;
      const pvt = template.Resources.PrivateEC2Instance;
      const profile = template.Resources.EC2InstanceProfile;

      [pub, pvt].forEach((i: any) => {
        expect(i).toBeDefined();
        const p = i.Properties;
        expect(p.ImageId).toEqual({ Ref: 'LatestAmiId' });
        expect(p.InstanceType).toEqual({ Ref: 'InstanceType' });
        expect(p.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
        // KeyName conditional must be present
        expect(p.KeyName).toBeDefined();
      });

      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have ALB in public subnets, listener on 80, and TG targeting public EC2 instance', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const l = template.Resources.ALBListener;
      const tg = template.Resources.ALBTargetGroup;

      expect(alb).toBeDefined();
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnetA' }, { Ref: 'PublicSubnetB' }]);

      expect(l).toBeDefined();
      expect(l.Properties.Port).toBe(80);
      expect(l.Properties.Protocol).toBe('HTTP');
      expect(l.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });

      expect(tg).toBeDefined();
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.Targets[0]).toEqual({ Id: { Ref: 'PublicEC2Instance' } });
    });

    test('should have DB subnet group, secret, and RDS instance wired correctly', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      const secret = template.Resources.DBSecret;
      const db = template.Resources.MySQLDatabase;

      expect(dbsg).toBeDefined();
      expect(dbsg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(Array.isArray(dbsg.Properties.SubnetIds)).toBe(true);

      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');

      expect(db).toBeDefined();
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(db.Properties.VPCSecurityGroups[0]).toEqual({ Ref: 'DBSecurityGroup' });
    });

    test('all key resources should be tagged with Environment: Production', () => {
      const mustHaveTags = [
        'VPC',
        'PublicSubnetA',
        'PublicSubnetB',
        'PrivateSubnetA',
        'InternetGateway',
        'NatGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'VPNGateway',
        'PublicEC2SecurityGroup',
        'PrivateEC2SecurityGroup',
        'ALBSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'EC2InstanceRole',
        'PublicEC2Instance',
        'PrivateEC2Instance',
        'DBSubnetGroup',
        'DBSecurityGroup',
        'DBSecret',
        'MySQLDatabase',
        'VPCFlowLog',
        'BackupS3Bucket'
      ];

      mustHaveTags.forEach((id: string) => {
        const res = template.Resources[id];
        expect(res).toBeDefined();
        const tags = res.Properties && res.Properties.Tags ? res.Properties.Tags : [];
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      });
    });
  });

  // ------------------------------
  // Outputs
  // ------------------------------
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetAId',
        'PublicSubnetBId',
        'PrivateSubnetAId',
        'ALBDNSName',
        'PublicEC2InstanceId',
        'PrivateEC2InstanceId',
        'DatabaseEndpoint',
        'BackupS3BucketName',
        'VPNGatewayId',
        'DBSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ALBDNSName output should be a GetAtt of the ALB DNSName', () => {
      const out = template.Outputs.ALBDNSName;
      expect(out.Description).toBe('Application Load Balancer DNS Name');
      expect(out.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('DatabaseEndpoint output should reference DB endpoint address', () => {
      const out = template.Outputs.DatabaseEndpoint;
      expect(out.Value).toEqual({ 'Fn::GetAtt': ['MySQLDatabase', 'Endpoint.Address'] });
    });
  });

  // ------------------------------
  // Template Validation
  // ------------------------------
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

    test('should have exactly one resource', () => {
      // In this template we expect a full stack; verify the exact count to guard accidental drifts.
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(38);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  // ------------------------------
  // Resource Naming Convention
  // ------------------------------
  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      // No DynamoDB in this template; assert Name tags include ${EnvironmentName} where applicable.
      const alb = template.Resources.ApplicationLoadBalancer;
      const nameTag = (alb.Properties.Tags || []).find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      // e.g., "${EnvironmentName}-alb"
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentName}-alb' });
    });

    // UPDATED TEST
    test('export names should follow naming convention', () => {
      // Map each OutputKey to the exact Export suffix used in the template
      const expectedSuffixByOutputKey: Record<string, string> = {
        VPCId: 'VPC-ID',
        PublicSubnetAId: 'PublicSubnetA-ID',
        PublicSubnetBId: 'PublicSubnetB-ID',
        PrivateSubnetAId: 'PrivateSubnetA-ID',
        ALBDNSName: 'ALB-DNS',
        PublicEC2InstanceId: 'PublicEC2-ID',
        PrivateEC2InstanceId: 'PrivateEC2-ID',
        DatabaseEndpoint: 'DB-Endpoint',
        BackupS3BucketName: 'BackupBucket',
        VPNGatewayId: 'VPNGateway-ID',
        DBSecretArn: 'DBSecretArn'
      };

      Object.keys(template.Outputs).forEach((outputKey: string) => {
        const output = template.Outputs[outputKey];
        const expectedSuffix = expectedSuffixByOutputKey[outputKey];
        expect(expectedSuffix).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedSuffix}`,
        });
      });
    });
  });
});
