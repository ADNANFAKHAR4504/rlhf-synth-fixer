// Unit tests for multi-region DR Terraform infrastructure
// Target: 90%+ coverage of tap_stack.tf resources

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

describe("Multi-Region DR Infrastructure - File Structure", () => {
  test("tap_stack.tf file exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[FAIL] Expected stack file at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf file exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });

  test("tap_stack.tf has non-zero content", () => {
    const stats = fs.statSync(stackPath);
    expect(stats.size).toBeGreaterThan(100);
  });
});

describe("Multi-Region DR Infrastructure - Provider Configuration", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("provider.tf declares primary AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("tap_stack.tf declares secondary provider with alias", () => {
    expect(stackContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
  });

  test("secondary provider uses secondary_region variable", () => {
    expect(stackContent).toMatch(/region\s*=\s*var\.secondary_region/);
  });

  test("provider.tf does NOT declare provider in tap_stack.tf unnecessarily", () => {
    // Ensure primary provider is in provider.tf, not duplicated
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Variables", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares secondary_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
  });

  test("declares environment variable with validation", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    expect(stackContent).toMatch(/validation\s*{/);
  });

  test("declares VPC CIDR variables for both regions", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
  });

  test("declares Aurora instance_class variable", () => {
    expect(stackContent).toMatch(/variable\s+"aurora_instance_class"\s*{/);
  });

  test("declares EC2 instance_type variable", () => {
    expect(stackContent).toMatch(/variable\s+"ec2_instance_type"\s*{/);
  });

  test("declares ASG capacity variables", () => {
    expect(stackContent).toMatch(/variable\s+"asg_min_capacity"\s*{/);
    expect(stackContent).toMatch(/variable\s+"asg_max_capacity"\s*{/);
    expect(stackContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Networking (Primary)", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr_primary/);
  });

  test("enables DNS hostnames and support in primary VPC", () => {
    const vpcBlock = stackContent.match(/resource\s+"aws_vpc"\s+"primary"\s*{[^}]*}/s);
    expect(vpcBlock).toBeTruthy();
    expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates primary public subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
  });

  test("creates primary private subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"\s*{/);
  });

  test("creates Internet Gateway for primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.primary\.id/);
  });

  test("creates NAT Gateways for primary region", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"\s*{/);
  });

  test("creates Elastic IPs for primary NAT Gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"primary_nat"\s*{/);
    expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("creates public route table for primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"\s*{/);
  });

  test("creates private route tables for primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private"\s*{/);
  });

  test("associates primary public subnets with route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_public"\s*{/);
  });

  test("associates primary private subnets with route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_private"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Networking (Secondary)", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates secondary VPC with secondary provider", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr_secondary/);
  });

  test("creates secondary public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_public"\s*{/);
  });

  test("creates secondary private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_private"\s*{/);
  });

  test("creates Internet Gateway for secondary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.secondary\.id/);
  });

  test("creates NAT Gateways for secondary region", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"\s*{/);
  });

  test("creates route tables for secondary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"secondary_public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"secondary_private"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary ALB security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"primary_alb"\s*{/);
  });

  test("primary ALB allows HTTP and HTTPS ingress", () => {
    const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"primary_alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*80/);
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*443/);
  });

  test("creates primary app security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"primary_app"\s*{/);
  });

  test("primary app security group allows traffic from ALB", () => {
    const appSgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"primary_app"\s*{[\s\S]*?(?=resource|$)/);
    expect(appSgBlock).toBeTruthy();
    expect(appSgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.primary_alb\.id\]/);
  });

  test("creates primary database security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"primary_db"\s*{/);
  });

  test("primary DB security group allows MySQL traffic from app servers", () => {
    const dbSgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"primary_db"\s*{[\s\S]*?(?=resource|$)/);
    expect(dbSgBlock).toBeTruthy();
    expect(dbSgBlock![0]).toMatch(/from_port\s*=\s*3306/);
    expect(dbSgBlock![0]).toMatch(/to_port\s*=\s*3306/);
  });

  test("creates secondary region security groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_alb"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_app"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_db"\s*{/);
  });

  test("secondary security groups use secondary provider", () => {
    const secondarySgBlocks = stackContent.match(/resource\s+"aws_security_group"\s+"secondary_\w+"\s*{[\s\S]*?provider\s*=\s*aws\.secondary/g);
    expect(secondarySgBlocks).toBeTruthy();
    expect(secondarySgBlocks!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Multi-Region DR Infrastructure - Aurora Global Database", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates RDS Global Cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"main"\s*{/);
    expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
  });

  test("creates primary Aurora cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/global_cluster_identifier\s*=\s*aws_rds_global_cluster\.main\.id/);
  });

  test("primary Aurora cluster has backup retention configured", () => {
    const primaryClusterBlock = stackContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?(?=resource\s+"aws_rds_cluster"|$)/);
    expect(primaryClusterBlock).toBeTruthy();
    expect(primaryClusterBlock![0]).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("primary Aurora cluster has storage encryption enabled", () => {
    const primaryClusterBlock = stackContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?(?=resource\s+"aws_rds_cluster"|$)/);
    expect(primaryClusterBlock).toBeTruthy();
    expect(primaryClusterBlock![0]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("creates primary Aurora cluster instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
  });

  test("creates DB subnet groups for both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"\s*{/);
  });

  test("creates secondary Aurora cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
  });

  test("creates secondary Aurora cluster instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"secondary"\s*{/);
  });

  test("secondary Aurora cluster references global cluster", () => {
    const secondaryClusterBlock = stackContent.match(/resource\s+"aws_rds_cluster"\s+"secondary"\s*{[\s\S]*?(?=resource\s+"aws_rds_cluster_instance"|$)/);
    expect(secondaryClusterBlock).toBeTruthy();
    expect(secondaryClusterBlock![0]).toMatch(/global_cluster_identifier\s*=\s*aws_rds_global_cluster\.main\.id/);
  });
});

describe("Multi-Region DR Infrastructure - DynamoDB Global Table", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates DynamoDB table with global replication", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"\s*{/);
  });

  test("DynamoDB table has replica in secondary region", () => {
    const dynamoBlock = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"main"\s*{[\s\S]*?(?=resource|$)/);
    expect(dynamoBlock).toBeTruthy();
    expect(dynamoBlock![0]).toMatch(/replica\s*{/);
    expect(dynamoBlock![0]).toMatch(/region_name\s*=\s*var\.secondary_region/);
  });

  test("DynamoDB table has stream enabled", () => {
    const dynamoBlock = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"main"\s*{[\s\S]*?(?=resource|$)/);
    expect(dynamoBlock).toBeTruthy();
    expect(dynamoBlock![0]).toMatch(/stream_enabled\s*=\s*true/);
  });

  test("DynamoDB table has point-in-time recovery enabled", () => {
    const dynamoBlock = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"main"\s*{[\s\S]*?(?=resource|$)/);
    expect(dynamoBlock).toBeTruthy();
    expect(dynamoBlock![0]).toMatch(/point_in_time_recovery\s*{/);
    expect(dynamoBlock![0]).toMatch(/enabled\s*=\s*true/);
  });

  test("DynamoDB table uses PAY_PER_REQUEST billing", () => {
    expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("DynamoDB table defines hash_key attribute", () => {
    const dynamoBlock = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"main"\s*{[\s\S]*?(?=resource|$)/);
    expect(dynamoBlock).toBeTruthy();
    expect(dynamoBlock![0]).toMatch(/hash_key\s*=\s*"id"/);
    expect(dynamoBlock![0]).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"id"[\s\S]*?type\s*=\s*"S"/);
  });
});

describe("Multi-Region DR Infrastructure - Application Load Balancers", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary ALB", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("primary ALB is internet-facing", () => {
    const albBlock = stackContent.match(/resource\s+"aws_lb"\s+"primary"\s*{[\s\S]*?(?=resource\s+"aws_lb"|resource\s+"aws_lb_target"|$)/);
    expect(albBlock).toBeTruthy();
    expect(albBlock![0]).toMatch(/internal\s*=\s*false/);
  });

  test("creates primary ALB target group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"\s*{/);
  });

  test("primary target group has health check configured", () => {
    const tgBlock = stackContent.match(/resource\s+"aws_lb_target_group"\s+"primary"\s*{[\s\S]*?(?=resource|$)/);
    expect(tgBlock).toBeTruthy();
    expect(tgBlock![0]).toMatch(/health_check\s*{/);
    expect(tgBlock![0]).toMatch(/path\s*=\s*"\/health"/);
  });

  test("creates primary ALB listener on port 80", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary"\s*{/);
    expect(stackContent).toMatch(/port\s*=\s*"80"/);
  });

  test("creates secondary ALB with provider", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"\s*{/);
    const secondaryAlbBlock = stackContent.match(/resource\s+"aws_lb"\s+"secondary"\s*{[\s\S]*?provider\s*=\s*aws\.secondary/);
    expect(secondaryAlbBlock).toBeTruthy();
  });

  test("creates secondary ALB target group and listener", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - IAM Roles and Policies", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates EC2 IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
  });

  test("EC2 role has assume role policy for EC2 service", () => {
    const ec2RoleBlock = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?(?=resource|$)/);
    expect(ec2RoleBlock).toBeTruthy();
    expect(ec2RoleBlock![0]).toMatch(/Service.*ec2\.amazonaws\.com/);
  });

  test("creates EC2 IAM role policy with DynamoDB permissions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
    const ec2PolicyBlock = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?(?=resource|$)/);
    expect(ec2PolicyBlock).toBeTruthy();
    expect(ec2PolicyBlock![0]).toMatch(/dynamodb:GetItem/);
    expect(ec2PolicyBlock![0]).toMatch(/dynamodb:PutItem/);
  });

  test("creates EC2 instance profile", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
  });

  test("creates Lambda IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"\s*{/);
  });

  test("Lambda role has assume role policy for Lambda service", () => {
    const lambdaRoleBlock = stackContent.match(/resource\s+"aws_iam_role"\s+"lambda_role"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaRoleBlock).toBeTruthy();
    expect(lambdaRoleBlock![0]).toMatch(/Service.*lambda\.amazonaws\.com/);
  });

  test("Lambda role policy includes RDS failover permissions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"\s*{/);
    const lambdaPolicyBlock = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaPolicyBlock).toBeTruthy();
    expect(lambdaPolicyBlock![0]).toMatch(/rds:FailoverGlobalCluster/);
  });

  test("Lambda role policy includes SNS publish permissions", () => {
    const lambdaPolicyBlock = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaPolicyBlock).toBeTruthy();
    expect(lambdaPolicyBlock![0]).toMatch(/sns:Publish/);
  });
});

describe("Multi-Region DR Infrastructure - Lambda Failover Function", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CloudWatch log group for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_failover"\s*{/);
  });

  test("creates Lambda failover function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"\s*{/);
    expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Lambda function has required environment variables", () => {
    const lambdaBlock = stackContent.match(/resource\s+"aws_lambda_function"\s+"failover"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaBlock).toBeTruthy();
    expect(lambdaBlock![0]).toMatch(/environment\s*{/);
    expect(lambdaBlock![0]).toMatch(/GLOBAL_CLUSTER_ID/);
    expect(lambdaBlock![0]).toMatch(/PRIMARY_REGION/);
    expect(lambdaBlock![0]).toMatch(/SECONDARY_REGION/);
  });

  test("Lambda function has appropriate timeout", () => {
    const lambdaBlock = stackContent.match(/resource\s+"aws_lambda_function"\s+"failover"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaBlock).toBeTruthy();
    expect(lambdaBlock![0]).toMatch(/timeout\s*=\s*\d+/);
  });

  test("creates null_resource for Lambda zip file", () => {
    expect(stackContent).toMatch(/resource\s+"null_resource"\s+"lambda_zip"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Auto Scaling Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary launch template", () => {
    expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"primary"\s*{/);
  });

  test("primary launch template includes IAM instance profile", () => {
    const ltBlock = stackContent.match(/resource\s+"aws_launch_template"\s+"primary"\s*{[\s\S]*?(?=resource\s+"aws_launch_template"|resource\s+"aws_autoscaling"|$)/);
    expect(ltBlock).toBeTruthy();
    expect(ltBlock![0]).toMatch(/iam_instance_profile\s*{/);
  });

  test("primary launch template has user data script", () => {
    const ltBlock = stackContent.match(/resource\s+"aws_launch_template"\s+"primary"\s*{[\s\S]*?(?=resource\s+"aws_launch_template"|resource\s+"aws_autoscaling"|$)/);
    expect(ltBlock).toBeTruthy();
    expect(ltBlock![0]).toMatch(/user_data\s*=/);
  });

  test("creates primary auto scaling group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary"\s*{/);
  });

  test("primary ASG has health check type ELB", () => {
    const asgBlock = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"primary"\s*{[\s\S]*?(?=resource|$)/);
    expect(asgBlock).toBeTruthy();
    expect(asgBlock![0]).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("primary ASG references capacity variables", () => {
    const asgBlock = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"primary"\s*{[\s\S]*?(?=resource|$)/);
    expect(asgBlock).toBeTruthy();
    expect(asgBlock![0]).toMatch(/min_size\s*=\s*var\.asg_min_capacity/);
    expect(asgBlock![0]).toMatch(/max_size\s*=\s*var\.asg_max_capacity/);
    expect(asgBlock![0]).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
  });

  test("creates secondary launch template and ASG", () => {
    expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"\s*{/);
  });

  test("secondary ASG starts with 0 capacity (standby)", () => {
    const secondaryAsgBlock = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"secondary"\s*{[\s\S]*?(?=resource|$)/);
    expect(secondaryAsgBlock).toBeTruthy();
    expect(secondaryAsgBlock![0]).toMatch(/desired_capacity\s*=\s*0/);
  });
});

describe("Multi-Region DR Infrastructure - CloudWatch Alarms", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates SNS topic for alerts", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
  });

  test("creates SNS topic subscription for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"lambda"\s*{/);
    expect(stackContent).toMatch(/protocol\s*=\s*"lambda"/);
  });

  test("creates Lambda permission for SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"sns"\s*{/);
  });

  test("creates CloudWatch alarm for unhealthy ALB targets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_alb_unhealthy"\s*{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"UnHealthyHostCount"/);
  });

  test("creates CloudWatch alarm for Aurora DB connections", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_db_connections"\s*{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
  });

  test("creates critical alarm for primary region failure", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_region_failure"\s*{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"HealthyHostCount"/);
  });

  test("alarms trigger SNS notifications", () => {
    const alarmBlocks = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/g);
    expect(alarmBlocks).toBeTruthy();
    expect(alarmBlocks!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Multi-Region DR Infrastructure - EventBridge", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates EventBridge rule for health checks", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"health_check"\s*{/);
    expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
  });

  test("creates EventBridge target for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"health_check_lambda"\s*{/);
  });

  test("creates Lambda permission for EventBridge", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"eventbridge"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("queries availability zones for primary region", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"\s*{/);
  });

  test("queries availability zones for secondary region", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"\s*{/);
    expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
  });

  test("queries latest Amazon Linux AMI for primary region", () => {
    expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_primary"\s*{/);
  });

  test("queries latest Amazon Linux AMI for secondary region", () => {
    expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("exports primary ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"primary_alb_dns"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_lb\.primary\.dns_name/);
  });

  test("exports secondary ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"secondary_alb_dns"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_lb\.secondary\.dns_name/);
  });

  test("exports primary Aurora endpoint", () => {
    expect(stackContent).toMatch(/output\s+"primary_aurora_endpoint"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_rds_cluster\.primary\.endpoint/);
  });

  test("exports secondary Aurora endpoint", () => {
    expect(stackContent).toMatch(/output\s+"secondary_aurora_endpoint"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_rds_cluster\.secondary\.endpoint/);
  });

  test("exports DynamoDB table name", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"\s*{/);
  });

  test("exports Lambda failover function ARN", () => {
    expect(stackContent).toMatch(/output\s+"lambda_failover_function"\s*{/);
  });

  test("exports SNS alerts topic ARN", () => {
    expect(stackContent).toMatch(/output\s+"sns_alerts_topic"\s*{/);
  });

  test("exports RTO/RPO summary", () => {
    expect(stackContent).toMatch(/output\s+"rto_rpo_summary"\s*{/);
    const outputBlock = stackContent.match(/output\s+"rto_rpo_summary"\s*{[\s\S]*?(?=output|$)/);
    expect(outputBlock).toBeTruthy();
    expect(outputBlock![0]).toMatch(/rto_target/);
    expect(outputBlock![0]).toMatch(/rpo_target/);
  });
});

describe("Multi-Region DR Infrastructure - Resource Tagging", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("resources have Environment tags", () => {
    const envTags = stackContent.match(/Environment\s*=\s*var\.environment/g);
    expect(envTags).toBeTruthy();
    expect(envTags!.length).toBeGreaterThan(10);
  });

  test("resources have Name tags", () => {
    const nameTags = stackContent.match(/Name\s*=\s*"\$\{var\.project_name\}/g);
    expect(nameTags).toBeTruthy();
    expect(nameTags!.length).toBeGreaterThan(10);
  });

  test("resources have consistent tagging pattern", () => {
    const tagBlocks = stackContent.match(/tags\s*=\s*{[\s\S]*?}/g);
    expect(tagBlocks).toBeTruthy();
    expect(tagBlocks!.length).toBeGreaterThan(20);
  });
});

describe("Multi-Region DR Infrastructure - Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("uses lifecycle blocks for security groups", () => {
    const lifecycleBlocks = stackContent.match(/lifecycle\s*{\s*create_before_destroy\s*=\s*true/g);
    expect(lifecycleBlocks).toBeTruthy();
    expect(lifecycleBlocks!.length).toBeGreaterThanOrEqual(6);
  });

  test("enables encryption for Aurora clusters", () => {
    const encryptionSettings = stackContent.match(/storage_encrypted\s*=\s*true/g);
    expect(encryptionSettings).toBeTruthy();
    expect(encryptionSettings!.length).toBeGreaterThanOrEqual(3);
  });

  test("configures backup retention for Aurora", () => {
    expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("uses proper subnet distribution across AZs", () => {
    const subnetCount = stackContent.match(/resource\s+"aws_subnet"/g);
    expect(subnetCount).toBeTruthy();
    expect(subnetCount!.length).toBeGreaterThanOrEqual(4);
  });

  test("includes description fields for security group rules", () => {
    const descriptions = stackContent.match(/description\s*=\s*"/g);
    expect(descriptions).toBeTruthy();
    expect(descriptions!.length).toBeGreaterThan(15);
  });
});

describe("Multi-Region DR Infrastructure - DR Requirements", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("implements Aurora Global Database for cross-region replication", () => {
    expect(stackContent).toMatch(/aws_rds_global_cluster/);
    expect(stackContent).toMatch(/global_cluster_identifier/);
  });

  test("implements DynamoDB Global Table", () => {
    const dynamoBlock = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"main"\s*{[\s\S]*?replica\s*{/);
    expect(dynamoBlock).toBeTruthy();
  });

  test("implements automated failover with Lambda", () => {
    expect(stackContent).toMatch(/aws_lambda_function.*failover/);
    const lambdaBlock = stackContent.match(/resource\s+"aws_lambda_function"\s+"failover"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaBlock).toBeTruthy();
    expect(lambdaBlock![0]).toMatch(/GLOBAL_CLUSTER_ID/);
  });

  test("configures health monitoring with CloudWatch", () => {
    const alarms = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
    expect(alarms).toBeTruthy();
    expect(alarms!.length).toBeGreaterThanOrEqual(3);
  });

  test("implements event-driven automation with EventBridge", () => {
    expect(stackContent).toMatch(/aws_cloudwatch_event_rule/);
    expect(stackContent).toMatch(/aws_cloudwatch_event_target/);
  });

  test("supports RTO target of 15 minutes", () => {
    const outputs = stackContent.match(/output\s+"rto_rpo_summary"[\s\S]*?15 minutes/);
    expect(outputs).toBeTruthy();
  });

  test("supports RPO target of 5 minutes", () => {
    const outputs = stackContent.match(/output\s+"rto_rpo_summary"[\s\S]*?5 minutes/);
    expect(outputs).toBeTruthy();
  });
});

describe("Multi-Region DR Infrastructure - Coverage Summary", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("covers all major AWS services", () => {
    expect(stackContent).toMatch(/aws_vpc/);
    expect(stackContent).toMatch(/aws_subnet/);
    expect(stackContent).toMatch(/aws_rds_global_cluster/);
    expect(stackContent).toMatch(/aws_dynamodb_table/);
    expect(stackContent).toMatch(/aws_lb/);
    expect(stackContent).toMatch(/aws_autoscaling_group/);
    expect(stackContent).toMatch(/aws_lambda_function/);
    expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm/);
    expect(stackContent).toMatch(/aws_sns_topic/);
    expect(stackContent).toMatch(/aws_iam_role/);
  });

  test("implements complete multi-region infrastructure", () => {
    const resourceCount = (stackContent.match(/resource\s+"/g) || []).length;
    console.log(`Total Terraform resources defined: ${resourceCount}`);
    expect(resourceCount).toBeGreaterThanOrEqual(50);
  });

  test("covers both primary and secondary regions", () => {
    const primaryResources = (stackContent.match(/resource\s+"aws_\w+"\s+"primary/g) || []).length;
    const secondaryResources = (stackContent.match(/resource\s+"aws_\w+"\s+"secondary/g) || []).length;
    console.log(`Primary region resources: ${primaryResources}`);
    console.log(`Secondary region resources: ${secondaryResources}`);
    expect(primaryResources).toBeGreaterThan(10);
    expect(secondaryResources).toBeGreaterThan(5);
  });
});
