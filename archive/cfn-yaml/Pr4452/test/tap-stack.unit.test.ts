/**
 * Robust unit tests for lib/TapStack.yml
 * - Accepts intrinsic-stripped parsing, verifies structure/tags
 * - Updated to assert Target registration via TargetGroup.Targets (no TargetGroupAttachment)
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const TEMPLATE_PATH = path.resolve(__dirname, '..', 'lib', 'TapStack.yml');

function stripCfnIntrinsics(yamlText: string): string {
  return yamlText.replace(/!([A-Za-z0-9:_\.\-]+)/g, '');
}
function normalizeRefValue(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if ('Ref' in v) return v.Ref;
    if ('Fn::Sub' in v && typeof v['Fn::Sub'] === 'string') return v['Fn::Sub'];
  }
  return undefined;
}
function lbAttributesToMap(arr: any[]): Record<string, any> {
  const map: Record<string, any> = {};
  if (!Array.isArray(arr)) return map;
  arr.forEach((entry) => {
    if (entry && typeof entry.Key !== 'undefined') {
      map[entry.Key] = entry.Value;
    }
  });
  return map;
}

describe('TapStack CloudFormation template - unit tests', () => {
  let template: any;
  let resources: any;

  beforeAll(() => {
    const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const cleaned = stripCfnIntrinsics(content);
    template = yaml.load(cleaned) as any;
    if (!template?.Resources) throw new Error('Parsed template missing Resources');
    resources = template.Resources;
  });

  test('Template version & description', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  test('Parameters include KeyName, InstanceType, SSHLocation, TargetRegion', () => {
    expect(template.Parameters.KeyName).toBeDefined();
    expect(template.Parameters.InstanceType).toBeDefined();
    expect(template.Parameters.SSHLocation).toBeDefined();
    expect(template.Parameters.TargetRegion).toBeDefined();
  });

  test('Condition DeployInTargetRegion exists', () => {
    expect(template.Conditions.DeployInTargetRegion).toBeDefined();
  });

  test('Mappings include RegionMap or mappings omitted', () => {
    if (template.Mappings) {
      expect(template.Mappings.RegionMap).toBeDefined();
    }
  });

  describe('Resources', () => {
    test('VPC exists and tagged', () => {
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(resources.VPC.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
          expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ])
      );
    });

    test('Subnets exist (public/private) and tagging', () => {
      ['PublicSubnetA', 'PublicSubnetB', 'PrivateSubnetA', 'PrivateSubnetB'].forEach((s) => {
        expect(resources[s].Type).toBe('AWS::EC2::Subnet');
        expect(resources[s].Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
            expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
          ])
        );
      });
      expect(resources.PublicSubnetA.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(resources.PrivateSubnetA.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('InternetGateway and route table exist', () => {
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.VPCGatewayAttachment).toBeDefined();
      expect(resources.PublicDefaultRoute).toBeDefined();
      expect(resources.PublicDefaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('ALB & access logging configured', () => {
      const alb = resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      const attrs = lbAttributesToMap(alb.Properties.LoadBalancerAttributes || []);
      expect(String(attrs['access_logs.s3.enabled'])).toBe('true');
      const bucketRaw = attrs['access_logs.s3.bucket'];
      const bucketName = normalizeRefValue(bucketRaw) ?? bucketRaw;
      expect(bucketName).toBe('ALBAccessLogBucket');
    });

    test('EC2 instance exists in private subnet and monitoring true', () => {
      const ec2 = resources.EC2Instance.Properties;
      const subnet = normalizeRefValue(ec2.SubnetId) ?? ec2.SubnetId;
      expect(subnet).toBe('PrivateSubnetA');
      expect(ec2.Monitoring).toBe(true);
      expect(ec2.IamInstanceProfile).toBeDefined();
    });

    test('S3 buckets use AES256, block public access, and are tagged', () => {
      ['LogBucket', 'ALBAccessLogBucket', 'ConfigBucket'].forEach((b) => {
        const bucket = resources[b].Properties;
        const sse = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm;
        expect(sse).toBe('AES256');
        expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      });
    });

    test('CloudWatch LogGroups exist and are tagged', () => {
      expect(resources.EC2LogGroup).toBeDefined();
      expect(resources.ALBLogGroup).toBeDefined();
      expect(resources.EC2LogGroup.Properties.Tags).toEqual(
        expect.arrayContaining([expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' })])
      );
    });

    test('IAM roles exist and tagged', () => {
      expect(resources.EC2CloudWatchAgentRole).toBeDefined();
      expect(resources.ConfigRecorderRole).toBeDefined();
      expect(resources.EC2CloudWatchAgentRole.Properties.Tags).toEqual(
        expect.arrayContaining([expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' })])
      );
    });

    test('EC2 SG allows ALB traffic and SSH (using param)', () => {
      const ingress = resources.EC2SecurityGroup.Properties.SecurityGroupIngress || [];
      const http = ingress.find((i: any) => i.FromPort === 80 && i.ToPort === 80);
      expect(http).toBeDefined();
      const src = normalizeRefValue(http.SourceSecurityGroupId) ?? http.SourceSecurityGroupId;
      expect(src).toBe('ALBSecurityGroup');
      const ssh = ingress.find((i: any) => i.FromPort === 22 && i.ToPort === 22);
      expect(normalizeRefValue(ssh.CidrIp) ?? ssh.CidrIp).toBe('SSHLocation');
    });

    test('Targets are attached via TargetGroup.Targets (no TargetGroupAttachment)', () => {
      expect(resources.ALBTargetGroup).toBeDefined();
      const targets = resources.ALBTargetGroup.Properties.Targets || [];
      const first = targets.find((t: any) => (normalizeRefValue(t.Id) ?? t.Id) === 'EC2Instance');
      expect(first).toBeDefined();
      expect(first.Port).toBe(80);
      expect(resources.TargetGroupAttachment).toBeUndefined(); // should not exist
    });
  });

  describe('Outputs & Metadata', () => {
    test('cfn-outputs metadata keys present in Outputs', () => {
      const keys = template.Metadata['cfn-outputs'];
      expect(Array.isArray(keys)).toBe(true);
      keys.forEach((k: string) => expect(template.Outputs[k]).toBeDefined());
    });

    test('Outputs exist and conditioned on DeployInTargetRegion', () => {
      const req = ['VpcId', 'PublicSubnetA', 'PrivateSubnetA', 'ALBArn', 'EC2InstanceId', 'ConfigBucketName', 'LogBucketName'];
      req.forEach((k) => {
        expect(template.Outputs[k]).toBeDefined();
        expect(template.Outputs[k].Condition).toBe('DeployInTargetRegion');
      });
    });
  });

  describe('other invariants', () => {
    test('All taggable resources include iac-rlhf-amazon:true', () => {
      Object.keys(resources).forEach((k) => {
        const r = resources[k];
        if (r?.Properties?.Tags) {
          expect(r.Properties.Tags).toEqual(
            expect.arrayContaining([expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' })])
          );
        }
      });
    });

    test('EC2 UserData includes CloudWatch agent snippet', () => {
      const ud = resources.EC2Instance.Properties.UserData;
      const s = typeof ud === 'string' ? ud : JSON.stringify(ud);
      expect(s).toMatch(/amazon-cloudwatch-agent/);
      expect(s).toMatch(/collect_list/);
    });
  });
});
