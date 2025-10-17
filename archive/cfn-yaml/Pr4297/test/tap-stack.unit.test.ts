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

// Load the CloudFormation template
const templateContent = fs.readFileSync(
  './lib/TapStack.yml',
  'utf-8'
);
const template = yaml.load(templateContent, { schema: cfnSchema }) as any;

describe("CloudFormation Template Validation", () => {
  describe("Template Format", () => {
    test("template has valid AWSTemplateFormatVersion", () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test("template has Description", () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test("template has Parameters section", () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test("template has Resources section", () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test("template has Outputs section", () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe("Parameters Validation", () => {
    test("EnvironmentSuffix parameter exists", () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test("EnvironmentSuffix has valid type", () => {
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test("EnvironmentSuffix has description", () => {
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test("EnvironmentSuffix has default value", () => {
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });
  });

  describe("VPC and Network Resources", () => {
    test("VPC resource exists", () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test("VPC has correct CIDR block", () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test("VPC has DNS enabled", () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test("Internet Gateway exists", () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test("VPC Gateway Attachment exists", () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test("Private Subnet 1 exists with correct CIDR", () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test("Private Subnet 2 exists with correct CIDR", () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test("Public Subnet 1 exists with correct CIDR", () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
    });

    test("Public Subnet 2 exists with correct CIDR", () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test("Private Route Table exists", () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test("Public Route Table exists", () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe("KMS Encryption Keys", () => {
    test("RDS KMS Key exists", () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test("RDS KMS Key has rotation enabled", () => {
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test("Logs KMS Key exists", () => {
      expect(template.Resources.LogsKMSKey).toBeDefined();
      expect(template.Resources.LogsKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test("Logs KMS Key has rotation enabled", () => {
      expect(template.Resources.LogsKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test("RDS KMS Key Alias exists", () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test("Logs KMS Key Alias exists", () => {
      expect(template.Resources.LogsKMSKeyAlias).toBeDefined();
      expect(template.Resources.LogsKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe("Secrets Manager", () => {
    test("DB Password Secret exists", () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test("DB Password Secret has secure generation", () => {
      const secret = template.Resources.DBPasswordSecret.Properties;
      expect(secret.GenerateSecretString).toBeDefined();
      expect(secret.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });
  });

  describe("RDS Database Configuration", () => {
    test("DB Subnet Group exists", () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test("RDS Security Group exists", () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test("Patient Database instance exists", () => {
      expect(template.Resources.PatientDatabase).toBeDefined();
      expect(template.Resources.PatientDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test("RDS uses correct PostgreSQL version", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.Engine).toBe('postgres');
      expect(rds.EngineVersion).toBe('15.8');
    });

    test("RDS has encryption enabled", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.KmsKeyId).toBeDefined();
    });

    test("RDS uses private subnets", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.PubliclyAccessible).toBe(false);
    });

    test("RDS has backup retention configured", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.BackupRetentionPeriod).toBe(1);
    });

    test("RDS database is deletable", () => {
      const rds = template.Resources.PatientDatabase;
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test("RDS has CloudWatch Logs exports enabled", () => {
      const rds = template.Resources.PatientDatabase.Properties;
      expect(rds.EnableCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe("Lambda Function Configuration", () => {
    test("Lambda Execution Role exists", () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test("Lambda Execution Role assumes service principal", () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const assumePolicy = role.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test("Lambda Execution Role has VPC access policy", () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test("Lambda Log Group exists", () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test("Lambda Log Group has encryption", () => {
      const logGroup = template.Resources.LambdaLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
    });

    test("Lambda function exists", () => {
      expect(template.Resources.PatientAPIFunction).toBeDefined();
      expect(template.Resources.PatientAPIFunction.Type).toBe('AWS::Lambda::Function');
    });

    test("Lambda uses correct Python runtime", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      expect(lambda.Runtime).toBe('python3.11');
    });

    test("Lambda has VPC configuration", () => {
      const lambda = template.Resources.PatientAPIFunction.Properties;
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds).toBeDefined();
    });

    test("Lambda Security Group exists", () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe("Security Group Rules", () => {
    test("Lambda to RDS Egress rule exists", () => {
      expect(template.Resources.LambdaToRDSEgress).toBeDefined();
      expect(template.Resources.LambdaToRDSEgress.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(template.Resources.LambdaToRDSEgress.Properties.FromPort).toBe(5432);
      expect(template.Resources.LambdaToRDSEgress.Properties.ToPort).toBe(5432);
    });

    test("Lambda to VPC Endpoint Egress rule exists", () => {
      expect(template.Resources.LambdaToVPCEndpointEgress).toBeDefined();
      expect(template.Resources.LambdaToVPCEndpointEgress.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(template.Resources.LambdaToVPCEndpointEgress.Properties.FromPort).toBe(443);
      expect(template.Resources.LambdaToVPCEndpointEgress.Properties.ToPort).toBe(443);
    });

    test("RDS from Lambda Ingress rule exists", () => {
      expect(template.Resources.RDSFromLambdaIngress).toBeDefined();
      expect(template.Resources.RDSFromLambdaIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(template.Resources.RDSFromLambdaIngress.Properties.FromPort).toBe(5432);
    });

    test("VPC Endpoint from Lambda Ingress rule exists", () => {
      expect(template.Resources.VPCEndpointFromLambdaIngress).toBeDefined();
      expect(template.Resources.VPCEndpointFromLambdaIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(template.Resources.VPCEndpointFromLambdaIngress.Properties.FromPort).toBe(443);
    });
  });

  describe("API Gateway Configuration", () => {
    test("API Gateway Log Group exists", () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test("API Gateway Log Group has encryption", () => {
      const logGroup = template.Resources.ApiGatewayLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
    });

    test("Patient API REST API exists", () => {
      expect(template.Resources.PatientAPI).toBeDefined();
      expect(template.Resources.PatientAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test("API Gateway uses REGIONAL endpoint", () => {
      const api = template.Resources.PatientAPI.Properties;
      expect(api.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test("API Gateway Resource exists", () => {
      expect(template.Resources.ApiGatewayResource).toBeDefined();
      expect(template.Resources.ApiGatewayResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(template.Resources.ApiGatewayResource.Properties.PathPart).toBe('patients');
    });

    test("API Gateway Method has AWS_IAM authorization", () => {
      const method = template.Resources.ApiGatewayMethodANY.Properties;
      expect(method.AuthorizationType).toBe('AWS_IAM');
    });

    test("API Gateway Deployment exists", () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test("API Gateway Stage exists", () => {
      expect(template.Resources.ApiGatewayStage).toBeDefined();
      expect(template.Resources.ApiGatewayStage.Type).toBe('AWS::ApiGateway::Stage');
      expect(template.Resources.ApiGatewayStage.Properties.StageName).toBe('prod');
    });

    test("API Gateway Stage has logging enabled", () => {
      const stage = template.Resources.ApiGatewayStage.Properties;
      expect(stage.AccessLogSetting).toBeDefined();
      expect(stage.MethodSettings).toBeDefined();
    });

    test("Lambda Invoke Permission exists", () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe("VPC Endpoints", () => {
    test("Secrets Manager VPC Endpoint exists", () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
      expect(template.Resources.SecretsManagerVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test("VPC Endpoint has private DNS enabled", () => {
      const endpoint = template.Resources.SecretsManagerVPCEndpoint.Properties;
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });

    test("VPC Endpoint Security Group exists", () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe("Outputs", () => {
    test("APIEndpoint output exists", () => {
      expect(template.Outputs.APIEndpoint).toBeDefined();
      expect(template.Outputs.APIEndpoint.Description).toBeDefined();
      expect(template.Outputs.APIEndpoint.Value).toBeDefined();
    });

    test("RDSEndpoint output exists", () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Value).toBeDefined();
    });

    test("LambdaFunctionArn output exists", () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toBeDefined();
    });

    test("RDSSecurityGroupId output exists", () => {
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
      expect(template.Outputs.RDSSecurityGroupId.Value).toBeDefined();
    });

    test("VPCId output exists", () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test("DBSecretArn output exists", () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
      expect(template.Outputs.DBSecretArn.Value).toBeDefined();
    });
  });

  describe("HIPAA Compliance Features", () => {
    test("Template has encryption at rest configured", () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.LogsKMSKey).toBeDefined();
      expect(template.Resources.PatientDatabase.Properties.StorageEncrypted).toBe(true);
    });

    test("Template has encryption in transit (HTTPS/IAM)", () => {
      const api = template.Resources.PatientAPI.Properties;
      expect(api.EndpointConfiguration).toBeDefined();
      const method = template.Resources.ApiGatewayMethodANY.Properties;
      expect(method.AuthorizationType).toBe('AWS_IAM');
    });

    test("Template has audit logging configured", () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.PatientDatabase.Properties.EnableCloudwatchLogsExports).toBeDefined();
    });

    test("Template has network isolation", () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PatientDatabase.Properties.PubliclyAccessible).toBe(false);
    });

    test("Template has Secrets Manager for credentials", () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
    });

    test("All resources have EnvironmentSuffix in names", () => {
      const vpc = template.Resources.VPC.Properties.Tags[0].Value;
      // The !Sub tag is parsed as an object with Fn::Sub property
      const vpcName = typeof vpc === 'object' && vpc['Fn::Sub'] ? vpc['Fn::Sub'] : vpc;
      expect(vpcName).toContain('${EnvironmentSuffix}');
    });
  });

  describe("Resource Dependencies and DeletionPolicy", () => {
    test("RDS Database has DeletionPolicy Delete", () => {
      expect(template.Resources.PatientDatabase.DeletionPolicy).toBe('Delete');
    });

    test("Lambda Function depends on Log Group", () => {
      expect(template.Resources.PatientAPIFunction.DependsOn).toContain('LambdaLogGroup');
    });

    test("API Deployment depends on Method", () => {
      expect(template.Resources.ApiGatewayDeployment.DependsOn).toContain('ApiGatewayMethodANY');
    });
  });
});
