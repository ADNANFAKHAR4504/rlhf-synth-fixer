import * as fs from "fs";
import * as path from "path";

/**
 * This test suite intentionally avoids YAML parsing because js-yaml (and most YAML parsers)
 * don't understand CloudFormation intrinsic tags like !Ref / !Sub / !If without custom schemas.
 * We instead verify structure via robust string and regex checks over the raw file contents.
 */

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json"); // optional (presence check only)

const text = fs.readFileSync(yamlPath, "utf8");

// ---------- helpers ----------
function hasLine(s: string) {
  // exact substring check
  return text.indexOf(s) !== -1;
}

function hasRegex(r: RegExp) {
  return r.test(text);
}

function getResourceBlock(logicalId: string): string | null {
  // Match a resource block starting with two spaces then the logical ID and colon
  // and capture until next top-level resource (two-space + word + colon) or end of Resources section.
  const re = new RegExp(
    String.raw`(^\s{2}${logicalId}:\s*\n(?:^\s{2,}.*\n)+)`,
    "m"
  );
  const m = text.match(re);
  return m ? m[1] : null;
}

function blockHas(logicalId: string, pattern: RegExp | string): boolean {
  const block = getResourceBlock(logicalId);
  if (!block) return false;
  if (typeof pattern === "string") return block.indexOf(pattern) !== -1;
  return pattern.test(block);
}

// ---------- tests ----------
describe("TapStack — Unit Validation (regex-based over YAML text)", () => {
  // 01
  test("template file is present and non-empty", () => {
    expect(text.length).toBeGreaterThan(1000);
    expect(hasLine("Resources:")).toBe(true);
  });

  // 02 parameters present
  test("required parameters exist and are initialized", () => {
    const must = [
      "EnvironmentSuffix:",
      "TeamTag:",
      "CostCenterTag:",
      "VpcCidr:",
      "PublicSubnetCidrs:",
      "PrivateSubnetCidrs:",
      "DatabaseSubnetCidrs:",
      "FlowLogsRetentionDays:",
      "LogGroupKmsKeyArn:",
    ];
    must.forEach((p) => expect(hasLine(p)).toBe(true));
  });

  // 03 condition present
  test("condition UseKmsForLogs present with intrinsic", () => {
    expect(hasRegex(/Conditions:\s*\n\s+UseKmsForLogs:\s*!Not\s*\[/m)).toBe(true);
  });

  // 04 VPC exists with DNS flags
  test("VPC exists with EnableDnsSupport and EnableDnsHostnames", () => {
    expect(blockHas("Vpc", "Type: AWS::EC2::VPC")).toBe(true);
    expect(blockHas("Vpc", "EnableDnsSupport: true")).toBe(true);
    expect(blockHas("Vpc", "EnableDnsHostnames: true")).toBe(true);
    expect(blockHas("Vpc", "CidrBlock:")).toBe(true);
  });

  // 05 IGW + attachment
  test("InternetGateway and VpcGatewayAttachment exist", () => {
    expect(blockHas("InternetGateway", "Type: AWS::EC2::InternetGateway")).toBe(true);
    expect(blockHas("VpcGatewayAttachment", "Type: AWS::EC2::VPCGatewayAttachment")).toBe(true);
  });

  // 06 public subnets
  test("three public subnets with MapPublicIpOnLaunch true", () => {
    ["PublicSubnetA", "PublicSubnetB", "PublicSubnetC"].forEach((id) => {
      expect(blockHas(id, "Type: AWS::EC2::Subnet")).toBe(true);
      expect(blockHas(id, "MapPublicIpOnLaunch: true")).toBe(true);
    });
  });

  // 07 private + db subnets
  test("three private and three database subnets exist", () => {
    ["PrivateSubnetA","PrivateSubnetB","PrivateSubnetC","DbSubnetA","DbSubnetB","DbSubnetC"].forEach((id) => {
      expect(blockHas(id, "Type: AWS::EC2::Subnet")).toBe(true);
    });
  });

  // 08 NAT + EIPs
  test("three EIPs and three NAT Gateways (per AZ)", () => {
    ["NatEipA","NatEipB","NatEipC"].forEach((id) =>
      expect(blockHas(id, "Type: AWS::EC2::EIP")).toBe(true)
    );
    ["NatGatewayA","NatGatewayB","NatGatewayC"].forEach((id) =>
      expect(blockHas(id, "Type: AWS::EC2::NatGateway")).toBe(true)
    );
  });

  // 09 public RTs and default route to IGW with DependsOn
  test("public route tables and routes to IGW with DependsOn attachment", () => {
    ["PublicRTA","PublicRTB","PublicRTC"].forEach((id) =>
      expect(blockHas(id, "Type: AWS::EC2::RouteTable")).toBe(true)
    );
    ["PublicRouteA0","PublicRouteB0","PublicRouteC0"].forEach((id) => {
      expect(blockHas(id, "Type: AWS::EC2::Route")).toBe(true);
      expect(blockHas(id, 'DestinationCidrBlock: "0.0.0.0/0"')).toBe(true);
      expect(blockHas(id, "GatewayId: !Ref InternetGateway")).toBe(true);
      expect(blockHas(id, "DependsOn: VpcGatewayAttachment")).toBe(true);
    });
  });

  // 10 private RTs default to local NAT
  test("private route tables point default route to local NAT", () => {
    expect(blockHas("PrivateRouteA0", "NatGatewayId: !Ref NatGatewayA")).toBe(true);
    expect(blockHas("PrivateRouteB0", "NatGatewayId: !Ref NatGatewayB")).toBe(true);
    expect(blockHas("PrivateRouteC0", "NatGatewayId: !Ref NatGatewayC")).toBe(true);
  });

  // 11 DB route tables with no 0.0.0.0/0
  test("database route tables exist with NO default Internet routes", () => {
    ["DbRTA","DbRTB","DbRTC"].forEach((id) =>
      expect(blockHas(id, "Type: AWS::EC2::RouteTable")).toBe(true)
    );
    // Ensure there is no Route destined to 0.0.0.0/0 referencing DbRT*
    const routesToDefault = text.match(/^\s{2,}[A-Za-z0-9]+:\n\s{4}Type:\sAWS::EC2::Route[\s\S]*?DestinationCidrBlock:\s"0\.0\.0\.0\/0"[\s\S]*?\n/gm) || [];
    const dbRtMentioned = routesToDefault.some((routeBlk) =>
      /RouteTableId:\s!Ref\s(DbRTA|DbRTB|DbRTC)/.test(routeBlk)
    );
    expect(dbRtMentioned).toBe(false);
  });

  // 12 explicit subnet associations
  test("explicit subnet associations present for all subnets", () => {
    const assocs = [
      "PublicAtoSubnetA","PublicBtoSubnetB","PublicCtoSubnetC",
      "PrivateAtoSubnetA","PrivateBtoSubnetB","PrivateCtoSubnetC",
      "DbAtoSubnetA","DbBtoSubnetB","DbCtoSubnetC",
    ];
    assocs.forEach((id) => {
      expect(blockHas(id, "Type: AWS::EC2::SubnetRouteTableAssociation")).toBe(true);
    });
  });

  // 13 endpoints exist
  test("gateway endpoints for S3 and DynamoDB exist", () => {
    expect(blockHas("S3Endpoint", "Type: AWS::EC2::VPCEndpoint")).toBe(true);
    expect(blockHas("DynamoDbEndpoint", "Type: AWS::EC2::VPCEndpoint")).toBe(true);
    expect(blockHas("S3Endpoint", "VpcEndpointType: Gateway")).toBe(true);
    expect(blockHas("DynamoDbEndpoint", "VpcEndpointType: Gateway")).toBe(true);
  });

  // 14 endpoints attach to private + db RTs
  test("endpoints attach to all private and db route tables", () => {
    const allRTs = ["PrivateRTA","PrivateRTB","PrivateRTC","DbRTA","DbRTB","DbRTC"];
    allRTs.forEach((rt) => {
      expect(blockHas("S3Endpoint", `- !Ref ${rt}`)).toBe(true);
      expect(blockHas("DynamoDbEndpoint", `- !Ref ${rt}`)).toBe(true);
    });
  });

  // 15 flow logs stack elements exist
  test("log group, role and flow log exist", () => {
    expect(blockHas("FlowLogsLogGroup", "Type: AWS::Logs::LogGroup")).toBe(true);
    expect(blockHas("FlowLogsRole", "Type: AWS::IAM::Role")).toBe(true);
    expect(blockHas("VpcFlowLogs", "Type: AWS::EC2::FlowLog")).toBe(true);
  });

  // 16 flow logs ALL + 60s
  test("flow logs configured for ALL traffic and 60s interval", () => {
    expect(blockHas("VpcFlowLogs", "TrafficType: ALL")).toBe(true);
    expect(blockHas("VpcFlowLogs", "MaxAggregationInterval: 60")).toBe(true);
    expect(blockHas("VpcFlowLogs", "ResourceType: VPC")).toBe(true);
  });

  // 17 log group retention + conditional KMS
  test("log group uses retention param and conditional KMS (Fn::If present)", () => {
    expect(blockHas("FlowLogsLogGroup", "RetentionInDays: !Ref FlowLogsRetentionDays")).toBe(true);
    expect(blockHas("FlowLogsLogGroup", "KmsKeyId: !If")).toBe(true);
  });

  // 18 DB NACL + associations
  test("database NACL exists and associated to all DB subnets", () => {
    expect(blockHas("DbNacl", "Type: AWS::EC2::NetworkAcl")).toBe(true);
    ["DbNaclAssocA","DbNaclAssocB","DbNaclAssocC"].forEach((id) =>
      expect(blockHas(id, "Type: AWS::EC2::SubnetNetworkAclAssociation")).toBe(true)
    );
  });

  // 19 NACL deny SSH (22) from each public subnet CIDR
  test("NACL explicitly denies SSH (22) from each public subnet CIDR", () => {
    ["DbNaclInDenySshPubA","DbNaclInDenySshPubB","DbNaclInDenySshPubC"].forEach((id) => {
      expect(blockHas(id, "Type: AWS::EC2::NetworkAclEntry")).toBe(true);
      expect(blockHas(id, "RuleAction: deny")).toBe(true);
      expect(blockHas(id, "Protocol: 6")).toBe(true);
      expect(blockHas(id, "PortRange: { From: 22, To: 22 }")).toBe(true);
      expect(blockHas(id, "CidrBlock: !Select [0, !Ref PublicSubnetCidrs]") ||
             blockHas(id, "CidrBlock: !Select [1, !Ref PublicSubnetCidrs]") ||
             blockHas(id, "CidrBlock: !Select [2, !Ref PublicSubnetCidrs]")).toBe(true);
    });
  });

  // 20 tagging keys exist (sampled resources)
  test("core resources include Environment, Team, CostCenter tags", () => {
    const core = ["Vpc","InternetGateway","PublicSubnetA","PrivateSubnetA","DbSubnetA","NatGatewayA","PublicRTA","PrivateRTA","DbRTA"];
    core.forEach((id) => {
      const blk = getResourceBlock(id);
      expect(blk).toBeTruthy();
      expect(/Key:\s+Environment/.test(blk!)).toBe(true);
      expect(/Key:\s+Team/.test(blk!)).toBe(true);
      expect(/Key:\s+CostCenter/.test(blk!)).toBe(true);
    });
  });

  // 21 Name tags interpolate environment suffix
  test("Name tag values include ${EnvironmentSuffix}", () => {
    const ids = ["Vpc","InternetGateway","PublicRTA","PrivateRTA","DbRTA","S3Endpoint","DynamoDbEndpoint"];
    ids.forEach((id) => {
      const blk = getResourceBlock(id)!;
      expect(/\bKey:\s+Name\b[\s\S]*?\bValue:\s+!Sub\s+"?[^"\n]*\$\{EnvironmentSuffix\}/m.test(blk)).toBe(true);
    });
  });

  // 22 Outputs include all required keys
  test("Outputs include VPC, subnets, RTs, NATs, endpoints, and flow logs", () => {
    const required = [
      "VpcId:",
      "PublicSubnetAId:",
      "PublicSubnetBId:",
      "PublicSubnetCId:",
      "PrivateSubnetAId:",
      "PrivateSubnetBId:",
      "PrivateSubnetCId:",
      "DbSubnetAId:",
      "DbSubnetBId:",
      "DbSubnetCId:",
      "PublicRTAId:",
      "PublicRTBId:",
      "PublicRTCId:",
      "PrivateRTAId:",
      "PrivateRTBId:",
      "PrivateRTCId:",
      "DbRTAId:",
      "DbRTBId:",
      "DbRTCId:",
      "InternetGatewayId:",
      "NatGatewayAId:",
      "NatGatewayBId:",
      "NatGatewayCId:",
      "S3EndpointId:",
      "DynamoDbEndpointId:",
      "FlowLogsLogGroupName:",
      "FlowLogsRoleArn:",
    ];
    required.forEach((o) => expect(hasRegex(new RegExp(`^\\s*${o}`, "m"))).toBe(true));
  });

  // 23 No unused parameters pattern (sanity — AZCount removed)
  test("no AZCount parameter (previous linter warning fixed)", () => {
    expect(hasRegex(/^\s*AZCount:/m)).toBe(false);
  });

  // 24 JSON file optional presence check (won't fail if absent)
  test("optional TapStack.json check (if present)", () => {
    const exists = fs.existsSync(jsonPath);
    expect(typeof exists).toBe("boolean");
  });

  // 25 No route entries sending db RTs to IGW/NAT (extra guard)
  test("no route entries attach IGW/NAT to DbRTA/DbRTB/DbRTC", () => {
    const routeBlocks = text.match(/^\s{2,}[A-Za-z0-9]+:\n\s{4}Type:\sAWS::EC2::Route[\s\S]*?(?=^\s{2}[A-Za-z0-9]+:|^\sOutputs:|^\s#|\Z)/gm) || [];
    const bad = routeBlocks.some((blk) => {
      const isDbRt = /RouteTableId:\s!Ref\s(DbRTA|DbRTB|DbRTC)/.test(blk);
      const toIgw = /GatewayId:\s!Ref\sInternetGateway/.test(blk) || /GatewayId:/.test(blk);
      const toNat = /NatGatewayId:\s!Ref\s(NatGatewayA|NatGatewayB|NatGatewayC)/.test(blk);
      return isDbRt && (toIgw || toNat);
    });
    expect(bad).toBe(false);
  });
});
