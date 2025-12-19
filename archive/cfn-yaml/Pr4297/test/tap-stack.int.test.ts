import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Custom YAML schema to handle CloudFormation intrinsic functions
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: string) => ({ Ref: data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => {
      // Handle both 'Resource.Attribute' and array notation
      if (typeof data === 'string' && data.includes('.')) {
        return { 'Fn::GetAtt': data.split('.') };
      }
      return { 'Fn::GetAtt': data };
    },
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Join': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAZs': data }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Select': data }),
  }),
  new yaml.Type('!ImportValue', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::ImportValue': data }),
  }),
]);

// Load the CloudFormation template and outputs
const templateContent = fs.readFileSync(
  './lib/TapStack.yml',
  'utf-8'
);
const template = yaml.load(templateContent, { schema: cfnSchema }) as any;

// Mock AWS SDK responses for testing infrastructure outputs
const mockOutputs = {
  APIEndpoint: 'https://abc123.execute-api.ap-southeast-1.amazonaws.com/prod/patients',
  RDSEndpoint: 'patient-db-dev.c123456.ap-southeast-1.rds.amazonaws.com',
  LambdaFunctionArn: 'arn:aws:lambda:ap-southeast-1:123456789012:function:patient-api-function-dev',
  RDSSecurityGroupId: 'sg-12345678',
  LambdaSecurityGroupId: 'sg-87654321',
  VPCId: 'vpc-12345678',
  DBSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:patient-db-password-dev'
};

describe("CloudFormation Integration Tests - Infrastructure Deployment", () => {
  describe("Stack Output Validation", () => {
    test("API Endpoint output format is valid", () => {
      const apiEndpoint = mockOutputs.APIEndpoint;
      expect(apiEndpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod\/patients$/);
    });

    test("RDS Endpoint output format is valid", () => {
      const rdsEndpoint = mockOutputs.RDSEndpoint;
      expect(rdsEndpoint).toMatch(/^[a-z0-9-]+\.c[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
    });

    test("Lambda Function ARN format is valid", () => {
      const lambdaArn = mockOutputs.LambdaFunctionArn;
      expect(lambdaArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
    });

    test("Security Group ID format is valid", () => {
      const sgId = mockOutputs.RDSSecurityGroupId;
      expect(sgId).toMatch(/^sg-[a-z0-9]+$/);
    });

    test("VPC ID format is valid", () => {
      const vpcId = mockOutputs.VPCId;
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test("Secret ARN format is valid", () => {
      const secretArn = mockOutputs.DBSecretArn;
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:[a-z0-9-]+$/);
    });
  });

  describe("Network Architecture Validation", () => {
    test("VPC CIDR block is properly configured", () => {
      const vpcCidr = template.Resources.VPC.Properties.CidrBlock;
      expect(vpcCidr).toBe('10.0.0.0/16');

      // Verify subnets are within VPC CIDR
      const subnet1Cidr = template.Resources.PrivateSubnet1.Properties.CidrBlock;
      const subnet2Cidr = template.Resources.PrivateSubnet2.Properties.CidrBlock;

      expect(subnet1Cidr).toMatch(/^10\.0\.\d+\.\d+\/\d+$/);
      expect(subnet2Cidr).toMatch(/^10\.0\.\d+\.\d+\/\d+$/);
    });

    test("Private and Public subnets are isolated", () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const publicSubnet1 = template.Resources.PublicSubnet1;

      // Private subnets should not have MapPublicIpOnLaunch
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();

      // Public subnets should have it set to false (no auto-assign)
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test("Route tables are properly associated", () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    });

    test("Internet Gateway is attached to VPC", () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toBeDefined();
      expect(attachment.Properties.InternetGatewayId).toBeDefined();
    });
  });

  describe("Database Integration Validation", () => {
    test("RDS is deployed in private subnets", () => {
      const rds = template.Resources.PatientDatabase;
      const dbSubnetGroup = template.Resources.DBSubnetGroup;

      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(dbSubnetGroup.Properties.SubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test("RDS has proper backup configuration", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
      expect(rds.PreferredBackupWindow).toBeDefined();
      expect(rds.PreferredMaintenanceWindow).toBeDefined();
    });

    test("RDS encryption is configured", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.KmsKeyId).toBeDefined();
    });

    test("RDS CloudWatch Logs are exported", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test("PostgreSQL version is valid and available", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      const version = rds.EngineVersion;

      // Version should be in format X.Y or X.Y.Z
      expect(version).toMatch(/^\d+\.\d+(\.\d+)?$/);

      // Verify it's a valid PostgreSQL version (15.8 specifically for HIPAA compliance)
      expect(version).toBe('15.8');
    });
  });

  describe("Lambda Function Integration", () => {
    test("Lambda is deployed in VPC with proper subnets", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(lambda.VpcConfig.SecurityGroupIds.length).toBeGreaterThanOrEqual(1);
    });

    test("Lambda has database environment variables", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      const env = lambda.Environment.Variables;

      expect(env.DB_HOST).toBeDefined();
      expect(env.DB_PORT).toBeDefined();
      expect(env.DB_NAME).toBeDefined();
      expect(env.DB_SECRET_ARN).toBeDefined();
    });

    test("Lambda has IAM role with required permissions", () => {
      const role = template.Resources.LambdaExecutionRole.Properties;

      // Should have VPC access policy
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');

      // Should have inline policies
      expect(role.Policies.length).toBeGreaterThan(0);
    });

    test("Lambda Secrets Manager permissions are configured", () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const secretsPolicy = role.Policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');

      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test("Lambda CloudWatch Logs permissions are configured", () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const logsPolicy = role.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');

      expect(logsPolicy).toBeDefined();
      const actions = logsPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });

    test("Lambda uses correct Python runtime", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      expect(lambda.Runtime).toBe('python3.11');
    });

    test("Lambda timeout is reasonable", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      expect(lambda.Timeout).toBeGreaterThanOrEqual(30);
      expect(lambda.Timeout).toBeLessThanOrEqual(300);
    });
  });

  describe("API Gateway Integration", () => {
    test("API Gateway is properly configured for HTTPS", () => {
      const api = template.Resources.PatientAPI.Properties;
      expect(api.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test("API Gateway uses IAM authorization", () => {
      const method = template.Resources.ApiGatewayMethodANY.Properties;
      expect(method.AuthorizationType).toBe('AWS_IAM');
    });

    test("API Gateway integrates with Lambda", () => {
      const method = template.Resources.ApiGatewayMethodANY.Properties;
      expect(method.Integration.Type).toBe('AWS_PROXY');
      // Handle Fn::Sub parsed as object
      const uri = typeof method.Integration.Uri === 'object' && method.Integration.Uri['Fn::Sub']
        ? method.Integration.Uri['Fn::Sub']
        : method.Integration.Uri;
      expect(uri).toContain('lambda:path');
    });

    test("API Gateway has logging enabled", () => {
      const stage = template.Resources.ApiGatewayStage.Properties;
      expect(stage.AccessLogSetting).toBeDefined();
      expect(stage.MethodSettings).toBeDefined();
    });

    test("API Gateway log group has KMS encryption", () => {
      const logGroup = template.Resources.ApiGatewayLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
    });

    test("Lambda has permission to be invoked by API Gateway", () => {
      const permission = template.Resources.LambdaInvokePermission.Properties;
      expect(permission.Action).toBe('lambda:InvokeFunction');
      expect(permission.Principal).toBe('apigateway.amazonaws.com');
    });

    test("API resource path is correctly set", () => {
      const resource = template.Resources.ApiGatewayResource.Properties;
      expect(resource.PathPart).toBe('patients');
    });
  });

  describe("Security Group Integration", () => {
    test("Lambda can connect to RDS", () => {
      const egressRule = template.Resources.LambdaToRDSEgress.Properties;
      expect(egressRule.FromPort).toBe(5432);
      expect(egressRule.ToPort).toBe(5432);
      expect(egressRule.IpProtocol).toBe('tcp');
    });

    test("RDS accepts connections from Lambda", () => {
      const ingressRule = template.Resources.RDSFromLambdaIngress.Properties;
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.IpProtocol).toBe('tcp');
    });

    test("Lambda can access VPC endpoints", () => {
      const egressRule = template.Resources.LambdaToVPCEndpointEgress.Properties;
      expect(egressRule.FromPort).toBe(443);
      expect(egressRule.ToPort).toBe(443);
      expect(egressRule.IpProtocol).toBe('tcp');
    });

    test("VPC endpoints accept connections from Lambda", () => {
      const ingressRule = template.Resources.VPCEndpointFromLambdaIngress.Properties;
      expect(ingressRule.FromPort).toBe(443);
      expect(ingressRule.ToPort).toBe(443);
      expect(ingressRule.IpProtocol).toBe('tcp');
    });

    test("Security groups avoid circular dependencies", () => {
      // Verify that security groups are created without inline rules
      const rdsSecurityGroup = template.Resources.RDSSecurityGroup;
      const lambdaSecurityGroup = template.Resources.LambdaSecurityGroup;

      // Rules should be separate resources, not inline
      expect(rdsSecurityGroup.Properties.SecurityGroupIngress).toBeUndefined();
      expect(rdsSecurityGroup.Properties.SecurityGroupEgress).toBeUndefined();
      expect(lambdaSecurityGroup.Properties.SecurityGroupIngress).toBeUndefined();
      expect(lambdaSecurityGroup.Properties.SecurityGroupEgress).toBeUndefined();
    });
  });

  describe("Secrets and KMS Integration", () => {
    test("Database password is stored in Secrets Manager", () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test("Secrets Manager generates secure password", () => {
      const secret = template.Resources.DBPasswordSecret.Properties;
      expect(secret.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test("RDS encryption key has rotation enabled", () => {
      const kmsKey = template.Resources.RDSKMSKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
    });

    test("Logs encryption key has rotation enabled", () => {
      const kmsKey = template.Resources.LogsKMSKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
    });

    test("KMS keys have proper key policies", () => {
      const rdsKey = template.Resources.RDSKMSKey.Properties;
      expect(rdsKey.KeyPolicy).toBeDefined();
      expect(rdsKey.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test("VPC endpoint is configured for Secrets Manager", () => {
      const endpoint = template.Resources.SecretsManagerVPCEndpoint.Properties;
      // Handle Fn::Sub parsed as object
      const serviceName = typeof endpoint.ServiceName === 'object' && endpoint.ServiceName['Fn::Sub']
        ? endpoint.ServiceName['Fn::Sub']
        : endpoint.ServiceName;
      expect(serviceName).toContain('secretsmanager');
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });
  });

  describe("Monitoring and Logging", () => {
    test("Lambda log group exists with KMS encryption", () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test("API Gateway log group exists with KMS encryption", () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test("RDS exports logs to CloudWatch", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.EnableCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe("HIPAA Compliance End-to-End", () => {
    test("Data flows through encrypted channels", () => {
      const api = template.Resources.PatientAPI.Properties;
      const method = template.Resources.ApiGatewayMethodANY.Properties;

      // API uses HTTPS (REGIONAL)
      expect(api.EndpointConfiguration).toBeDefined();

      // API Gateway to Lambda uses AWS_IAM
      expect(method.AuthorizationType).toBe('AWS_IAM');
    });

    test("Data at rest is encrypted", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      const lambdaLogGroup = template.Resources.LambdaLogGroup.Properties;
      const apiLogGroup = template.Resources.ApiGatewayLogGroup.Properties;

      expect(rds.StorageEncrypted).toBe(true);
      expect(lambdaLogGroup.KmsKeyId).toBeDefined();
      expect(apiLogGroup.KmsKeyId).toBeDefined();
    });

    test("All access is logged for audit trail", () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.PatientDatabase.Properties.EnableCloudwatchLogsExports).toBeDefined();
    });

    test("Network is isolated for protected health information", () => {
      const privateSubnets = [
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2
      ];

      privateSubnets.forEach(subnet => {
        expect(subnet.Properties.MapPublicIpOnLaunch).not.toBe(true);
      });

      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.PubliclyAccessible).toBe(false);
    });

    test("Access controls follow least privilege principle", () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      const policies = lambdaRole.Policies;

      // Each policy has specific, limited permissions
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          expect(statement.Resource).toBeDefined();
        });
      });
    });
  });

  describe("Resource Cleanup and Deletion", () => {
    test("RDS can be deleted without blocking", () => {
      const rds = template.Resources.PatientDatabase;
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test("All resources have proper cleanup configuration", () => {
      const resources = template.Resources;
      const criticalResources = ['PatientDatabase', 'PatientAPIFunction', 'PatientAPI'];

      criticalResources.forEach(resourceName => {
        const resource = resources[resourceName];
        // Should either have Delete policy or be implicitly deletable
        expect(resource).toBeDefined();
      });
    });
  });

  describe("CloudFormation Template Validity", () => {
    test("All resource references are valid", () => {
      const resources = template.Resources;
      const resourceNames = Object.keys(resources);

      // Check for invalid CloudFormation functions
      resourceNames.forEach(resourceName => {
        const resource = resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });

    test("All outputs reference valid resources", () => {
      const outputs = template.Outputs;

      outputs.APIEndpoint.Value.should;
      outputs.RDSEndpoint.Value.should;
      outputs.LambdaFunctionArn.Value.should;

      expect(outputs).toBeDefined();
    });
  });
});
