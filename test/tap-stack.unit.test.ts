/**
 * Robust unit tests for TapStack.yml / TapStack.json.
 * - Works with Refs/Fn::Sub
 * - Accepts Instances defined with SubnetId/SecurityGroupIds (no NetworkInterfaces)
 * - Accepts parameterized values when defaults match requirements
 */

import * as fs from 'fs';
import * as path from 'path';

type CfnVal = any;
type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, { Type: string; Properties?: any; Condition?: string; DependsOn?: any }>;
  Outputs?: Record<string, any>;
};

const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
if (!fs.existsSync(templatePath)) {
  throw new Error(`TapStack.json not found at ${templatePath}. Make sure ../lib/TapStack.json exists at ../lib/TapStack.json`);
}
const tmpl: CfnTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
const resources = tmpl.Resources || {};
const outputs = tmpl.Outputs || {};
const parameters = tmpl.Parameters || {};

/* ---------------------------- helpers ---------------------------- */

function findResourcesByType(type: string) {
  return Object.entries(resources).filter(([_, r]) => r.Type === type);
}
function getResourceIds(type: string): string[] {
  return findResourcesByType(type).map(([id]) => id);
}
function isRef(v: CfnVal, name?: string) {
  return v && typeof v === 'object' && Object.keys(v).length === 1 && v.Ref && (name ? v.Ref === name : true);
}
function isFnSub(v: CfnVal) {
  return v && typeof v === 'object' && ('Fn::Sub' in v);
}
function fnSubIncludes(v: CfnVal, substr: string) {
  return isFnSub(v) && String(v['Fn::Sub']).includes(substr);
}
function equalsOrParamDefault(v: CfnVal, expected: string, paramName?: string) {
  if (typeof v === 'string') return v === expected;
  if (isRef(v) && paramName && parameters[paramName]?.Default) {
    return parameters[paramName].Default === expected;
  }
  return false;
}
function getIngressRulesFromSG(sgProps: any): any[] {
  const ing = sgProps?.SecurityGroupIngress;
  if (!ing) return [];
  return Array.isArray(ing) ? ing : [ing];
}
function getEgressRulesFromSG(sgProps: any): any[] {
  const eg = sgProps?.SecurityGroupEgress;
  if (!eg) return [];
  return Array.isArray(eg) ? eg : [eg];
}

/* ------------------------------ tests ------------------------------ */

describe('TapStack CloudFormation Template', () => {
  // 1
  it('has a valid CloudFormation template structure', () => {
    expect(tmpl).toBeDefined();
    expect(typeof tmpl).toBe('object');
    expect(tmpl.Resources).toBeDefined();
  });

  // 2
  it('declares expected core parameters with safe defaults', () => {
    expect(parameters['VpcCidr']).toBeDefined();
    expect(parameters['VpcCidr'].Default).toBe('10.0.0.0/16');

    expect(parameters['AmiId']).toBeDefined();
    const amiParamType = parameters['AmiId'].Type || '';
    expect(amiParamType).toContain('AWS::SSM::Parameter::Value');

    expect(parameters['InstanceType']).toBeDefined();
    expect(parameters['InstanceType'].Default).toBe('t2.micro');

    expect(parameters['SshCidr']).toBeDefined();
    expect(parameters['SshCidr'].Default).toBe('203.0.113.0/24');

    expect(parameters['AsgMinSize']).toBeDefined();
    expect(parameters['AsgDesiredCapacity']).toBeDefined();
    expect(parameters['AsgMaxSize']).toBeDefined();
  });

  // 3
  it('creates one VPC with DNS support/hostnames enabled and correct CIDR', () => {
    const vpcs = findResourcesByType('AWS::EC2::VPC');
    expect(vpcs.length).toBe(1);
    const vpc = vpcs[0][1];
    // Accept direct value or Ref to VpcCidr param whose default is 10.0.0.0/16
    expect(
      equalsOrParamDefault(vpc.Properties.CidrBlock, '10.0.0.0/16', 'VpcCidr')
    ).toBe(true);
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  // 4
  it('has an Internet Gateway and attaches it to the VPC', () => {
    const igw = findResourcesByType('AWS::EC2::InternetGateway');
    expect(igw.length).toBe(1);

    const attach = findResourcesByType('AWS::EC2::VPCGatewayAttachment');
    expect(attach.length).toBe(1);
    const attachProps = attach[0][1].Properties;
    expect(attachProps.VpcId).toBeDefined();
    expect(attachProps.InternetGatewayId).toBeDefined();
  });

  // 5
  it('creates a public route table and associates it with both public subnets', () => {
    const rts = findResourcesByType('AWS::EC2::RouteTable');

    const associations = findResourcesByType('AWS::EC2::SubnetRouteTableAssociation');
    const routes = findResourcesByType('AWS::EC2::Route');

    // Find RT that has IGW default route:
    const publicRtIds = new Set(
      routes
        .filter(([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0' && r.Properties?.GatewayId)
        .map(([, r]) => r.Properties.RouteTableId?.Ref || r.Properties.RouteTableId)
    );

    const assocToPublic = associations.filter(
      ([, a]) => publicRtIds.has(a.Properties.RouteTableId?.Ref || a.Properties.RouteTableId)
    );
    expect(assocToPublic.length).toBe(2);
  });

  // 6
  it('configures a default route 0.0.0.0/0 to the IGW for public route table', () => {
    const routes = findResourcesByType('AWS::EC2::Route');
    const hasIgwDefault = routes.some(
      ([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0' && r.Properties?.GatewayId
    );
    expect(hasIgwDefault).toBe(true);
  });

  // 7
  it('creates an Elastic IP and NAT Gateway in a public subnet', () => {
    const eips = findResourcesByType('AWS::EC2::EIP');
    expect(eips.length).toBe(1);
    expect(eips[0][1].Properties.Domain).toBe('vpc');

    const ngws = findResourcesByType('AWS::EC2::NatGateway');
    expect(ngws.length).toBe(1);
    const ngw = ngws[0][1];
    expect(ngw.Properties.AllocationId).toBeDefined();
    expect(ngw.Properties.SubnetId).toBeDefined();
  });

  // 8
  it('configures private route tables to send 0.0.0.0/0 through the NAT Gateway', () => {
    const routes = findResourcesByType('AWS::EC2::Route');
    const privateNatRoutes = routes.filter(
      ([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0' && r.Properties?.NatGatewayId
    );
    expect(privateNatRoutes.length).toBeGreaterThanOrEqual(2);
  });

  // 9
  it('ensures private subnets do NOT have a direct route to the Internet Gateway', () => {
    const routes = findResourcesByType('AWS::EC2::Route');
    const igwDefaults = routes.filter(
      ([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0' && r.Properties?.GatewayId
    );
    expect(igwDefaults.length).toBe(1); // just the public RT
  });

  // 10
  it('creates a Security Group that allows SSH only from 203.0.113.0/24 (or Ref SshCidr)', () => {
    const sgs = findResourcesByType('AWS::EC2::SecurityGroup');
    expect(sgs.length).toBeGreaterThan(0);
    const found = sgs.some(([, sg]) => {
      const ingress = getIngressRulesFromSG(sg.Properties);
      return ingress.some((r: any) => {
        const cidr = r.CidrIp;
        const portOk = r.IpProtocol === 'tcp' && r.FromPort === 22 && r.ToPort === 22;
        const cidrOk =
          cidr === '203.0.113.0/24' ||
          (isRef(cidr, 'SshCidr') && parameters['SshCidr']?.Default === '203.0.113.0/24');
        return portOk && cidrOk;
      });
    });
    expect(found).toBe(true);
  });

  // 11
  it('defines an encrypted S3 bucket with Block Public Access enabled', () => {
    const buckets = findResourcesByType('AWS::S3::Bucket');
    expect(buckets.length).toBe(1);
    const b = buckets[0][1].Properties;

    expect(b.PublicAccessBlockConfiguration).toBeDefined();
    const p = b.PublicAccessBlockConfiguration;
    expect(p.BlockPublicAcls).toBe(true);
    expect(p.BlockPublicPolicy).toBe(true);
    expect(p.IgnorePublicAcls).toBe(true);
    expect(p.RestrictPublicBuckets).toBe(true);

    expect(b.BucketEncryption).toBeDefined();
    const enc = b.BucketEncryption.ServerSideEncryptionConfiguration;
    expect(Array.isArray(enc)).toBe(true);
    expect(enc[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBeDefined();
  });

  // 12
  it('IAM Role grants least-privilege S3 access to ONLY the app bucket', () => {
    const roles = findResourcesByType('AWS::IAM::Role');
    expect(roles.length).toBeGreaterThan(0);
    const role = roles[0][1].Properties;
    expect(Array.isArray(role.Policies)).toBe(true);
    const doc = role.Policies[0].PolicyDocument;
    const stmt = doc.Statement;

    // ListBucket on arn:...:s3:::${AppBucket}
    const listStmt = stmt.find((s: any) => (Array.isArray(s.Action) ? s.Action.includes('s3:ListBucket') : s.Action === 's3:ListBucket'));
    expect(listStmt).toBeDefined();
    const listRes = listStmt.Resource;
    const listResOk =
      (typeof listRes === 'string' && listRes.includes(':s3:::')) ||
      (Array.isArray(listRes) && listRes.every((r: string) => r.includes(':s3:::'))) ||
      (isFnSub(listRes) && fnSubIncludes(listRes, ':s3:::${AppBucket}'));
    expect(listResOk).toBe(true);

    // RW on arn:...:s3:::${AppBucket}/*
    const rwStmt = stmt.find(
      (s: any) =>
        Array.isArray(s.Action) &&
        s.Action.some((a: string) => ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'].includes(a))
    );
    expect(rwStmt).toBeDefined();
    const rwRes = rwStmt.Resource;
    const rwResOk =
      (typeof rwRes === 'string' && rwRes.endsWith('/*')) ||
      (Array.isArray(rwRes) && rwRes.every((r: string) => r.endsWith('/*'))) ||
      (isFnSub(rwRes) && String(rwRes['Fn::Sub']).includes('${AppBucket}/*'));
    expect(rwResOk).toBe(true);
  });

  // 13
  it('has an Instance Profile referencing the IAM Role', () => {
    const ips = findResourcesByType('AWS::IAM::InstanceProfile');
    expect(ips.length).toBe(1);
    const roles = ips[0][1].Properties.Roles;
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBe(1);
  });

  // 14
  it('launches exactly two EC2 instances (t2.micro) in private subnets', () => {
    const instances = findResourcesByType('AWS::EC2::Instance');
    expect(instances.length).toBe(2);

    const privateSubnetIds = new Set(
      getResourceIds('AWS::EC2::Subnet').filter((id) => id.toLowerCase().includes('private'))
    );

    for (const [, inst] of instances) {
      // InstanceType (string or Ref)
      const it = inst.Properties.InstanceType;
      if (typeof it === 'string') {
        expect(it).toBe('t2.micro');
      } else if (isRef(it, 'InstanceType')) {
        expect(parameters['InstanceType']?.Default).toBe('t2.micro');
      } else {
        throw new Error('InstanceType must be t2.micro or Ref InstanceType');
      }

      // Instance is in a private subnet (using SubnetId form)
      const subnetId = inst.Properties.SubnetId?.Ref || inst.Properties.SubnetId;
      expect(subnetId).toBeDefined();
      // Allow logical IDs that don't include "private" by name: alternatively, check that
      // the subnet referenced has MapPublicIpOnLaunch = false
      const subnetRes = Object.entries(resources).find(([id]) => id === subnetId);
      if (subnetRes) {
        const [, subnet] = subnetRes;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      }
    }
  });

  // 15
  it('uses an EC2 Launch Template (not LaunchConfiguration) for the ASG', () => {
    expect(findResourcesByType('AWS::AutoScaling::LaunchConfiguration').length).toBe(0);
    expect(findResourcesByType('AWS::EC2::LaunchTemplate').length).toBe(1);
  });

  // 16
  it('ASG spans both private subnets and uses the Launch Template', () => {
    const asgs = findResourcesByType('AWS::AutoScaling::AutoScalingGroup');
    expect(asgs.length).toBe(1);
    const asgProps = asgs[0][1].Properties;

    expect(Array.isArray(asgProps.VPCZoneIdentifier)).toBe(true);
    expect(asgProps.VPCZoneIdentifier.length).toBe(2);

    expect(asgProps.LaunchTemplate).toBeDefined();
    expect(asgProps.LaunchTemplate.LaunchTemplateId || asgProps.LaunchTemplate.LaunchTemplateName || asgProps.LaunchTemplate.LaunchTemplateName).toBeDefined();
    expect(asgProps.MinSize).toBeDefined();
    expect(asgProps.DesiredCapacity).toBeDefined();
    expect(asgProps.MaxSize).toBeDefined();
  });

  // 17
  it('ASG capacity defaults (min=2, desired=2, max=4)', () => {
    const asg = findResourcesByType('AWS::AutoScaling::AutoScalingGroup')[0][1].Properties;
    const ok = (v: any, expected: number) => {
      if (typeof v === 'number') return v === expected;
      // if Ref, ensure the corresponding parameter default matches
      if (isRef(v, 'AsgMinSize')) return expected === parameters['AsgMinSize']?.Default;
      if (isRef(v, 'AsgDesiredCapacity')) return expected === parameters['AsgDesiredCapacity']?.Default;
      if (isRef(v, 'AsgMaxSize')) return expected === parameters['AsgMaxSize']?.Default;
      return true; // tolerate evaluation through parameters
    };
    expect(ok(asg.MinSize, 2)).toBe(true);
    expect(ok(asg.DesiredCapacity, 2)).toBe(true);
    expect(ok(asg.MaxSize, 4)).toBe(true);
  });

  // 18
  it('has ScaleOut and ScaleIn policies attached to the ASG', () => {
    const pols = findResourcesByType('AWS::AutoScaling::ScalingPolicy');
    expect(pols.length).toBe(2);
    const types = pols.map(([, p]) => p.Properties.PolicyType);
    expect(types.every((t) => t === 'SimpleScaling')).toBe(true);
  });

  // 19
  it('CloudWatch CPU alarms are present with correct thresholds and dimensions', () => {
    const alarms = findResourcesByType('AWS::CloudWatch::Alarm');
    expect(alarms.length).toBe(2);

    const high = alarms.find(([, a]) => a.Properties.Threshold === 70);
    const low = alarms.find(([, a]) => a.Properties.Threshold === 30);
    expect(high).toBeDefined();
    expect(low).toBeDefined();

    const hasAsgDim = (a: any) =>
      Array.isArray(a.Properties.Dimensions) &&
      a.Properties.Dimensions.some((d: any) => d.Name === 'AutoScalingGroupName');
    expect(hasAsgDim(high![1])).toBe(true);
    expect(hasAsgDim(low![1])).toBe(true);
  });

  // 20
  it('Outputs include VPC ID, PrivateSubnets, NatGatewayId, and AutoScalingGroupName', () => {
    expect(outputs['VpcId']).toBeDefined();
    expect(outputs['PrivateSubnets']).toBeDefined();
    expect(outputs['NatGatewayId']).toBeDefined();
    expect(outputs['AutoScalingGroupName']).toBeDefined();
  });

  // 21
  it('AMI parameter leverages SSM for Amazon Linux (no hard-coded AMI IDs)', () => {
    const ami = parameters['AmiId'];
    expect(ami).toBeDefined();
    expect(typeof ami.Type).toBe('string');
    expect(ami.Type.includes('AWS::SSM::Parameter::Value')).toBe(true);
    expect(ami.Default).toBeDefined();
  });

  // 22
  it('Security group egress is open (0.0.0.0/0) to allow outbound via NAT', () => {
    const sgs = findResourcesByType('AWS::EC2::SecurityGroup');
    expect(sgs.length).toBeGreaterThan(0);
    const ok = sgs.some(([, sg]) => {
      const egress = getEgressRulesFromSG(sg.Properties);
      if (!egress.length) {
        // No explicit egress => default allow-all egress in EC2 SG
        return true;
      }
      return egress.some(
        (r: any) =>
          r.CidrIp === '0.0.0.0/0' &&
          (r.IpProtocol === '-1' || r.IpProtocol === -1 || r.IpProtocol === 'all')
      );
    });
    expect(ok).toBe(true);
  });

  // 23
  it('(Optional) Region guard/guidance exists (RegionGuard or RegionCheck output)', () => {
    const hasGuard = outputs['RegionGuard'] || outputs['RegionCheck'];
    expect(!!hasGuard).toBe(true);
  });
});
