// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CFN = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
const jsonPath = path.join(__dirname, '../lib/TapStack.json');

function loadJson(p: string): CFN {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as CFN;
}

function getResourcesByType(tpl: CFN, type: string) {
  return Object.entries(tpl.Resources ?? {}).filter(
    ([, res]) => (res as any).Type === type
  );
}

function getRes(tpl: CFN, logicalId: string) {
  return (tpl.Resources ?? {})[logicalId];
}

describe('TapStack — Unit Tests (JSON-driven, YAML presence verified)', () => {
  // 1
  it('YAML and JSON files exist and YAML is readable as text', () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(() => fs.readFileSync(yamlPath, 'utf8')).not.toThrow();
    expect(() => fs.readFileSync(jsonPath, 'utf8')).not.toThrow();
  });

  const tpl = loadJson(jsonPath);

  // 2
  it('template has a valid AWSTemplateFormatVersion', () => {
    expect(typeof tpl.AWSTemplateFormatVersion).toBe('string');
    expect(tpl.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  // 3
  it('Region parameter constrained to ap-southeast-2 and has correct default', () => {
    const p = tpl.Parameters?.Region;
    expect(p).toBeDefined();
    expect(p.AllowedValues).toEqual(['ap-southeast-2']);
    expect(p.Default).toBe('ap-southeast-2');
  });

  // 4
  it('CIDR mapping includes Hub and three Spokes with expected keys', () => {
    const m = tpl.Mappings?.Cidrs;
    expect(m).toBeDefined();
    expect(Object.keys(m)).toEqual(expect.arrayContaining(['Hub', 'Spoke1', 'Spoke2', 'Spoke3']));
    ['Hub', 'Spoke1', 'Spoke2', 'Spoke3'].forEach((k) => {
      expect(m[k]).toBeDefined();
      expect(m[k]).toHaveProperty('Vpc');
    });
  });

  // 5
  it('creates exactly 4 VPCs (Hub + 3 Spokes)', () => {
    const vpcs = getResourcesByType(tpl, 'AWS::EC2::VPC');
    expect(vpcs.length).toBe(4);
    const logicals = vpcs.map(([id]) => id);
    expect(logicals).toEqual(expect.arrayContaining(['HubVpc', 'Spoke1Vpc', 'Spoke2Vpc', 'Spoke3Vpc']));
  });

  // 6
  it('Hub subnets (2 public + 2 private) exist', () => {
    ['HubPubA', 'HubPubB', 'HubPrvA', 'HubPrvB'].forEach((id) => {
      const res = getRes(tpl, id);
      expect(res?.Type).toBe('AWS::EC2::Subnet');
    });
  });

  // 7
  it('Each Spoke has exactly 2 private subnets; total subnets = 10', () => {
    ['Spoke1PrvA', 'Spoke1PrvB', 'Spoke2PrvA', 'Spoke2PrvB', 'Spoke3PrvA', 'Spoke3PrvB'].forEach((id) => {
      const res = getRes(tpl, id);
      expect(res?.Type).toBe('AWS::EC2::Subnet');
    });
    const allSubnets = getResourcesByType(tpl, 'AWS::EC2::Subnet');
    expect(allSubnets.length).toBe(10);
  });

  // 8
  it('NAT gateways and EIPs: exactly 2 of each', () => {
    const nats = getResourcesByType(tpl, 'AWS::EC2::NatGateway');
    const eips = getResourcesByType(tpl, 'AWS::EC2::EIP');
    expect(nats.length).toBe(2);
    expect(eips.length).toBe(2);
  });

  // 9
  it('Transit Gateway and its route tables exist (1 TGW + 2 RTs)', () => {
    const tgws = getResourcesByType(tpl, 'AWS::EC2::TransitGateway');
    const rt = getResourcesByType(tpl, 'AWS::EC2::TransitGatewayRouteTable');
    expect(tgws.length).toBe(1);
    expect(rt.length).toBe(2);
    expect(getRes(tpl, 'Tgw')).toBeDefined();
    expect(getRes(tpl, 'TgwHubRt')).toBeDefined();
    expect(getRes(tpl, 'TgwSpokeRt')).toBeDefined();
  });

  // 10
  it('Creates 4 TGW VPC attachments, each with exactly 2 subnets', () => {
    const ids = ['HubTgwAttachment', 'Spoke1TgwAttachment', 'Spoke2TgwAttachment', 'Spoke3TgwAttachment'];
    ids.forEach((id) => {
      const att = getRes(tpl, id);
      expect(att?.Type).toBe('AWS::EC2::TransitGatewayVpcAttachment');
      const subs = att?.Properties?.SubnetIds;
      expect(Array.isArray(subs)).toBe(true);
      expect((subs as any[]).length).toBe(2);
    });
  });

  // 11
  it('Associations: hub/spokes are associated to the correct TGW route tables', () => {
    ['AssocHubToHubRt', 'AssocSpoke1ToSpokeRt', 'AssocSpoke2ToSpokeRt', 'AssocSpoke3ToSpokeRt'].forEach((id) => {
      const res = getRes(tpl, id);
      expect(res?.Type).toBe('AWS::EC2::TransitGatewayRouteTableAssociation');
    });
  });

  // 12
  it('Hub TGW route table has routes to all spokes', () => {
    ['TgwHubRtToSpoke1', 'TgwHubRtToSpoke2', 'TgwHubRtToSpoke3'].forEach((id) => {
      const res = getRes(tpl, id);
      expect(res?.Type).toBe('AWS::EC2::TransitGatewayRoute');
    });
  });

  // 13
  it('Spoke TGW route table has a route to the hub', () => {
    const res = getRes(tpl, 'TgwSpokeRtToHub');
    expect(res?.Type).toBe('AWS::EC2::TransitGatewayRoute');
  });

  // 14
  it('VPC route tables for spokes exist (one per spoke)', () => {
    ['Spoke1PrivateRt', 'Spoke2PrivateRt', 'Spoke3PrivateRt'].forEach((id) => {
      const res = getRes(tpl, id);
      expect(res?.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  // 15
  it('Spoke routes to hub and default depend on their TGW attachments (race-free creation)', () => {
    const pairs: Array<[string, string]> = [
      ['Spoke1ToHubRoute', 'Spoke1TgwAttachment'],
      ['Spoke1DefaultToTgw', 'Spoke1TgwAttachment'],
      ['Spoke2ToHubRoute', 'Spoke2TgwAttachment'],
      ['Spoke2DefaultToTgw', 'Spoke2TgwAttachment'],
      ['Spoke3ToHubRoute', 'Spoke3TgwAttachment'],
      ['Spoke3DefaultToTgw', 'Spoke3TgwAttachment'],
    ];
    pairs.forEach(([routeId, depends]) => {
      const res = getRes(tpl, routeId);
      expect(res?.Type).toBe('AWS::EC2::Route');
      const d = res?.DependsOn;
      if (Array.isArray(d)) {
        expect(d).toContain(depends);
      } else {
        expect(d).toBe(depends);
      }
    });
  });

  // 16
  it('Endpoint security groups exist for hub and three spokes and allow tcp/443 from 0.0.0.0/0', () => {
    ['HubEndpointSg', 'Spoke1EndpointSg', 'Spoke2EndpointSg', 'Spoke3EndpointSg'].forEach((id) => {
      const sg = getRes(tpl, id);
      expect(sg?.Type).toBe('AWS::EC2::SecurityGroup');
      const ing = sg?.Properties?.SecurityGroupIngress;
      expect(Array.isArray(ing)).toBe(true);
      const rule = ing[0];
      expect(rule?.IpProtocol).toBe('tcp');
      expect(rule?.FromPort).toBe(443);
      expect(rule?.ToPort).toBe(443);
      expect(rule?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  // 17
  it('Creates 12 interface VPC endpoints (SSM, SSMMessages, EC2Messages for hub + 3 spokes)', () => {
    const eps = getResourcesByType(tpl, 'AWS::EC2::VPCEndpoint');
    expect(eps.length).toBe(12);
  });

  // 18
  it('Each endpoint has a ServiceName that resolves via Fn::Sub in JSON form', () => {
    const ids = [
      'HubSsmEndpoint','HubSsmMessagesEndpoint','HubEc2MessagesEndpoint',
      'Spoke1SsmEndpoint','Spoke1SsmMessagesEndpoint','Spoke1Ec2MessagesEndpoint',
      'Spoke2SsmEndpoint','Spoke2SsmMessagesEndpoint','Spoke2Ec2MessagesEndpoint',
      'Spoke3SsmEndpoint','Spoke3SsmMessagesEndpoint','Spoke3Ec2MessagesEndpoint',
    ];
    ids.forEach((id) => {
      const ep = getRes(tpl, id);
      const svc = ep?.Properties?.ServiceName;
      // In JSON form, Fn::Sub is an object like { "Fn::Sub": "com.amazonaws.${Region}.ssm" }
      expect(typeof svc).toBe('object');
      expect(svc).toHaveProperty('Fn::Sub');
      expect(typeof svc['Fn::Sub']).toBe('string');
      const s = svc['Fn::Sub'] as string;
      expect(
        s.endsWith('.ssm') || s.endsWith('.ssmmessages') || s.endsWith('.ec2messages')
      ).toBe(true);
    });
  });

  // 19
  it('Flow Logs: log group exists with 7 days retention and IAM role has logs permissions', () => {
    const lg = getRes(tpl, 'FlowLogsLogGroup');
    expect(lg?.Type).toBe('AWS::Logs::LogGroup');
    expect(lg?.Properties?.RetentionInDays).toBe(7);

    const role = getRes(tpl, 'FlowLogsRole');
    expect(role?.Type).toBe('AWS::IAM::Role');
    const policies = role?.Properties?.Policies ?? [];
    const doc = policies[0]?.PolicyDocument;
    const statements = Array.isArray(doc?.Statement) ? doc.Statement : [];
    const actions = statements.flatMap((st: any) =>
      Array.isArray(st.Action) ? st.Action : [st.Action]
    );
    const required = ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents'];
    required.forEach((a) => expect(actions).toEqual(expect.arrayContaining([a])));
  });

  // 20
  it('Flow Logs are enabled for all 4 VPCs', () => {
    ['HubVpcFlowLogs','Spoke1VpcFlowLogs','Spoke2VpcFlowLogs','Spoke3VpcFlowLogs'].forEach((id) => {
      const fl = getRes(tpl, id);
      expect(fl?.Type).toBe('AWS::EC2::FlowLog');
      expect(fl?.Properties?.TrafficType).toBe('ALL');
      expect(fl?.Properties?.LogGroupName).toBeDefined();
    });
  });

  // 21
  it('Route53 Private Hosted Zone exists and is associated with 4 VPCs', () => {
    const hz = getRes(tpl, 'PrivateHostedZone');
    expect(hz?.Type).toBe('AWS::Route53::HostedZone');
    const vpcs = hz?.Properties?.VPCs;
    expect(Array.isArray(vpcs)).toBe(true);
    expect(vpcs.length).toBe(4);
  });

  // 22
  it('Hub public route table has default 0.0.0.0/0 via IGW and depends on the IGW attachment', () => {
    const r = getRes(tpl, 'HubPublicRtIgwDefault');
    expect(r?.Type).toBe('AWS::EC2::Route');
    expect(r?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(r?.DependsOn).toBe('HubIgwAttachment');
  });

  // 23
  it('Hub private route tables have default routes to their NAT gateways', () => {
    const a = getRes(tpl, 'HubPrvADefaultToNat');
    const b = getRes(tpl, 'HubPrvBDefaultToNat');
    expect(a?.Type).toBe('AWS::EC2::Route');
    expect(b?.Type).toBe('AWS::EC2::Route');
    expect(a?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(b?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(a?.Properties?.NatGatewayId).toBeDefined();
    expect(b?.Properties?.NatGatewayId).toBeDefined();
  });

  // 24
  it('Outputs include essential identifiers (VPCs, subnets, TGW, RTs, PHZ, Flow Logs)', () => {
    const out = tpl.Outputs ?? {};
    const keys = Object.keys(out);
    const expected = [
      'HubVpcId','HubPublicSubnets','HubPrivateSubnets',
      'Spoke1VpcId','Spoke1PrivateSubnets',
      'Spoke2VpcId','Spoke2PrivateSubnets',
      'Spoke3VpcId','Spoke3PrivateSubnets',
      'TransitGatewayId','TgwHubRouteTableId','TgwSpokeRouteTableId',
      'PrivateHostedZoneId','FlowLogsLogGroupName',
    ];
    expected.forEach((k) => expect(keys).toContain(k));
  });

  // 25
  it('JSON resource set is non-empty and consistent for sanity', () => {
    const ids = Object.keys(tpl.Resources ?? {}).sort();
    expect(ids.length).toBeGreaterThan(0);
    // sanity: must include core anchors
    ['Tgw','HubVpc','Spoke1Vpc','Spoke2Vpc','Spoke3Vpc'].forEach((k) =>
      expect(ids).toContain(k)
    );
  });
});
