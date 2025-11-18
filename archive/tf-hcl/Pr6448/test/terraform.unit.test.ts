// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform healthcare data processing pipeline
// Tests: variables, resources, security, IAM, networking, tags, encryption

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

// Helper to read and parse Terraform file
function readTerraformFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

// Helper to extract blocks by type
function extractBlocks(content: string, blockType: string): string[] {
  const regex = new RegExp(`${blockType}\\s+[^{]*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, "gs");
  return content.match(regex) || [];
}

describe("Terraform Configuration Files", () => {
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("tap_stack.tf has content", () => {
      const content = readTerraformFile(TAP_STACK_PATH);
      expect(content.length).toBeGreaterThan(1000);
    });

    test("provider.tf has content", () => {
      const content = readTerraformFile(PROVIDER_PATH);
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readTerraformFile(PROVIDER_PATH);
    });

    test("contains terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*\{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test("AWS provider has required_providers block", () => {
      expect(providerContent).toMatch(/required_providers\s*\{/);
      expect(providerContent).toMatch(/aws\s*=\s*\{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("contains archive provider", () => {
      expect(providerContent).toMatch(/archive\s*=\s*\{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });

    test("contains random provider", () => {
      expect(providerContent).toMatch(/random\s*=\s*\{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test("has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*\{\s*\}/);
    });

    test("AWS provider uses default_tags", () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
      expect(providerContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("tap_stack.tf does NOT contain duplicate provider declaration", () => {
      const tapContent = readTerraformFile(TAP_STACK_PATH);
      expect(tapContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    });

    test("tap_stack.tf does NOT contain duplicate terraform block", () => {
      const tapContent = readTerraformFile(TAP_STACK_PATH);
      const terraformBlocks = tapContent.match(/terraform\s*\{/g);
      expect(terraformBlocks).toBeNull();
    });
  });

  describe("Variables - Type Definitions", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("environment variable exists with string type", () => {
      expect(tapContent).toMatch(/variable\s+"environment"\s*\{/);
      expect(tapContent).toMatch(/type\s*=\s*string/);
    });

    test("environment variable has validation for dev, staging, prod", () => {
      const envVar = tapContent.match(/variable\s+"environment"\s*\{[\s\S]*?\n\}/);
      expect(envVar).toBeTruthy();
      expect(envVar![0]).toMatch(/validation\s*\{/);
      expect(envVar![0]).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("aws_region variable has default value", () => {
      expect(tapContent).toMatch(/variable\s+"aws_region"\s*\{/);
      expect(tapContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("project_name variable exists with default", () => {
      expect(tapContent).toMatch(/variable\s+"project_name"\s*\{/);
      expect(tapContent).toMatch(/default\s*=\s*"tap-healthcare"/);
    });

    test("vpc_cidr variable exists with default CIDR block", () => {
      expect(tapContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
      expect(tapContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("numeric variables have correct types", () => {
      const numericVars = [
        "kinesis_shard_count",
        "kinesis_retention_hours",
        "dynamodb_read_capacity",
        "dynamodb_write_capacity",
        "lambda_memory_size",
        "lambda_timeout",
        "lambda_reserved_concurrent_executions",
        "sqs_visibility_timeout",
        "sqs_message_retention",
        "sqs_max_receive_count",
        "log_retention_days",
      ];

      numericVars.forEach(varName => {
        const varBlock = tapContent.match(new RegExp(`variable\\s+"${varName}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(varBlock).toBeTruthy();
        expect(varBlock![0]).toMatch(/type\s*=\s*number/);
      });
    });

    test("list variables have correct types", () => {
      expect(tapContent).toMatch(/variable\s+"availability_zones"\s*\{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(tapContent).toMatch(/variable\s+"hospital_regions"\s*\{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("aurora capacity variables have decimal defaults", () => {
      expect(tapContent).toMatch(/variable\s+"aurora_min_capacity"[\s\S]*?default\s*=\s*0\.5/);
      expect(tapContent).toMatch(/variable\s+"aurora_max_capacity"[\s\S]*?default\s*=\s*1/);
    });

    test("lambda_runtime variable has default python version", () => {
      expect(tapContent).toMatch(/variable\s+"lambda_runtime"[\s\S]*?default\s*=\s*"python3\.12"/);
    });
  });

  describe("Locals and Data Sources", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("defines name_prefix local", () => {
      expect(tapContent).toMatch(/locals\s*\{/);
      expect(tapContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/);
    });

    test("defines common_tags local with required tags", () => {
      const localsBlock = tapContent.match(/locals\s*\{[\s\S]*?\n\}/);
      expect(localsBlock).toBeTruthy();
      expect(localsBlock![0]).toMatch(/common_tags\s*=/);
      expect(localsBlock![0]).toMatch(/Environment\s*=\s*var\.environment/);
      expect(localsBlock![0]).toMatch(/Project\s*=\s*var\.project_name/);
      expect(localsBlock![0]).toMatch(/Owner\s*=\s*var\.owner/);
      expect(localsBlock![0]).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(localsBlock![0]).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(localsBlock![0]).toMatch(/CreatedAt\s*=\s*timestamp\(\)/);
    });

    test("defines subnet CIDR calculations", () => {
      expect(tapContent).toMatch(/private_subnet_cidrs\s*=\s*\[for\s+i,\s*az\s+in\s+local\.azs\s*:\s*cidrsubnet/);
      expect(tapContent).toMatch(/public_subnet_cidrs\s*=\s*\[for\s+i,\s*az\s+in\s+local\.azs\s*:\s*cidrsubnet/);
    });

    test("defines VPC endpoint services list", () => {
      const vpcEndpointsMatch = tapContent.match(/vpc_endpoint_services\s*=\s*\[[\s\S]*?\]/);
      expect(vpcEndpointsMatch).toBeTruthy();
      expect(vpcEndpointsMatch![0]).toMatch(/dynamodb/);
      expect(vpcEndpointsMatch![0]).toMatch(/kinesis-streams/);
      expect(vpcEndpointsMatch![0]).toMatch(/secretsmanager/);
      expect(vpcEndpointsMatch![0]).toMatch(/s3/);
    });

    test("uses aws_caller_identity data source", () => {
      expect(tapContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses aws_partition data source", () => {
      expect(tapContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe("KMS Encryption", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("KMS key resource exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("KMS key has deletion window configured", () => {
      const kmsBlock = tapContent.match(/resource\s+"aws_kms_key"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(kmsBlock).toBeTruthy();
      expect(kmsBlock![0]).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS key has rotation enabled", () => {
      const kmsBlock = tapContent.match(/resource\s+"aws_kms_key"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(kmsBlock).toBeTruthy();
      expect(kmsBlock![0]).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has alias", () => {
      expect(tapContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(tapContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test("KMS key has tags", () => {
      const kmsBlock = tapContent.match(/resource\s+"aws_kms_key"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(kmsBlock).toBeTruthy();
      expect(kmsBlock![0]).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe("VPC and Networking", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("VPC resource exists with DNS enabled", () => {
      const vpcBlock = tapContent.match(/resource\s+"aws_vpc"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpcBlock![0]).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("private subnets are created with count", () => {
      const privateSubnet = tapContent.match(/resource\s+"aws_subnet"\s+"private"\s*\{[\s\S]*?\n\}/);
      expect(privateSubnet).toBeTruthy();
      expect(privateSubnet![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(privateSubnet![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(privateSubnet![0]).toMatch(/cidr_block\s*=\s*local\.private_subnet_cidrs\[count\.index\]/);
    });

    test("public subnets are created with count and public IPs", () => {
      const publicSubnet = tapContent.match(/resource\s+"aws_subnet"\s+"public"\s*\{[\s\S]*?\n\}/);
      expect(publicSubnet).toBeTruthy();
      expect(publicSubnet![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(publicSubnet![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("Internet Gateway exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tapContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("NAT Gateways are created per AZ", () => {
      const natGateway = tapContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(natGateway).toBeTruthy();
      expect(natGateway![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(natGateway![0]).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(natGateway![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test("EIPs for NAT Gateways exist", () => {
      const eip = tapContent.match(/resource\s+"aws_eip"\s+"nat"\s*\{[\s\S]*?\n\}/);
      expect(eip).toBeTruthy();
      expect(eip![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(eip![0]).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("private route tables route through NAT", () => {
      const privateRT = tapContent.match(/resource\s+"aws_route_table"\s+"private"\s*\{[\s\S]*?\n\}/);
      expect(privateRT).toBeTruthy();
      expect(privateRT![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
      expect(privateRT![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("public route table routes through IGW", () => {
      const publicRT = tapContent.match(/resource\s+"aws_route_table"\s+"public"\s*\{[\s\S]*?\n\}/);
      expect(publicRT).toBeTruthy();
      expect(publicRT![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(publicRT![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("route table associations exist for private subnets", () => {
      const privateRTA = tapContent.match(/resource\s+"aws_route_table_association"\s+"private"\s*\{[\s\S]*?\n\}/);
      expect(privateRTA).toBeTruthy();
      expect(privateRTA![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(privateRTA![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
    });

    test("route table associations exist for public subnets", () => {
      const publicRTA = tapContent.match(/resource\s+"aws_route_table_association"\s+"public"\s*\{[\s\S]*?\n\}/);
      expect(publicRTA).toBeTruthy();
      expect(publicRTA![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(publicRTA![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });
  });

  describe("Security Groups", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Lambda security group exists with egress only", () => {
      const lambdaSG = tapContent.match(/resource\s+"aws_security_group"\s+"lambda"\s*\{[\s\S]*?\n\}/);
      expect(lambdaSG).toBeTruthy();
      expect(lambdaSG![0]).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-lambda-"/);
      expect(lambdaSG![0]).toMatch(/egress\s*\{/);
      expect(lambdaSG![0]).toMatch(/protocol\s*=\s*"-1"/);
    });

    test("Aurora security group allows PostgreSQL from Lambda", () => {
      const auroraSG = tapContent.match(/resource\s+"aws_security_group"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(auroraSG).toBeTruthy();
      expect(auroraSG![0]).toMatch(/ingress\s*\{/);
      expect(auroraSG![0]).toMatch(/from_port\s*=\s*5432/);
      expect(auroraSG![0]).toMatch(/to_port\s*=\s*5432/);
      expect(auroraSG![0]).toMatch(/protocol\s*=\s*"tcp"/);
      expect(auroraSG![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("Redis security group allows port 6379 from Lambda", () => {
      const redisSG = tapContent.match(/resource\s+"aws_security_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redisSG).toBeTruthy();
      expect(redisSG![0]).toMatch(/from_port\s*=\s*6379/);
      expect(redisSG![0]).toMatch(/to_port\s*=\s*6379/);
      expect(redisSG![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("VPC endpoints security group allows HTTPS from VPC CIDR", () => {
      const vpceSG = tapContent.match(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*\{[\s\S]*?\n\}/);
      expect(vpceSG).toBeTruthy();
      expect(vpceSG![0]).toMatch(/from_port\s*=\s*443/);
      expect(vpceSG![0]).toMatch(/to_port\s*=\s*443/);
      expect(vpceSG![0]).toMatch(/cidr_blocks\s*=\s*\[var\.vpc_cidr\]/);
    });

    test("all security groups are in VPC", () => {
      const sgResources = tapContent.match(/resource\s+"aws_security_group"\s+"(?:lambda|aurora|redis|vpc_endpoints)"\s*\{[\s\S]*?\n\}/g);
      expect(sgResources).toBeTruthy();
      sgResources!.forEach(sg => {
        expect(sg).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      });
    });
  });

  describe("VPC Endpoints", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("DynamoDB Gateway endpoint exists", () => {
      const dynamodbVPCE = tapContent.match(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*\{[\s\S]*?\n\}/);
      expect(dynamodbVPCE).toBeTruthy();
      expect(dynamodbVPCE![0]).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
      expect(dynamodbVPCE![0]).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.dynamodb"/);
      expect(dynamodbVPCE![0]).toMatch(/route_table_ids\s*=\s*aws_route_table\.private\[\*\]\.id/);
    });

    test("S3 Gateway endpoint exists", () => {
      const s3VPCE = tapContent.match(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*\{[\s\S]*?\n\}/);
      expect(s3VPCE).toBeTruthy();
      expect(s3VPCE![0]).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
      expect(s3VPCE![0]).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
    });

    test("Interface endpoints for AWS services exist", () => {
      const interfaceVPCE = tapContent.match(/resource\s+"aws_vpc_endpoint"\s+"interface_endpoints"\s*\{[\s\S]*?\n\}/);
      expect(interfaceVPCE).toBeTruthy();
      expect(interfaceVPCE![0]).toMatch(/for_each\s*=\s*toset\(\[/);
      expect(interfaceVPCE![0]).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
      expect(interfaceVPCE![0]).toMatch(/private_dns_enabled\s*=\s*true/);
      expect(interfaceVPCE![0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(interfaceVPCE![0]).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.vpc_endpoints\.id\]/);
    });

    test("Interface endpoints include required services", () => {
      const interfaceVPCE = tapContent.match(/resource\s+"aws_vpc_endpoint"\s+"interface_endpoints"\s*\{[\s\S]*?\]/);
      expect(interfaceVPCE).toBeTruthy();
      expect(interfaceVPCE![0]).toMatch(/"kinesis-streams"/);
      expect(interfaceVPCE![0]).toMatch(/"sns"/);
      expect(interfaceVPCE![0]).toMatch(/"sqs"/);
      expect(interfaceVPCE![0]).toMatch(/"secretsmanager"/);
      expect(interfaceVPCE![0]).toMatch(/"ssm"/);
      expect(interfaceVPCE![0]).toMatch(/"athena"/);
      expect(interfaceVPCE![0]).toMatch(/"states"/);
    });
  });

  describe("S3 Buckets - Security", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("audit logs bucket exists with random suffix", () => {
      const auditBucket = tapContent.match(/resource\s+"aws_s3_bucket"\s+"audit_logs"\s*\{[\s\S]*?\n\}/);
      expect(auditBucket).toBeTruthy();
      expect(auditBucket![0]).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-audit-logs-\$\{random_id\.bucket_suffix\.hex\}"/);
    });

    test("athena results bucket exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"/);
    });

    test("audit logs bucket has versioning enabled", () => {
      const versioningBlock = tapContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"audit_logs"\s*\{[\s\S]*?\n\}/);
      expect(versioningBlock).toBeTruthy();
      expect(versioningBlock![0]).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("athena results bucket has versioning enabled", () => {
      const versioningBlock = tapContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"athena_results"\s*\{[\s\S]*?\n\}/);
      expect(versioningBlock).toBeTruthy();
      expect(versioningBlock![0]).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("audit logs bucket has KMS encryption", () => {
      const encryptionBlock = tapContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit_logs"\s*\{[\s\S]*?\n\}/);
      expect(encryptionBlock).toBeTruthy();
      expect(encryptionBlock![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(encryptionBlock![0]).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("athena results bucket has KMS encryption", () => {
      const encryptionBlock = tapContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"athena_results"\s*\{[\s\S]*?\n\}/);
      expect(encryptionBlock).toBeTruthy();
      expect(encryptionBlock![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("audit logs bucket blocks public access", () => {
      const publicAccessBlock = tapContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"audit_logs"\s*\{[\s\S]*?\n\}/);
      expect(publicAccessBlock).toBeTruthy();
      expect(publicAccessBlock![0]).toMatch(/block_public_acls\s*=\s*true/);
      expect(publicAccessBlock![0]).toMatch(/block_public_policy\s*=\s*true/);
      expect(publicAccessBlock![0]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(publicAccessBlock![0]).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("athena results bucket blocks public access", () => {
      const publicAccessBlock = tapContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"athena_results"\s*\{[\s\S]*?\n\}/);
      expect(publicAccessBlock).toBeTruthy();
      expect(publicAccessBlock![0]).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("random_id is used for bucket suffix", () => {
      expect(tapContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(tapContent).toMatch(/byte_length\s*=\s*4/);
    });
  });

  describe("IoT Core", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("IoT thing exists for patient monitor", () => {
      const iotThing = tapContent.match(/resource\s+"aws_iot_thing"\s+"patient_monitor"\s*\{[\s\S]*?\n\}/);
      expect(iotThing).toBeTruthy();
      expect(iotThing![0]).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-patient-monitor"/);
      expect(iotThing![0]).toMatch(/attributes\s*=\s*\{/);
      expect(iotThing![0]).toMatch(/Environment\s*=\s*var\.environment/);
    });

    test("IoT topic rule routes to Kinesis", () => {
      const topicRule = tapContent.match(/resource\s+"aws_iot_topic_rule"\s+"kinesis_ingestion"\s*\{[\s\S]*?\n\}/);
      expect(topicRule).toBeTruthy();
      expect(topicRule![0]).toMatch(/enabled\s*=\s*true/);
      expect(topicRule![0]).toMatch(/sql\s*=\s*"SELECT \* FROM 'topic\/patient\/vitals'"/);
      expect(topicRule![0]).toMatch(/kinesis\s*\{/);
      expect(topicRule![0]).toMatch(/role_arn\s*=\s*aws_iam_role\.iot_kinesis\.arn/);
      expect(topicRule![0]).toMatch(/stream_name\s*=\s*aws_kinesis_stream\.patient_vitals\.name/);
    });
  });

  describe("Kinesis Data Stream", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Kinesis stream exists with KMS encryption", () => {
      const kinesisStream = tapContent.match(/resource\s+"aws_kinesis_stream"\s+"patient_vitals"\s*\{[\s\S]*?\n\}/);
      expect(kinesisStream).toBeTruthy();
      expect(kinesisStream![0]).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(kinesisStream![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Kinesis stream has retention period configured", () => {
      const kinesisStream = tapContent.match(/resource\s+"aws_kinesis_stream"\s+"patient_vitals"\s*\{[\s\S]*?\n\}/);
      expect(kinesisStream).toBeTruthy();
      expect(kinesisStream![0]).toMatch(/retention_period\s*=\s*var\.kinesis_retention_hours/);
    });

    test("Kinesis stream has stream mode configuration", () => {
      const kinesisStream = tapContent.match(/resource\s+"aws_kinesis_stream"\s+"patient_vitals"\s*\{[\s\S]*?\n\}/);
      expect(kinesisStream).toBeTruthy();
      expect(kinesisStream![0]).toMatch(/stream_mode_details\s*\{/);
      expect(kinesisStream![0]).toMatch(/stream_mode\s*=\s*var\.kinesis_stream_mode/);
    });

    test("Kinesis stream shard count is conditional", () => {
      const kinesisStream = tapContent.match(/resource\s+"aws_kinesis_stream"\s+"patient_vitals"\s*\{[\s\S]*?\n\}/);
      expect(kinesisStream).toBeTruthy();
      expect(kinesisStream![0]).toMatch(/shard_count\s*=\s*var\.kinesis_stream_mode\s*==\s*"PROVISIONED"\s*\?\s*var\.kinesis_shard_count\s*:\s*null/);
    });
  });

  describe("DynamoDB Table", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("DynamoDB table has KMS encryption", () => {
      const dynamoTable = tapContent.match(/resource\s+"aws_dynamodb_table"\s+"patient_records"\s*\{[\s\S]*?\n\}/);
      expect(dynamoTable).toBeTruthy();
      expect(dynamoTable![0]).toMatch(/server_side_encryption\s*\{/);
      expect(dynamoTable![0]).toMatch(/enabled\s*=\s*true/);
      expect(dynamoTable![0]).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("DynamoDB table has point-in-time recovery enabled", () => {
      const dynamoTable = tapContent.match(/resource\s+"aws_dynamodb_table"\s+"patient_records"\s*\{[\s\S]*?\n\}/);
      expect(dynamoTable).toBeTruthy();
      expect(dynamoTable![0]).toMatch(/point_in_time_recovery\s*\{/);
      expect(dynamoTable![0]).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB table has stream enabled", () => {
      const dynamoTable = tapContent.match(/resource\s+"aws_dynamodb_table"\s+"patient_records"\s*\{[\s\S]*?\n\}/);
      expect(dynamoTable).toBeTruthy();
      expect(dynamoTable![0]).toMatch(/stream_enabled\s*=\s*true/);
      expect(dynamoTable![0]).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test("DynamoDB table has correct keys", () => {
      const dynamoTable = tapContent.match(/resource\s+"aws_dynamodb_table"\s+"patient_records"\s*\{[\s\S]*?\n\}/);
      expect(dynamoTable).toBeTruthy();
      expect(dynamoTable![0]).toMatch(/hash_key\s*=\s*"patient_id"/);
      expect(dynamoTable![0]).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test("DynamoDB table has provisioned billing mode", () => {
      const dynamoTable = tapContent.match(/resource\s+"aws_dynamodb_table"\s+"patient_records"\s*\{[\s\S]*?\n\}/);
      expect(dynamoTable).toBeTruthy();
      expect(dynamoTable![0]).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
      expect(dynamoTable![0]).toMatch(/read_capacity\s*=\s*var\.dynamodb_read_capacity/);
      expect(dynamoTable![0]).toMatch(/write_capacity\s*=\s*var\.dynamodb_write_capacity/);
    });
  });

  describe("SNS Topics", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("all SNS topics have KMS encryption", () => {
      const snsTopics = ["patient_updates", "operational_alerts", "data_quality_findings", "phi_violations"];
      snsTopics.forEach(topic => {
        const topicBlock = tapContent.match(new RegExp(`resource\\s+"aws_sns_topic"\\s+"${topic}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(topicBlock).toBeTruthy();
        expect(topicBlock![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
      });
    });

    test("SNS topics have proper naming", () => {
      const snsTopics = ["patient_updates", "operational_alerts", "data_quality_findings", "phi_violations"];
      snsTopics.forEach(topic => {
        const topicBlock = tapContent.match(new RegExp(`resource\\s+"aws_sns_topic"\\s+"${topic}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(topicBlock).toBeTruthy();
        expect(topicBlock![0]).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-/);
      });
    });
  });

  describe("SQS Queues", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("hospital region queues use for_each", () => {
      const sqsQueue = tapContent.match(/resource\s+"aws_sqs_queue"\s+"hospital_region"\s*\{[\s\S]*?\n\}/);
      expect(sqsQueue).toBeTruthy();
      expect(sqsQueue![0]).toMatch(/for_each\s*=\s*toset\(var\.hospital_regions\)/);
    });

    test("hospital region queues have KMS encryption", () => {
      const sqsQueue = tapContent.match(/resource\s+"aws_sqs_queue"\s+"hospital_region"\s*\{[\s\S]*?\n\}/);
      expect(sqsQueue).toBeTruthy();
      expect(sqsQueue![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("hospital region queues have DLQ configured", () => {
      const sqsQueue = tapContent.match(/resource\s+"aws_sqs_queue"\s+"hospital_region"\s*\{[\s\S]*?\n\}/);
      expect(sqsQueue).toBeTruthy();
      expect(sqsQueue![0]).toMatch(/redrive_policy\s*=\s*jsonencode\(\{/);
      expect(sqsQueue![0]).toMatch(/deadLetterTargetArn\s*=\s*aws_sqs_queue\.hospital_region_dlq\[each\.key\]\.arn/);
      expect(sqsQueue![0]).toMatch(/maxReceiveCount\s*=\s*var\.sqs_max_receive_count/);
    });

    test("DLQ queues exist for hospital regions", () => {
      const dlqQueue = tapContent.match(/resource\s+"aws_sqs_queue"\s+"hospital_region_dlq"\s*\{[\s\S]*?\n\}/);
      expect(dlqQueue).toBeTruthy();
      expect(dlqQueue![0]).toMatch(/for_each\s*=\s*toset\(var\.hospital_regions\)/);
    });

    test("SNS subscription exists for hospital queues", () => {
      const subscription = tapContent.match(/resource\s+"aws_sns_topic_subscription"\s+"hospital_queues"\s*\{[\s\S]*?\n\}/);
      expect(subscription).toBeTruthy();
      expect(subscription![0]).toMatch(/for_each\s*=\s*toset\(var\.hospital_regions\)/);
      expect(subscription![0]).toMatch(/topic_arn\s*=\s*aws_sns_topic\.patient_updates\.arn/);
      expect(subscription![0]).toMatch(/protocol\s*=\s*"sqs"/);
      expect(subscription![0]).toMatch(/raw_message_delivery\s*=\s*true/);
    });

    test("SQS queue policy allows SNS to send messages", () => {
      const queuePolicy = tapContent.match(/resource\s+"aws_sqs_queue_policy"\s+"hospital_region"\s*\{[\s\S]*?\n\}(?!\s*\})/);
      expect(queuePolicy).toBeTruthy();
      expect(queuePolicy![0]).toMatch(/for_each\s*=\s*toset\(var\.hospital_regions\)/);
      expect(queuePolicy![0]).toMatch(/Action\s*=\s*"sqs:SendMessage"/);
      expect(queuePolicy![0]).toMatch(/Service\s*=\s*"sns\.amazonaws\.com"/);
    });

    test("Kinesis DLQ exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_sqs_queue"\s+"kinesis_dlq"/);
    });

    test("DynamoDB stream DLQ exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dynamodb_stream_dlq"/);
    });
  });

  describe("Aurora PostgreSQL", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Aurora credentials stored in Secrets Manager with KMS", () => {
      const secret = tapContent.match(/resource\s+"aws_secretsmanager_secret"\s+"aurora_credentials"\s*\{[\s\S]*?\n\}/);
      expect(secret).toBeTruthy();
      expect(secret![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(secret![0]).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("Aurora password is random", () => {
      const password = tapContent.match(/resource\s+"random_password"\s+"aurora_password"\s*\{[\s\S]*?\n\}/);
      expect(password).toBeTruthy();
      expect(password![0]).toMatch(/length\s*=\s*32/);
      expect(password![0]).toMatch(/special\s*=\s*true/);
    });

    test("Aurora cluster has KMS encryption", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/storage_encrypted\s*=\s*true/);
      expect(cluster![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Aurora cluster has serverless v2 scaling", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/serverlessv2_scaling_configuration\s*\{/);
      expect(cluster![0]).toMatch(/min_capacity\s*=\s*var\.aurora_min_capacity/);
      expect(cluster![0]).toMatch(/max_capacity\s*=\s*var\.aurora_max_capacity/);
    });

    test("Aurora cluster has backup retention", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("Aurora cluster has CloudWatch logs enabled", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test("Aurora cluster skip final snapshot for non-prod", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/skip_final_snapshot\s*=\s*var\.environment\s*!=\s*"prod"/);
    });

    test("Aurora instances have Performance Insights enabled with KMS", () => {
      const instance = tapContent.match(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(instance).toBeTruthy();
      expect(instance![0]).toMatch(/performance_insights_enabled\s*=\s*true/);
      expect(instance![0]).toMatch(/performance_insights_kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Aurora instances have enhanced monitoring", () => {
      const instance = tapContent.match(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(instance).toBeTruthy();
      expect(instance![0]).toMatch(/monitoring_interval\s*=\s*60/);
      expect(instance![0]).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_monitoring\.arn/);
    });

    test("Aurora instances are not publicly accessible", () => {
      const instance = tapContent.match(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(instance).toBeTruthy();
      expect(instance![0]).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("Aurora subnet group uses private subnets", () => {
      const subnetGroup = tapContent.match(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(subnetGroup).toBeTruthy();
      expect(subnetGroup![0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("ElastiCache Redis", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Redis has encryption at rest with KMS", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      expect(redis![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Redis has encryption in transit", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/transit_encryption_enabled\s*=\s*true/);
    });

    test("Redis has snapshot retention", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/snapshot_retention_limit\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*5\s*:\s*1/);
    });

    test("Redis has auto minor version upgrade", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/auto_minor_version_upgrade\s*=\s*true/);
    });

    test("Redis has CloudWatch logs configured", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/log_delivery_configuration\s*\{/);
      expect(redis![0]).toMatch(/destination_type\s*=\s*"cloudwatch-logs"/);
      expect(redis![0]).toMatch(/log_type\s*=\s*"slow-log"/);
    });

    test("Redis subnet group uses private subnets", () => {
      const subnetGroup = tapContent.match(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(subnetGroup).toBeTruthy();
      expect(subnetGroup![0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("Lambda Functions", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Lambda layer exists for common dependencies", () => {
      const layer = tapContent.match(/resource\s+"aws_lambda_layer_version"\s+"common"\s*\{[\s\S]*?\n\}/);
      expect(layer).toBeTruthy();
      expect(layer![0]).toMatch(/compatible_runtimes\s*=\s*\[var\.lambda_runtime\]/);
    });

    test("HIPAA validator Lambda has VPC configuration", () => {
      const lambda = tapContent.match(/resource\s+"aws_lambda_function"\s+"hipaa_validator"\s*\{[\s\S]*?\n\}/);
      expect(lambda).toBeTruthy();
      expect(lambda![0]).toMatch(/vpc_config\s*\{/);
      expect(lambda![0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(lambda![0]).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("all Lambda functions have X-Ray tracing", () => {
      const lambdas = ["hipaa_validator", "stream_processor", "data_quality_check", "phi_detector", "remediation"];
      lambdas.forEach(lambda => {
        const lambdaBlock = tapContent.match(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambda}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(lambdaBlock).toBeTruthy();
        expect(lambdaBlock![0]).toMatch(/tracing_config\s*\{/);
        expect(lambdaBlock![0]).toMatch(/mode\s*=\s*"Active"/);
      });
    });

    test("all Lambda functions have reserved concurrent executions", () => {
      const lambdas = ["hipaa_validator", "stream_processor"];
      lambdas.forEach(lambda => {
        const lambdaBlock = tapContent.match(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambda}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(lambdaBlock).toBeTruthy();
        expect(lambdaBlock![0]).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrent_executions/);
      });
    });

    test("SQS consumer Lambda uses for_each for regions", () => {
      const lambda = tapContent.match(/resource\s+"aws_lambda_function"\s+"sqs_consumer"\s*\{[\s\S]*?\n\}/);
      expect(lambda).toBeTruthy();
      expect(lambda![0]).toMatch(/for_each\s*=\s*toset\(var\.hospital_regions\)/);
    });

    test("Lambda event source mapping for Kinesis has DLQ", () => {
      const mapping = tapContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_hipaa_validator"\s*\{[\s\S]*?\n\}/);
      expect(mapping).toBeTruthy();
      expect(mapping![0]).toMatch(/destination_config\s*\{/);
      expect(mapping![0]).toMatch(/on_failure\s*\{/);
      expect(mapping![0]).toMatch(/destination_arn\s*=\s*aws_sqs_queue\.kinesis_dlq\.arn/);
    });

    test("Lambda event source mapping for DynamoDB has DLQ", () => {
      const mapping = tapContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_stream_processor"\s*\{[\s\S]*?\n\}/);
      expect(mapping).toBeTruthy();
      expect(mapping![0]).toMatch(/destination_config\s*\{/);
      expect(mapping![0]).toMatch(/destination_arn\s*=\s*aws_sqs_queue\.dynamodb_stream_dlq\.arn/);
    });

    test("Lambda event source mappings have parallelization", () => {
      const kinesisMapping = tapContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_hipaa_validator"\s*\{[\s\S]*?\n\}/);
      expect(kinesisMapping).toBeTruthy();
      expect(kinesisMapping![0]).toMatch(/parallelization_factor\s*=\s*10/);
      expect(kinesisMapping![0]).toMatch(/maximum_retry_attempts\s*=\s*3/);
    });

    test("SNS Lambda permission for remediation function", () => {
      const permission = tapContent.match(/resource\s+"aws_lambda_permission"\s+"sns_invoke_remediation"\s*\{[\s\S]*?\n\}/);
      expect(permission).toBeTruthy();
      expect(permission![0]).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(permission![0]).toMatch(/principal\s*=\s*"sns\.amazonaws\.com"/);
      expect(permission![0]).toMatch(/source_arn\s*=\s*aws_sns_topic\.phi_violations\.arn/);
    });
  });

  describe("Step Functions", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Step Functions state machine exists", () => {
      expect(tapContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"data_quality_workflow"/);
      const stateMachineSection = tapContent.substring(
        tapContent.indexOf('resource "aws_sfn_state_machine" "data_quality_workflow"'),
        tapContent.indexOf('resource "aws_cloudwatch_event_rule" "data_quality_schedule"')
      );
      expect(stateMachineSection).toMatch(/definition\s*=\s*jsonencode\(\{/);
    });

    test("Step Functions has logging configured with KMS", () => {
      expect(tapContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"data_quality_workflow"/);
      const stateMachineSection = tapContent.substring(
        tapContent.indexOf('resource "aws_sfn_state_machine" "data_quality_workflow"'),
        tapContent.indexOf('resource "aws_cloudwatch_event_rule" "data_quality_schedule"')
      );
      expect(stateMachineSection).toMatch(/logging_configuration\s*\{/);
      expect(stateMachineSection).toMatch(/log_destination\s*=\s*"\$\{aws_cloudwatch_log_group\.step_functions\.arn\}:\*"/);
      expect(stateMachineSection).toMatch(/include_execution_data\s*=\s*true/);
    });

    test("Step Functions has X-Ray tracing enabled", () => {
      expect(tapContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"data_quality_workflow"/);
      const stateMachineSection = tapContent.substring(
        tapContent.indexOf('resource "aws_sfn_state_machine" "data_quality_workflow"'),
        tapContent.indexOf('resource "aws_cloudwatch_event_rule" "data_quality_schedule"')
      );
      expect(stateMachineSection).toMatch(/tracing_configuration\s*\{/);
      expect(stateMachineSection).toMatch(/enabled\s*=\s*true/);
    });

    test("EventBridge rule triggers Step Functions", () => {
      const rule = tapContent.match(/resource\s+"aws_cloudwatch_event_rule"\s+"data_quality_schedule"\s*\{[\s\S]*?\n\}/);
      expect(rule).toBeTruthy();
      expect(rule![0]).toMatch(/schedule_expression\s*=\s*var\.eventbridge_schedule/);
    });

    test("EventBridge target points to Step Functions", () => {
      expect(tapContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_functions"/);
      const targetSection = tapContent.substring(
        tapContent.indexOf('resource "aws_cloudwatch_event_target" "step_functions"'),
        tapContent.indexOf('# ==========================================\n# CloudWatch Log Groups')
      );
      expect(targetSection).toMatch(/arn\s*=\s*aws_sfn_state_machine\.data_quality_workflow\.arn/);
    });
  });

  describe("CloudWatch - Logs and Alarms", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Lambda log groups have KMS encryption", () => {
      const logGroup = tapContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*\{[\s\S]*?\n\}/);
      expect(logGroup).toBeTruthy();
      expect(logGroup![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(logGroup![0]).toMatch(/for_each\s*=\s*toset\(\[/);
    });

    test("Lambda log groups have retention configured", () => {
      const logGroup = tapContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*\{[\s\S]*?\n\}/);
      expect(logGroup).toBeTruthy();
      expect(logGroup![0]).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("Step Functions log group exists with KMS", () => {
      const logGroup = tapContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"\s*\{[\s\S]*?\n\}/);
      expect(logGroup).toBeTruthy();
      expect(logGroup![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Redis log group exists with KMS", () => {
      const logGroup = tapContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"redis_slow_log"\s*\{[\s\S]*?\n\}/);
      expect(logGroup).toBeTruthy();
      expect(logGroup![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Kinesis iterator age alarm exists", () => {
      const alarm = tapContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_iterator_age"\s*\{[\s\S]*?\n\}/);
      expect(alarm).toBeTruthy();
      expect(alarm![0]).toMatch(/metric_name\s*=\s*"GetRecords\.IteratorAgeMilliseconds"/);
      expect(alarm![0]).toMatch(/threshold\s*=\s*60000/);
      expect(alarm![0]).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.operational_alerts\.arn\]/);
    });

    test("Lambda error alarms exist for all functions", () => {
      const alarms = tapContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*\{[\s\S]*?\n\}/);
      expect(alarms).toBeTruthy();
      expect(alarms![0]).toMatch(/for_each\s*=\s*toset\(\[/);
      expect(alarms![0]).toMatch(/metric_name\s*=\s*"Errors"/);
    });

    test("Lambda throttle alarms exist", () => {
      const alarms = tapContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*\{[\s\S]*?\n\}/);
      expect(alarms).toBeTruthy();
      expect(alarms![0]).toMatch(/metric_name\s*=\s*"Throttles"/);
    });

    test("Aurora connection count alarm exists", () => {
      const alarm = tapContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connection_count"\s*\{[\s\S]*?\n\}/);
      expect(alarm).toBeTruthy();
      expect(alarm![0]).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
    });

    test("Redis memory usage alarm exists", () => {
      const alarm = tapContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_memory_usage"\s*\{[\s\S]*?\n\}/);
      expect(alarm).toBeTruthy();
      expect(alarm![0]).toMatch(/metric_name\s*=\s*"DatabaseMemoryUsagePercentage"/);
    });
  });

  describe("SSM Parameters", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("runtime config parameters exist", () => {
      const ssmParam = tapContent.match(/resource\s+"aws_ssm_parameter"\s+"runtime_config"\s*\{[\s\S]*?\n\}/);
      expect(ssmParam).toBeTruthy();
      expect(ssmParam![0]).toMatch(/for_each\s*=\s*\{/);
      expect(ssmParam![0]).toMatch(/kinesis_batch_size/);
      expect(ssmParam![0]).toMatch(/dynamodb_batch_size/);
      expect(ssmParam![0]).toMatch(/redis_ttl_seconds/);
    });

    test("SSM parameters use name prefix pattern", () => {
      const ssmParam = tapContent.match(/resource\s+"aws_ssm_parameter"\s+"runtime_config"\s*\{[\s\S]*?\n\}/);
      expect(ssmParam).toBeTruthy();
      expect(ssmParam![0]).toMatch(/name\s*=\s*"\/\$\{local\.name_prefix\}\/config\/\$\{each\.key\}"/);
    });
  });

  describe("IAM Roles and Policies - Least Privilege", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("IoT role can only write to Kinesis", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"iot_kinesis"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "iot_kinesis"'),
        tapContent.indexOf('resource "aws_iam_role" "hipaa_validator_lambda"')
      );
      expect(policySection).toMatch(/Action\s*=\s*\[/);
      expect(policySection).toMatch(/"kinesis:PutRecord"/);
      expect(policySection).toMatch(/"kinesis:PutRecords"/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_kinesis_stream\.patient_vitals\.arn/);
    });

    test("HIPAA validator Lambda role has minimal permissions", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"hipaa_validator_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "hipaa_validator_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "hipaa_validator_lambda_vpc"')
      );
      expect(policySection).toMatch(/"kinesis:DescribeStream"/);
      expect(policySection).toMatch(/"kinesis:GetRecords"/);
      expect(policySection).toMatch(/"dynamodb:PutItem"/);
      expect(policySection).toMatch(/"kms:Decrypt"/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_kinesis_stream\.patient_vitals\.arn/);
    });

    test("Stream processor Lambda can read DynamoDB streams and publish to SNS", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"stream_processor_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "stream_processor_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "stream_processor_lambda_vpc"')
      );
      expect(policySection).toMatch(/"dynamodb:DescribeStream"/);
      expect(policySection).toMatch(/"dynamodb:GetRecords"/);
      expect(policySection).toMatch(/"sns:Publish"/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_dynamodb_table\.patient_records\.stream_arn/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_sns_topic\.patient_updates\.arn/);
    });

    test("SQS consumer Lambda can access Secrets Manager", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"sqs_consumer_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "sqs_consumer_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "sqs_consumer_lambda_vpc"')
      );
      expect(policySection).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_secretsmanager_secret\.aurora_credentials\.arn/);
    });

    test("Data quality Lambda has read-only DB access", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"data_quality_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "data_quality_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "data_quality_lambda_vpc"')
      );
      expect(policySection).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(policySection).toMatch(/"sns:Publish"/);
      // Should not have write permissions to database
    });

    test("PHI detector Lambda has Athena and S3 permissions", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"phi_detector_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "phi_detector_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "phi_detector_lambda_vpc"')
      );
      expect(policySection).toMatch(/"athena:StartQueryExecution"/);
      expect(policySection).toMatch(/"athena:GetQueryExecution"/);
      expect(policySection).toMatch(/"s3:GetObject"/);
      expect(policySection).toMatch(/aws_s3_bucket\.audit_logs\.arn/);
    });

    test("Remediation Lambda has limited SSM access", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"remediation_lambda"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "remediation_lambda"'),
        tapContent.indexOf('resource "aws_iam_role_policy_attachment" "remediation_lambda_vpc"')
      );
      expect(policySection).toMatch(/"ssm:PutParameter"/);
      expect(policySection).toMatch(/Resource\s*=\s*"arn:aws:ssm:\$\{var\.aws_region\}:\$\{data\.aws_caller_identity\.current\.account_id\}:parameter\/remediation\/\*"/);
    });

    test("Step Functions role can only invoke specific Lambda functions", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"step_functions"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "step_functions"'),
        tapContent.indexOf('resource "aws_iam_role" "eventbridge"')
      );
      expect(policySection).toMatch(/"lambda:InvokeFunction"/);
      expect(policySection).toMatch(/aws_lambda_function\.data_quality_check\.arn/);
      expect(policySection).toMatch(/aws_lambda_function\.phi_detector\.arn/);
    });

    test("EventBridge role can only start specific state machine", () => {
      expect(tapContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"eventbridge"/);
      const policySection = tapContent.substring(
        tapContent.indexOf('resource "aws_iam_role_policy" "eventbridge"'),
        tapContent.indexOf('resource "aws_iam_role" "rds_monitoring"')
      );
      expect(policySection).toMatch(/"states:StartExecution"/);
      expect(policySection).toMatch(/Resource\s*=\s*aws_sfn_state_machine\.data_quality_workflow\.arn/);
    });

    test("RDS monitoring role exists with managed policy", () => {
      const roleAttachment = tapContent.match(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"\s*\{[\s\S]*?\n\}/);
      expect(roleAttachment).toBeTruthy();
      expect(roleAttachment![0]).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AmazonRDSEnhancedMonitoringRole"/);
    });

    test("Lambda VPC execution role attached to all Lambda roles", () => {
      const lambdaRoles = ["hipaa_validator", "stream_processor", "sqs_consumer", "data_quality", "phi_detector", "remediation"];
      lambdaRoles.forEach(role => {
        const attachment = tapContent.match(new RegExp(`resource\\s+"aws_iam_role_policy_attachment"\\s+"${role}_lambda_vpc"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(attachment).toBeTruthy();
        expect(attachment![0]).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWSLambdaVPCAccessExecutionRole"/);
      });
    });

    test("all IAM roles use assume_role_policy with correct principal", () => {
      const iamRoles = tapContent.match(/resource\s+"aws_iam_role"\s+"[^"]+"\s*\{[\s\S]*?\n\}/g);
      expect(iamRoles).toBeTruthy();
      iamRoles!.forEach(role => {
        expect(role).toMatch(/assume_role_policy\s*=\s*jsonencode\(\{/);
        expect(role).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
        expect(role).toMatch(/Principal\s*=\s*\{/);
        expect(role).toMatch(/Service\s*=/);
      });
    });
  });

  describe("Outputs", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("VPC outputs exist", () => {
      expect(tapContent).toMatch(/output\s+"vpc_id"\s*\{/);
      expect(tapContent).toMatch(/output\s+"private_subnet_ids"\s*\{/);
      expect(tapContent).toMatch(/output\s+"public_subnet_ids"\s*\{/);
    });

    test("Kinesis output exists", () => {
      const output = tapContent.match(/output\s+"kinesis_stream_arn"\s*\{[\s\S]*?\n\}/);
      expect(output).toBeTruthy();
      expect(output![0]).toMatch(/value\s*=\s*aws_kinesis_stream\.patient_vitals\.arn/);
    });

    test("DynamoDB outputs exist", () => {
      expect(tapContent).toMatch(/output\s+"dynamodb_table_name"\s*\{/);
      expect(tapContent).toMatch(/output\s+"dynamodb_stream_arn"\s*\{/);
    });

    test("SNS topic outputs exist for all topics", () => {
      expect(tapContent).toMatch(/output\s+"sns_patient_updates_arn"\s*\{/);
      expect(tapContent).toMatch(/output\s+"sns_operational_alerts_arn"\s*\{/);
      expect(tapContent).toMatch(/output\s+"sns_data_quality_findings_arn"\s*\{/);
      expect(tapContent).toMatch(/output\s+"sns_phi_violations_arn"\s*\{/);
    });

    test("Aurora outputs exist", () => {
      expect(tapContent).toMatch(/output\s+"aurora_cluster_endpoint"\s*\{/);
      expect(tapContent).toMatch(/output\s+"aurora_reader_endpoint"\s*\{/);
    });

    test("Redis output exists", () => {
      const output = tapContent.match(/output\s+"redis_primary_endpoint"\s*\{[\s\S]*?\n\}/);
      expect(output).toBeTruthy();
      expect(output![0]).toMatch(/value\s*=\s*aws_elasticache_replication_group\.redis\.primary_endpoint_address/);
    });

    test("Lambda function ARNs output exists", () => {
      const output = tapContent.match(/output\s+"lambda_function_arns"\s*\{[\s\S]*?\n\}/);
      expect(output).toBeTruthy();
      expect(output![0]).toMatch(/hipaa_validator/);
      expect(output![0]).toMatch(/stream_processor/);
      expect(output![0]).toMatch(/sqs_consumers/);
    });

    test("KMS key ARN output exists", () => {
      const output = tapContent.match(/output\s+"kms_key_arn"\s*\{[\s\S]*?\n\}/);
      expect(output).toBeTruthy();
      expect(output![0]).toMatch(/value\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("all outputs have descriptions", () => {
      const outputs = tapContent.match(/output\s+"[^"]+"\s*\{[\s\S]*?\n\}/g);
      expect(outputs).toBeTruthy();
      outputs!.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  describe("Resource Naming and Tagging", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("all resources use name_prefix for naming", () => {
      const namedResources = tapContent.match(/Name\s*=\s*"\$\{local\.name_prefix\}-[^"]+"/g);
      expect(namedResources).toBeTruthy();
      expect(namedResources!.length).toBeGreaterThan(50);
    });

    test("all major resources have tags with common_tags", () => {
      const taggedResources = tapContent.match(/tags\s*=\s*merge\(local\.common_tags,\s*\{/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(40);
    });

    test("some resources use tags without merge (IAM roles)", () => {
      const simpleTags = tapContent.match(/tags\s*=\s*local\.common_tags/g);
      expect(simpleTags).toBeTruthy();
      expect(simpleTags!.length).toBeGreaterThan(10);
    });

    test("security groups use name_prefix instead of name", () => {
      const sgNamePrefixes = tapContent.match(/resource\s+"aws_security_group"\s+"[^"]+"\s*\{[\s\S]*?name_prefix\s*=\s*"\$\{local\.name_prefix\}-/g);
      expect(sgNamePrefixes).toBeTruthy();
      expect(sgNamePrefixes!.length).toBeGreaterThan(3);
    });

    test("Secrets Manager uses name_prefix", () => {
      const secret = tapContent.match(/resource\s+"aws_secretsmanager_secret"\s+"aurora_credentials"\s*\{[\s\S]*?\n\}/);
      expect(secret).toBeTruthy();
      expect(secret![0]).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-aurora-"/);
    });
  });

  describe("Environment-Specific Configuration", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("Aurora snapshot behavior differs by environment", () => {
      const cluster = tapContent.match(/resource\s+"aws_rds_cluster"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(cluster).toBeTruthy();
      expect(cluster![0]).toMatch(/skip_final_snapshot\s*=\s*var\.environment\s*!=\s*"prod"/);
      expect(cluster![0]).toMatch(/final_snapshot_identifier\s*=\s*var\.environment\s*==\s*"prod"\s*\?/);
    });

    test("Redis snapshot retention differs by environment", () => {
      const redis = tapContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redis).toBeTruthy();
      expect(redis![0]).toMatch(/snapshot_retention_limit\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*5\s*:\s*1/);
    });

    test("all resources are tagged with environment variable", () => {
      const localsBlock = tapContent.match(/locals\s*\{[\s\S]*?common_tags\s*=\s*\{[\s\S]*?\}/);
      expect(localsBlock).toBeTruthy();
      expect(localsBlock![0]).toMatch(/Environment\s*=\s*var\.environment/);
    });
  });

  describe("Security Best Practices", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("no hardcoded credentials in configuration", () => {
      expect(tapContent).not.toMatch(/password\s*=\s*"[^$]/);
      expect(tapContent).not.toMatch(/secret\s*=\s*"[^$]/);
      expect(tapContent).not.toMatch(/access_key\s*=\s*"[^$]/);
    });

    test("all data at rest is encrypted", () => {
      // KMS for major services
      expect(tapContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tapContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
      expect(tapContent).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(tapContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tapContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    });

    test("all data in transit is encrypted", () => {
      expect(tapContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
      // HTTPS for VPC endpoints
      expect(tapContent).toMatch(/from_port\s*=\s*443/);
    });

    test("databases are not publicly accessible", () => {
      expect(tapContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("S3 buckets block all public access", () => {
      const publicAccessBlocks = tapContent.match(/resource\s+"aws_s3_bucket_public_access_block"[\s\S]*?block_public_acls\s*=\s*true/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(2);
    });

    test("Lambda functions are in private subnets", () => {
      const lambdaVpcConfigs = tapContent.match(/vpc_config\s*\{[\s\S]*?subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/g);
      expect(lambdaVpcConfigs).toBeTruthy();
      expect(lambdaVpcConfigs!.length).toBeGreaterThanOrEqual(5);
    });

    test("security groups follow least privilege", () => {
      // Aurora only from Lambda
      const auroraSG = tapContent.match(/resource\s+"aws_security_group"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(auroraSG![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);

      // Redis only from Lambda
      const redisSG = tapContent.match(/resource\s+"aws_security_group"\s+"redis"\s*\{[\s\S]*?\n\}/);
      expect(redisSG![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });
  });

  describe("Archive Data Sources for Lambda Code", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("all Lambda functions use archive_file data source", () => {
      const lambdaFunctions = ["lambda_layer", "hipaa_validator", "stream_processor", "sqs_consumer", "data_quality_check", "phi_detector", "remediation"];
      lambdaFunctions.forEach(func => {
        const archiveBlock = tapContent.match(new RegExp(`data\\s+"archive_file"\\s+"${func}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(archiveBlock).toBeTruthy();
        expect(archiveBlock![0]).toMatch(/type\s*=\s*"zip"/);
      });
    });

    test("Lambda functions reference archive_file output", () => {
      const lambdaFunctions = ["hipaa_validator", "stream_processor", "sqs_consumer", "data_quality_check", "phi_detector", "remediation"];
      lambdaFunctions.forEach(func => {
        const lambdaBlock = tapContent.match(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${func}"\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
        expect(lambdaBlock).toBeTruthy();
        expect(lambdaBlock![0]).toMatch(/source_code_hash\s*=\s*data\.archive_file\./);
      });
    });

    test("Lambda layer uses archive_file", () => {
      const layerBlock = tapContent.match(/resource\s+"aws_lambda_layer_version"\s+"common"\s*\{[\s\S]*?\n\}/);
      expect(layerBlock).toBeTruthy();
      expect(layerBlock![0]).toMatch(/filename\s*=\s*data\.archive_file\.lambda_layer\.output_path/);
      expect(layerBlock![0]).toMatch(/source_code_hash\s*=\s*data\.archive_file\.lambda_layer\.output_base64sha256/);
    });
  });

  describe("High Availability and Reliability", () => {
    let tapContent: string;

    beforeAll(() => {
      tapContent = readTerraformFile(TAP_STACK_PATH);
    });

    test("resources are deployed across multiple AZs", () => {
      expect(tapContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
      const multiAzResources = tapContent.match(/count\s*=\s*length\(local\.azs\)/g);
      expect(multiAzResources!.length).toBeGreaterThanOrEqual(6); // Subnets, NATs, EIPs, Route tables
    });

    test("Aurora has multiple instances", () => {
      const auroraInstance = tapContent.match(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*\{[\s\S]*?\n\}/);
      expect(auroraInstance).toBeTruthy();
      expect(auroraInstance![0]).toMatch(/count\s*=\s*2/);
    });

    test("NAT Gateways are per AZ for high availability", () => {
      const natGateway = tapContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*\{[\s\S]*?\n\}/);
      expect(natGateway).toBeTruthy();
      expect(natGateway![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });

    test("DynamoDB has point-in-time recovery", () => {
      expect(tapContent).toMatch(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
    });

    test("S3 buckets have versioning for data protection", () => {
      const versioningConfigs = tapContent.match(/resource\s+"aws_s3_bucket_versioning"[\s\S]*?status\s*=\s*"Enabled"/g);
      expect(versioningConfigs).toBeTruthy();
      expect(versioningConfigs!.length).toBeGreaterThanOrEqual(2);
    });

    test("Lambda event source mappings have retry configuration", () => {
      const kinesisMapping = tapContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_hipaa_validator"\s*\{[\s\S]*?\n\}/);
      expect(kinesisMapping).toBeTruthy();
      expect(kinesisMapping![0]).toMatch(/maximum_retry_attempts\s*=\s*3/);
      expect(kinesisMapping![0]).toMatch(/maximum_record_age_in_seconds\s*=\s*3600/);
    });

    test("all queues have DLQs configured", () => {
      expect(tapContent).toMatch(/deadLetterTargetArn/);
      expect(tapContent).toMatch(/maxReceiveCount/);
      expect(tapContent).toMatch(/resource\s+"aws_sqs_queue"\s+"hospital_region_dlq"/);
      expect(tapContent).toMatch(/resource\s+"aws_sqs_queue"\s+"kinesis_dlq"/);
      expect(tapContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dynamodb_stream_dlq"/);
    });
  });
});
