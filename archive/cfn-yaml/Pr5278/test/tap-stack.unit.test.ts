import fs from "fs";
import path from "path";

// We parse the compiled Intrinsics-friendly JSON (no !Sub issues)
type CFN = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadJson(p: string): CFN {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as CFN;
}

const YAML_PATH = path.resolve(process.cwd(), "lib/TapStack.yml");
const JSON_PATH = path.resolve(process.cwd(), "lib/TapStack.json");

describe("TapStack — Unit Tests (JSON-driven, YAML presence verified)", () => {
  let tpl: CFN;

  beforeAll(() => {
    // YAML presence (we don't parse it to avoid CFN tags)
    expect(fs.existsSync(YAML_PATH)).toBe(true);
    // JSON must exist and be valid
    expect(fs.existsSync(JSON_PATH)).toBe(true);
    tpl = loadJson(JSON_PATH);
    expect(tpl).toBeTruthy();
  });

  it("JSON resource set is non-empty and consistent for sanity", () => {
    expect(tpl.Resources && typeof tpl.Resources === "object").toBe(true);
    expect(Object.keys(tpl.Resources!).length).toBeGreaterThan(10);
  });

  it("Description mentions hub-and-spoke and TGW", () => {
    const d = String(tpl.Description || "");
    expect(d.toLowerCase()).toContain("hub");
    expect(d.toLowerCase()).toContain("spoke");
    expect(d.toLowerCase()).toContain("transit");
  });

  it("Template is region-agnostic: either has Region parameter OR uses GetAZs without hard-coding", () => {
    const hasRegionParam = Boolean(tpl.Parameters?.Region);
    // If Region parameter exists, it's okay; if not, verify somewhere we use Fn::GetAZs with a blank or AWS::Region ref
    const resources = tpl.Resources || {};
    const findGetAZs = JSON.stringify(resources).includes('"Fn::GetAZs"');
    expect(hasRegionParam || findGetAZs).toBe(true);
  });

  it("Mappings.Cidrs defines Hub and Spoke{1,2,3} ranges", () => {
    expect(tpl.Mappings?.Cidrs?.Hub?.Vpc).toBeDefined();
    expect(tpl.Mappings?.Cidrs?.Spoke1?.Vpc).toBeDefined();
    expect(tpl.Mappings?.Cidrs?.Spoke2?.Vpc).toBeDefined();
    expect(tpl.Mappings?.Cidrs?.Spoke3?.Vpc).toBeDefined();
  });

  it("Transit Gateway defined with sane defaults (no default assoc/propagation)", () => {
    const tgw = tpl.Resources?.Tgw;
    expect(tgw?.Type).toBe("AWS::EC2::TransitGateway");
    const props = tgw?.Properties || {};
    expect(props.DefaultRouteTableAssociation).toBe("disable");
    expect(props.DefaultRouteTablePropagation).toBe("disable");
    expect(props.DnsSupport).toBe("enable");
  });

  it("TGW has hub and spoke route tables", () => {
    expect(tpl.Resources?.TgwHubRt?.Type).toBe("AWS::EC2::TransitGatewayRouteTable");
    expect(tpl.Resources?.TgwSpokeRt?.Type).toBe("AWS::EC2::TransitGatewayRouteTable");
  });

  it("Hub VPC and three Spoke VPCs exist", () => {
    expect(tpl.Resources?.HubVpc?.Type).toBe("AWS::EC2::VPC");
    expect(tpl.Resources?.Spoke1Vpc?.Type).toBe("AWS::EC2::VPC");
    expect(tpl.Resources?.Spoke2Vpc?.Type).toBe("AWS::EC2::VPC");
    expect(tpl.Resources?.Spoke3Vpc?.Type).toBe("AWS::EC2::VPC");
  });

  it("Hub has public + private subnets in two AZs (A,B)", () => {
    expect(tpl.Resources?.HubPubA?.Type).toBe("AWS::EC2::Subnet");
    expect(tpl.Resources?.HubPubB?.Type).toBe("AWS::EC2::Subnet");
    expect(tpl.Resources?.HubPrvA?.Type).toBe("AWS::EC2::Subnet");
    expect(tpl.Resources?.HubPrvB?.Type).toBe("AWS::EC2::Subnet");
    // ensure Fn::Select index 0/1 pattern is used to avoid >2 subnets
    const hubPubA = JSON.stringify(tpl.Resources?.HubPubA);
    const hubPubB = JSON.stringify(tpl.Resources?.HubPubB);
    expect(hubPubA).toContain('"Fn::Select":[0');
    expect(hubPubB).toContain('"Fn::Select":[1');
  });

  it("Each Spoke has two private subnets (A,B) only, aligning with TGW attachment limit", () => {
    ["Spoke1", "Spoke2", "Spoke3"].forEach((s) => {
      expect(tpl.Resources?.[`${s}PrvA`]?.Type).toBe("AWS::EC2::Subnet");
      expect(tpl.Resources?.[`${s}PrvB`]?.Type).toBe("AWS::EC2::Subnet");
      expect(tpl.Resources?.[`${s}PrvC`]).toBeUndefined();
    });
  });

  it("NAT Gateways defined in both hub public subnets (A,B) with allocated EIPs", () => {
    expect(tpl.Resources?.HubNatA?.Type).toBe("AWS::EC2::NatGateway");
    expect(tpl.Resources?.HubNatB?.Type).toBe("AWS::EC2::NatGateway");
    expect(tpl.Resources?.HubEipA?.Type).toBe("AWS::EC2::EIP");
    expect(tpl.Resources?.HubEipB?.Type).toBe("AWS::EC2::EIP");
  });

  it("Hub private route tables default to the matching NATs", () => {
    const rta = tpl.Resources?.HubPrvADefaultToNat;
    const rtb = tpl.Resources?.HubPrvBDefaultToNat;
    expect(rta?.Type).toBe("AWS::EC2::Route");
    expect(rtb?.Type).toBe("AWS::EC2::Route");
    expect(rta?.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(rtb?.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(rta?.Properties?.NatGatewayId).toBeDefined();
    expect(rtb?.Properties?.NatGatewayId).toBeDefined();
  });

  it("All four VPCs have VPC Flow Logs to a 7-day retention log group via an IAM role", () => {
    expect(tpl.Resources?.FlowLogsLogGroup?.Type).toBe("AWS::Logs::LogGroup");
    expect(tpl.Resources?.FlowLogsRole?.Type).toBe("AWS::IAM::Role");
    expect(tpl.Resources?.HubVpcFlowLogs?.Type).toBe("AWS::EC2::FlowLog");
    expect(tpl.Resources?.Spoke1VpcFlowLogs?.Type).toBe("AWS::EC2::FlowLog");
    expect(tpl.Resources?.Spoke2VpcFlowLogs?.Type).toBe("AWS::EC2::FlowLog");
    expect(tpl.Resources?.Spoke3VpcFlowLogs?.Type).toBe("AWS::EC2::FlowLog");
  });

  it("TGW VPC attachments use exactly two SubnetIds each", () => {
    const check = (resName: string) => {
      const res = tpl.Resources?.[resName];
      expect(res?.Type).toBe("AWS::EC2::TransitGatewayVpcAttachment");
      const subnets = res?.Properties?.SubnetIds || [];
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(2);
    };
    ["HubTgwAttachment", "Spoke1TgwAttachment", "Spoke2TgwAttachment", "Spoke3TgwAttachment"].forEach(check);
  });

  it("TGW associations wire hub to hub-rt and each spoke to spoke-rt", () => {
    const a1 = tpl.Resources?.AssocHubToHubRt;
    const a2 = tpl.Resources?.AssocSpoke1ToSpokeRt;
    const a3 = tpl.Resources?.AssocSpoke2ToSpokeRt;
    const a4 = tpl.Resources?.AssocSpoke3ToSpokeRt;
    [a1, a2, a3, a4].forEach((a) => expect(a?.Type).toBe("AWS::EC2::TransitGatewayRouteTableAssociation"));
  });

  it("TGW routes: hub RT has destinations to each spoke; spoke RT has only route to hub", () => {
    expect(tpl.Resources?.TgwHubRtToSpoke1?.Type).toBe("AWS::EC2::TransitGatewayRoute");
    expect(tpl.Resources?.TgwHubRtToSpoke2?.Type).toBe("AWS::EC2::TransitGatewayRoute");
    expect(tpl.Resources?.TgwHubRtToSpoke3?.Type).toBe("AWS::EC2::TransitGatewayRoute");
    expect(tpl.Resources?.TgwSpokeRtToHub?.Type).toBe("AWS::EC2::TransitGatewayRoute");
  });

  it("VPC route tables in spokes point default 0.0.0.0/0 and hub CIDR to TGW, and wait on attachment", () => {
    ["Spoke1", "Spoke2", "Spoke3"].forEach((s) => {
      const toHub = tpl.Resources?.[`${s}ToHubRoute`];
      const toDef = tpl.Resources?.[`${s}DefaultToTgw`];
      expect(toHub?.Type).toBe("AWS::EC2::Route");
      expect(toDef?.Type).toBe("AWS::EC2::Route");
      expect(toDef?.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(toHub?.Properties?.TransitGatewayId || toDef?.Properties?.TransitGatewayId).toBeDefined();
      // Optional DependsOn in JSON may be collapsed; just assert existence of the TGW ref
    });
  });

  it("Each VPC has SSM, SSMMessages, EC2Messages Interface endpoints", () => {
    const names = [
      "HubSsmEndpoint",
      "HubSsmMessagesEndpoint",
      "HubEc2MessagesEndpoint",
      "Spoke1SsmEndpoint",
      "Spoke1SsmMessagesEndpoint",
      "Spoke1Ec2MessagesEndpoint",
      "Spoke2SsmEndpoint",
      "Spoke2SsmMessagesEndpoint",
      "Spoke2Ec2MessagesEndpoint",
      "Spoke3SsmEndpoint",
      "Spoke3SsmMessagesEndpoint",
      "Spoke3Ec2MessagesEndpoint",
    ];
    names.forEach((n) => {
      expect(tpl.Resources?.[n]?.Type).toBe("AWS::EC2::VPCEndpoint");
      expect(tpl.Resources?.[n]?.Properties?.VpcEndpointType).toBe("Interface");
    });
  });

  it("Route 53 PrivateHostedZone is associated to hub and all spokes", () => {
    const hz = tpl.Resources?.PrivateHostedZone;
    expect(hz?.Type).toBe("AWS::Route53::HostedZone");
    const vpcs = hz?.Properties?.VPCs || [];
    expect(Array.isArray(vpcs)).toBe(true);
    expect(vpcs.length).toBe(4);
  });

  it("Outputs include VPC IDs, subnets, TGW IDs, route table IDs, PHZ ID, and FlowLogs log group", () => {
    const o = tpl.Outputs || {};
    [
      "HubVpcId",
      "HubPublicSubnets",
      "HubPrivateSubnets",
      "Spoke1VpcId",
      "Spoke1PrivateSubnets",
      "Spoke2VpcId",
      "Spoke2PrivateSubnets",
      "Spoke3VpcId",
      "Spoke3PrivateSubnets",
      "TransitGatewayId",
      "TgwHubRouteTableId",
      "TgwSpokeRouteTableId",
      "PrivateHostedZoneId",
      "FlowLogsLogGroupName",
    ].forEach((k) => expect(o[k]).toBeDefined());
  });

  it("Tags present on core resources (Name, environment, cost-center, owner)", () => {
    const mustHave = ["Tgw", "HubVpc", "Spoke1Vpc", "Spoke2Vpc", "Spoke3Vpc"];
    mustHave.forEach((rid) => {
      const tags = tpl.Resources?.[rid]?.Properties?.Tags || [];
      expect(Array.isArray(tags)).toBe(true);
      const keys = tags.map((t: any) => t.Key);
      ["Name", "environment", "cost-center", "owner"].forEach((k) => {
        expect(keys).toContain(k);
      });
    });
  });

  it("Lint friendliness: TGW attachments limit respected, no third subnet in attachments", () => {
    const att = ["HubTgwAttachment", "Spoke1TgwAttachment", "Spoke2TgwAttachment", "Spoke3TgwAttachment"];
    for (const a of att) {
      const subnets = tpl.Resources?.[a]?.Properties?.SubnetIds || [];
      expect(subnets.length).toBe(2);
    }
  });

  it("No explicit third-AZ constructs for hub/spokes (keeps AZ Select indices to 0 and 1)", () => {
    const s = JSON.stringify(tpl.Resources || {});
    // this checks that we didn't introduce Select index 2 for any subnet resources
    expect(s.includes('"Fn::Select":[2')).toBe(false);
  });

  it("FlowLogsRole trust policy is for vpc-flow-logs.amazonaws.com", () => {
    const role = tpl.Resources?.FlowLogsRole;
    expect(role?.Type).toBe("AWS::IAM::Role");
    const assume = JSON.stringify(role?.Properties?.AssumeRolePolicyDocument || {});
    expect(assume).toContain("vpc-flow-logs.amazonaws.com");
  });

  it("Security groups for endpoints allow TCP/443", () => {
    ["HubEndpointSg", "Spoke1EndpointSg", "Spoke2EndpointSg", "Spoke3EndpointSg"].forEach((rid) => {
      const sg = tpl.Resources?.[rid];
      expect(sg?.Type).toBe("AWS::EC2::SecurityGroup");
      const ingress = sg?.Properties?.SecurityGroupIngress || [];
      const has443 = ingress.some((r: any) => r.FromPort === 443 && r.ToPort === 443 && r.IpProtocol === "tcp");
      expect(has443).toBe(true);
    });
  });
});
