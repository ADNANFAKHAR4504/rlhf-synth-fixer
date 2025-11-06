import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack SAM Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE TESTS
  // ===================================================================

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have SAM Transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure and scalable serverless infrastructure with SAM');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Globals).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ===================================================================
  // PARAMETERS TESTS
  // ===================================================================

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('secureserverlessapp');
      expect(template.Parameters.ProjectName.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have GitHubOwner parameter', () => {
      expect(template.Parameters.GitHubOwner).toBeDefined();
      expect(template.Parameters.GitHubOwner.Type).toBe('String');
    });

    test('should have GitHubRepo parameter', () => {
      expect(template.Parameters.GitHubRepo).toBeDefined();
      expect(template.Parameters.GitHubRepo.Type).toBe('String');
    });

    test('should have GitHubBranch parameter', () => {
      expect(template.Parameters.GitHubBranch).toBeDefined();
      expect(template.Parameters.GitHubBranch.Default).toBe('main');
    });

    test('should have CodeStarConnectionArn parameter', () => {
      expect(template.Parameters.CodeStarConnectionArn).toBeDefined();
      expect(template.Parameters.CodeStarConnectionArn.Type).toBe('String');
      expect(template.Parameters.CodeStarConnectionArn.Default).toBe('');
    });
  });

  // ===================================================================
  // CONDITIONS TESTS
  // ===================================================================

  describe('Conditions', () => {
    test('should have CreatePipeline condition', () => {
      expect(template.Conditions.CreatePipeline).toBeDefined();
      expect(template.Conditions.CreatePipeline).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'CodeStarConnectionArn' }, ''] }]
      });
    });
  });

  // ===================================================================
  // GLOBALS TESTS
  // ===================================================================

  describe('Globals Configuration', () => {
    test('should have Function globals', () => {
      expect(template.Globals.Function).toBeDefined();
    });

    test('should configure Lambda runtime to Python 3.9', () => {
      expect(template.Globals.Function.Runtime).toBe('python3.9');
    });

    test('should configure Lambda timeout to 15 seconds', () => {
      expect(template.Globals.Function.Timeout).toBe(15);
    });

    test('should configure Lambda memory to 512 MB', () => {
      expect(template.Globals.Function.MemorySize).toBe(512);
    });

    test('should enable X-Ray tracing', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });

    test('should configure environment variables', () => {
      expect(template.Globals.Function.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(template.Globals.Function.Environment.Variables.PROJECT_NAME).toEqual({ Ref: 'ProjectName' });
      expect(template.Globals.Function.Environment.Variables.TABLE_NAME).toEqual({ Ref: 'UserDataTable' });
    });

    test('should configure VPC settings', () => {
      expect(template.Globals.Function.VpcConfig).toBeDefined();
      expect(template.Globals.Function.VpcConfig.SecurityGroupIds).toEqual([{ Ref: 'LambdaSecurityGroup' }]);
      expect(template.Globals.Function.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should configure tags', () => {
      expect(template.Globals.Function.Tags.Environment).toEqual({ Ref: 'Environment' });
      expect(template.Globals.Function.Tags.ProjectName).toEqual({ Ref: 'ProjectName' });
    });
  });

  // ===================================================================
  // DYNAMODB TESTS
  // ===================================================================

  describe('DynamoDB Table - UserDataTable', () => {
    let table: any;

    beforeAll(() => {
      table = template.Resources.UserDataTable;
    });

    test('should be defined', () => {
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct table name', () => {
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-UserData'
      });
    });

    test('should use PROVISIONED billing mode', () => {
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
    });

    test('should have correct provisioned throughput', () => {
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
    });

    test('should have correct attribute definitions', () => {
      expect(table.Properties.AttributeDefinitions).toHaveLength(2);
      expect(table.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'userId',
        AttributeType: 'S'
      });
      expect(table.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N'
      });
    });

    test('should have correct key schema with hash and range keys', () => {
      expect(table.Properties.KeySchema).toHaveLength(2);
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'userId',
        KeyType: 'HASH'
      });
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('should have encryption enabled with KMS', () => {
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toBe('alias/aws/dynamodb');
    });

    test('should have point-in-time recovery enabled', () => {
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have streams enabled with NEW_AND_OLD_IMAGES', () => {
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have correct tags', () => {
      expect(table.Properties.Tags).toBeDefined();
      expect(table.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
      expect(table.Properties.Tags).toContainEqual({
        Key: 'ProjectName',
        Value: { Ref: 'ProjectName' }
      });
    });
  });

  // ===================================================================
  // DYNAMODB AUTO SCALING TESTS
  // ===================================================================

  describe('DynamoDB Auto Scaling', () => {
    test('should have auto scaling role', () => {
      const role = template.Resources.DynamoDBAutoScalingRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('application-autoscaling.amazonaws.com');
    });

    test('should have read capacity scalable target', () => {
      const target = template.Resources.UserTableReadCapacityScalableTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MinCapacity).toBe(5);
      expect(target.Properties.MaxCapacity).toBe(20);
      expect(target.Properties.ScalableDimension).toBe('dynamodb:table:ReadCapacityUnits');
    });

    test('should have read scaling policy', () => {
      const policy = template.Resources.UserTableReadScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
    });

    test('should have write capacity scalable target', () => {
      const target = template.Resources.UserTableWriteCapacityScalableTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MinCapacity).toBe(5);
      expect(target.Properties.MaxCapacity).toBe(20);
      expect(target.Properties.ScalableDimension).toBe('dynamodb:table:WriteCapacityUnits');
    });

    test('should have write scaling policy', () => {
      const policy = template.Resources.UserTableWriteScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
    });
  });

  // ===================================================================
  // SSM PARAMETERS TESTS
  // ===================================================================

  describe('SSM Parameters', () => {
    test('should have DatabaseEndpointParameter', () => {
      const param = template.Resources.DatabaseEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${ProjectName}/${Environment}/database/endpoint'
      });
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toEqual({ 'Fn::GetAtt': ['UserDataTable', 'Arn'] });
    });

    test('should have ApiKeyParameter', () => {
      const param = template.Resources.ApiKeyParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${ProjectName}/${Environment}/api/key'
      });
      expect(param.Properties.Type).toBe('String');
    });
  });

  // ===================================================================
  // IAM ROLE TESTS
  // ===================================================================

  describe('Lambda Execution Role', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.LambdaExecutionRole;
    });

    test('should be defined', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct trust policy for Lambda', () => {
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have required managed policies attached', () => {
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('should have DynamoDB access policy', () => {
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Scan');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:DeleteItem');
    });

    test('should have Parameter Store access policy', () => {
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ssm:GetParameter');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ssm:GetParameters');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ssm:GetParametersByPath');
    });

    test('should have CloudWatch Logs policy', () => {
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });
  });

  // ===================================================================
  // LAMBDA FUNCTIONS TESTS
  // ===================================================================

  describe('Lambda Functions', () => {
    describe('GetUserFunction', () => {
      let func: any;

      beforeAll(() => {
        func = template.Resources.GetUserFunction;
      });

      test('should be defined as SAM function', () => {
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Serverless::Function');
      });

      test('should have correct function name', () => {
        expect(func.Properties.FunctionName).toEqual({
          'Fn::Sub': '${ProjectName}-${Environment}-GetUser'
        });
      });

      test('should have inline code', () => {
        expect(func.Properties.InlineCode).toBeDefined();
        expect(func.Properties.InlineCode).toContain('def lambda_handler');
        expect(func.Properties.InlineCode).toContain('dynamodb');
      });

      test('should have correct handler', () => {
        expect(func.Properties.Handler).toBe('index.lambda_handler');
      });

      test('should reference Lambda execution role', () => {
        expect(func.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      });

      test('should have API Gateway event trigger', () => {
        expect(func.Properties.Events.GetUserApi).toBeDefined();
        expect(func.Properties.Events.GetUserApi.Type).toBe('Api');
        expect(func.Properties.Events.GetUserApi.Properties.Path).toBe('/users/{userId}');
        expect(func.Properties.Events.GetUserApi.Properties.Method).toBe('GET');
        expect(func.Properties.Events.GetUserApi.Properties.RestApiId).toEqual({ Ref: 'PublicApi' });
      });

      test('should have SSM parameter prefix in environment', () => {
        expect(func.Properties.Environment.Variables.SSM_PARAMETER_PREFIX).toEqual({
          'Fn::Sub': '/${ProjectName}/${Environment}'
        });
      });
    });

    describe('CreateUserFunction', () => {
      let func: any;

      beforeAll(() => {
        func = template.Resources.CreateUserFunction;
      });

      test('should be defined as SAM function', () => {
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Serverless::Function');
      });

      test('should have correct function name', () => {
        expect(func.Properties.FunctionName).toEqual({
          'Fn::Sub': '${ProjectName}-${Environment}-CreateUser'
        });
      });

      test('should have inline code with PUT operation', () => {
        expect(func.Properties.InlineCode).toBeDefined();
        expect(func.Properties.InlineCode).toContain('put_item');
      });

      test('should have API Gateway POST event trigger', () => {
        expect(func.Properties.Events.CreateUserApi).toBeDefined();
        expect(func.Properties.Events.CreateUserApi.Type).toBe('Api');
        expect(func.Properties.Events.CreateUserApi.Properties.Path).toBe('/users');
        expect(func.Properties.Events.CreateUserApi.Properties.Method).toBe('POST');
      });
    });

    describe('ProcessDataFunction', () => {
      let func: any;

      beforeAll(() => {
        func = template.Resources.ProcessDataFunction;
      });

      test('should be defined as SAM function', () => {
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Serverless::Function');
      });

      test('should have correct function name', () => {
        expect(func.Properties.FunctionName).toEqual({
          'Fn::Sub': '${ProjectName}-${Environment}-ProcessData'
        });
      });

      test('should be connected to Private API', () => {
        expect(func.Properties.Events.ProcessDataApi).toBeDefined();
        expect(func.Properties.Events.ProcessDataApi.Properties.RestApiId).toEqual({ Ref: 'PrivateApi' });
        expect(func.Properties.Events.ProcessDataApi.Properties.Path).toBe('/process');
        expect(func.Properties.Events.ProcessDataApi.Properties.Method).toBe('POST');
      });
    });
  });

  // ===================================================================
  // API GATEWAY TESTS
  // ===================================================================

  describe('API Gateway - Public API', () => {
    let api: any;

    beforeAll(() => {
      api = template.Resources.PublicApi;
    });

    test('should be defined as SAM API', () => {
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::Serverless::Api');
    });

    test('should have correct name', () => {
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-PublicAPI'
      });
    });

    test('should use Environment as stage name', () => {
      expect(api.Properties.StageName).toEqual({ Ref: 'Environment' });
    });

    test('should have tracing enabled', () => {
      expect(api.Properties.TracingEnabled).toBe(true);
    });

    test('should have access logging configured', () => {
      expect(api.Properties.AccessLogSetting).toBeDefined();
      expect(api.Properties.AccessLogSetting.DestinationArn).toEqual({ 'Fn::GetAtt': ['ApiLogGroup', 'Arn'] });
    });

    test('should have CORS configured', () => {
      expect(api.Properties.Cors).toBeDefined();
      expect(api.Properties.Cors.AllowMethods).toBe("'GET, POST, PUT, DELETE, OPTIONS'");
      expect(api.Properties.Cors.AllowOrigin).toBe("'*'");
    });

    test('should require API key', () => {
      expect(api.Properties.Auth.ApiKeyRequired).toBe(true);
    });

    test('should have method settings for logging and metrics', () => {
      expect(api.Properties.MethodSettings).toBeDefined();
      expect(api.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(api.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(api.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });
  });

  describe('API Gateway - Private API', () => {
    let api: any;

    beforeAll(() => {
      api = template.Resources.PrivateApi;
    });

    test('should be defined as SAM API', () => {
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::Serverless::Api');
    });

    test('should have PRIVATE endpoint type', () => {
      expect(api.Properties.EndpointConfiguration.Type).toBe('PRIVATE');
      expect(api.Properties.EndpointConfiguration.VPCEndpointIds).toEqual([{ Ref: 'VPCEndpoint' }]);
    });

    test('should have resource policy restricting access to VPC endpoint', () => {
      expect(api.Properties.Auth.ResourcePolicy).toBeDefined();
      expect(api.Properties.Auth.ResourcePolicy.CustomStatements[0].Condition.StringEquals).toEqual({
        'aws:SourceVpce': { Ref: 'VPCEndpoint' }
      });
    });
  });

  describe('API Gateway - API Key and Usage Plan', () => {
    test('should have API key defined', () => {
      const apiKey = template.Resources.PublicApiKey;
      expect(apiKey).toBeDefined();
      expect(apiKey.Type).toBe('AWS::ApiGateway::ApiKey');
      expect(apiKey.Properties.Enabled).toBe(true);
      expect(apiKey.DependsOn).toBe('PublicApiStage');
    });

    test('should have usage plan with throttling', () => {
      const usagePlan = template.Resources.PublicApiUsagePlan;
      expect(usagePlan).toBeDefined();
      expect(usagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      expect(usagePlan.Properties.Throttle.BurstLimit).toBe(100);
      expect(usagePlan.Properties.Throttle.RateLimit).toBe(50);
    });

    test('should have quota configured', () => {
      const usagePlan = template.Resources.PublicApiUsagePlan;
      expect(usagePlan.Properties.Quota.Limit).toBe(10000);
      expect(usagePlan.Properties.Quota.Period).toBe('DAY');
    });

    test('should link API key to usage plan', () => {
      const usagePlanKey = template.Resources.PublicApiUsagePlanKey;
      expect(usagePlanKey).toBeDefined();
      expect(usagePlanKey.Type).toBe('AWS::ApiGateway::UsagePlanKey');
      expect(usagePlanKey.Properties.KeyType).toBe('API_KEY');
    });
  });

  // ===================================================================
  // VPC RESOURCES TESTS
  // ===================================================================

  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PrivateSubnet1 in AZ1', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
    });

    test('should have PrivateSubnet2 in AZ2', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have private route table', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have subnet route table associations', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(assoc1).toBeDefined();
      expect(assoc2).toBeDefined();
      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have Lambda security group with HTTPS egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupEgress[0].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupEgress[0].ToPort).toBe(443);
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have VPC endpoint security group', () => {
      const sg = template.Resources.VPCEndpointSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('should have VPC endpoint for execute-api', () => {
      const endpoint = template.Resources.VPCEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.execute-api'
      });
    });
  });

  // ===================================================================
  // WAF TESTS
  // ===================================================================

  describe('AWS WAF', () => {
    let waf: any;

    beforeAll(() => {
      waf = template.Resources.WAFWebACL;
    });

    test('should have WAF Web ACL defined', () => {
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('should have REGIONAL scope', () => {
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('should have default allow action', () => {
      expect(waf.Properties.DefaultAction.Allow).toEqual({});
    });

    test('should have SQL injection rule', () => {
      const rule = waf.Properties.Rules.find((r: any) => r.Name === 'SQLInjectionRule');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(1);
      expect(rule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    test('should have XSS protection rule', () => {
      const rule = waf.Properties.Rules.find((r: any) => r.Name === 'XSSProtectionRule');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(2);
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
    });

    test('should have rate limiting rule', () => {
      const rule = waf.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(3);
      expect(rule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
      expect(rule.Action.Block).toEqual({});
    });

    test('should have core rule set', () => {
      const rule = waf.Properties.Rules.find((r: any) => r.Name === 'CoreRuleSet');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(4);
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
    });

    test('should have visibility config for all rules', () => {
      waf.Properties.Rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig).toBeDefined();
        expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
      });
    });

    test('should be associated with Public API', () => {
      const assoc = template.Resources.WAFAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(assoc.DependsOn).toBe('PublicApiStage');
      expect(assoc.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WAFWebACL', 'Arn'] });
    });
  });

  // ===================================================================
  // CLOUDWATCH TESTS
  // ===================================================================

  describe('CloudWatch Resources', () => {
    test('should have API log group', () => {
      const logGroup = template.Resources.ApiLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/apigateway/${ProjectName}-${Environment}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have API Gateway 4XX alarm', () => {
      const alarm = template.Resources.APIGateway4XXAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('should have DynamoDB throttle alarm', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  // ===================================================================
  // CI/CD PIPELINE TESTS
  // ===================================================================

  describe('CI/CD Pipeline Resources', () => {
    test('should have S3 artifact bucket with encryption', () => {
      const bucket = template.Resources.PipelineArtifactStore;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Condition).toBe('CreatePipeline');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle policy for artifacts', () => {
      const bucket = template.Resources.PipelineArtifactStore;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });

    test('should have CodeBuild project', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Condition).toBe('CreatePipeline');
      expect(project.Properties.Environment.Image).toBe('aws/codebuild/standard:5.0');
    });

    test('should have CodeBuild role with required permissions', () => {
      const role = template.Resources.CodeBuildRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('CreatePipeline');
    });

    test('should have CodePipeline with Source, Build, and Deploy stages', () => {
      const pipeline = template.Resources.DeploymentPipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Condition).toBe('CreatePipeline');
      expect(pipeline.Properties.Stages).toHaveLength(3);
      expect(pipeline.Properties.Stages[0].Name).toBe('Source');
      expect(pipeline.Properties.Stages[1].Name).toBe('Build');
      expect(pipeline.Properties.Stages[2].Name).toBe('Deploy');
    });

    test('should use CodeStar connection for GitHub', () => {
      const pipeline = template.Resources.DeploymentPipeline;
      const sourceAction = pipeline.Properties.Stages[0].Actions[0];
      expect(sourceAction.ActionTypeId.Provider).toBe('CodeStarSourceConnection');
      expect(sourceAction.Configuration.ConnectionArn).toEqual({ Ref: 'CodeStarConnectionArn' });
    });

    test('should have CloudFormation execution role', () => {
      const role = template.Resources.CloudFormationRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('CreatePipeline');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/PowerUserAccess');
    });
  });

  // ===================================================================
  // OUTPUTS TESTS
  // ===================================================================

  describe('Stack Outputs', () => {
    test('should have PublicApiUrl output', () => {
      const output = template.Outputs.PublicApiUrl;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL of the public API');
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-PublicApiUrl'
      });
    });

    test('should have PrivateApiUrl output', () => {
      const output = template.Outputs.PrivateApiUrl;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL of the private API');
    });

    test('should have UserDataTableName output', () => {
      const output = template.Outputs.UserDataTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'UserDataTable' });
    });

    test('should have Lambda function ARN outputs', () => {
      expect(template.Outputs.GetUserFunctionArn).toBeDefined();
      expect(template.Outputs.CreateUserFunctionArn).toBeDefined();
      expect(template.Outputs.ProcessDataFunctionArn).toBeDefined();
    });

    test('should have Lambda function name outputs', () => {
      expect(template.Outputs.GetUserFunctionName).toBeDefined();
      expect(template.Outputs.CreateUserFunctionName).toBeDefined();
      expect(template.Outputs.ProcessDataFunctionName).toBeDefined();
    });

    test('should have VPC resource outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.LambdaSecurityGroupId).toBeDefined();
      expect(template.Outputs.VPCEndpointId).toBeDefined();
    });

    test('should have WAF outputs', () => {
      expect(template.Outputs.WAFWebACLArn).toBeDefined();
      expect(template.Outputs.WAFWebACLId).toBeDefined();
    });

    test('should have SSM parameter outputs', () => {
      expect(template.Outputs.DatabaseEndpointParameterName).toBeDefined();
      expect(template.Outputs.ApiKeyParameterName).toBeDefined();
    });

    test('should have DynamoDB table outputs', () => {
      expect(template.Outputs.UserDataTableArn).toBeDefined();
      expect(template.Outputs.UserDataTableStreamArn).toBeDefined();
    });

    test('should have conditional pipeline outputs', () => {
      expect(template.Outputs.PipelineUrl).toBeDefined();
      expect(template.Outputs.PipelineUrl.Condition).toBe('CreatePipeline');
      expect(template.Outputs.PipelineArtifactStoreBucket).toBeDefined();
      expect(template.Outputs.PipelineArtifactStoreBucket.Condition).toBe('CreatePipeline');
    });

    test('should have stack metadata outputs', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.Region).toBeDefined();
    });

    test('all outputs should have exports with proper naming', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  // ===================================================================
  // RESOURCE DEPENDENCIES AND RELATIONSHIPS
  // ===================================================================

  describe('Resource Dependencies and Relationships', () => {
    test('Lambda functions should depend on execution role', () => {
      expect(template.Resources.GetUserFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      expect(template.Resources.CreateUserFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      expect(template.Resources.ProcessDataFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('Lambda execution role should have access to DynamoDB table', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toContainEqual({ 'Fn::GetAtt': ['UserDataTable', 'Arn'] });
    });

    test('Auto scaling targets should reference DynamoDB table', () => {
      const readTarget = template.Resources.UserTableReadCapacityScalableTarget;
      const writeTarget = template.Resources.UserTableWriteCapacityScalableTarget;
      expect(readTarget.Properties.ResourceId).toEqual({ 'Fn::Sub': 'table/${UserDataTable}' });
      expect(writeTarget.Properties.ResourceId).toEqual({ 'Fn::Sub': 'table/${UserDataTable}' });
    });

    test('Scaling policies should reference scalable targets', () => {
      const readPolicy = template.Resources.UserTableReadScalingPolicy;
      const writePolicy = template.Resources.UserTableWriteScalingPolicy;
      expect(readPolicy.Properties.ScalingTargetId).toEqual({ Ref: 'UserTableReadCapacityScalableTarget' });
      expect(writePolicy.Properties.ScalingTargetId).toEqual({ Ref: 'UserTableWriteCapacityScalableTarget' });
    });

    test('VPC endpoint should be in correct VPC and subnets', () => {
      const endpoint = template.Resources.VPCEndpoint;
      expect(endpoint.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(endpoint.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(endpoint.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Private API should reference VPC endpoint', () => {
      const api = template.Resources.PrivateApi;
      expect(api.Properties.EndpointConfiguration.VPCEndpointIds).toContainEqual({ Ref: 'VPCEndpoint' });
    });

    test('WAF association should reference both WAF and API', () => {
      const assoc = template.Resources.WAFAssociation;
      expect(assoc.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WAFWebACL', 'Arn'] });
      expect(assoc.Properties.ResourceArn['Fn::Sub']).toContain('${PublicApi}');
    });

    test('API key should have dependency on API stage', () => {
      const apiKey = template.Resources.PublicApiKey;
      expect(apiKey.DependsOn).toBe('PublicApiStage');
    });
  });

  // ===================================================================
  // TAGGING TESTS
  // ===================================================================

  describe('Resource Tagging', () => {
    test('DynamoDB table should have required tags', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
      expect(table.Properties.Tags).toContainEqual({
        Key: 'ProjectName',
        Value: { Ref: 'ProjectName' }
      });
    });

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(vpc.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('Lambda functions should inherit tags from Globals', () => {
      expect(template.Globals.Function.Tags).toBeDefined();
      expect(template.Globals.Function.Tags.Environment).toEqual({ Ref: 'Environment' });
      expect(template.Globals.Function.Tags.ProjectName).toEqual({ Ref: 'ProjectName' });
    });

    test('S3 bucket should have tags when created', () => {
      const bucket = template.Resources.PipelineArtifactStore;
      if (bucket) {
        expect(bucket.Properties.Tags).toBeDefined();
      }
    });
  });

  // ===================================================================
  // SECURITY CONFIGURATION TESTS
  // ===================================================================

  describe('Security Configuration', () => {
    test('DynamoDB should have encryption at rest', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.PipelineArtifactStore;
      if (bucket) {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      }
    });

    test('Lambda functions should be in VPC', () => {
      expect(template.Globals.Function.VpcConfig).toBeDefined();
      expect(template.Globals.Function.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
      expect(template.Globals.Function.VpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
    });

    test('API Gateway should have logging enabled', () => {
      const api = template.Resources.PublicApi;
      expect(api.Properties.AccessLogSetting).toBeDefined();
      expect(api.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
    });

    test('Lambda execution role should follow least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toContainEqual({ 'Fn::GetAtt': ['UserDataTable', 'Arn'] });
    });
  });
});
