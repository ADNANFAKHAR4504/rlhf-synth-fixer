// Unit tests for multi-region DR Terraform infrastructure (Modular)
// Target: 90%+ coverage of modular infrastructure

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const MODULES_DIR = "../lib/modules";

const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const modulesPath = path.resolve(__dirname, MODULES_DIR);

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

  test("variables.tf file exists", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
  });

  test("outputs.tf file exists", () => {
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
  });

  test("modules directory exists", () => {
    const exists = fs.existsSync(modulesPath);
    expect(exists).toBe(true);
  });

  test("tap_stack.tf has non-zero content", () => {
    const stats = fs.statSync(stackPath);
    expect(stats.size).toBeGreaterThan(100);
  });

  test("all required modules exist", () => {
    const requiredModules = [
      "vpc", "security_groups", "alb", "asg", "kms",
      "rds", "dynamodb", "iam", "lambda", "monitoring",
      "backup", "waf", "route53"
    ];
    
    requiredModules.forEach(moduleName => {
      const modulePath = path.join(modulesPath, moduleName);
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });

  test("each module has required files", () => {
    const requiredModules = ["vpc", "security_groups", "alb", "rds", "iam"];
    const requiredFiles = ["main.tf", "variables.tf", "outputs.tf"];
    
    requiredModules.forEach(moduleName => {
      requiredFiles.forEach(fileName => {
        const filePath = path.join(modulesPath, moduleName, fileName);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
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

  test("provider.tf declares secondary provider with alias", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
  });

  test("secondary provider uses secondary_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.secondary_region/);
  });

  test("provider.tf declares configuration_aliases for multi-region support", () => {
    expect(providerContent).toMatch(/configuration_aliases\s*=\s*\[aws\.secondary\]/);
  });
});

describe("Multi-Region DR Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares secondary_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"secondary_region"\s*{/);
  });

  test("declares environment variable with validation", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test("declares VPC CIDR variables for both regions", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
  });

  test("declares Aurora instance_class variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_class"\s*{/);
  });

  test("declares EC2 instance_type variable", () => {
    expect(variablesContent).toMatch(/variable\s+"ec2_instance_type"\s*{/);
  });

  test("declares ASG capacity variables", () => {
    expect(variablesContent).toMatch(/variable\s+"asg_min_capacity"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"asg_max_capacity"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Networking Modules", () => {
  let stackContent: string;
  let vpcModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const vpcModulePath = path.join(modulesPath, "vpc", "main.tf");
    vpcModuleContent = fs.readFileSync(vpcModulePath, "utf8");
  });

  test("instantiates primary VPC module", () => {
    expect(stackContent).toMatch(/module\s+"vpc_primary"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test("VPC module creates VPC with DNS support", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(vpcModuleContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcModuleContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC module creates public and private subnets", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(vpcModuleContent).toMatch(/count\s*=\s*2/);
  });

  test("VPC module creates Internet Gateway", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("VPC module creates NAT Gateways and EIPs", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(vpcModuleContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    expect(vpcModuleContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("VPC module creates route tables", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(vpcModuleContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test("VPC module creates route table associations", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(vpcModuleContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
  });

  test("instantiates secondary VPC module", () => {
    expect(stackContent).toMatch(/module\s+"vpc_secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Security Groups Modules", () => {
  let stackContent: string;
  let sgModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const sgModulePath = path.join(modulesPath, "security_groups", "main.tf");
    sgModuleContent = fs.readFileSync(sgModulePath, "utf8");
  });

  test("instantiates primary security groups module", () => {
    expect(stackContent).toMatch(/module\s+"security_groups_primary"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/security_groups"/);
  });

  test("security groups module creates ALB security group", () => {
    expect(sgModuleContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
  });

  test("ALB security group allows HTTP and HTTPS", () => {
    const sgBlock = sgModuleContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*80/);
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*443/);
  });

  test("security groups module creates app security group", () => {
    expect(sgModuleContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
  });

  test("app security group references ALB security group", () => {
    const appSgBlock = sgModuleContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?(?=resource|$)/);
    expect(appSgBlock).toBeTruthy();
    expect(appSgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("security groups module creates database security group", () => {
    expect(sgModuleContent).toMatch(/resource\s+"aws_security_group"\s+"db"\s*{/);
  });

  test("database security group allows MySQL traffic", () => {
    const dbSgBlock = sgModuleContent.match(/resource\s+"aws_security_group"\s+"db"\s*{[\s\S]*?(?=resource|$)/);
    expect(dbSgBlock).toBeTruthy();
    expect(dbSgBlock![0]).toMatch(/from_port\s*=\s*3306/);
    expect(dbSgBlock![0]).toMatch(/to_port\s*=\s*3306/);
  });

  test("instantiates secondary security groups module", () => {
    expect(stackContent).toMatch(/module\s+"security_groups_secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - RDS Module", () => {
  let stackContent: string;
  let rdsModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const rdsModulePath = path.join(modulesPath, "rds", "main.tf");
    rdsModuleContent = fs.readFileSync(rdsModulePath, "utf8");
  });

  test("instantiates RDS module", () => {
    expect(stackContent).toMatch(/module\s+"rds"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/rds"/);
  });

  test("RDS module creates primary cluster with Multi-AZ configuration", () => {
    expect(rdsModuleContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"\s*{/);
    expect(rdsModuleContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
  });

  test("RDS module creates cluster instances with Multi-AZ", () => {
    expect(rdsModuleContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"\s*{/);
    expect(rdsModuleContent).toMatch(/count\s*=\s*2/);
  });

  test("RDS module creates DB subnet group", () => {
    expect(rdsModuleContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - DynamoDB Module", () => {
  let stackContent: string;
  let dynamoModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const dynamoModulePath = path.join(modulesPath, "dynamodb", "main.tf");
    dynamoModuleContent = fs.readFileSync(dynamoModulePath, "utf8");
  });

  test("instantiates DynamoDB module", () => {
    expect(stackContent).toMatch(/module\s+"dynamodb"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/dynamodb"/);
  });

  test("DynamoDB module creates table with global replication", () => {
    expect(dynamoModuleContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"\s*{/);
  });

  test("DynamoDB table has replica in secondary region", () => {
    expect(dynamoModuleContent).toMatch(/replica\s*{/);
    expect(dynamoModuleContent).toMatch(/region_name\s*=\s*var\.secondary_region/);
  });

  test("DynamoDB table has stream enabled", () => {
    expect(dynamoModuleContent).toMatch(/stream_enabled\s*=\s*true/);
  });

  test("DynamoDB table has point-in-time recovery", () => {
    expect(dynamoModuleContent).toMatch(/point_in_time_recovery\s*{/);
    expect(dynamoModuleContent).toMatch(/enabled\s*=\s*true/);
  });

  test("DynamoDB table uses PAY_PER_REQUEST billing", () => {
    expect(dynamoModuleContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("DynamoDB table defines hash_key attribute", () => {
    expect(dynamoModuleContent).toMatch(/hash_key\s*=\s*"id"/);
    expect(dynamoModuleContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"id"[\s\S]*?type\s*=\s*"S"/);
  });
});

describe("Multi-Region DR Infrastructure - ALB Modules", () => {
  let stackContent: string;
  let albModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const albModulePath = path.join(modulesPath, "alb", "main.tf");
    albModuleContent = fs.readFileSync(albModulePath, "utf8");
  });

  test("instantiates primary ALB module", () => {
    expect(stackContent).toMatch(/module\s+"alb_primary"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/alb"/);
  });

  test("ALB module creates load balancer", () => {
    expect(albModuleContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(albModuleContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(albModuleContent).toMatch(/internal\s*=\s*false/);
  });

  test("ALB module creates target group with health checks", () => {
    expect(albModuleContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
    expect(albModuleContent).toMatch(/health_check\s*{/);
    expect(albModuleContent).toMatch(/path\s*=\s*"\/health"/);
  });

  test("ALB module creates listener", () => {
    expect(albModuleContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
    expect(albModuleContent).toMatch(/port\s*=\s*"80"/);
  });

  test("instantiates secondary ALB module", () => {
    expect(stackContent).toMatch(/module\s+"alb_secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - ASG Modules", () => {
  let stackContent: string;
  let asgModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const asgModulePath = path.join(modulesPath, "asg", "main.tf");
    asgModuleContent = fs.readFileSync(asgModulePath, "utf8");
  });

  test("instantiates primary ASG module", () => {
    expect(stackContent).toMatch(/module\s+"asg_primary"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/asg"/);
  });

  test("ASG module creates launch template", () => {
    expect(asgModuleContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
    expect(asgModuleContent).toMatch(/iam_instance_profile\s*{/);
    expect(asgModuleContent).toMatch(/user_data\s*=/);
  });

  test("ASG module creates auto scaling group", () => {
    expect(asgModuleContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
    expect(asgModuleContent).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("instantiates secondary ASG module", () => {
    expect(stackContent).toMatch(/module\s+"asg_secondary"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - IAM Module", () => {
  let stackContent: string;
  let iamModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const iamModulePath = path.join(modulesPath, "iam", "main.tf");
    iamModuleContent = fs.readFileSync(iamModulePath, "utf8");
  });

  test("instantiates IAM module", () => {
    expect(stackContent).toMatch(/module\s+"iam"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/iam"/);
  });

  test("IAM module creates EC2 role policy with DynamoDB permissions", () => {
    expect(iamModuleContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
    const ec2PolicyBlock = iamModuleContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?(?=resource|$)/);
    expect(ec2PolicyBlock).toBeTruthy();
    expect(ec2PolicyBlock![0]).toMatch(/dynamodb:GetItem/);
  });

  test("IAM module creates instance profile", () => {
    expect(iamModuleContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
  });

  test("Lambda role policy includes RDS failover permissions", () => {
    const lambdaPolicyBlock = iamModuleContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaPolicyBlock).toBeTruthy();
    expect(lambdaPolicyBlock![0]).toMatch(/rds:FailoverGlobalCluster/);
  });

  test("IAM module creates backup role", () => {
    expect(iamModuleContent).toMatch(/resource\s+"aws_iam_role"\s+"backup_role"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Lambda Module", () => {
  let stackContent: string;
  let lambdaModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const lambdaModulePath = path.join(modulesPath, "lambda", "main.tf");
    lambdaModuleContent = fs.readFileSync(lambdaModulePath, "utf8");
  });

  test("instantiates Lambda module", () => {
    expect(stackContent).toMatch(/module\s+"lambda"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/lambda"/);
  });

  test("Lambda module creates CloudWatch log group", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_failover"\s*{/);
  });

  test("Lambda module creates failover function", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"\s*{/);
    expect(lambdaModuleContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Lambda module creates deployment package", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"local_file"\s+"lambda_code"\s*{/);
    expect(lambdaModuleContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Monitoring Module", () => {
  let stackContent: string;
  let monitoringModuleContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    const monitoringModulePath = path.join(modulesPath, "monitoring", "main.tf");
    monitoringModuleContent = fs.readFileSync(monitoringModulePath, "utf8");
  });

  test("instantiates Monitoring module", () => {
    expect(stackContent).toMatch(/module\s+"monitoring"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/monitoring"/);
  });

  test("Monitoring module creates SNS topic", () => {
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
  });

  test("Monitoring module creates CloudWatch alarms", () => {
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_alb_unhealthy"\s*{/);
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_db_connections"\s*{/);
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_region_failure"\s*{/);
  });

  test("Monitoring module creates EventBridge rule", () => {
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"health_check"\s*{/);
    expect(monitoringModuleContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
  });

  test("Monitoring module creates Lambda permissions", () => {
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_lambda_permission"\s+"sns"\s*{/);
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_lambda_permission"\s+"eventbridge"\s*{/);
  });
});

describe("Multi-Region DR Infrastructure - Additional Modules", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("instantiates Backup module", () => {
    expect(stackContent).toMatch(/module\s+"backup"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/backup"/);
  });

  test("instantiates WAF module", () => {
    expect(stackContent).toMatch(/module\s+"waf_primary"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/waf"/);
  });

  test("instantiates Route53 module", () => {
    expect(stackContent).toMatch(/module\s+"route53"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/route53"/);
  });

  test("instantiates KMS module", () => {
    expect(stackContent).toMatch(/module\s+"kms"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/kms"/);
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

});

describe("Multi-Region DR Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("exports primary ALB DNS name", () => {
    expect(outputsContent).toMatch(/output\s+"primary_alb_dns"/);
    expect(outputsContent).toMatch(/module\.alb_primary\.alb_dns_name/);
  });

  test("exports secondary ALB DNS name", () => {
    expect(outputsContent).toMatch(/output\s+"secondary_alb_dns"/);
    expect(outputsContent).toMatch(/module\.alb_secondary\.alb_dns_name/);
  });

  test("exports primary Aurora endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"primary_aurora_endpoint"/);
    expect(outputsContent).toMatch(/module\.rds\.primary_endpoint/);
  });

  test("exports primary Aurora reader endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"primary_aurora_reader_endpoint"/);
    expect(outputsContent).toMatch(/module\.rds\.primary_reader_endpoint/);
  });

  test("exports DynamoDB table name", () => {
    expect(outputsContent).toMatch(/output\s+"dynamodb_table_name"/);
    expect(outputsContent).toMatch(/module\.dynamodb\.table_name/);
  });

  test("exports Lambda failover function ARN", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_failover_function"/);
    expect(outputsContent).toMatch(/module\.lambda\.function_arn/);
  });

  test("exports SNS alerts topic ARN", () => {
    expect(outputsContent).toMatch(/output\s+"sns_alerts_topic"/);
    expect(outputsContent).toMatch(/module\.monitoring\.sns_topic_arn/);
  });

  test("exports RTO/RPO summary", () => {
    expect(outputsContent).toMatch(/output\s+"rto_rpo_summary"/);
    expect(outputsContent).toMatch(/rto_target/);
    expect(outputsContent).toMatch(/rpo_target/);
    expect(outputsContent).toMatch(/15 minutes/);
    expect(outputsContent).toMatch(/5 minutes/);
  });
});


describe("Multi-Region DR Infrastructure - Best Practices", () => {
  let sgModuleContent: string;
  let rdsModuleContent: string;

  beforeAll(() => {
    const sgModulePath = path.join(modulesPath, "security_groups", "main.tf");
    sgModuleContent = fs.readFileSync(sgModulePath, "utf8");
    const rdsModulePath = path.join(modulesPath, "rds", "main.tf");
    rdsModuleContent = fs.readFileSync(rdsModulePath, "utf8");
  });

  test("uses lifecycle blocks for security groups", () => {
    const lifecycleBlocks = sgModuleContent.match(/lifecycle\s*{\s*create_before_destroy\s*=\s*true/g);
    expect(lifecycleBlocks).toBeTruthy();
    expect(lifecycleBlocks!.length).toBeGreaterThanOrEqual(3);
  });

  test("enables encryption for Aurora clusters", () => {
    expect(rdsModuleContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("configures backup retention for Aurora", () => {
    expect(rdsModuleContent).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("includes description fields for security group rules", () => {
    const descriptions = sgModuleContent.match(/description\s*=\s*"/g);
    expect(descriptions).toBeTruthy();
    expect(descriptions!.length).toBeGreaterThan(6);
  });
});

describe("Multi-Region DR Infrastructure - DR Requirements", () => {
  let rdsModuleContent: string;
  let dynamoModuleContent: string;
  let lambdaModuleContent: string;
  let monitoringModuleContent: string;
  let outputsContent: string;

  beforeAll(() => {
    rdsModuleContent = fs.readFileSync(path.join(modulesPath, "rds", "main.tf"), "utf8");
    dynamoModuleContent = fs.readFileSync(path.join(modulesPath, "dynamodb", "main.tf"), "utf8");
    lambdaModuleContent = fs.readFileSync(path.join(modulesPath, "lambda", "main.tf"), "utf8");
    monitoringModuleContent = fs.readFileSync(path.join(modulesPath, "monitoring", "main.tf"), "utf8");
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("implements Aurora Multi-AZ for high availability", () => {
    expect(rdsModuleContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
    expect(rdsModuleContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"/);
    expect(rdsModuleContent).toMatch(/count\s*=\s*2/);
  });

  test("implements DynamoDB Global Table", () => {
    expect(dynamoModuleContent).toMatch(/replica/);
    expect(dynamoModuleContent).toMatch(/region_name/);
  });

  test("implements automated failover with Lambda", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"/);
    expect(lambdaModuleContent).toMatch(/GLOBAL_CLUSTER_ID/);
  });

  test("configures health monitoring with CloudWatch", () => {
    const alarms = monitoringModuleContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
    expect(alarms).toBeTruthy();
    expect(alarms!.length).toBeGreaterThanOrEqual(3);
  });

  test("implements event-driven automation with EventBridge", () => {
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
    expect(monitoringModuleContent).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
  });

  test("supports RTO target of 15 minutes", () => {
    expect(outputsContent).toMatch(/rto_target/);
    expect(outputsContent).toMatch(/15 minutes/);
  });

  test("supports RPO target of 5 minutes", () => {
    expect(outputsContent).toMatch(/rpo_target/);
    expect(outputsContent).toMatch(/5 minutes/);
  });
});

describe("Multi-Region DR Infrastructure - Coverage Summary", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("instantiates all required modules", () => {
    const moduleCount = (stackContent.match(/module\s+"/g) || []).length;
    console.log(`Total modules instantiated: ${moduleCount}`);
    expect(moduleCount).toBeGreaterThanOrEqual(13);
  });

  test("covers both primary and secondary regions", () => {
    const primaryModules = (stackContent.match(/module\s+"[a-z_]*primary/g) || []).length;
    const secondaryModules = (stackContent.match(/module\s+"[a-z_]*secondary/g) || []).length;
    console.log(`Primary region modules: ${primaryModules}`);
    console.log(`Secondary region modules: ${secondaryModules}`);
    expect(primaryModules).toBeGreaterThanOrEqual(4);
    expect(secondaryModules).toBeGreaterThanOrEqual(4);
  });

  test("maintains modular architecture", () => {
    // Verify modules directory exists and contains required modules
    const requiredModules = [
      "vpc", "security_groups", "alb", "asg", "rds",
      "dynamodb", "iam", "lambda", "monitoring", "backup",
      "waf", "route53", "kms"
    ];
    
    requiredModules.forEach(moduleName => {
      const modulePath = path.join(modulesPath, moduleName);
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });
});
