// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/main.tf (modular architecture)
// No Terraform or CDKTF commands are executed - pure static code analysis

import fs from "fs";
import path from "path";

const MAIN_TF = "../lib/main.tf";
const mainPath = path.resolve(__dirname, MAIN_TF);
let mainContent: string;

beforeAll(() => {
  if (!fs.existsSync(mainPath)) {
    throw new Error(`Main file not found at: ${mainPath}`);
  }
  mainContent = fs.readFileSync(mainPath, "utf8");
});

describe("Terraform Main File Structure", () => {
  test("main.tf exists", () => {
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test("main.tf is not empty", () => {
    expect(mainContent.length).toBeGreaterThan(0);
  });

  test("main.tf has reasonable size", () => {
    expect(mainContent.length).toBeGreaterThan(10000);
  });
});

describe("Provider Configuration", () => {
  test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
    expect(mainContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("does NOT declare terraform block in main.tf", () => {
    expect(mainContent).not.toMatch(/\bterraform\s*{/);
  });

  test("does NOT declare required_providers in main.tf", () => {
    expect(mainContent).not.toMatch(/\brequired_providers\s*{/);
  });
});

describe("Variable Declarations", () => {
  const requiredVariables = [
    "aws_region",
    "vpc_a_cidr",
    "vpc_b_cidr",
    "allowed_ports",
    "retention_days",
    "traffic_volume_threshold",
    "rejected_connections_threshold",
    "anomaly_threshold_percent",
    "traffic_baseline",
    "lambda_schedule",
    "alert_email",
    "create_dashboard",
    "environment",
    "owner",
    "enable_xray"
  ];

  requiredVariables.forEach(varName => {
    test(`declares ${varName} variable`, () => {
      expect(mainContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
    });
  });

  test("alert_email variable is marked as sensitive", () => {
    const alertEmailVarMatch = mainContent.match(
      /variable\s+"alert_email"\s*{[^}]*}/s
    );
    expect(alertEmailVarMatch).toBeTruthy();
    expect(alertEmailVarMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("vpc_a_cidr has validation block", () => {
    const vpcACidrMatch = mainContent.match(
      /variable\s+"vpc_a_cidr"\s*{[^}]*validation[^}]*}/s
    );
    expect(vpcACidrMatch).toBeTruthy();
  });

  test("vpc_b_cidr has validation block", () => {
    const vpcBCidrMatch = mainContent.match(
      /variable\s+"vpc_b_cidr"\s*{[^}]*validation[^}]*}/s
    );
    expect(vpcBCidrMatch).toBeTruthy();
  });

  test("allowed_ports has validation block", () => {
    const allowedPortsMatch = mainContent.match(
      /variable\s+"allowed_ports"\s*{[^}]*validation[^}]*}/s
    );
    expect(allowedPortsMatch).toBeTruthy();
  });
});

describe("Data Sources", () => {
  test("declares aws_caller_identity data source", () => {
    expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_availability_zones data source", () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("declares aws_region data source", () => {
    expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
  });
});

describe("Random Resources", () => {
  test("declares random_string resource for suffix", () => {
    expect(mainContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
  });

  test("random_string has length specified", () => {
    const randomStringMatch = mainContent.match(
      /resource\s+"random_string"\s+"suffix"\s*{[^}]*}/s
    );
    expect(randomStringMatch![0]).toMatch(/length\s*=\s*\d+/);
  });
});

describe("Locals Block", () => {
  test("declares locals block", () => {
    expect(mainContent).toMatch(/locals\s*{/);
  });

  test("locals defines suffix", () => {
    expect(mainContent).toMatch(/suffix\s*=/);
  });

  test("locals defines common_tags", () => {
    expect(mainContent).toMatch(/common_tags\s*=/);
  });

  test("common_tags includes Environment tag", () => {
    expect(mainContent).toMatch(/Environment/);
  });

  test("common_tags includes ManagedBy = Terraform tag", () => {
    expect(mainContent).toMatch(/ManagedBy.*=.*"Terraform"/);
  });

  test("common_tags includes Project tag", () => {
    expect(mainContent).toMatch(/Project/);
  });
});

describe("VPC Modules", () => {
  test("declares VPC-A module", () => {
    expect(mainContent).toMatch(/module\s+"vpc_a"\s*{/);
  });

  test("declares VPC-B module", () => {
    expect(mainContent).toMatch(/module\s+"vpc_b"\s*{/);
  });

  test("VPC-A module uses ./modules/vpc source", () => {
    const vpcAMatch = mainContent.match(/module\s+"vpc_a"\s*{[^}]*source[^}]*}/s);
    expect(vpcAMatch![0]).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test("VPC-B module uses ./modules/vpc source", () => {
    const vpcBMatch = mainContent.match(/module\s+"vpc_b"\s*{[^}]*source[^}]*}/s);
    expect(vpcBMatch![0]).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test("VPC modules enable DNS hostnames", () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC modules enable DNS support", () => {
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });
});

describe("VPC Peering Connection", () => {
  test("declares VPC peering connection", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"a_to_b"/);
  });

  test("peering connection has auto_accept = true", () => {
    const peeringMatch = mainContent.match(
      /resource\s+"aws_vpc_peering_connection"\s+"a_to_b"\s*{[^}]*}/s
    );
    expect(peeringMatch![0]).toMatch(/auto_accept\s*=\s*true/);
  });

  test("peering connection has requester block with DNS resolution", () => {
    const peeringStart = mainContent.indexOf('resource "aws_vpc_peering_connection" "a_to_b"');
    const nextResource = mainContent.indexOf('\n# =', peeringStart + 1);
    const peeringBlock = mainContent.substring(peeringStart, nextResource);
    expect(peeringBlock).toMatch(/requester\s*{/);
    expect(peeringBlock).toMatch(/allow_remote_vpc_dns_resolution\s*=\s*true/);
  });

  test("peering connection has accepter block with DNS resolution", () => {
    const peeringStart = mainContent.indexOf('resource "aws_vpc_peering_connection" "a_to_b"');
    const nextResource = mainContent.indexOf('\n# =', peeringStart + 1);
    const peeringBlock = mainContent.substring(peeringStart, nextResource);
    expect(peeringBlock).toMatch(/accepter\s*{/);
    expect(peeringBlock).toMatch(/allow_remote_vpc_dns_resolution\s*=\s*true/);
  });
});

describe("Peering Routes", () => {
  test("declares route from VPC-A public to VPC-B", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_public_to_vpc_b"/);
  });

  test("declares routes from VPC-A private to VPC-B", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_private_to_vpc_b"/);
  });

  test("declares route from VPC-B public to VPC-A", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route"\s+"vpc_b_public_to_vpc_a"/);
  });

  test("declares routes from VPC-B private to VPC-A", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route"\s+"vpc_b_private_to_vpc_a"/);
  });

  test("peering routes reference vpc_peering_connection_id", () => {
    const routeMatches = mainContent.match(
      /resource\s+"aws_route"\s+"vpc_a_public_to_vpc_b"\s*{[^}]*}/s
    );
    expect(routeMatches![0]).toMatch(/vpc_peering_connection_id/);
  });
});

describe("Security Module", () => {
  test("declares security module", () => {
    expect(mainContent).toMatch(/module\s+"security"\s*{/);
  });

  test("security module uses ./modules/security source", () => {
    const securityMatch = mainContent.match(/module\s+"security"\s*{[^}]*source[^}]*}/s);
    expect(securityMatch![0]).toMatch(/source\s*=\s*"\.\/modules\/security"/);
  });

  test("security module passes VPC IDs", () => {
    const securityMatch = mainContent.match(/module\s+"security"\s*{[^}]*}/s);
    expect(securityMatch![0]).toMatch(/vpc_a_id/);
    expect(securityMatch![0]).toMatch(/vpc_b_id/);
  });
});

describe("Monitoring Module", () => {
  test("declares monitoring module", () => {
    expect(mainContent).toMatch(/module\s+"monitoring"\s*{/);
  });

  test("monitoring module uses ./modules/monitoring source", () => {
    const monitoringMatch = mainContent.match(/module\s+"monitoring"\s*{[^}]*source[^}]*}/s);
    expect(monitoringMatch![0]).toMatch(/source\s*=\s*"\.\/modules\/monitoring"/);
  });

  test("monitoring module passes log group names", () => {
    const monitoringMatch = mainContent.match(/module\s+"monitoring"\s*{[^}]*}/s);
    expect(monitoringMatch![0]).toMatch(/vpc_a_log_group_name/);
    expect(monitoringMatch![0]).toMatch(/vpc_b_log_group_name/);
  });

  test("monitoring module passes alert email", () => {
    const monitoringMatch = mainContent.match(/module\s+"monitoring"\s*{[^}]*}/s);
    expect(monitoringMatch![0]).toMatch(/alert_email/);
  });
});

describe("Lambda Module", () => {
  test("declares lambda module", () => {
    expect(mainContent).toMatch(/module\s+"lambda"\s*{/);
  });

  test("lambda module uses ./modules/lambda source", () => {
    const lambdaMatch = mainContent.match(/module\s+"lambda"\s*{[^}]*source[^}]*}/s);
    expect(lambdaMatch![0]).toMatch(/source\s*=\s*"\.\/modules\/lambda"/);
  });

  test("lambda module passes log group names", () => {
    const lambdaStart = mainContent.indexOf('module "lambda"');
    const nextModule = mainContent.indexOf('\n# =', lambdaStart + 1);
    const lambdaBlock = mainContent.substring(lambdaStart, nextModule);
    expect(lambdaBlock).toMatch(/vpc_a_log_group_name/);
    expect(lambdaBlock).toMatch(/vpc_b_log_group_name/);
  });

  test("lambda module passes SNS topic ARN", () => {
    const lambdaStart = mainContent.indexOf('module "lambda"');
    const nextModule = mainContent.indexOf('\n# =', lambdaStart + 1);
    const lambdaBlock = mainContent.substring(lambdaStart, nextModule);
    expect(lambdaBlock).toMatch(/sns_topic_arn/);
  });

  test("lambda module has enable_xray parameter", () => {
    const lambdaStart = mainContent.indexOf('module "lambda"');
    const nextModule = mainContent.indexOf('\n# =', lambdaStart + 1);
    const lambdaBlock = mainContent.substring(lambdaStart, nextModule);
    expect(lambdaBlock).toMatch(/enable_xray/);
  });
});

describe("Output Declarations", () => {
  const requiredOutputs = [
    "vpc_a_id",
    "vpc_b_id",
    "vpc_a_cidr",
    "vpc_b_cidr",
    "peering_connection_id",
    "vpc_a_security_group_id",
    "vpc_b_security_group_id",
    "vpc_a_log_group_name",
    "vpc_b_log_group_name",
    "lambda_function_arn",
    "lambda_function_name",
    "sns_topic_arn",
    "dashboard_url",
    "alert_email"
  ];

  requiredOutputs.forEach(outputName => {
    test(`declares ${outputName} output`, () => {
      expect(mainContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*{`));
    });
  });

  test("alert_email output is marked as sensitive", () => {
    const outputMatch = mainContent.match(
      /output\s+"alert_email"\s*{[^}]*}/s
    );
    expect(outputMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("outputs reference module outputs", () => {
    expect(mainContent).toMatch(/module\.vpc_a\./);
    expect(mainContent).toMatch(/module\.vpc_b\./);
    expect(mainContent).toMatch(/module\.security\./);
    expect(mainContent).toMatch(/module\.monitoring\./);
    expect(mainContent).toMatch(/module\.lambda\./);
  });
});

describe("Resource Naming with Suffix", () => {
  test("resources use suffix for unique naming", () => {
    expect(mainContent).toMatch(/\$\{local\.suffix\}/);
  });

  test("module configurations reference local.suffix", () => {
    const vpcMatch = mainContent.match(/module\s+"vpc_a"\s*{[^}]*}/s);
    expect(vpcMatch![0]).toMatch(/suffix\s*=\s*local\.suffix/);
  });
});

describe("Tagging Consistency", () => {
  test("modules receive common_tags", () => {
    const mergeCount = (mainContent.match(/common_tags\s*=\s*local\.common_tags/g) || []).length;
    expect(mergeCount).toBeGreaterThan(4); // Should pass tags to all modules
  });

  test("peering connection merges common_tags", () => {
    const peeringStart = mainContent.indexOf('resource "aws_vpc_peering_connection" "a_to_b"');
    const nextResource = mainContent.indexOf('\n# =', peeringStart + 1);
    const peeringBlock = mainContent.substring(peeringStart, nextResource);
    expect(peeringBlock).toMatch(/merge\(local\.common_tags/);
  });
});

describe("Modular Architecture", () => {
  test("uses module blocks instead of direct resources for VPCs", () => {
    expect(mainContent).toMatch(/module\s+"vpc_a"/);
    expect(mainContent).toMatch(/module\s+"vpc_b"/);
    expect(mainContent).not.toMatch(/resource\s+"aws_vpc"\s+"vpc_a"/);
    expect(mainContent).not.toMatch(/resource\s+"aws_vpc"\s+"vpc_b"/);
  });

  test("uses module blocks for security", () => {
    expect(mainContent).toMatch(/module\s+"security"/);
  });

  test("uses module blocks for monitoring", () => {
    expect(mainContent).toMatch(/module\s+"monitoring"/);
  });

  test("uses module blocks for lambda", () => {
    expect(mainContent).toMatch(/module\s+"lambda"/);
  });

  test("total number of modules is 5 (vpc_a, vpc_b, security, monitoring, lambda)", () => {
    // Only count active modules (not commented out with #)
    const lines = mainContent.split('\n');
    const moduleCount = lines.filter(line => {
      return line.match(/^\s*module\s+"/) && !line.trim().startsWith('#');
    }).length;
    expect(moduleCount).toBe(5);
  });
});
