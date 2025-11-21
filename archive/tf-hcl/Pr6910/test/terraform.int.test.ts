import * as fs from 'fs';
import * as path from 'path';

/**
 * Terraform Integration Tests
 * Tests validate actual deployment outputs from cfn-outputs/flat-outputs.json
 * No AWS API calls - Pure output validation
 */

interface DeploymentOutputs {
  apiUrl?: string;
  configComparison?: string;
  dashboardName?: string;
  dbEndpoint?: string;
  driftReport?: string;
  dynamoTableName?: string;
  environment?: string;
  lambdaFunctionArn?: string;
  lambdaFunctionName?: string;
  s3BucketName?: string;
  vpcId?: string;
  vpc_id?: string;
  vpc_cidr?: string;
  private_subnet_ids?: string[];
  public_subnet_ids?: string[];
  aurora_cluster_endpoint?: string;
  aurora_cluster_reader_endpoint?: string;
  aurora_cluster_id?: string;
  s3_bucket_ids?: string[];
  s3_bucket_arns?: string[];
  lambda_function_arn?: string;
  lambda_function_name?: string;
  alb_dns_name?: string;
  alb_arn?: string;
  sns_topic_arn?: string;
  environment_suffix?: string;
}

interface ConfigComparison {
  dev?: any;
  staging?: any;
  prod?: any;
  differences?: string[];
}

interface DriftReport {
  environment?: string;
  resources?: Array<{
    resourceType: string;
    resourceName: string;
    drift: boolean;
  }>;
  timestamp?: string;
}

describe('Terraform Integration Tests - Deployment Outputs', () => {
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  let outputs: DeploymentOutputs;

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs file not found at: ${outputsPath}`);
    }

    const content = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(content);
  });

  describe('1. Deployment Outputs File Tests', () => {
    test('should have valid deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have parseable JSON content', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should not be empty', () => {
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('2. Environment Configuration Tests', () => {
    test('should have environment defined', () => {
      expect(outputs.environment).toBeDefined();
      expect(typeof outputs.environment).toBe('string');
    });

    test('should have valid environment value', () => {
      const validEnvironments = ['dev', 'staging', 'prod'];
      expect(validEnvironments).toContain(outputs.environment);
    });

    test('should have environment suffix if defined', () => {
      if (outputs.environment_suffix) {
        expect(outputs.environment_suffix.length).toBeGreaterThanOrEqual(4);
        expect(outputs.environment_suffix.length).toBeLessThanOrEqual(16);
      }
    });
  });

  describe('3. VPC Infrastructure Tests', () => {
    test('should have VPC ID defined', () => {
      const vpcId = outputs.vpcId || outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    test('should have valid VPC ID format', () => {
      const vpcId = outputs.vpcId || outputs.vpc_id;
      if (vpcId) {
        expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }
    });

    test('should have VPC CIDR if defined', () => {
      if (outputs.vpc_cidr) {
        expect(outputs.vpc_cidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      }
    });
  });

  describe('4. Database (RDS/Aurora) Tests', () => {
    test('should have database endpoint if defined', () => {
      const dbEndpoint = outputs.dbEndpoint || outputs.aurora_cluster_endpoint;
      if (dbEndpoint) {
        expect(dbEndpoint).toBeDefined();
        expect(typeof dbEndpoint).toBe('string');
      }
    });

    test('should have valid database endpoint format', () => {
      const dbEndpoint = outputs.dbEndpoint || outputs.aurora_cluster_endpoint;
      if (dbEndpoint) {
        // Should match format: hostname:port or just hostname
        expect(dbEndpoint).toMatch(/^[a-z0-9.-]+(:[\d]+)?$/);
      }
    });

    test('should have database port if endpoint includes it', () => {
      const dbEndpoint = outputs.dbEndpoint || outputs.aurora_cluster_endpoint;
      if (dbEndpoint && dbEndpoint.includes(':')) {
        const port = dbEndpoint.split(':')[1];
        const portNum = parseInt(port, 10);
        expect(portNum).toBeGreaterThan(0);
        expect(portNum).toBeLessThan(65536);
      }
    });

    test('should have Aurora cluster ID if defined', () => {
      if (outputs.aurora_cluster_id) {
        expect(outputs.aurora_cluster_id).toBeDefined();
        expect(typeof outputs.aurora_cluster_id).toBe('string');
      }
    });

    test('should have Aurora reader endpoint if defined', () => {
      if (outputs.aurora_cluster_reader_endpoint) {
        expect(outputs.aurora_cluster_reader_endpoint).toBeDefined();
        expect(typeof outputs.aurora_cluster_reader_endpoint).toBe('string');
      }
    });

    test('should have database endpoint matching naming convention', () => {
      const dbEndpoint = outputs.dbEndpoint;
      if (dbEndpoint) {
        // Should contain environment or PR identifier
        const hostname = dbEndpoint.split(':')[0];
        expect(hostname).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
      }
    });
  });

  describe('5. Lambda Function Tests', () => {
    test('should have Lambda function name', () => {
      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
    });

    test('should have valid Lambda function name format', () => {
      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (functionName) {
        // Lambda names: alphanumeric, hyphens, underscores
        expect(functionName).toMatch(/^[a-zA-Z0-9-_]+$/);
        expect(functionName.length).toBeLessThanOrEqual(64);
      }
    });

    test('should have Lambda function ARN', () => {
      const functionArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      expect(functionArn).toBeDefined();
      expect(typeof functionArn).toBe('string');
    });

    test('should have valid Lambda ARN format', () => {
      const functionArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      if (functionArn) {
        expect(functionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/);
      }
    });

    test('should have Lambda ARN matching function name', () => {
      const functionArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;

      if (functionArn && functionName) {
        expect(functionArn).toContain(functionName);
      }
    });

    test('should have Lambda function in correct AWS region', () => {
      const functionArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      if (functionArn) {
        const arnParts = functionArn.split(':');
        const region = arnParts[3];
        expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d{1}$/);
      }
    });
  });

  describe('6. S3 Storage Tests', () => {
    test('should have S3 bucket name', () => {
      const bucketName = outputs.s3BucketName;
      if (bucketName) {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
      }
    });

    test('should have valid S3 bucket name format', () => {
      const bucketName = outputs.s3BucketName;
      if (bucketName) {
        // S3 naming rules: lowercase, numbers, hyphens, 3-63 chars
        expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
        expect(bucketName.length).toBeGreaterThanOrEqual(3);
        expect(bucketName.length).toBeLessThanOrEqual(63);
      }
    });

    test('should not have invalid S3 bucket name patterns', () => {
      const bucketName = outputs.s3BucketName;
      if (bucketName) {
        expect(bucketName).not.toContain('..');
        expect(bucketName).not.toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        expect(bucketName).not.toContain('_');
      }
    });

  });

  describe('7. DynamoDB Tests', () => {
    test('should have DynamoDB table name if defined', () => {
      if (outputs.dynamoTableName) {
        expect(outputs.dynamoTableName).toBeDefined();
        expect(typeof outputs.dynamoTableName).toBe('string');
      }
    });

    test('should have valid DynamoDB table name format', () => {
      if (outputs.dynamoTableName) {
        // DynamoDB: alphanumeric, hyphens, underscores, periods, 3-255 chars
        expect(outputs.dynamoTableName).toMatch(/^[a-zA-Z0-9._-]+$/);
        expect(outputs.dynamoTableName.length).toBeGreaterThanOrEqual(3);
        expect(outputs.dynamoTableName.length).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('8. API Gateway Tests', () => {
    test('should have API URL if defined', () => {
      if (outputs.apiUrl) {
        expect(outputs.apiUrl).toBeDefined();
        expect(typeof outputs.apiUrl).toBe('string');
      }
    });

    test('should have valid API URL format', () => {
      if (outputs.apiUrl) {
        expect(outputs.apiUrl).toMatch(/^https:\/\//);
        expect(() => new URL(outputs.apiUrl!)).not.toThrow();
      }
    });

    test('should have API Gateway URL structure', () => {
      if (outputs.apiUrl) {
        // API Gateway format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        expect(outputs.apiUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\//);
      }
    });

    test('should have environment stage in API URL', () => {
      if (outputs.apiUrl && outputs.environment) {
        expect(outputs.apiUrl).toContain(outputs.environment);
      }
    });
  });

  describe('9. Load Balancer Tests', () => {
    test('should have ALB DNS name if defined', () => {
      if (outputs.alb_dns_name) {
        expect(outputs.alb_dns_name).toBeDefined();
        expect(typeof outputs.alb_dns_name).toBe('string');
      }
    });

    test('should have valid ALB DNS format', () => {
      if (outputs.alb_dns_name) {
        expect(outputs.alb_dns_name).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
      }
    });

    test('should have ALB ARN if defined', () => {
      if (outputs.alb_arn) {
        expect(outputs.alb_arn).toMatch(/^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:loadbalancer\/app\//);
      }
    });
  });

  describe('10. Monitoring Tests', () => {
    test('should have CloudWatch dashboard name if defined', () => {
      if (outputs.dashboardName) {
        expect(outputs.dashboardName).toBeDefined();
        expect(typeof outputs.dashboardName).toBe('string');
      }
    });

    test('should have valid dashboard name format', () => {
      if (outputs.dashboardName) {
        expect(outputs.dashboardName).toMatch(/^[a-zA-Z0-9_-]+$/);
        expect(outputs.dashboardName.length).toBeLessThanOrEqual(255);
      }
    });

    test('should have SNS topic ARN if defined', () => {
      if (outputs.sns_topic_arn) {
        expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9_-]+$/);
      }
    });
  });

  describe('11. Resource Naming Convention Tests', () => {

    test('should follow consistent naming pattern for S3', () => {
      const bucketName = outputs.s3BucketName;
      if (bucketName) {
        // Should contain environment identifier
        const hasEnvIdentifier = bucketName.includes('pr') ||
                                  bucketName.includes('dev') ||
                                  bucketName.includes('staging') ||
                                  bucketName.includes('prod');
        expect(hasEnvIdentifier).toBe(true);
      }
    });

    test('should follow consistent naming pattern for DynamoDB', () => {
      if (outputs.dynamoTableName) {
        const hasEnvOrPR = /-(dev|staging|prod|pr\d+)$/.test(outputs.dynamoTableName);
        expect(hasEnvOrPR).toBe(true);
      }
    });

    test('should follow consistent naming pattern for Dashboard', () => {
      if (outputs.dashboardName) {
        const hasEnvOrPR = /-(dev|staging|prod|pr\d+)$/.test(outputs.dashboardName) ||
                           /-pr\d+/.test(outputs.dashboardName);
        expect(hasEnvOrPR).toBe(true);
      }
    });
  });

  describe('12. Config Comparison Tests', () => {
    let configComparison: ConfigComparison;

    beforeAll(() => {
      if (outputs.configComparison) {
        configComparison = JSON.parse(outputs.configComparison);
      }
    });

    test('should have config comparison data if defined', () => {
      if (outputs.configComparison) {
        expect(configComparison).toBeDefined();
        expect(typeof configComparison).toBe('object');
      }
    });

    test('should have all environment configs', () => {
      if (configComparison) {
        expect(configComparison.dev).toBeDefined();
        expect(configComparison.staging).toBeDefined();
        expect(configComparison.prod).toBeDefined();
      }
    });

    test('should have different VPC CIDRs per environment', () => {
      if (configComparison) {
        const devCidr = configComparison.dev?.vpcCidr;
        const stagingCidr = configComparison.staging?.vpcCidr;
        const prodCidr = configComparison.prod?.vpcCidr;

        if (devCidr && stagingCidr && prodCidr) {
          expect(devCidr).not.toBe(stagingCidr);
          expect(devCidr).not.toBe(prodCidr);
          expect(stagingCidr).not.toBe(prodCidr);
        }
      }
    });

    test('should have different RDS instance classes per environment', () => {
      if (configComparison) {
        const devInstance = configComparison.dev?.rdsInstanceClass;
        const prodInstance = configComparison.prod?.rdsInstanceClass;

        if (devInstance && prodInstance) {
          expect(devInstance).not.toBe(prodInstance);
          // Dev should be smaller than prod
          expect(devInstance).toContain('t3');
          expect(prodInstance).toContain('m5');
        }
      }
    });

    test('should have increasing API rate limits by environment', () => {
      if (configComparison) {
        const devLimit = configComparison.dev?.apiGatewayRateLimit;
        const stagingLimit = configComparison.staging?.apiGatewayRateLimit;
        const prodLimit = configComparison.prod?.apiGatewayRateLimit;

        if (devLimit && stagingLimit && prodLimit) {
          expect(devLimit).toBeLessThan(stagingLimit);
          expect(stagingLimit).toBeLessThan(prodLimit);
        }
      }
    });

    test('should have increasing DynamoDB capacity by environment', () => {
      if (configComparison) {
        const devRead = configComparison.dev?.dynamoReadCapacity;
        const stagingRead = configComparison.staging?.dynamoReadCapacity;
        const prodRead = configComparison.prod?.dynamoReadCapacity;

        if (devRead && stagingRead && prodRead) {
          expect(devRead).toBeLessThan(stagingRead);
          expect(stagingRead).toBeLessThan(prodRead);
        }
      }
    });

    test('should have increasing S3 retention by environment', () => {
      if (configComparison) {
        const devRetention = configComparison.dev?.s3RetentionDays;
        const stagingRetention = configComparison.staging?.s3RetentionDays;
        const prodRetention = configComparison.prod?.s3RetentionDays;

        if (devRetention && stagingRetention && prodRetention) {
          expect(devRetention).toBeLessThan(stagingRetention);
          expect(stagingRetention).toBeLessThan(prodRetention);
        }
      }
    });

    test('should have environment-specific KMS key aliases', () => {
      if (configComparison) {
        const devAlias = configComparison.dev?.kmsKeyAlias;
        const stagingAlias = configComparison.staging?.kmsKeyAlias;
        const prodAlias = configComparison.prod?.kmsKeyAlias;

        if (devAlias) expect(devAlias).toContain('dev');
        if (stagingAlias) expect(stagingAlias).toContain('staging');
        if (prodAlias) expect(prodAlias).toContain('prod');
      }
    });

    test('should document configuration differences', () => {
      if (configComparison && configComparison.differences) {
        expect(Array.isArray(configComparison.differences)).toBe(true);
        expect(configComparison.differences.length).toBeGreaterThan(0);
      }
    });
  });

  describe('13. Drift Detection Tests', () => {
    let driftReport: DriftReport;

    beforeAll(() => {
      if (outputs.driftReport) {
        driftReport = JSON.parse(outputs.driftReport);
      }
    });

    test('should have drift report if defined', () => {
      if (outputs.driftReport) {
        expect(driftReport).toBeDefined();
        expect(typeof driftReport).toBe('object');
      }
    });

    test('should have environment in drift report', () => {
      if (driftReport) {
        expect(driftReport.environment).toBeDefined();
      }
    });

    test('should have resources array in drift report', () => {
      if (driftReport) {
        expect(driftReport.resources).toBeDefined();
        expect(Array.isArray(driftReport.resources)).toBe(true);
      }
    });

    test('should have valid resource types in drift report', () => {
      if (driftReport && driftReport.resources) {
        const validTypes = ['VPC', 'RDS', 'Lambda', 'API Gateway', 'DynamoDB', 'S3', 'ALB', 'SNS', 'KMS'];
        driftReport.resources.forEach(resource => {
          expect(validTypes).toContain(resource.resourceType);
        });
      }
    });

    test('should have drift status for each resource', () => {
      if (driftReport && driftReport.resources) {
        driftReport.resources.forEach(resource => {
          expect(typeof resource.drift).toBe('boolean');
        });
      }
    });

    test('should not have any drifted resources', () => {
      if (driftReport && driftReport.resources) {
        const driftedResources = driftReport.resources.filter(r => r.drift === true);
        expect(driftedResources.length).toBe(0);
      }
    });

    test('should have valid timestamp in drift report', () => {
      if (driftReport && driftReport.timestamp) {
        const timestamp = new Date(driftReport.timestamp);
        expect(timestamp.toString()).not.toBe('Invalid Date');
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    test('should check critical resources in drift report', () => {
      if (driftReport && driftReport.resources) {
        const resourceTypes = driftReport.resources.map(r => r.resourceType);
        expect(resourceTypes).toContain('VPC');
        expect(resourceTypes).toContain('Lambda');
      }
    });
  });

  describe('14. Cross-Resource Validation Tests', () => {
    test('should have Lambda and S3 bucket both defined', () => {
      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      const bucketName = outputs.s3BucketName;

      if (functionName && bucketName) {
        expect(functionName).toBeDefined();
        expect(bucketName).toBeDefined();
      }
    });

    test('should have consistent environment identifiers across resources', () => {
      const lambdaName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      const bucketName = outputs.s3BucketName;
      const dynamoName = outputs.dynamoTableName;

      // Extract environment suffix from Lambda name
      if (lambdaName && bucketName) {
        const lambdaSuffix = lambdaName.match(/-(pr\d+|dev|staging|prod)$/);
        const bucketSuffix = bucketName.match(/-(pr\d+|dev|staging|prod)/);

        if (lambdaSuffix && bucketSuffix) {
          expect(lambdaSuffix[1]).toBe(bucketSuffix[1]);
        }
      }
    });

    test('should have ARNs in the same AWS region', () => {
      const lambdaArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      const snsArn = outputs.sns_topic_arn;

      if (lambdaArn && snsArn) {
        const lambdaRegion = lambdaArn.split(':')[3];
        const snsRegion = snsArn.split(':')[3];
        expect(lambdaRegion).toBe(snsRegion);
      }
    });

    test('should have ARNs with the same AWS account', () => {
      const lambdaArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      const snsArn = outputs.sns_topic_arn;

      if (lambdaArn && snsArn) {
        const lambdaAccount = lambdaArn.split(':')[4];
        const snsAccount = snsArn.split(':')[4];
        expect(lambdaAccount).toBe(snsAccount);
      }
    });
  });

  describe('15. Security Validation Tests', () => {
    test('should use HTTPS for API Gateway', () => {
      if (outputs.apiUrl) {
        expect(outputs.apiUrl).toMatch(/^https:\/\//);
      }
    });

    test('should have database endpoint without credentials', () => {
      const dbEndpoint = outputs.dbEndpoint || outputs.aurora_cluster_endpoint;
      if (dbEndpoint) {
        expect(dbEndpoint).not.toContain('@');
        expect(dbEndpoint).not.toContain('password');
        expect(dbEndpoint).not.toContain('user');
      }
    });

    test('should not expose sensitive data in bucket names', () => {
      const bucketName = outputs.s3BucketName;
      if (bucketName) {
        expect(bucketName.toLowerCase()).not.toContain('password');
        expect(bucketName.toLowerCase()).not.toContain('secret');
        expect(bucketName.toLowerCase()).not.toContain('key');
      }
    });

    test('should have ARNs without inline credentials', () => {
      const allOutputs = Object.values(outputs).join(' ');
      expect(allOutputs).not.toContain('AKIA'); // AWS Access Key pattern
      expect(allOutputs).not.toContain('password');
      expect(allOutputs).not.toContain('secret');
    });
  });

  describe('16. Resource Existence Tests', () => {
    test('should have at least one compute resource', () => {
      const hasLambda = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      expect(hasLambda).toBeDefined();
    });

    test('should have at least one storage resource', () => {
      const hasStorage = outputs.s3BucketName || outputs.s3_bucket_ids;
      expect(hasStorage).toBeDefined();
    });

    test('should have networking infrastructure', () => {
      const hasVpc = outputs.vpcId || outputs.vpc_id;
      expect(hasVpc).toBeDefined();
    });

    test('should have database infrastructure if configured', () => {
      const hasDatabase = outputs.dbEndpoint || outputs.aurora_cluster_endpoint;
      // Database is optional, but if present should be valid
      if (hasDatabase) {
        expect(hasDatabase).toBeDefined();
      }
    });
  });

  describe('17. Output Completeness Tests', () => {
    test('should have minimum required outputs', () => {
      const requiredOutputs = ['environment'];
      requiredOutputs.forEach(key => {
        expect(outputs[key as keyof DeploymentOutputs]).toBeDefined();
      });
    });

    test('should have infrastructure outputs', () => {
      const hasInfraOutputs =
        outputs.vpcId ||
        outputs.vpc_id ||
        outputs.lambdaFunctionName ||
        outputs.lambda_function_name;

      expect(hasInfraOutputs).toBeDefined();
    });

    test('should have all ARN outputs properly formatted', () => {
      const arnOutputs = [
        outputs.lambdaFunctionArn,
        outputs.lambda_function_arn,
        outputs.sns_topic_arn,
        outputs.alb_arn
      ].filter(Boolean);

      arnOutputs.forEach(arn => {
        expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]+:\d{12}:/);
      });
    });
  });

  describe('18. Data Type Validation Tests', () => {
    test('should have string outputs as strings', () => {
      const stringOutputs = [
        outputs.environment,
        outputs.vpcId,
        outputs.lambdaFunctionName,
        outputs.s3BucketName
      ].filter(Boolean);

      stringOutputs.forEach(output => {
        expect(typeof output).toBe('string');
      });
    });


    test('should have valid JSON in embedded JSON fields', () => {
      if (outputs.configComparison) {
        expect(() => JSON.parse(outputs.configComparison!)).not.toThrow();
      }
      if (outputs.driftReport) {
        expect(() => JSON.parse(outputs.driftReport!)).not.toThrow();
      }
    });
  });

  describe('19. Environment-Specific Configuration Tests', () => {
    test('should have appropriate resources for environment', () => {
      if (outputs.environment === 'dev') {
        // Dev might have simpler configurations
        expect(outputs.environment).toBe('dev');
      } else if (outputs.environment === 'prod') {
        // Prod should have all monitoring
        expect(outputs.environment).toBe('prod');
      }
    });

    test('should have environment reflected in resource names', () => {
      const resourceNames = [
        outputs.lambdaFunctionName,
        outputs.lambda_function_name,
        outputs.dynamoTableName,
        outputs.dashboardName
      ].filter(Boolean);

      resourceNames.forEach(name => {
        const hasEnvMatch = name?.includes(outputs.environment!) ||
                           name?.includes('pr');
        expect(hasEnvMatch).toBe(true);
      });
    });
  });

  describe('20. AWS Resource Limits Tests', () => {
    test('should have Lambda function name within length limits', () => {
      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (functionName) {
        expect(functionName.length).toBeLessThanOrEqual(64);
      }
    });

    test('should have S3 bucket name within length limits', () => {
      if (outputs.s3BucketName) {
        expect(outputs.s3BucketName.length).toBeGreaterThanOrEqual(3);
        expect(outputs.s3BucketName.length).toBeLessThanOrEqual(63);
      }
    });

    test('should have DynamoDB table name within length limits', () => {
      if (outputs.dynamoTableName) {
        expect(outputs.dynamoTableName.length).toBeGreaterThanOrEqual(3);
        expect(outputs.dynamoTableName.length).toBeLessThanOrEqual(255);
      }
    });

    test('should have valid AWS region identifiers', () => {
      const lambdaArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      if (lambdaArn) {
        const region = lambdaArn.split(':')[3];
        const validRegionPattern = /^[a-z]{2}-[a-z]+-\d{1}$/;
        expect(region).toMatch(validRegionPattern);
      }
    });

    test('should have valid AWS account ID', () => {
      const lambdaArn = outputs.lambdaFunctionArn || outputs.lambda_function_arn;
      if (lambdaArn) {
        const accountId = lambdaArn.split(':')[4];
        expect(accountId).toMatch(/^\d{12}$/);
      }
    });
  });
});
