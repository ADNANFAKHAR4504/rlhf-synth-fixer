// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed - pure static code analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
let stackContent: string;

beforeAll(() => {
  if (!fs.existsSync(stackPath)) {
    throw new Error(`Stack file not found at: ${stackPath}`);
  }
  stackContent = fs.readFileSync(stackPath, "utf8");
});

describe("Terraform Stack File Existence", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("tap_stack.tf is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("tap_stack.tf has reasonable size (not truncated)", () => {
    // Should have at least 20KB of content for complete implementation
    expect(stackContent.length).toBeGreaterThan(20000);
  });
});

describe("Provider Configuration", () => {
  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("does NOT declare terraform block in tap_stack.tf", () => {
    expect(stackContent).not.toMatch(/\bterraform\s*{/);
  });

  test("does NOT declare required_providers in tap_stack.tf", () => {
    expect(stackContent).not.toMatch(/\brequired_providers\s*{/);
  });
});

describe("Variable Declarations", () => {
  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares vpc_a_cidr variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_a_cidr"\s*{/);
  });

  test("declares vpc_b_cidr variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_b_cidr"\s*{/);
  });

  test("declares allowed_ports variable", () => {
    expect(stackContent).toMatch(/variable\s+"allowed_ports"\s*{/);
  });

  test("declares retention_days variable", () => {
    expect(stackContent).toMatch(/variable\s+"retention_days"\s*{/);
  });

  test("declares traffic_volume_threshold variable", () => {
    expect(stackContent).toMatch(/variable\s+"traffic_volume_threshold"\s*{/);
  });

  test("declares rejected_connections_threshold variable", () => {
    expect(stackContent).toMatch(/variable\s+"rejected_connections_threshold"\s*{/);
  });

  test("declares anomaly_threshold_percent variable", () => {
    expect(stackContent).toMatch(/variable\s+"anomaly_threshold_percent"\s*{/);
  });

  test("declares traffic_baseline variable", () => {
    expect(stackContent).toMatch(/variable\s+"traffic_baseline"\s*{/);
  });

  test("declares lambda_schedule variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_schedule"\s*{/);
  });

  test("declares alert_email variable", () => {
    expect(stackContent).toMatch(/variable\s+"alert_email"\s*{/);
  });

  test("declares create_dashboard variable", () => {
    expect(stackContent).toMatch(/variable\s+"create_dashboard"\s*{/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares owner variable", () => {
    expect(stackContent).toMatch(/variable\s+"owner"\s*{/);
  });

  test("alert_email variable is marked as sensitive", () => {
    const alertEmailVarMatch = stackContent.match(
      /variable\s+"alert_email"\s*{[^}]*}/s
    );
    expect(alertEmailVarMatch).toBeTruthy();
    expect(alertEmailVarMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("vpc_a_cidr has validation block", () => {
    const vpcACidrMatch = stackContent.match(
      /variable\s+"vpc_a_cidr"\s*{[^}]*validation[^}]*}/s
    );
    expect(vpcACidrMatch).toBeTruthy();
  });

  test("vpc_b_cidr has validation block", () => {
    const vpcBCidrMatch = stackContent.match(
      /variable\s+"vpc_b_cidr"\s*{[^}]*validation[^}]*}/s
    );
    expect(vpcBCidrMatch).toBeTruthy();
  });

  test("allowed_ports has validation block", () => {
    const allowedPortsMatch = stackContent.match(
      /variable\s+"allowed_ports"\s*{[^}]*validation[^}]*}/s
    );
    expect(allowedPortsMatch).toBeTruthy();
  });
});

describe("Data Sources", () => {
  test("declares aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("declares archive_file data source for Lambda", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_traffic_analyzer"/);
  });
});

describe("Random Resources", () => {
  test("declares random_string resource for suffix", () => {
    expect(stackContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
  });

  test("random_string has length specified", () => {
    const randomStringMatch = stackContent.match(
      /resource\s+"random_string"\s+"suffix"\s*{[^}]*}/s
    );
    expect(randomStringMatch![0]).toMatch(/length\s*=\s*\d+/);
  });
});

describe("Locals Block", () => {
  test("declares locals block", () => {
    expect(stackContent).toMatch(/locals\s*{/);
  });

  test("locals defines suffix", () => {
    expect(stackContent).toMatch(/suffix\s*=/);
  });

  test("locals defines common_tags", () => {
    expect(stackContent).toMatch(/common_tags\s*=/);
  });

  test("common_tags includes Environment tag", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags[^}]*}/s);
    expect(localsMatch).toBeTruthy();
    expect(localsMatch![0]).toMatch(/Environment/);
  });

  test("common_tags includes ManagedBy = Terraform tag", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags[^}]*}/s);
    expect(localsMatch![0]).toMatch(/ManagedBy.*=.*"Terraform"/);
  });

  test("common_tags includes Project tag", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags[^}]*}/s);
    expect(localsMatch![0]).toMatch(/Project/);
  });
});

describe("VPC Resources", () => {
  test("declares VPC-A resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"vpc_a"/);
  });

  test("declares VPC-B resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"vpc_b"/);
  });

  test("VPC-A enables DNS hostnames", () => {
    const vpcAMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_a"\s*{[^}]*}/s
    );
    expect(vpcAMatch![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC-A enables DNS support", () => {
    const vpcAMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_a"\s*{[^}]*}/s
    );
    expect(vpcAMatch![0]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC-B enables DNS hostnames", () => {
    const vpcBMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_b"\s*{[^}]*}/s
    );
    expect(vpcBMatch![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC-B enables DNS support", () => {
    const vpcBMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_b"\s*{[^}]*}/s
    );
    expect(vpcBMatch![0]).toMatch(/enable_dns_support\s*=\s*true/);
  });
});

describe("Subnet Resources", () => {
  test("declares VPC-A public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"vpc_a_public"/);
  });

  test("declares VPC-A private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"vpc_a_private"/);
  });

  test("declares VPC-B public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"vpc_b_public"/);
  });

  test("declares VPC-B private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"vpc_b_private"/);
  });

  test("VPC-A public subnets use count", () => {
    const subnetMatch = stackContent.match(
      /resource\s+"aws_subnet"\s+"vpc_a_public"\s*{[^}]*count[^}]*}/s
    );
    expect(subnetMatch).toBeTruthy();
  });

  test("VPC-A private subnets use count", () => {
    const subnetMatch = stackContent.match(
      /resource\s+"aws_subnet"\s+"vpc_a_private"\s*{[^}]*count[^}]*}/s
    );
    expect(subnetMatch).toBeTruthy();
  });
});

describe("Gateway Resources", () => {
  test("declares VPC-A Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"vpc_a"/);
  });

  test("declares VPC-B Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"vpc_b"/);
  });

  test("declares VPC-A NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"vpc_a"/);
  });

  test("declares VPC-B NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"vpc_b"/);
  });

  test("declares EIP for VPC-A NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"vpc_a_nat"/);
  });

  test("declares EIP for VPC-B NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"vpc_b_nat"/);
  });

  test("VPC-A NAT Gateway has depends_on Internet Gateway", () => {
    // Extract the NAT gateway resource block
    const natStart = stackContent.indexOf('resource "aws_nat_gateway" "vpc_a"');
    const nextResource = stackContent.indexOf('\nresource ', natStart + 1);
    const natBlock = stackContent.substring(natStart, nextResource);
    expect(natBlock).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.vpc_a\]/);
  });
});

describe("Route Table Resources", () => {
  test("declares VPC-A public route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"vpc_a_public"/);
  });

  test("declares VPC-A private route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"vpc_a_private"/);
  });

  test("declares VPC-B public route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"vpc_b_public"/);
  });

  test("declares VPC-B private route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"vpc_b_private"/);
  });

  test("declares route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
  });

  test("declares route for VPC-A public to internet", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_public_internet"/);
  });

  test("declares route for VPC-A private to NAT", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_private_nat"/);
  });
});

describe("VPC Peering Connection", () => {
  test("declares VPC peering connection", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"a_to_b"/);
  });

  test("peering connection has auto_accept = true", () => {
    const peeringMatch = stackContent.match(
      /resource\s+"aws_vpc_peering_connection"\s+"a_to_b"\s*{[^}]*}/s
    );
    expect(peeringMatch![0]).toMatch(/auto_accept\s*=\s*true/);
  });

  test("peering connection has requester block with DNS resolution", () => {
    const peeringMatch = stackContent.match(
      /resource\s+"aws_vpc_peering_connection"\s+"a_to_b"\s*{[^}]*requester[^}]*}/s
    );
    expect(peeringMatch).toBeTruthy();
    expect(peeringMatch![0]).toMatch(/allow_remote_vpc_dns_resolution\s*=\s*true/);
  });

  test("peering connection has accepter block with DNS resolution", () => {
    const peeringStart = stackContent.indexOf('resource "aws_vpc_peering_connection" "a_to_b"');
    const nextResource = stackContent.indexOf('\n# =', peeringStart + 1);
    const peeringBlock = stackContent.substring(peeringStart, nextResource);
    expect(peeringBlock).toMatch(/accepter\s*{/);
    expect(peeringBlock).toMatch(/allow_remote_vpc_dns_resolution\s*=\s*true/);
  });
});

describe("Peering Routes", () => {
  test("declares route from VPC-A public to VPC-B", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_public_to_vpc_b"/);
  });

  test("declares routes from VPC-A private to VPC-B", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_a_private_to_vpc_b"/);
  });

  test("declares route from VPC-B public to VPC-A", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_b_public_to_vpc_a"/);
  });

  test("declares routes from VPC-B private to VPC-A", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route"\s+"vpc_b_private_to_vpc_a"/);
  });

  test("peering routes reference vpc_peering_connection_id", () => {
    const routeMatches = stackContent.match(
      /resource\s+"aws_route"\s+"vpc_a_public_to_vpc_b"\s*{[^}]*}/s
    );
    expect(routeMatches![0]).toMatch(/vpc_peering_connection_id/);
  });
});

describe("Security Groups", () => {
  test("declares VPC-A security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_a"/);
  });

  test("declares VPC-B security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_b"/);
  });

  test("declares ingress rules for VPC-A", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"vpc_a_from_vpc_b"/);
  });

  test("declares egress rules for VPC-A", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"vpc_a_to_vpc_b"/);
  });

  test("declares ingress rules for VPC-B", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"vpc_b_from_vpc_a"/);
  });

  test("declares egress rules for VPC-B", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"vpc_b_to_vpc_a"/);
  });

  test("security group rules use for_each pattern", () => {
    const ingressMatch = stackContent.match(
      /resource\s+"aws_vpc_security_group_ingress_rule"\s+"vpc_a_from_vpc_b"\s*{[^}]*for_each[^}]*}/s
    );
    expect(ingressMatch).toBeTruthy();
  });
});

describe("IAM Roles", () => {
  test("declares IAM role for Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
  });

  test("declares IAM role policy for Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/);
  });

  test("declares IAM role for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_traffic_analyzer"/);
  });

  test("declares IAM role policy for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_traffic_analyzer"/);
  });

  test("Flow Logs IAM role has vpc-flow-logs.amazonaws.com principal", () => {
    const roleStart = stackContent.indexOf('resource "aws_iam_role" "flow_logs"');
    const nextResource = stackContent.indexOf('\nresource ', roleStart + 1);
    const roleBlock = stackContent.substring(roleStart, nextResource);
    expect(roleBlock).toMatch(/vpc-flow-logs\.amazonaws\.com/);
  });

  test("Lambda IAM role has lambda.amazonaws.com principal", () => {
    const roleStart = stackContent.indexOf('resource "aws_iam_role" "lambda_traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', roleStart + 1);
    const roleBlock = stackContent.substring(roleStart, nextResource);
    expect(roleBlock).toMatch(/lambda\.amazonaws\.com/);
  });
});

describe("CloudWatch Log Groups", () => {
  test("declares VPC-A Flow Logs log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_a_flow_logs"/);
  });

  test("declares VPC-B Flow Logs log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_b_flow_logs"/);
  });

  test("declares Lambda log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_traffic_analyzer"/);
  });

  test("log groups have retention_in_days set", () => {
    const logGroupStart = stackContent.indexOf('resource "aws_cloudwatch_log_group" "vpc_a_flow_logs"');
    const nextResource = stackContent.indexOf('\nresource ', logGroupStart + 1);
    const logGroupBlock = stackContent.substring(logGroupStart, nextResource);
    expect(logGroupBlock).toMatch(/retention_in_days/);
  });
});

describe("VPC Flow Logs", () => {
  test("declares VPC-A Flow Log", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_a"/);
  });

  test("declares VPC-B Flow Log", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_b"/);
  });

  test("Flow Logs capture ALL traffic", () => {
    const flowLogMatch = stackContent.match(
      /resource\s+"aws_flow_log"\s+"vpc_a"\s*{[^}]*}/s
    );
    expect(flowLogMatch![0]).toMatch(/traffic_type\s*=\s*"ALL"/);
  });

  test("Flow Logs send to CloudWatch", () => {
    const flowLogMatch = stackContent.match(
      /resource\s+"aws_flow_log"\s+"vpc_a"\s*{[^}]*}/s
    );
    expect(flowLogMatch![0]).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/);
  });
});

describe("CloudWatch Metric Filters", () => {
  test("declares VPC-A traffic volume metric filter", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"vpc_a_traffic_volume"/);
  });

  test("declares VPC-A rejected connections metric filter", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"vpc_a_rejected_connections"/);
  });

  test("declares VPC-B traffic volume metric filter", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"vpc_b_traffic_volume"/);
  });

  test("declares VPC-B rejected connections metric filter", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"vpc_b_rejected_connections"/);
  });

  test("metric filters use Company/VPCPeering namespace", () => {
    const metricStart = stackContent.indexOf('resource "aws_cloudwatch_log_metric_filter" "vpc_a_traffic_volume"');
    const nextResource = stackContent.indexOf('\nresource ', metricStart + 1);
    const metricBlock = stackContent.substring(metricStart, nextResource);
    expect(metricBlock).toMatch(/namespace\s*=\s*"Company\/VPCPeering"/);
  });
});

describe("SNS Topic", () => {
  test("declares SNS topic for alerts", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
  });

  test("declares SNS topic subscription", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"/);
  });

  test("declares SNS topic policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"alerts"/);
  });

  test("SNS subscription uses email protocol", () => {
    const subMatch = stackContent.match(
      /resource\s+"aws_sns_topic_subscription"\s+"alerts_email"\s*{[^}]*}/s
    );
    expect(subMatch![0]).toMatch(/protocol\s*=\s*"email"/);
  });

  test("SNS topic policy allows CloudWatch to publish", () => {
    const policyMatch = stackContent.match(
      /resource\s+"aws_sns_topic_policy"\s+"alerts"\s*{[^}]*}/s
    );
    expect(policyMatch![0]).toMatch(/cloudwatch\.amazonaws\.com/);
  });

  test("SNS topic policy allows Lambda to publish", () => {
    const policyStart = stackContent.indexOf('resource "aws_sns_topic_policy" "alerts"');
    const nextResource = stackContent.indexOf('\n# =', policyStart + 1);
    const policyBlock = stackContent.substring(policyStart, nextResource);
    expect(policyBlock).toMatch(/lambda\.amazonaws\.com/);
  });
});

describe("CloudWatch Alarms", () => {
  test("declares VPC-A traffic volume alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"vpc_a_traffic_volume"/);
  });

  test("declares VPC-A rejected connections alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"vpc_a_rejected_connections"/);
  });

  test("declares VPC-B traffic volume alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"vpc_b_traffic_volume"/);
  });

  test("declares VPC-B rejected connections alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"vpc_b_rejected_connections"/);
  });

  test("alarms have depends_on metric filters", () => {
    const alarmStart = stackContent.indexOf('resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume"');
    const nextResource = stackContent.indexOf('\nresource ', alarmStart + 1);
    const alarmBlock = stackContent.substring(alarmStart, nextResource);
    expect(alarmBlock).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_metric_filter\.vpc_a_traffic_volume\]/);
  });

  test("alarms publish to SNS topic", () => {
    const alarmStart = stackContent.indexOf('resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume"');
    const nextResource = stackContent.indexOf('\nresource ', alarmStart + 1);
    const alarmBlock = stackContent.substring(alarmStart, nextResource);
    expect(alarmBlock).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
  });
});

describe("Lambda Function", () => {
  test("declares Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"traffic_analyzer"/);
  });

  test("Lambda uses python3.12 runtime", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/runtime\s*=\s*"python3\.12"/);
  });

  test("Lambda has environment variables", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/environment\s*{/);
    expect(lambdaBlock).toMatch(/variables\s*=/);
  });

  test("Lambda environment includes VPC_A_LOG_GROUP", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/VPC_A_LOG_GROUP/);
  });

  test("Lambda environment includes VPC_B_LOG_GROUP", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/VPC_B_LOG_GROUP/);
  });

  test("Lambda environment includes SNS_TOPIC_ARN", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/SNS_TOPIC_ARN/);
  });

  test("Lambda has timeout configured", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/timeout\s*=\s*\d+/);
  });

  test("Lambda has memory_size configured", () => {
    const lambdaStart = stackContent.indexOf('resource "aws_lambda_function" "traffic_analyzer"');
    const nextResource = stackContent.indexOf('\nresource ', lambdaStart + 1);
    const lambdaBlock = stackContent.substring(lambdaStart, nextResource);
    expect(lambdaBlock).toMatch(/memory_size\s*=\s*\d+/);
  });
});

describe("EventBridge Scheduling", () => {
  test("declares EventBridge rule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"lambda_schedule"/);
  });

  test("declares EventBridge target", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"/);
  });

  test("declares Lambda permission for EventBridge", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
  });

  test("EventBridge rule has schedule_expression", () => {
    const ruleStart = stackContent.indexOf('resource "aws_cloudwatch_event_rule" "lambda_schedule"');
    const nextResource = stackContent.indexOf('\nresource ', ruleStart + 1);
    const ruleBlock = stackContent.substring(ruleStart, nextResource);
    expect(ruleBlock).toMatch(/schedule_expression/);
  });

  test("Lambda permission allows events.amazonaws.com", () => {
    const permMatch = stackContent.match(
      /resource\s+"aws_lambda_permission"\s+"allow_eventbridge"\s*{[^}]*}/s
    );
    expect(permMatch![0]).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
  });
});

describe("CloudWatch Dashboard", () => {
  test("declares CloudWatch dashboard with conditional count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"vpc_peering"/);
  });

  test("dashboard uses count for conditional creation", () => {
    const dashMatch = stackContent.match(
      /resource\s+"aws_cloudwatch_dashboard"\s+"vpc_peering"\s*{[^}]*count[^}]*}/s
    );
    expect(dashMatch).toBeTruthy();
  });

  test("dashboard has dashboard_body", () => {
    const dashStart = stackContent.indexOf('resource "aws_cloudwatch_dashboard" "vpc_peering"');
    const nextResource = stackContent.indexOf('\n# =', dashStart + 1);
    const dashBlock = stackContent.substring(dashStart, nextResource);
    expect(dashBlock).toMatch(/dashboard_body\s*=/);
  });
});

describe("Output Declarations", () => {
  test("declares vpc_a_id output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_a_id"\s*{/);
  });

  test("declares vpc_b_id output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_b_id"\s*{/);
  });

  test("declares vpc_a_cidr output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_a_cidr"\s*{/);
  });

  test("declares vpc_b_cidr output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_b_cidr"\s*{/);
  });

  test("declares peering_connection_id output", () => {
    expect(stackContent).toMatch(/output\s+"peering_connection_id"\s*{/);
  });

  test("declares vpc_a_security_group_id output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_a_security_group_id"\s*{/);
  });

  test("declares vpc_b_security_group_id output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_b_security_group_id"\s*{/);
  });

  test("declares vpc_a_log_group_name output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_a_log_group_name"\s*{/);
  });

  test("declares vpc_b_log_group_name output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_b_log_group_name"\s*{/);
  });

  test("declares lambda_function_arn output", () => {
    expect(stackContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
  });

  test("declares lambda_function_name output", () => {
    expect(stackContent).toMatch(/output\s+"lambda_function_name"\s*{/);
  });

  test("declares sns_topic_arn output", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
  });

  test("declares dashboard_url output", () => {
    expect(stackContent).toMatch(/output\s+"dashboard_url"\s*{/);
  });

  test("declares alert_email output", () => {
    expect(stackContent).toMatch(/output\s+"alert_email"\s*{/);
  });

  test("alert_email output is marked as sensitive", () => {
    const outputMatch = stackContent.match(
      /output\s+"alert_email"\s*{[^}]*}/s
    );
    expect(outputMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Resource Naming with Suffix", () => {
  test("resources use suffix for unique naming", () => {
    // Check that resources reference local.suffix
    expect(stackContent).toMatch(/\$\{local\.suffix\}/);
  });

  test("VPC-A name includes suffix", () => {
    const vpcMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_a"\s*{[^}]*tags[^}]*Name[^}]*}/s
    );
    expect(vpcMatch![0]).toMatch(/vpc-a-.*\$\{local\.suffix\}/);
  });
});

describe("Tagging Consistency", () => {
  test("resources merge common_tags", () => {
    const mergeCount = (stackContent.match(/merge\(local\.common_tags/g) || []).length;
    expect(mergeCount).toBeGreaterThan(10); // Should have many resources with merged tags
  });

  test("VPC resources have VPC tag", () => {
    const vpcAMatch = stackContent.match(
      /resource\s+"aws_vpc"\s+"vpc_a"\s*{[^}]*tags.*VPC.*=.*"VPC-A"[^}]*}/s
    );
    expect(vpcAMatch).toBeTruthy();
  });
});
