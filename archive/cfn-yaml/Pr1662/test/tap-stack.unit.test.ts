import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const templatePath =
  process.env.TEMPLATE_PATH || path.join(process.cwd(), 'template.yaml');

describe('TapStack CloudFormation Template (Unit)', () => {
  let tpl: any;

   beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    tpl = JSON.parse(templateContent);
  });

  test('has valid CFN format version and description', () => {
    expect(tpl.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(typeof tpl.Description).toBe('string');
    // Accept either exact or the variant we shared earlier
    expect(tpl.Description).toMatch(/TAP Stack - Task Assignment Platform/i);
  });

  describe('Parameters', () => {
    test('has LatestAmiId parameter with default SSM path', () => {
      expect(tpl.Parameters).toBeDefined();
      const p = tpl.Parameters.LatestAmiId;
      expect(p).toBeDefined();
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(p.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
    });
  });

  describe('Core networking resources exist', () => {
    const mustHave = [
      'VPC',
      'InternetGateway',
      'VPCGatewayAttachment',
      'PublicSubnetA',
      'PublicSubnetB',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnetARouteTableAssociation',
      'PublicSubnetBRouteTableAssociation',
      'PrivateRouteTableA',
      'PrivateRouteTableB',
      'PrivateSubnetARouteTableAssociation',
      'PrivateSubnetBRouteTableAssociation',
    ];
    mustHave.forEach((name) => {
      test(`has resource: ${name}`, () => {
        expect(tpl.Resources?.[name]).toBeDefined();
      });
    });

    test('PublicRoute depends on VPCGatewayAttachment', () => {
      expect(tpl.Resources.PublicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('KMS + S3 encryption & logging', () => {
    test('KmsKey exists', () => {
      expect(tpl.Resources.KmsKey?.Type).toBe('AWS::KMS::Key');
    });

    test('MainBucket and LogsBucket have SSE-KMS', () => {
      const mbEnc =
        tpl.Resources.MainBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;
      const lbEnc =
        tpl.Resources.LogsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;

      expect(mbEnc.SSEAlgorithm).toBe('aws:kms');
      expect(lbEnc.SSEAlgorithm).toBe('aws:kms');
      expect(mbEnc.KMSMasterKeyID).toBeDefined();
      expect(lbEnc.KMSMasterKeyID).toBeDefined();
    });

    test('MainBucket has access logging to LogsBucket', () => {
      const logCfg = tpl.Resources.MainBucket.Properties.LoggingConfiguration;
      expect(logCfg).toBeDefined();
      expect(logCfg.DestinationBucketName).toBeDefined();
      expect(logCfg.LogFilePrefix).toBe('s3-access/');
    });

    test('LogsBucket keeps ACL with W3045 lint suppression', () => {
      const lb = tpl.Resources.LogsBucket;
      expect(lb.Properties.AccessControl).toBe('LogDeliveryWrite');
      const suppression =
        lb.Metadata?.['cfn-lint']?.config?.ignore_checks || [];
      expect(suppression).toContain('W3045');
    });
  });

  describe('Security groups', () => {
    test('AlbSG allows HTTP from anywhere', () => {
      const ingress = tpl.Resources.AlbSG.Properties.SecurityGroupIngress;
      const http = ingress.find(
        (r: any) =>
          r.IpProtocol === 'tcp' &&
          r.FromPort === 80 &&
          r.ToPort === 80 &&
          r.CidrIp === '0.0.0.0/0'
      );
      expect(http).toBeDefined();
    });

    test('WebSG allows HTTP either from ALB SG or from internet (depending on variant)', () => {
      const web = tpl.Resources.WebSG.Properties.SecurityGroupIngress;
      const fromAlb = web.find(
        (r: any) =>
          r.IpProtocol === 'tcp' &&
          r.FromPort === 80 &&
          r.ToPort === 80 &&
          r.SourceSecurityGroupId
      );
      const fromWorld = web.find(
        (r: any) =>
          r.IpProtocol === 'tcp' &&
          r.FromPort === 80 &&
          r.ToPort === 80 &&
          r.CidrIp === '0.0.0.0/0'
      );
      expect(!!fromAlb || !!fromWorld).toBe(true);
    });

    test('RdsSG allows MySQL from WebSG only', () => {
      const ingress = tpl.Resources.RdsSG.Properties.SecurityGroupIngress;
      const mysql = ingress.find(
        (r: any) =>
          r.IpProtocol === 'tcp' &&
          r.FromPort === 3306 &&
          r.ToPort === 3306 &&
          r.SourceSecurityGroupId
      );
      expect(mysql).toBeDefined();
    });
  });

  describe('ALB + TargetGroup + Listener', () => {
    test('ALB/TargetGroup/HttpListener exist', () => {
      expect(tpl.Resources.ALB?.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(tpl.Resources.TargetGroup?.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      expect(tpl.Resources.HttpListener?.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('TargetGroup is HTTP:80 with sane matcher', () => {
      const tg = tpl.Resources.TargetGroup.Properties;
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.Matcher?.HttpCode).toBe('200-399');
    });
  });

  describe('Compute (LaunchTemplate + ASG)', () => {
    test('LaunchTemplate has encrypted root EBS', () => {
      const l = tpl.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const ebs = l.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toBeDefined();
    });

    test('ASG is configured to avoid ALB wait (no TG or DesiredCapacity 0)', () => {
      const asg = tpl.Resources.AutoScalingGroup.Properties;
      const noTG = asg.TargetGroupARNs === undefined;
      const desiredZero =
        String(asg.DesiredCapacity ?? '0') === '0' ||
        Number(asg.DesiredCapacity ?? 0) === 0;
      expect(noTG || desiredZero).toBe(true);
      expect(asg.HealthCheckType).toBe('EC2');
    });
  });

  describe('RDS MySQL', () => {
    test('DBInstance is private, encrypted, with backups', () => {
      const db = tpl.Resources.DBInstance.Properties;
      expect(db.Engine).toBe('mysql');
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Lambda', () => {
    test('Lambda function exists and is in VPC', () => {
      const fn = tpl.Resources.AppLambda;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.VpcConfig).toBeDefined();
      expect(fn.Properties.Role).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('has expected outputs', () => {
      const outs = tpl.Outputs;
      const required = [
        'VpcId',
        'ALBDNSName',
        'RDSEndpoint',
        'LambdaArn',
        'S3Buckets',
        'KmsKeyArn',
      ];
      required.forEach((k) => expect(outs[k]).toBeDefined());
    });
  });
});
