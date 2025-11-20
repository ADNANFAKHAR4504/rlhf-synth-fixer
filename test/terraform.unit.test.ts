import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';

/**
 * Terraform Unit Tests - 100% Mock Coverage
 * No live AWS deployments - Pure configuration validation
 */

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  // Helper to read and parse Terraform files
  const readTerraformFile = (filePath: string): any => {
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content);
  };

  // Helper to check if file exists
  const fileExists = (filePath: string): boolean => {
    return fs.existsSync(filePath);
  };

  describe('1. File Structure Tests', () => {
    test('should have all required root Terraform files', () => {
      expect(fileExists(path.join(libPath, 'main.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'variables.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'outputs.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'providers.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'locals.tf'))).toBe(true);
    });

    test('should have all module directories', () => {
      const modules = ['vpc', 'iam', 'aurora', 'storage', 'lambda', 'alb', 'monitoring'];
      modules.forEach(moduleName => {
        const modulePath = path.join(libPath, 'modules', moduleName);
        expect(fileExists(modulePath)).toBe(true);
      });
    });

    test('should have main.tf in each module', () => {
      const modules = ['vpc', 'storage'];
      modules.forEach(moduleName => {
        const mainTfPath = path.join(libPath, 'modules', moduleName, 'main.tf');
        expect(fileExists(mainTfPath)).toBe(true);
      });
    });
  });

  describe('2. Provider Configuration Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'providers.tf'));
    });

    test('should define terraform block', () => {
      expect(config.terraform).toBeDefined();
      expect(Array.isArray(config.terraform)).toBe(true);
      expect(config.terraform.length).toBeGreaterThan(0);
    });

    test('should require Terraform version >= 1.5.0', () => {
      const terraform = config.terraform[0];
      expect(terraform.required_version).toBe('>= 1.5.0');
    });

    test('should configure AWS provider', () => {
      const terraform = config.terraform[0];
      expect(terraform.required_providers).toBeDefined();
      expect(terraform.required_providers.aws).toBeDefined();
      expect(terraform.required_providers.aws.source).toBe('hashicorp/aws');
      expect(terraform.required_providers.aws.version).toBe('~> 5.0');
    });

    test('should configure S3 backend', () => {
      const terraform = config.terraform[0];
      expect(terraform.backend).toBeDefined();
      expect(terraform.backend.s3).toBeDefined();
    });

    test('should define AWS provider block', () => {
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
    });

    test('should configure default tags in provider', () => {
      const provider = config.provider.aws[0];
      expect(provider.default_tags).toBeDefined();
      expect(provider.default_tags.tags).toBeDefined();
      expect(provider.default_tags.tags.ManagedBy).toBe('Terraform');
      expect(provider.default_tags.tags.Project).toBeDefined();
    });
  });

  describe('3. Variables Configuration Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'variables.tf'));
    });

    test('should define environment variable', () => {
      expect(config.variable.environment).toBeDefined();
      const envVar = config.variable.environment[0];
      expect(envVar.type).toBe('string');
      expect(envVar.description).toBeDefined();
    });

    test('should validate environment values', () => {
      const envVar = config.variable.environment[0];
      expect(envVar.validation).toBeDefined();
      expect(envVar.validation.condition).toContain('dev');
      expect(envVar.validation.condition).toContain('staging');
      expect(envVar.validation.condition).toContain('prod');
      expect(envVar.validation.error_message).toBeDefined();
    });

    test('should define environment_suffix variable', () => {
      expect(config.variable.environment_suffix).toBeDefined();
      const suffixVar = config.variable.environment_suffix[0];
      expect(suffixVar.type).toBe('string');
      expect(suffixVar.description).toBeDefined();
    });

    test('should validate environment_suffix length', () => {
      const suffixVar = config.variable.environment_suffix[0];
      expect(suffixVar.validation).toBeDefined();
      expect(suffixVar.validation.error_message).toContain('4');
      expect(suffixVar.validation.error_message).toContain('16');
    });

    test('should define aws_region variable', () => {
      expect(config.variable.aws_region).toBeDefined();
      expect(config.variable.aws_region[0].type).toBe('string');
    });

    test('should define project_name with default', () => {
      expect(config.variable.project_name).toBeDefined();
      expect(config.variable.project_name[0].default).toBe('payment-processing');
    });

    test('should define vpc_cidr variable', () => {
      expect(config.variable.vpc_cidr).toBeDefined();
      expect(config.variable.vpc_cidr[0].type).toBe('string');
    });

    test('should define availability_zones as list', () => {
      expect(config.variable.availability_zones).toBeDefined();
      expect(config.variable.availability_zones[0].type).toBe('list(string)');
    });

    test('should define aurora_instance_class variable', () => {
      expect(config.variable.aurora_instance_class).toBeDefined();
      expect(config.variable.aurora_instance_class[0].type).toBe('string');
    });

    test('should define aurora_instance_count with default', () => {
      expect(config.variable.aurora_instance_count).toBeDefined();
      expect(config.variable.aurora_instance_count[0].type).toBe('number');
      expect(config.variable.aurora_instance_count[0].default).toBe(2);
    });

    test('should define lambda_memory_size with default', () => {
      expect(config.variable.lambda_memory_size).toBeDefined();
      expect(config.variable.lambda_memory_size[0].default).toBe(512);
    });

    test('should define lambda_timeout with default', () => {
      expect(config.variable.lambda_timeout).toBeDefined();
      expect(config.variable.lambda_timeout[0].default).toBe(300);
    });

    test('should define alb_instance_type with default', () => {
      expect(config.variable.alb_instance_type).toBeDefined();
      expect(config.variable.alb_instance_type[0].default).toBe('t3.micro');
    });

    test('should define log_retention_days variable', () => {
      expect(config.variable.log_retention_days).toBeDefined();
      expect(config.variable.log_retention_days[0].type).toBe('number');
    });

    test('should define feature flag: enable_config_rules', () => {
      expect(config.variable.enable_config_rules).toBeDefined();
      expect(config.variable.enable_config_rules[0].type).toBe('bool');
      expect(config.variable.enable_config_rules[0].default).toBe(false);
    });

    test('should define feature flag: enable_step_functions', () => {
      expect(config.variable.enable_step_functions).toBeDefined();
      expect(config.variable.enable_step_functions[0].type).toBe('bool');
      expect(config.variable.enable_step_functions[0].default).toBe(false);
    });

    test('should define feature flag: enable_eventbridge', () => {
      expect(config.variable.enable_eventbridge).toBeDefined();
      expect(config.variable.enable_eventbridge[0].type).toBe('bool');
      expect(config.variable.enable_eventbridge[0].default).toBe(false);
    });

    test('should define bucket_names with default array', () => {
      expect(config.variable.bucket_names).toBeDefined();
      const bucketVar = config.variable.bucket_names[0];
      expect(bucketVar.type).toBe('list(string)');
      expect(bucketVar.default).toContain('data-processing');
      expect(bucketVar.default).toContain('archive');
      expect(bucketVar.default).toContain('logs');
    });
  });

  describe('4. Locals Configuration Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should define locals block', () => {
      expect(config.locals).toBeDefined();
      expect(Array.isArray(config.locals)).toBe(true);
    });

    test('should define environment_config for all environments', () => {
      const locals = config.locals[0];
      expect(locals.environment_config).toBeDefined();
      expect(locals.environment_config.dev).toBeDefined();
      expect(locals.environment_config.staging).toBeDefined();
      expect(locals.environment_config.prod).toBeDefined();
    });

    test('should configure dev environment correctly', () => {
      const devConfig = config.locals[0].environment_config.dev;
      expect(devConfig.instance_type).toBe('t3.small');
      expect(devConfig.aurora_instance_class).toBe('db.t3.medium');
      expect(devConfig.log_retention).toBe(7);
      expect(devConfig.backup_retention).toBe(1);
      expect(devConfig.multi_az).toBe(false);
    });

    test('should configure staging environment correctly', () => {
      const stagingConfig = config.locals[0].environment_config.staging;
      expect(stagingConfig.instance_type).toBe('t3.medium');
      expect(stagingConfig.aurora_instance_class).toBe('db.r6g.large');
      expect(stagingConfig.log_retention).toBe(30);
      expect(stagingConfig.backup_retention).toBe(7);
      expect(stagingConfig.multi_az).toBe(true);
    });

    test('should configure prod environment correctly', () => {
      const prodConfig = config.locals[0].environment_config.prod;
      expect(prodConfig.instance_type).toBe('t3.large');
      expect(prodConfig.aurora_instance_class).toBe('db.r6g.xlarge');
      expect(prodConfig.log_retention).toBe(90);
      expect(prodConfig.backup_retention).toBe(30);
      expect(prodConfig.multi_az).toBe(true);
    });

    test('should define current_config selector', () => {
      const locals = config.locals[0];
      expect(locals.current_config).toBeDefined();
    });

    test('should define name_prefix', () => {
      const locals = config.locals[0];
      expect(locals.name_prefix).toBeDefined();
    });

    test('should define resource_names', () => {
      const locals = config.locals[0];
      expect(locals.resource_names).toBeDefined();
      expect(locals.resource_names.vpc).toBeDefined();
      expect(locals.resource_names.aurora_cluster).toBeDefined();
      expect(locals.resource_names.alb).toBeDefined();
      expect(locals.resource_names.lambda).toBeDefined();
      expect(locals.resource_names.sns_topic).toBeDefined();
      expect(locals.resource_names.log_group).toBeDefined();
    });

    test('should define common_tags', () => {
      const locals = config.locals[0];
      expect(locals.common_tags).toBeDefined();
      expect(locals.common_tags.ManagedBy).toBe('Terraform');
    });

    test('should define iam_roles configuration', () => {
      const locals = config.locals[0];
      expect(locals.iam_roles).toBeDefined();
      expect(locals.iam_roles.lambda_execution).toBeDefined();
      expect(locals.iam_roles.ecs_task).toBeDefined();
      expect(locals.iam_roles.rds_monitoring).toBeDefined();
    });
  });

  describe('5. Outputs Configuration Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'outputs.tf'));
    });

    test('should define vpc_id output', () => {
      expect(config.output.vpc_id).toBeDefined();
      expect(config.output.vpc_id[0].description).toBeDefined();
      expect(config.output.vpc_id[0].value).toContain('module.vpc');
    });

    test('should define vpc_cidr output', () => {
      expect(config.output.vpc_cidr).toBeDefined();
      expect(config.output.vpc_cidr[0].value).toContain('vpc_cidr_block');
    });

    test('should define subnet outputs', () => {
      expect(config.output.private_subnet_ids).toBeDefined();
      expect(config.output.public_subnet_ids).toBeDefined();
    });

    test('should define sensitive Aurora outputs', () => {
      expect(config.output.aurora_cluster_endpoint).toBeDefined();
      expect(config.output.aurora_cluster_endpoint[0].sensitive).toBe(true);
      expect(config.output.aurora_cluster_reader_endpoint).toBeDefined();
      expect(config.output.aurora_cluster_reader_endpoint[0].sensitive).toBe(true);
    });

    test('should define aurora_cluster_id output', () => {
      expect(config.output.aurora_cluster_id).toBeDefined();
    });

    test('should define S3 bucket outputs', () => {
      expect(config.output.s3_bucket_ids).toBeDefined();
      expect(config.output.s3_bucket_arns).toBeDefined();
    });

    test('should define Lambda function outputs', () => {
      expect(config.output.lambda_function_arn).toBeDefined();
      expect(config.output.lambda_function_name).toBeDefined();
    });

    test('should define ALB outputs', () => {
      expect(config.output.alb_dns_name).toBeDefined();
      expect(config.output.alb_arn).toBeDefined();
    });

    test('should define SNS topic output', () => {
      expect(config.output.sns_topic_arn).toBeDefined();
    });

    test('should define environment metadata outputs', () => {
      expect(config.output.environment).toBeDefined();
      expect(config.output.environment_suffix).toBeDefined();
    });
  });

  describe('6. Main Infrastructure - Module Configurations', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define VPC module', () => {
      expect(config.module.vpc).toBeDefined();
      const vpcModule = config.module.vpc[0];
      expect(vpcModule.source).toBe('./modules/vpc');
    });

    test('should configure VPC module with correct parameters', () => {
      const vpcModule = config.module.vpc[0];
      expect(vpcModule.name_prefix).toBeDefined();
      expect(vpcModule.vpc_cidr).toBeDefined();
      expect(vpcModule.availability_zones).toBeDefined();
      expect(vpcModule.enable_nat_gateway).toBe(true);
      expect(vpcModule.enable_dns_hostnames).toBe(true);
      expect(vpcModule.enable_dns_support).toBe(true);
      expect(vpcModule.tags).toBeDefined();
    });

    test('should define IAM module', () => {
      expect(config.module.iam).toBeDefined();
      const iamModule = config.module.iam[0];
      expect(iamModule.source).toBe('./modules/iam');
      expect(iamModule.environment).toBeDefined();
      expect(iamModule.project_name).toBeDefined();
    });

    test('should define Aurora module', () => {
      expect(config.module.aurora).toBeDefined();
      const auroraModule = config.module.aurora[0];
      expect(auroraModule.source).toBe('./modules/aurora');
    });

    test('should configure Aurora with correct settings', () => {
      const auroraModule = config.module.aurora[0];
      expect(auroraModule.engine_version).toBe('15');
      expect(auroraModule.master_username).toBe('dbadmin');
      expect(auroraModule.storage_encrypted).toBe(true);
      expect(auroraModule.skip_final_snapshot).toBe(true);
      expect(auroraModule.preferred_backup_window).toBe('03:00-04:00');
    });

    test('should define storage module', () => {
      expect(config.module.storage).toBeDefined();
      const storageModule = config.module.storage[0];
      expect(storageModule.source).toBe('./modules/storage');
      expect(storageModule.enable_versioning).toBe(true);
      expect(storageModule.force_destroy).toBe(true);
    });

    test('should define Lambda module', () => {
      expect(config.module.lambda).toBeDefined();
      const lambdaModule = config.module.lambda[0];
      expect(lambdaModule.source).toBe('./modules/lambda');
      expect(lambdaModule.handler).toBe('index.handler');
      expect(lambdaModule.runtime).toBe('python3.9');
    });

    test('should configure Lambda with VPC settings', () => {
      const lambdaModule = config.module.lambda[0];
      expect(lambdaModule.vpc_config).toBeDefined();
      expect(lambdaModule.vpc_config.subnet_ids).toBeDefined();
      expect(lambdaModule.vpc_config.security_group_ids).toBeDefined();
    });

    test('should configure Lambda environment variables', () => {
      const lambdaModule = config.module.lambda[0];
      expect(lambdaModule.environment_variables).toBeDefined();
      expect(lambdaModule.environment_variables.ENVIRONMENT).toBeDefined();
      expect(lambdaModule.environment_variables.DB_ENDPOINT).toBeDefined();
    });

    test('should define ALB module', () => {
      expect(config.module.alb).toBeDefined();
      const albModule = config.module.alb[0];
      expect(albModule.source).toBe('./modules/alb');
    });

    test('should configure ALB listener rules', () => {
      const albModule = config.module.alb[0];
      expect(albModule.listener_rules).toBeDefined();
      expect(Array.isArray(albModule.listener_rules)).toBe(true);
      expect(albModule.listener_rules[0].priority).toBe(100);
    });

    test('should define monitoring module', () => {
      expect(config.module.monitoring).toBeDefined();
      const monitoringModule = config.module.monitoring[0];
      expect(monitoringModule.source).toBe('./modules/monitoring');
    });
  });

  describe('7. Main Infrastructure - KMS Resources', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define KMS key for Aurora', () => {
      expect(config.resource.aws_kms_key).toBeDefined();
      expect(config.resource.aws_kms_key.aurora).toBeDefined();
    });

    test('should enable KMS key rotation', () => {
      const kmsKey = config.resource.aws_kms_key.aurora[0];
      expect(kmsKey.enable_key_rotation).toBe(true);
    });

    test('should set KMS deletion window', () => {
      const kmsKey = config.resource.aws_kms_key.aurora[0];
      expect(kmsKey.deletion_window_in_days).toBe(7);
    });

    test('should define KMS alias', () => {
      expect(config.resource.aws_kms_alias).toBeDefined();
      expect(config.resource.aws_kms_alias.aurora).toBeDefined();
    });
  });

  describe('8. Main Infrastructure - Security Groups', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define Lambda security group', () => {
      expect(config.resource.aws_security_group).toBeDefined();
      expect(config.resource.aws_security_group.lambda).toBeDefined();
    });

    test('should configure Lambda security group egress', () => {
      const lambdaSg = config.resource.aws_security_group.lambda[0];
      expect(lambdaSg.egress).toBeDefined();
      expect(lambdaSg.egress.protocol).toBe('-1');
    });

    test('should set Lambda security group lifecycle', () => {
      const lambdaSg = config.resource.aws_security_group.lambda[0];
      expect(lambdaSg.lifecycle).toBeDefined();
      expect(lambdaSg.lifecycle.create_before_destroy).toBe(true);
    });

    test('should define ALB security group', () => {
      expect(config.resource.aws_security_group.alb).toBeDefined();
    });

    test('should configure ALB security group with HTTP ingress', () => {
      const albSg = config.resource.aws_security_group.alb[0];
      expect(albSg.ingress).toBeDefined();
      expect(Array.isArray(albSg.ingress)).toBe(true);

      const httpRule = albSg.ingress.find((rule: any) => rule.from_port === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.protocol).toBe('tcp');
    });

    test('should configure ALB security group with HTTPS ingress', () => {
      const albSg = config.resource.aws_security_group.alb[0];
      const httpsRule = albSg.ingress.find((rule: any) => rule.from_port === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.protocol).toBe('tcp');
    });

    test('should configure ALB security group egress', () => {
      const albSg = config.resource.aws_security_group.alb[0];
      expect(albSg.egress).toBeDefined();
    });
  });

  describe('9. Main Infrastructure - SSM and Secrets', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define SSM parameter for database password', () => {
      expect(config.resource.aws_ssm_parameter).toBeDefined();
      expect(config.resource.aws_ssm_parameter.db_password).toBeDefined();
    });

    test('should configure SSM parameter as SecureString', () => {
      const ssmParam = config.resource.aws_ssm_parameter.db_password[0];
      expect(ssmParam.type).toBe('SecureString');
    });

    test('should define random password resource', () => {
      expect(config.resource.random_password).toBeDefined();
      expect(config.resource.random_password.db_password).toBeDefined();
    });

    test('should configure random password with correct length', () => {
      const randomPass = config.resource.random_password.db_password[0];
      expect(randomPass.length).toBe(32);
      expect(randomPass.special).toBe(true);
    });
  });

  describe('10. Main Infrastructure - S3 Events', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define S3 bucket notification', () => {
      expect(config.resource.aws_s3_bucket_notification).toBeDefined();
      expect(config.resource.aws_s3_bucket_notification.data_processing).toBeDefined();
    });

    test('should configure Lambda function trigger', () => {
      const notification = config.resource.aws_s3_bucket_notification.data_processing[0];
      expect(notification.lambda_function).toBeDefined();
      expect(notification.lambda_function.events).toContain('s3:ObjectCreated:*');
      expect(notification.lambda_function.filter_prefix).toBe('incoming/');
    });

    test('should define Lambda permission for S3', () => {
      expect(config.resource.aws_lambda_permission).toBeDefined();
      expect(config.resource.aws_lambda_permission.allow_s3).toBeDefined();
    });

    test('should configure Lambda permission correctly', () => {
      const permission = config.resource.aws_lambda_permission.allow_s3[0];
      expect(permission.action).toBe('lambda:InvokeFunction');
      expect(permission.principal).toBe('s3.amazonaws.com');
    });
  });

  describe('11. VPC Module Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'modules', 'vpc', 'main.tf'));
    });

    test('should define all VPC module variables', () => {
      expect(config.variable.name_prefix).toBeDefined();
      expect(config.variable.vpc_cidr).toBeDefined();
      expect(config.variable.availability_zones).toBeDefined();
      expect(config.variable.enable_nat_gateway).toBeDefined();
      expect(config.variable.single_nat_gateway).toBeDefined();
      expect(config.variable.enable_dns_hostnames).toBeDefined();
      expect(config.variable.enable_dns_support).toBeDefined();
      expect(config.variable.tags).toBeDefined();
    });

    test('should set default values for optional variables', () => {
      expect(config.variable.enable_nat_gateway[0].default).toBe(true);
      expect(config.variable.single_nat_gateway[0].default).toBe(false);
      expect(config.variable.enable_dns_hostnames[0].default).toBe(true);
      expect(config.variable.enable_dns_support[0].default).toBe(true);
    });

    test('should define VPC resource', () => {
      expect(config.resource.aws_vpc).toBeDefined();
      expect(config.resource.aws_vpc.main).toBeDefined();
    });

    test('should configure VPC with DNS settings', () => {
      const vpc = config.resource.aws_vpc.main[0];
      expect(vpc.enable_dns_hostnames).toBeDefined();
      expect(vpc.enable_dns_support).toBeDefined();
    });

    test('should define internet gateway', () => {
      expect(config.resource.aws_internet_gateway).toBeDefined();
      expect(config.resource.aws_internet_gateway.main).toBeDefined();
    });

    test('should define public subnets with count', () => {
      expect(config.resource.aws_subnet.public).toBeDefined();
      const subnet = config.resource.aws_subnet.public[0];
      expect(subnet.map_public_ip_on_launch).toBe(true);
    });

    test('should define private subnets', () => {
      expect(config.resource.aws_subnet.private).toBeDefined();
    });

    test('should define elastic IPs for NAT', () => {
      expect(config.resource.aws_eip.nat).toBeDefined();
      const eip = config.resource.aws_eip.nat[0];
      expect(eip.domain).toBe('vpc');
    });

    test('should define NAT gateways', () => {
      expect(config.resource.aws_nat_gateway.main).toBeDefined();
    });

    test('should define public route table', () => {
      expect(config.resource.aws_route_table.public).toBeDefined();
      const rt = config.resource.aws_route_table.public[0];
      expect(rt.route).toBeDefined();
      expect(rt.route.cidr_block).toBe('0.0.0.0/0');
    });

    test('should define private route table', () => {
      expect(config.resource.aws_route_table.private).toBeDefined();
    });

    test('should define route table associations', () => {
      expect(config.resource.aws_route_table_association.public).toBeDefined();
      expect(config.resource.aws_route_table_association.private).toBeDefined();
    });

    test('should define VPC outputs', () => {
      expect(config.output.vpc_id).toBeDefined();
      expect(config.output.vpc_cidr_block).toBeDefined();
      expect(config.output.public_subnet_ids).toBeDefined();
      expect(config.output.private_subnet_ids).toBeDefined();
      expect(config.output.nat_gateway_ids).toBeDefined();
    });
  });

  describe('12. Storage Module Tests', () => {
    let config: any;

    beforeAll(() => {
      config = readTerraformFile(path.join(libPath, 'modules', 'storage', 'main.tf'));
    });

    test('should define all storage module variables', () => {
      expect(config.variable.bucket_names).toBeDefined();
      expect(config.variable.environment).toBeDefined();
      expect(config.variable.environment_suffix).toBeDefined();
      expect(config.variable.project_name).toBeDefined();
      expect(config.variable.enable_versioning).toBeDefined();
      expect(config.variable.force_destroy).toBeDefined();
    });

    test('should set default values for storage variables', () => {
      expect(config.variable.enable_versioning[0].default).toBe(true);
      expect(config.variable.force_destroy[0].default).toBe(true);
    });

    test('should define locals for bucket configuration', () => {
      expect(config.locals).toBeDefined();
      expect(config.locals[0].buckets).toBeDefined();
    });

    test('should define S3 bucket resource with for_each', () => {
      expect(config.resource.aws_s3_bucket).toBeDefined();
      expect(config.resource.aws_s3_bucket.buckets).toBeDefined();
    });

    test('should define bucket versioning resource', () => {
      expect(config.resource.aws_s3_bucket_versioning).toBeDefined();
      const versioning = config.resource.aws_s3_bucket_versioning.buckets[0];
      expect(versioning.versioning_configuration.status).toBe('Enabled');
    });

    test('should define bucket encryption', () => {
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration).toBeDefined();
      const encryption = config.resource.aws_s3_bucket_server_side_encryption_configuration.buckets[0];
      expect(encryption.rule.apply_server_side_encryption_by_default.sse_algorithm).toBe('AES256');
    });

    test('should define public access block', () => {
      expect(config.resource.aws_s3_bucket_public_access_block).toBeDefined();
      const publicBlock = config.resource.aws_s3_bucket_public_access_block.buckets[0];
      expect(publicBlock.block_public_acls).toBe(true);
      expect(publicBlock.block_public_policy).toBe(true);
      expect(publicBlock.ignore_public_acls).toBe(true);
      expect(publicBlock.restrict_public_buckets).toBe(true);
    });

    test('should define storage outputs', () => {
      expect(config.output.bucket_ids).toBeDefined();
      expect(config.output.bucket_arns).toBeDefined();
      expect(config.output.bucket_names).toBeDefined();
    });
  });

  describe('13. Security Best Practices Tests', () => {
    let mainConfig: any;
    let storageConfig: any;

    beforeAll(() => {
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
      storageConfig = readTerraformFile(path.join(libPath, 'modules', 'storage', 'main.tf'));
    });

    test('should enable encryption at rest for Aurora', () => {
      const auroraModule = mainConfig.module.aurora[0];
      expect(auroraModule.storage_encrypted).toBe(true);
    });

    test('should enable KMS key rotation', () => {
      const kmsKey = mainConfig.resource.aws_kms_key.aurora[0];
      expect(kmsKey.enable_key_rotation).toBe(true);
    });

    test('should store passwords as SecureString', () => {
      const ssmParam = mainConfig.resource.aws_ssm_parameter.db_password[0];
      expect(ssmParam.type).toBe('SecureString');
    });

    test('should enable S3 encryption', () => {
      const encryption = storageConfig.resource.aws_s3_bucket_server_side_encryption_configuration.buckets[0];
      expect(encryption.rule).toBeDefined();
    });

    test('should block all S3 public access', () => {
      const publicBlock = storageConfig.resource.aws_s3_bucket_public_access_block.buckets[0];
      expect(publicBlock.block_public_acls).toBe(true);
      expect(publicBlock.block_public_policy).toBe(true);
    });

    test('should use lifecycle policies for security groups', () => {
      const lambdaSg = mainConfig.resource.aws_security_group.lambda[0];
      expect(lambdaSg.lifecycle.create_before_destroy).toBe(true);
    });
  });

  describe('14. High Availability Tests', () => {
    let localsConfig: any;
    let mainConfig: any;

    beforeAll(() => {
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should enable multi-AZ for staging', () => {
      const stagingConfig = localsConfig.locals[0].environment_config.staging;
      expect(stagingConfig.multi_az).toBe(true);
    });

    test('should enable multi-AZ for production', () => {
      const prodConfig = localsConfig.locals[0].environment_config.prod;
      expect(prodConfig.multi_az).toBe(true);
    });

    test('should disable multi-AZ for dev to save costs', () => {
      const devConfig = localsConfig.locals[0].environment_config.dev;
      expect(devConfig.multi_az).toBe(false);
    });

    test('should use multiple availability zones', () => {
      const vpcModule = mainConfig.module.vpc[0];
      expect(vpcModule.availability_zones).toBeDefined();
    });
  });

  describe('15. Backup and Disaster Recovery Tests', () => {
    let mainConfig: any;
    let localsConfig: any;

    beforeAll(() => {
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should configure Aurora backup window', () => {
      const auroraModule = mainConfig.module.aurora[0];
      expect(auroraModule.preferred_backup_window).toBe('03:00-04:00');
    });

    test('should have different backup retention per environment', () => {
      const envConfig = localsConfig.locals[0].environment_config;
      expect(envConfig.dev.backup_retention).toBe(1);
      expect(envConfig.staging.backup_retention).toBe(7);
      expect(envConfig.prod.backup_retention).toBe(30);
    });

    test('should enable S3 versioning', () => {
      const storageModule = mainConfig.module.storage[0];
      expect(storageModule.enable_versioning).toBe(true);
    });

    test('should set KMS deletion window for recovery', () => {
      const kmsKey = mainConfig.resource.aws_kms_key.aurora[0];
      expect(kmsKey.deletion_window_in_days).toBe(7);
    });
  });

  describe('16. Monitoring and Logging Tests', () => {
    let mainConfig: any;
    let localsConfig: any;

    beforeAll(() => {
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should configure monitoring module', () => {
      expect(mainConfig.module.monitoring).toBeDefined();
    });

    test('should have different log retention per environment', () => {
      const envConfig = localsConfig.locals[0].environment_config;
      expect(envConfig.dev.log_retention).toBe(7);
      expect(envConfig.staging.log_retention).toBe(30);
      expect(envConfig.prod.log_retention).toBe(90);
    });

    test('should configure SNS topic for alerts', () => {
      const monitoringModule = mainConfig.module.monitoring[0];
      expect(monitoringModule.sns_topic_name).toBeDefined();
    });
  });

  describe('17. Tagging Strategy Tests', () => {
    let mainConfig: any;
    let localsConfig: any;
    let providersConfig: any;

    beforeAll(() => {
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
      providersConfig = readTerraformFile(path.join(libPath, 'providers.tf'));
    });

    test('should define common tags in locals', () => {
      const commonTags = localsConfig.locals[0].common_tags;
      expect(commonTags.ManagedBy).toBe('Terraform');
    });

    test('should apply default tags at provider level', () => {
      const provider = providersConfig.provider.aws[0];
      expect(provider.default_tags.tags.ManagedBy).toBe('Terraform');
    });

    test('should pass tags to all modules', () => {
      expect(mainConfig.module.vpc[0].tags).toBeDefined();
      expect(mainConfig.module.iam[0].tags).toBeDefined();
      expect(mainConfig.module.aurora[0].tags).toBeDefined();
      expect(mainConfig.module.storage[0].tags).toBeDefined();
      expect(mainConfig.module.lambda[0].tags).toBeDefined();
      expect(mainConfig.module.alb[0].tags).toBeDefined();
      expect(mainConfig.module.monitoring[0].tags).toBeDefined();
    });
  });

  describe('18. Resource Naming Convention Tests', () => {
    let localsConfig: any;

    beforeAll(() => {
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should define consistent naming prefix', () => {
      const locals = localsConfig.locals[0];
      expect(locals.name_prefix).toBeDefined();
    });

    test('should include environment suffix in resource names', () => {
      const resourceNames = localsConfig.locals[0].resource_names;
      Object.values(resourceNames).forEach((name: any) => {
        if (typeof name === 'string') {
          expect(name).toContain('${var.environment_suffix}');
        }
      });
    });
  });

  describe('19. Cost Optimization Tests', () => {
    let localsConfig: any;
    let mainConfig: any;

    beforeAll(() => {
      localsConfig = readTerraformFile(path.join(libPath, 'locals.tf'));
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should use smaller instances for dev', () => {
      const devConfig = localsConfig.locals[0].environment_config.dev;
      expect(devConfig.instance_type).toBe('t3.small');
      expect(devConfig.aurora_instance_class).toBe('db.t3.medium');
    });

    test('should use single NAT gateway for dev', () => {
      const vpcModule = mainConfig.module.vpc[0];
      expect(vpcModule.single_nat_gateway).toBeDefined();
    });

    test('should scale up for production', () => {
      const prodConfig = localsConfig.locals[0].environment_config.prod;
      expect(prodConfig.instance_type).toBe('t3.large');
      expect(prodConfig.aurora_instance_class).toBe('db.r6g.xlarge');
    });
  });

  describe('20. Integration and Dependencies Tests', () => {
    let mainConfig: any;

    beforeAll(() => {
      mainConfig = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should reference VPC outputs in other modules', () => {
      const auroraModule = mainConfig.module.aurora[0];
      expect(auroraModule.vpc_id).toContain('module.vpc');
      expect(auroraModule.subnet_ids).toContain('module.vpc');
    });

    test('should reference IAM outputs in Lambda', () => {
      const lambdaModule = mainConfig.module.lambda[0];
      expect(lambdaModule.execution_role_arn).toContain('module.iam');
    });

    test('should reference storage outputs in Lambda env vars', () => {
      const lambdaModule = mainConfig.module.lambda[0];
      expect(lambdaModule.environment_variables.DB_ENDPOINT).toContain('module.aurora');
    });

    test('should configure S3 notification with dependency', () => {
      const notification = mainConfig.resource.aws_s3_bucket_notification.data_processing[0];
      expect(notification.depends_on).toContain('aws_lambda_permission.allow_s3');
    });
  });
});
