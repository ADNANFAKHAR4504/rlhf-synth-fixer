import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS cloud environment');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.LogRetentionDays).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cfn-secure-project');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
    });

    test('LogRetentionDays parameter should have correct properties', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.AllowedValues).toContain(30);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have MainVPC resource', () => {
      expect(template.Resources.MainVPC).toBeDefined();
      expect(template.Resources.MainVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('MainVPC should have correct properties', () => {
      const vpc = template.Resources.MainVPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
    });

    test('should have security group for API Gateway', () => {
      expect(template.Resources.APIGatewaySecurityGroup).toBeDefined();
      const sg = template.Resources.APIGatewaySecurityGroup.Properties;
      expect(sg.GroupDescription).toContain('API Gateway');
    });
  });

  describe('S3 Buckets', () => {
    test('should have ApplicationDataBucket with encryption', () => {
      expect(template.Resources.ApplicationDataBucket).toBeDefined();
      const bucket = template.Resources.ApplicationDataBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(
        bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('ApplicationDataBucket should block public access', () => {
      const bucket = template.Resources.ApplicationDataBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(
        true
      );
      expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('should have APIGatewayLogsBucket with encryption', () => {
      expect(template.Resources.APIGatewayLogsBucket).toBeDefined();
      const bucket = template.Resources.APIGatewayLogsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(
        bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have bucket policies for security', () => {
      expect(template.Resources.ApplicationDataBucketPolicy).toBeDefined();
      const policy =
        template.Resources.ApplicationDataBucketPolicy.Properties
          .PolicyDocument;
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Sid).toBe('DenyInsecureConnections');
      expect(policy.Statement[1].Sid).toBe('RestrictToVPCEndpoint');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      const endpoint = template.Resources.S3VPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Gateway');
    });

    test('should have API Gateway VPC Endpoint', () => {
      expect(template.Resources.APIGatewayVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.APIGatewayVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have all required log groups', () => {
      expect(template.Resources.APIGatewayLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.WAFLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('log groups should have retention settings', () => {
      const logGroups = [
        'APIGatewayLogGroup',
        'S3AccessLogGroup',
        'WAFLogGroup',
        'LambdaLogGroup',
      ];
      logGroups.forEach(logGroup => {
        expect(
          template.Resources[logGroup].Properties.RetentionInDays
        ).toBeDefined();
        expect(
          template.Resources[logGroup].Properties.RetentionInDays.Ref
        ).toBe('LogRetentionDays');
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have APIGatewayCloudWatchRole', () => {
      expect(template.Resources.APIGatewayCloudWatchRole).toBeDefined();
      const role = template.Resources.APIGatewayCloudWatchRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe(
        'apigateway.amazonaws.com'
      );
    });

    test('should have LambdaExecutionRole with least privilege', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(role.Policies).toHaveLength(2);
    });

    test('LambdaExecutionRole should have S3 and CloudWatch policies', () => {
      const policies =
        template.Resources.LambdaExecutionRole.Properties.Policies;
      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      const cwPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(cwPolicy).toBeDefined();
    });
  });

  describe('AWS WAF', () => {
    test('should have WebACL resource', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('WebACL should have correct scope and rules', () => {
      const webAcl = template.Resources.WebACL.Properties;
      expect(webAcl.Scope).toBe('REGIONAL');
      expect(webAcl.Rules).toHaveLength(4);
    });

    test('WebACL should have SQL injection protection', () => {
      const webAcl = template.Resources.WebACL.Properties;
      const sqlRule = webAcl.Rules.find(
        (r: any) => r.Name === 'SQLInjectionRule'
      );
      expect(sqlRule).toBeDefined();
      expect(sqlRule.Statement.ManagedRuleGroupStatement.Name).toBe(
        'AWSManagedRulesSQLiRuleSet'
      );
    });

    test('WebACL should have XSS protection', () => {
      const webAcl = template.Resources.WebACL.Properties;
      const xssRule = webAcl.Rules.find((r: any) => r.Name === 'XSSRule');
      expect(xssRule).toBeDefined();
      expect(xssRule.Statement.ManagedRuleGroupStatement.Name).toBe(
        'AWSManagedRulesCommonRuleSet'
      );
    });

    test('WebACL should have rate limiting', () => {
      const webAcl = template.Resources.WebACL.Properties;
      const rateRule = webAcl.Rules.find(
        (r: any) => r.Name === 'RateLimitRule'
      );
      expect(rateRule).toBeDefined();
      expect(rateRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('should have WAF logging configuration', () => {
      expect(template.Resources.WAFLoggingConfiguration).toBeDefined();
      expect(template.Resources.WAFLoggingConfiguration.Type).toBe(
        'AWS::WAFv2::LoggingConfiguration'
      );
    });
  });

  describe('Lambda Functions', () => {
    test('should have SecureDataProcessorFunction', () => {
      expect(template.Resources.SecureDataProcessorFunction).toBeDefined();
      expect(template.Resources.SecureDataProcessorFunction.Type).toBe('AWS::Lambda::Function');
      
      const lambda = template.Resources.SecureDataProcessorFunction.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Handler).toBe('index.lambda_handler');
    });

    test('should have HealthCheckFunction', () => {
      expect(template.Resources.HealthCheckFunction).toBeDefined();
      expect(template.Resources.HealthCheckFunction.Type).toBe('AWS::Lambda::Function');
      
      const lambda = template.Resources.HealthCheckFunction.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Handler).toBe('index.lambda_handler');
    });

    test('Lambda functions should be in VPC', () => {
      const lambdas = ['SecureDataProcessorFunction', 'HealthCheckFunction'];
      lambdas.forEach(lambdaName => {
        const lambda = template.Resources[lambdaName].Properties;
        expect(lambda.VpcConfig).toBeDefined();
        expect(lambda.VpcConfig.SubnetIds).toBeDefined();
        expect(lambda.VpcConfig.SecurityGroupIds).toBeDefined();
      });
    });

    test('Lambda functions should have environment variables', () => {
      const lambdas = ['SecureDataProcessorFunction', 'HealthCheckFunction'];
      lambdas.forEach(lambdaName => {
        const lambda = template.Resources[lambdaName].Properties;
        expect(lambda.Environment.Variables.S3_BUCKET).toBeDefined();
        expect(lambda.Environment.Variables.LOG_LEVEL).toBe('INFO');
      });
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const sg = template.Resources.LambdaSecurityGroup.Properties;
      expect(sg.SecurityGroupEgress).toBeDefined();
      expect(sg.SecurityGroupEgress[0].FromPort).toBe(443);
      expect(sg.SecurityGroupEgress[0].ToPort).toBe(443);
    });

    test('should have Lambda invoke permissions', () => {
      expect(template.Resources.SecureProcessorInvokePermission).toBeDefined();
      expect(template.Resources.HealthCheckInvokePermission).toBeDefined();
      
      const permissions = ['SecureProcessorInvokePermission', 'HealthCheckInvokePermission'];
      permissions.forEach(permissionName => {
        const permission = template.Resources[permissionName].Properties;
        expect(permission.Action).toBe('lambda:InvokeFunction');
        expect(permission.Principal).toBe('apigateway.amazonaws.com');
      });
    });
  });

  describe('API Gateway', () => {
    test('should have RestAPI resource', () => {
      expect(template.Resources.RestAPI).toBeDefined();
      expect(template.Resources.RestAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('RestAPI should have REGIONAL endpoint', () => {
      const api = template.Resources.RestAPI.Properties;
      expect(api.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API resources and methods', () => {
      expect(template.Resources.APIResource).toBeDefined();
      expect(template.Resources.APIMethod).toBeDefined();
      expect(template.Resources.HealthResource).toBeDefined();
      expect(template.Resources.HealthMethod).toBeDefined();
    });

    test('API methods should use Lambda integration', () => {
      const apiMethod = template.Resources.APIMethod.Properties.Integration;
      expect(apiMethod.Type).toBe('AWS_PROXY');
      expect(apiMethod.IntegrationHttpMethod).toBe('POST');
      expect(apiMethod.Uri).toBeDefined();
      
      const healthMethod = template.Resources.HealthMethod.Properties.Integration;
      expect(healthMethod.Type).toBe('AWS_PROXY');
      expect(healthMethod.IntegrationHttpMethod).toBe('POST');
      expect(healthMethod.Uri).toBeDefined();
    });

    test('should have API deployment and stage', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIStage).toBeDefined();
    });

    test('API Stage should have CloudWatch logging enabled', () => {
      const stage = template.Resources.APIStage.Properties;
      expect(stage.AccessLogSetting).toBeDefined();
    });

    test('should have WAF association', () => {
      expect(template.Resources.WebACLAssociation).toBeDefined();
      expect(template.Resources.WebACLAssociation.Type).toBe(
        'AWS::WAFv2::WebACLAssociation'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PrivateSubnetIds',
        'PublicSubnetId',
        'APIGatewayURL',
        'APIGatewayId',
        'SecureEndpoint',
        'HealthEndpoint',
        'ApplicationDataBucketName',
        'APILogsBucketName',
        'WebACLId',
        'WebACLArn',
        'APIGatewayLogGroupName',
        'WAFLogGroupName',
        'SecurityGroupId',
        'S3VPCEndpointId',
        'APIGatewayVPCEndpointId',
        'LambdaExecutionRoleArn',
        'SecureProcessorFunctionArn',
        'HealthCheckFunctionArn',
        'LambdaSecurityGroupId',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('outputs should have export names with EnvironmentSuffix', () => {
      const exportsWithEnvSuffix = [
        'VPCId',
        'PrivateSubnetIds',
        'PublicSubnetId',
        'APIGatewayURL',
        'APIGatewayId',
        'ApplicationDataBucketName',
        'APILogsBucketName',
        'WebACLId',
        'WebACLArn',
        'APIGatewayLogGroupName',
        'WAFLogGroupName',
        'SecurityGroupId',
        'S3VPCEndpointId',
        'APIGatewayVPCEndpointId',
        'LambdaExecutionRoleArn',
        'SecureProcessorFunctionArn',
        'HealthCheckFunctionArn',
        'LambdaSecurityGroupId',
      ];

      exportsWithEnvSuffix.forEach(output => {
        const exportName = template.Outputs[output].Export?.Name;
        if (exportName) {
          expect(exportName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Requirements', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['ApplicationDataBucket', 'APIGatewayLogsBucket'];
      buckets.forEach(bucket => {
        const encryption =
          template.Resources[bucket].Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(
          encryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['ApplicationDataBucket', 'APIGatewayLogsBucket'];
      buckets.forEach(bucket => {
        const publicAccess =
          template.Resources[bucket].Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      const s3Policy = lambdaRole.Policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );

      // Check that S3 permissions are limited to specific bucket
      expect(
        s3Policy.PolicyDocument.Statement[0].Resource[0]['Fn::Sub']
      ).toContain('${ApplicationDataBucket.Arn}/*');

      // Check that actions are limited
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:GetObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:PutObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Action).not.toContain('s3:*');
    });

    test('WAF should protect against common exploits', () => {
      const webAcl = template.Resources.WebACL.Properties;
      const ruleNames = webAcl.Rules.map((r: any) => r.Name);

      expect(ruleNames).toContain('SQLInjectionRule');
      expect(ruleNames).toContain('XSSRule');
      expect(ruleNames).toContain('KnownBadInputsRule');
      expect(ruleNames).toContain('RateLimitRule');
    });

    test('API Gateway should have CloudWatch logging', () => {
      const stage = template.Resources.APIStage.Properties;
      expect(stage.AccessLogSetting).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentSuffix in names', () => {
      // Check bucket names
      expect(
        template.Resources.ApplicationDataBucket.Properties.BucketName[
          'Fn::Sub'
        ]
      ).toContain('${EnvironmentSuffix}');
      expect(
        template.Resources.APIGatewayLogsBucket.Properties.BucketName['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');

      // Check log group names
      expect(
        template.Resources.APIGatewayLogGroup.Properties.LogGroupName['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');
      expect(
        template.Resources.WAFLogGroup.Properties.LogGroupName['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');

      // Check WAF name
      expect(template.Resources.WebACL.Properties.Name['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );

      // Check API Gateway name
      expect(template.Resources.RestAPI.Properties.Name['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('all tags should include environment suffix in Name tag', () => {
      const resourcesWithTags = [
        'MainVPC',
        'PublicSubnet1',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'InternetGateway',
        'NatGatewayEIP',
        'NatGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'APIGatewaySecurityGroup',
        'ApplicationDataBucket',
        'APIGatewayLogsBucket',
        'APIGatewayCloudWatchRole',
        'LambdaExecutionRole',
        'WebACL',
        'RestAPI',
        'APIStage',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('all resources should be in us-east-1 region (implicit)', () => {
      // Since region is not explicitly set in most resources, they will use the deployment region
      // Check that S3 VPC endpoint uses region reference
      expect(
        template.Resources.S3VPCEndpoint.Properties.ServiceName['Fn::Sub']
      ).toContain('${AWS::Region}');
      expect(
        template.Resources.APIGatewayVPCEndpoint.Properties.ServiceName[
          'Fn::Sub'
        ]
      ).toContain('${AWS::Region}');
    });

    test('VPC should contain all networking components', () => {
      // Check that all subnets reference the MainVPC
      expect(template.Resources.PublicSubnet1.Properties.VpcId.Ref).toBe(
        'MainVPC'
      );
      expect(template.Resources.PrivateSubnet1.Properties.VpcId.Ref).toBe(
        'MainVPC'
      );
      expect(template.Resources.PrivateSubnet2.Properties.VpcId.Ref).toBe(
        'MainVPC'
      );

      // Check that route tables reference the MainVPC
      expect(template.Resources.PublicRouteTable.Properties.VpcId.Ref).toBe(
        'MainVPC'
      );
      expect(template.Resources.PrivateRouteTable.Properties.VpcId.Ref).toBe(
        'MainVPC'
      );

      // Check that security group references the MainVPC
      expect(
        template.Resources.APIGatewaySecurityGroup.Properties.VpcId.Ref
      ).toBe('MainVPC');
    });
  });
});
