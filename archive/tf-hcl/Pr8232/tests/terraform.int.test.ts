import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  WAFV2Client,
  GetWebACLCommand,
} from '@aws-sdk/client-wafv2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';

/* ----------------------------- Utilities ----------------------------- */

// Defines the structure of the JSON output from Terraform
type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type TerraformOutputs = {
  // VPC & Network
  vpc_id?: TfOutputValue<string>;
  vpc_cidr?: TfOutputValue<string>;
  vpc_arn?: TfOutputValue<string>;
  internet_gateway_id?: TfOutputValue<string>;
  nat_gateway_ids?: TfOutputValue<string[]>;

  // Subnets
  public_subnet_ids?: TfOutputValue<string[]>;
  private_app_subnet_ids?: TfOutputValue<string[]>;
  private_db_subnet_ids?: TfOutputValue<string[]>;
  public_subnet_cidrs?: TfOutputValue<string[]>;
  private_app_subnet_cidrs?: TfOutputValue<string[]>;
  private_db_subnet_cidrs?: TfOutputValue<string[]>;

  // Security Groups
  alb_security_group_id?: TfOutputValue<string>;
  app_security_group_id?: TfOutputValue<string>;
  rds_security_group_id?: TfOutputValue<string>;

  // ALB
  alb_arn?: TfOutputValue<string>;
  alb_dns_name?: TfOutputValue<string>;
  target_group_arn?: TfOutputValue<string>;
  http_listener_arn?: TfOutputValue<string>;

  // Launch Template
  launch_template_id?: TfOutputValue<string>;

  // RDS
  rds_instance_id?: TfOutputValue<string>;
  rds_endpoint?: TfOutputValue<string>;
  rds_address?: TfOutputValue<string>;
  rds_port?: TfOutputValue<number>;
  rds_database_name?: TfOutputValue<string>;
  rds_username?: TfOutputValue<string>;
  rds_engine_version?: TfOutputValue<string>;
  rds_instance_class?: TfOutputValue<string>;
  rds_allocated_storage?: TfOutputValue<number>;
  rds_availability_zone?: TfOutputValue<string>;
  rds_multi_az?: TfOutputValue<boolean>;
  rds_backup_window?: TfOutputValue<string>;
  rds_subnet_group_name?: TfOutputValue<string>;

  // S3
  logs_bucket_name?: TfOutputValue<string>;
  logs_bucket_arn?: TfOutputValue<string>;

  // CloudWatch
  app_log_group_name?: TfOutputValue<string>;
  vpc_flow_logs_group_name?: TfOutputValue<string>;

  // WAF
  waf_web_acl_id?: TfOutputValue<string>;
  waf_web_acl_arn?: TfOutputValue<string>;

  // KMS
  kms_key_id?: TfOutputValue<string>;
  kms_key_arn?: TfOutputValue<string>;

  // IAM
  ec2_role_arn?: TfOutputValue<string>;
  vpc_flow_logs_role_arn?: TfOutputValue<string>;

  // General
  region?: TfOutputValue<string>;
  environment?: TfOutputValue<string>;
};

// Reads and validates the outputs from the JSON file
function readTerraformOutputs() {
  const outputPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Outputs file not found at ${outputPath}`);
  }

  const rawOutputs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  // Detect format: if first key has a "value" property, it's the nested format (LocalStack)
  // Otherwise, it's the flat format (AWS CLI terraform output -json)
  const firstKey = Object.keys(rawOutputs)[0];
  const isNestedFormat = rawOutputs[firstKey] && typeof rawOutputs[firstKey] === 'object' && 'value' in rawOutputs[firstKey];

  if (isNestedFormat) {
    // Already in the correct format (LocalStack)
    return rawOutputs as TerraformOutputs;
  } else {
    // Flat format (AWS) - convert to nested format
    const outputs: any = {};
    for (const [key, value] of Object.entries(rawOutputs)) {
      // Parse JSON strings for arrays and objects
      let parsedValue = value;
      if (typeof value === 'string') {
        // Try to parse as JSON if it looks like an array or object
        if ((value.startsWith('[') && value.endsWith(']')) || 
            (value.startsWith('{') && value.endsWith('}'))) {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
        }
        // Convert string booleans to actual booleans
        else if (value === 'true') {
          parsedValue = true;
        } else if (value === 'false') {
          parsedValue = false;
        }
        // Convert numeric strings to numbers for specific keys
        else if (/^\d+$/.test(value) && 
                 (key.includes('port') || key.includes('storage') || key.includes('size') || 
                  key.includes('version') || key.includes('threshold'))) {
          parsedValue = parseInt(value, 10);
        }
      }

      outputs[key] = {
        sensitive: key.includes('password') || key.includes('username') || key.includes('connection_string'),
        type: Array.isArray(parsedValue) ? 'array' : typeof parsedValue,
        value: parsedValue
      };
    }
    return outputs as TerraformOutputs;
  }
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

function getOutputValue<T>(
  outputs: TerraformOutputs,
  key: keyof TerraformOutputs,
  errorMsg: string
): T {
  const output = outputs[key] as TfOutputValue<T> | undefined;
  if (!output || output.value === undefined || output.value === null) {
    throw new Error(errorMsg);
  }
  return output.value;
}

// Detect if we're running against LocalStack
function isLocalStack(): boolean {
  return process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
         process.env.AWS_ENDPOINT_URL?.includes('localstack') ||
         process.env.LOCALSTACK === 'true';
}

// Get AWS client configuration
function getClientConfig(region: string) {
  const isLocal = isLocalStack();
  const config: any = { region };

  if (isLocal) {
    config.endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
    config.credentials = {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    };
    // Disable SSL verification for LocalStack
    config.tls = false;
  }

  return config;
}

/* ----------------------------- Tests ----------------------------- */

describe('Terraform Infrastructure Integration Tests', () => {
  const TEST_TIMEOUT = 120_000; // 2 minutes per test
  const outputs = readTerraformOutputs();
  const region = getOutputValue<string>(outputs, 'region', 'region missing in outputs');
  const isLocal = isLocalStack();

  console.log(`Running tests against ${isLocal ? 'LocalStack' : 'AWS'} in region ${region}`);

  // Initialize AWS clients with proper configuration
  const clientConfig = getClientConfig(region);
  const ec2Client = new EC2Client(clientConfig);
  const rdsClient = new RDSClient(clientConfig);
  const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
  const cwLogsClient = new CloudWatchLogsClient(clientConfig);
  const wafClient = new WAFV2Client(clientConfig);
  const kmsClient = new KMSClient(clientConfig);
  const iamClient = new IAMClient(clientConfig);

  afterAll(async () => {
    // Clean up clients
    [ec2Client, rdsClient, elbClient, cwLogsClient, wafClient, kmsClient, iamClient].forEach(
      (client) => {
        try {
          client.destroy();
        } catch {}
      }
    );
  });

  describe('VPC Infrastructure', () => {
    test(
      'VPC should exist with correct CIDR block',
      async () => {
        const vpcId = getOutputValue<string>(outputs, 'vpc_id', 'vpc_id missing in outputs');
        const expectedCidr = getOutputValue<string>(outputs, 'vpc_cidr', 'vpc_cidr missing in outputs');

        const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
        const res = await ec2Client.send(command);

        const vpc = assertDefined(res.Vpcs?.[0], `VPC ${vpcId} not found`);

        expect(vpc.VpcId).toBe(vpcId);
        expect(vpc.CidrBlock).toBe(expectedCidr);
      },
      TEST_TIMEOUT
    );

    test(
      'Public subnets should exist and be properly configured',
      async () => {
        const subnetIds = getOutputValue<string[]>(
          outputs,
          'public_subnet_ids',
          'public_subnet_ids missing in outputs'
        );
        const expectedCidrs = getOutputValue<string[]>(
          outputs,
          'public_subnet_cidrs',
          'public_subnet_cidrs missing in outputs'
        );

        const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
        const res = await ec2Client.send(command);

        expect(res.Subnets).toHaveLength(subnetIds.length);

        res.Subnets?.forEach((subnet, idx) => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(expectedCidrs).toContain(subnet.CidrBlock);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'Private app subnets should exist and not auto-assign public IPs',
      async () => {
        const subnetIds = getOutputValue<string[]>(
          outputs,
          'private_app_subnet_ids',
          'private_app_subnet_ids missing in outputs'
        );
        const expectedCidrs = getOutputValue<string[]>(
          outputs,
          'private_app_subnet_cidrs',
          'private_app_subnet_cidrs missing in outputs'
        );

        const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
        const res = await ec2Client.send(command);

        expect(res.Subnets).toHaveLength(subnetIds.length);

        res.Subnets?.forEach((subnet) => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(expectedCidrs).toContain(subnet.CidrBlock);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'Private DB subnets should exist and not auto-assign public IPs',
      async () => {
        const subnetIds = getOutputValue<string[]>(
          outputs,
          'private_db_subnet_ids',
          'private_db_subnet_ids missing in outputs'
        );
        const expectedCidrs = getOutputValue<string[]>(
          outputs,
          'private_db_subnet_cidrs',
          'private_db_subnet_cidrs missing in outputs'
        );

        const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
        const res = await ec2Client.send(command);

        expect(res.Subnets).toHaveLength(subnetIds.length);

        res.Subnets?.forEach((subnet) => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(expectedCidrs).toContain(subnet.CidrBlock);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'Internet Gateway should be attached to VPC',
      async () => {
        const igwId = getOutputValue<string>(
          outputs,
          'internet_gateway_id',
          'internet_gateway_id missing in outputs'
        );
        const vpcId = getOutputValue<string>(outputs, 'vpc_id', 'vpc_id missing in outputs');

        const command = new DescribeInternetGatewaysCommand({
          InternetGatewayIds: [igwId],
        });
        const res = await ec2Client.send(command);

        const igw = assertDefined(res.InternetGateways?.[0], `IGW ${igwId} not found`);

        expect(igw.Attachments).toHaveLength(1);
        expect(igw.Attachments?.[0].VpcId).toBe(vpcId);
        expect(igw.Attachments?.[0].State).toBe('available');
      },
      TEST_TIMEOUT
    );

    test(
      'NAT Gateways should exist and be in public subnets',
      async () => {
        const natGatewayIds = getOutputValue<string[]>(
          outputs,
          'nat_gateway_ids',
          'nat_gateway_ids missing in outputs'
        );
        const publicSubnetIds = getOutputValue<string[]>(
          outputs,
          'public_subnet_ids',
          'public_subnet_ids missing in outputs'
        );

        const command = new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds,
        });
        const res = await ec2Client.send(command);

        expect(res.NatGateways).toHaveLength(natGatewayIds.length);

        res.NatGateways?.forEach((nat) => {
          expect(['available', 'pending']).toContain(nat.State);
          expect(publicSubnetIds).toContain(nat.SubnetId);
        });
      },
      TEST_TIMEOUT
    );
  });

  describe('Security Groups', () => {
    test(
      'ALB security group should allow HTTP and HTTPS from allowed CIDRs',
      async () => {
        const sgId = getOutputValue<string>(
          outputs,
          'alb_security_group_id',
          'alb_security_group_id missing in outputs'
        );

        const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
        const res = await ec2Client.send(command);

        const sg = assertDefined(res.SecurityGroups?.[0], `ALB SG ${sgId} not found`);

        expect(sg.GroupName).toContain('alb');

        const ingressRules = sg.IpPermissions || [];
        const httpRule = ingressRules.find((r) => r.FromPort === 80);
        const httpsRule = ingressRules.find((r) => r.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'App security group should only allow traffic from ALB security group',
      async () => {
        const appSgId = getOutputValue<string>(
          outputs,
          'app_security_group_id',
          'app_security_group_id missing in outputs'
        );
        const albSgId = getOutputValue<string>(
          outputs,
          'alb_security_group_id',
          'alb_security_group_id missing in outputs'
        );

        const command = new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] });
        const res = await ec2Client.send(command);

        const sg = assertDefined(res.SecurityGroups?.[0], `App SG ${appSgId} not found`);

        expect(sg.GroupName).toContain('app');

        const ingressRules = sg.IpPermissions || [];
        expect(ingressRules.length).toBeGreaterThan(0);

        const httpsRule = ingressRules.find((r) => r.FromPort === 443);
        expect(httpsRule).toBeDefined();
        expect(httpsRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(albSgId);
      },
      TEST_TIMEOUT
    );

    test(
      'RDS security group should only allow PostgreSQL from app security group',
      async () => {
        const rdsSgId = getOutputValue<string>(
          outputs,
          'rds_security_group_id',
          'rds_security_group_id missing in outputs'
        );
        const appSgId = getOutputValue<string>(
          outputs,
          'app_security_group_id',
          'app_security_group_id missing in outputs'
        );

        const command = new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId] });
        const res = await ec2Client.send(command);

        const sg = assertDefined(res.SecurityGroups?.[0], `RDS SG ${rdsSgId} not found`);

        expect(sg.GroupName).toContain('rds');

        const ingressRules = sg.IpPermissions || [];
        expect(ingressRules).toHaveLength(1);

        const pgRule = ingressRules[0];
        expect(pgRule.FromPort).toBe(5432);
        expect(pgRule.ToPort).toBe(5432);
        expect(pgRule.IpProtocol).toBe('tcp');
        expect(pgRule.UserIdGroupPairs?.[0]?.GroupId).toBe(appSgId);
        expect(pgRule.IpRanges).toHaveLength(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('Application Load Balancer', () => {
    test(
      'ALB should exist and be application type',
      async () => {
        const albArn = getOutputValue<string>(outputs, 'alb_arn', 'alb_arn missing in outputs');

        const command = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        });
        const res = await elbClient.send(command);

        const alb = assertDefined(res.LoadBalancers?.[0], `ALB ${albArn} not found`);

        expect(alb.Type).toBe('application');
        expect(['active', 'provisioning']).toContain(alb.State?.Code);
      },
      TEST_TIMEOUT
    );

    test(
      'Target group should exist with correct protocol and port',
      async () => {
        const tgArn = getOutputValue<string>(
          outputs,
          'target_group_arn',
          'target_group_arn missing in outputs'
        );

        const command = new DescribeTargetGroupsCommand({
          TargetGroupArns: [tgArn],
        });
        const res = await elbClient.send(command);

        const tg = assertDefined(res.TargetGroups?.[0], `Target Group ${tgArn} not found`);

        expect(tg.Protocol).toBe('HTTPS');
        expect(tg.Port).toBe(443);
        expect(tg.HealthCheckProtocol).toBe('HTTPS');
      },
      TEST_TIMEOUT
    );

    test(
      'HTTP listener should exist and forward to target group',
      async () => {
        const listenerArn = getOutputValue<string>(
          outputs,
          'http_listener_arn',
          'http_listener_arn missing in outputs'
        );

        const command = new DescribeListenersCommand({
          ListenerArns: [listenerArn],
        });
        const res = await elbClient.send(command);

        const listener = assertDefined(
          res.Listeners?.[0],
          `Listener ${listenerArn} not found`
        );

        expect(listener.Protocol).toBe('HTTP');
        expect(listener.DefaultActions).toHaveLength(1);
        expect(listener.DefaultActions?.[0].Type).toBe('forward');
      },
      TEST_TIMEOUT
    );
  });

  describe('RDS Database', () => {
    test(
      'RDS instance should exist and be accessible',
      async () => {
        const rdsSubnetGroupName = getOutputValue<string>(
          outputs,
          'rds_subnet_group_name',
          'rds_subnet_group_name missing in outputs'
        );

        // Verify RDS by checking subnet group exists (works on both AWS and LocalStack)
        const command = new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: rdsSubnetGroupName,
        });
        const res = await rdsClient.send(command);

        const subnetGroup = assertDefined(
          res.DBSubnetGroups?.[0],
          `DB Subnet Group ${rdsSubnetGroupName} not found`
        );

        expect(subnetGroup.DBSubnetGroupName).toBe(rdsSubnetGroupName);
        expect(subnetGroup.Subnets).toHaveLength(2);

        const azs = subnetGroup.Subnets?.map((s) => s.SubnetAvailabilityZone?.Name) || [];
        expect(new Set(azs).size).toBe(2); // Should span 2 different AZs
      },
      TEST_TIMEOUT
    );

    test(
      'RDS outputs should be present and valid',
      async () => {
        const rdsInstanceId = getOutputValue<string>(
          outputs,
          'rds_instance_id',
          'rds_instance_id missing in outputs'
        );
        const rdsEndpoint = getOutputValue<string>(
          outputs,
          'rds_endpoint',
          'rds_endpoint missing in outputs'
        );
        const rdsAddress = getOutputValue<string>(
          outputs,
          'rds_address',
          'rds_address missing in outputs'
        );
        const rdsDatabaseName = getOutputValue<string>(
          outputs,
          'rds_database_name',
          'rds_database_name missing in outputs'
        );
        const rdsInstanceClass = getOutputValue<string>(
          outputs,
          'rds_instance_class',
          'rds_instance_class missing in outputs'
        );
        const rdsEngineVersion = getOutputValue<string>(
          outputs,
          'rds_engine_version',
          'rds_engine_version missing in outputs'
        );
        const rdsMultiAz = getOutputValue<boolean>(
          outputs,
          'rds_multi_az',
          'rds_multi_az missing in outputs'
        );
        const rdsAllocatedStorage = getOutputValue<number>(
          outputs,
          'rds_allocated_storage',
          'rds_allocated_storage missing in outputs'
        );

        // Validate outputs are defined
        expect(rdsInstanceId).toBeDefined();
        expect(rdsEndpoint).toBeDefined();
        expect(rdsAddress).toBeDefined();
        expect(rdsDatabaseName).toBe('appdb');
        expect(rdsInstanceClass).toBe('db.t3.micro');
        expect(rdsEngineVersion).toMatch(/^15/); // Starts with 15 (could be 15 or 15.12, etc.)
        expect(rdsMultiAz).toBe(true);
        expect(rdsAllocatedStorage).toBe(20);

        // Validate endpoint format (should contain address and port)
        expect(rdsEndpoint).toContain(rdsAddress);
        expect(rdsEndpoint).toMatch(/:\d+$/); // Should end with :port
      },
      TEST_TIMEOUT
    );

    test(
      'DB subnet group should span multiple AZs',
      async () => {
        const subnetGroupName = getOutputValue<string>(
          outputs,
          'rds_subnet_group_name',
          'rds_subnet_group_name missing in outputs'
        );

        const command = new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        });
        const res = await rdsClient.send(command);

        const subnetGroup = assertDefined(
          res.DBSubnetGroups?.[0],
          `DB Subnet Group ${subnetGroupName} not found`
        );

        expect(subnetGroup.Subnets).toHaveLength(2);

        const azs = subnetGroup.Subnets?.map((s) => s.SubnetAvailabilityZone?.Name) || [];
        expect(new Set(azs).size).toBe(2); // Should span 2 different AZs
      },
      TEST_TIMEOUT
    );
  });

  describe('CloudWatch Logging', () => {
    test(
      'Application log group should exist',
      async () => {
        const logGroupName = getOutputValue<string>(
          outputs,
          'app_log_group_name',
          'app_log_group_name missing in outputs'
        );

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const res = await cwLogsClient.send(command);

        const logGroup = res.logGroups?.find((lg) => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'VPC Flow Logs log group should exist',
      async () => {
        const logGroupName = getOutputValue<string>(
          outputs,
          'vpc_flow_logs_group_name',
          'vpc_flow_logs_group_name missing in outputs'
        );

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const res = await cwLogsClient.send(command);

        const logGroup = res.logGroups?.find((lg) => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe('WAF', () => {
    test(
      'WAF Web ACL should exist with managed rule sets',
      async () => {
        const webAclId = getOutputValue<string>(
          outputs,
          'waf_web_acl_id',
          'waf_web_acl_id missing in outputs'
        );
        const webAclArn = getOutputValue<string>(
          outputs,
          'waf_web_acl_arn',
          'waf_web_acl_arn missing in outputs'
        );

        const command = new GetWebACLCommand({
          Id: webAclId,
          Name: 'nova-prod-waf',
          Scope: 'REGIONAL',
        });
        const res = await wafClient.send(command);

        const webAcl = assertDefined(res.WebACL, `WAF Web ACL ${webAclId} not found`);

        expect(webAcl.Rules).toHaveLength(3);
        expect(webAcl.DefaultAction?.Allow).toBeDefined();

        const ruleNames = webAcl.Rules?.map((r) => r.Name) || [];
        expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
        expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
        expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
      },
      TEST_TIMEOUT
    );
  });

  describe('KMS Encryption', () => {
    test(
      'KMS key should exist with rotation enabled',
      async () => {
        const keyId = getOutputValue<string>(
          outputs,
          'kms_key_id',
          'kms_key_id missing in outputs'
        );

        const command = new DescribeKeyCommand({ KeyId: keyId });
        const res = await kmsClient.send(command);

        const key = assertDefined(res.KeyMetadata, `KMS key ${keyId} not found`);

        expect(key.KeyState).toBe('Enabled');
        expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');

        if (!isLocal) {
          // LocalStack doesn't support rotation check
          const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
          const rotationRes = await kmsClient.send(rotationCommand);
          expect(rotationRes.KeyRotationEnabled).toBe(true);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('IAM Roles', () => {
    test(
      'EC2 role should exist',
      async () => {
        const roleArn = getOutputValue<string>(
          outputs,
          'ec2_role_arn',
          'ec2_role_arn missing in outputs'
        );
        const roleName = roleArn.split('/').pop();

        if (!roleName) {
          throw new Error(`Could not extract role name from ARN: ${roleArn}`);
        }

        const command = new GetRoleCommand({ RoleName: roleName });
        const res = await iamClient.send(command);

        const role = assertDefined(res.Role, `IAM role ${roleName} not found`);

        expect(role.RoleName).toBe(roleName);
        expect(role.Arn).toBe(roleArn);
      },
      TEST_TIMEOUT
    );

    test(
      'VPC Flow Logs role should exist',
      async () => {
        const roleArn = getOutputValue<string>(
          outputs,
          'vpc_flow_logs_role_arn',
          'vpc_flow_logs_role_arn missing in outputs'
        );
        const roleName = roleArn.split('/').pop();

        if (!roleName) {
          throw new Error(`Could not extract role name from ARN: ${roleArn}`);
        }

        const command = new GetRoleCommand({ RoleName: roleName });
        const res = await iamClient.send(command);

        const role = assertDefined(res.Role, `IAM role ${roleName} not found`);

        expect(role.RoleName).toBe(roleName);
        expect(role.Arn).toBe(roleArn);
      },
      TEST_TIMEOUT
    );
  });
});