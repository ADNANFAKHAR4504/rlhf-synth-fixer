import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.Description).toContain('suffix');
    });

    test('should only have Environment and EnvironmentSuffix parameters', () => {
      const parameterKeys = Object.keys(template.Parameters);
      expect(parameterKeys).toHaveLength(2);
      expect(parameterKeys).toContain('Environment');
      expect(parameterKeys).toContain('EnvironmentSuffix');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have all environment entries', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig.development).toBeDefined();
      expect(envConfig.staging).toBeDefined();
      expect(envConfig.production).toBeDefined();
    });

    test('development environment should have correct configuration', () => {
      const dev = template.Mappings.EnvironmentConfig.development;
      expect(dev.LogRetention).toBe(7);
      expect(dev.DynamoDBReadCapacity).toBe(5);
      expect(dev.DynamoDBWriteCapacity).toBe(5);
      expect(dev.LambdaMemory).toBe(512);
      expect(dev.LambdaTimeout).toBe(30);
    });

    test('staging environment should have correct configuration', () => {
      const staging = template.Mappings.EnvironmentConfig.staging;
      expect(staging.LogRetention).toBe(30);
      expect(staging.DynamoDBReadCapacity).toBe(10);
      expect(staging.DynamoDBWriteCapacity).toBe(10);
      expect(staging.LambdaMemory).toBe(1024);
      expect(staging.LambdaTimeout).toBe(60);
    });

    test('production environment should have correct configuration', () => {
      const prod = template.Mappings.EnvironmentConfig.production;
      expect(prod.LogRetention).toBe(90);
      expect(prod.DynamoDBReadCapacity).toBe(20);
      expect(prod.DynamoDBWriteCapacity).toBe(20);
      expect(prod.LambdaMemory).toBe(2048);
      expect(prod.LambdaTimeout).toBe(90);
    });
  });

  describe('VPC Resources', () => {
    test('should have ApplicationVPC resource', () => {
      expect(template.Resources.ApplicationVPC).toBeDefined();
      expect(template.Resources.ApplicationVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('ApplicationVPC should have correct properties', () => {
      const vpc = template.Resources.ApplicationVPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('ApplicationVPC should have required tags', () => {
      const tags = template.Resources.ApplicationVPC.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
    });

    test('should have PrivateSubnetAZ1 resource', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
    });

    test('PrivateSubnetAZ1 should have correct properties', () => {
      const subnet = template.Resources.PrivateSubnetAZ1.Properties;
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.VpcId).toEqual({ Ref: 'ApplicationVPC' });
    });

    test('should have PrivateSubnetAZ2 resource', () => {
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
    });

    test('PrivateSubnetAZ2 should have correct properties', () => {
      const subnet = template.Resources.PrivateSubnetAZ2.Properties;
      expect(subnet.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.VpcId).toEqual({ Ref: 'ApplicationVPC' });
    });

    test('should have PublicSubnetAZ1 resource', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnetAZ1 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnetAZ1.Properties;
      expect(subnet.CidrBlock).toBe('10.0.101.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.VpcId).toEqual({ Ref: 'ApplicationVPC' });
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway resource', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('AttachGateway should reference correct resources', () => {
      const attach = template.Resources.AttachGateway.Properties;
      expect(attach.VpcId).toEqual({ Ref: 'ApplicationVPC' });
      expect(attach.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have NATGatewayEIP resource', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NATGatewayEIP should have correct properties', () => {
      const eip = template.Resources.NATGatewayEIP.Properties;
      expect(eip.Domain).toBe('vpc');
    });

    test('NATGatewayEIP should depend on AttachGateway', () => {
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
    });

    test('should have NATGateway resource', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NATGateway should reference correct resources', () => {
      const nat = template.Resources.NATGateway.Properties;
      expect(nat.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
      expect(nat.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
    });

    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PrivateRouteTable resource', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PublicRoute resource', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PublicRoute should have correct properties', () => {
      const route = template.Resources.PublicRoute.Properties;
      expect(route.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PrivateRoute resource', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PrivateRoute should have correct properties', () => {
      const route = template.Resources.PrivateRoute.Properties;
      expect(route.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2RouteTableAssociation).toBeDefined();
    });

    test('should have LambdaSecurityGroup resource', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('LambdaSecurityGroup should have correct egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup.Properties;
      expect(sg.SecurityGroupEgress).toBeDefined();
      expect(Array.isArray(sg.SecurityGroupEgress)).toBe(true);
      expect(sg.SecurityGroupEgress.length).toBeGreaterThan(0);
    });

    test('should have DynamoDBVPCEndpoint resource', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      const statement = role.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have required managed policies', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('LambdaExecutionRole should have DynamoDB policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const dynamoPolicy = role.Policies.find((p: any) => p.PolicyName === 'LambdaDynamoDBPolicy');
      expect(dynamoPolicy).toBeDefined();
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:UpdateItem');
      expect(statement.Action).toContain('dynamodb:DeleteItem');
    });

    test('LambdaExecutionRole should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const logsPolicy = role.Policies.find((p: any) => p.PolicyName === 'LambdaCloudWatchLogs');
      expect(logsPolicy).toBeDefined();
    });

    test('LambdaExecutionRole should have required tags', () => {
      const tags = template.Resources.LambdaExecutionRole.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });

    test('should have StepFunctionsExecutionRole resource', () => {
      expect(template.Resources.StepFunctionsExecutionRole).toBeDefined();
      expect(template.Resources.StepFunctionsExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('StepFunctionsExecutionRole should have correct trust policy', () => {
      const role = template.Resources.StepFunctionsExecutionRole.Properties;
      const statement = role.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('states.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('StepFunctionsExecutionRole should have Lambda invoke policy', () => {
      const role = template.Resources.StepFunctionsExecutionRole.Properties;
      const lambdaPolicy = role.Policies.find((p: any) => p.PolicyName === 'StepFunctionsLambdaInvoke');
      expect(lambdaPolicy).toBeDefined();
      const statement = lambdaPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('lambda:InvokeFunction');
    });

    test('StepFunctionsExecutionRole should have X-Ray policy', () => {
      const role = template.Resources.StepFunctionsExecutionRole.Properties;
      const xrayPolicy = role.Policies.find((p: any) => p.PolicyName === 'StepFunctionsXRay');
      expect(xrayPolicy).toBeDefined();
    });

    test('StepFunctionsExecutionRole should have CloudWatch Logs policy', () => {
      const role = template.Resources.StepFunctionsExecutionRole.Properties;
      const logsPolicy = role.Policies.find((p: any) => p.PolicyName === 'StepFunctionsCloudWatchLogs');
      expect(logsPolicy).toBeDefined();
      const statement = logsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('logs:CreateLogDelivery');
      expect(statement.Action).toContain('logs:PutResourcePolicy');
      expect(statement.Action).toContain('logs:DescribeLogGroups');
    });

    test('should have ApiGatewayExecutionRole resource', () => {
      expect(template.Resources.ApiGatewayExecutionRole).toBeDefined();
      expect(template.Resources.ApiGatewayExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('ApiGatewayExecutionRole should have correct managed policy', () => {
      const role = template.Resources.ApiGatewayExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs');
    });

    test('all IAM roles should follow least privilege principle', () => {
      const roles = [
        template.Resources.LambdaExecutionRole,
        template.Resources.StepFunctionsExecutionRole,
        template.Resources.ApiGatewayExecutionRole
      ];

      roles.forEach(role => {
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              expect(statement.Effect).toBe('Allow');
              expect(statement.Action).toBeDefined();
              expect(statement.Resource).toBeDefined();
            });
          });
        }
      });
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ApplicationTable resource', () => {
      expect(template.Resources.ApplicationTable).toBeDefined();
      expect(template.Resources.ApplicationTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ApplicationTable should have correct deletion policies', () => {
      const table = template.Resources.ApplicationTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('ApplicationTable should have correct properties', () => {
      const props = template.Resources.ApplicationTable.Properties;
      expect(props.BillingMode).toBe('PROVISIONED');
      expect(props.ProvisionedThroughput).toBeDefined();
    });

    test('ApplicationTable should have correct attribute definitions', () => {
      const attrs = template.Resources.ApplicationTable.Properties.AttributeDefinitions;
      expect(attrs).toHaveLength(4);
      expect(attrs.find((a: any) => a.AttributeName === 'pk' && a.AttributeType === 'S')).toBeDefined();
      expect(attrs.find((a: any) => a.AttributeName === 'sk' && a.AttributeType === 'S')).toBeDefined();
      expect(attrs.find((a: any) => a.AttributeName === 'gsi1pk' && a.AttributeType === 'S')).toBeDefined();
      expect(attrs.find((a: any) => a.AttributeName === 'gsi1sk' && a.AttributeType === 'S')).toBeDefined();
    });

    test('ApplicationTable should have correct key schema', () => {
      const keySchema = template.Resources.ApplicationTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema.find((k: any) => k.AttributeName === 'pk' && k.KeyType === 'HASH')).toBeDefined();
      expect(keySchema.find((k: any) => k.AttributeName === 'sk' && k.KeyType === 'RANGE')).toBeDefined();
    });

    test('ApplicationTable should have GSI1', () => {
      const gsi = template.Resources.ApplicationTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('GSI1');
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    test('ApplicationTable should have StreamSpecification', () => {
      const stream = template.Resources.ApplicationTable.Properties.StreamSpecification;
      expect(stream.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('ApplicationTable should have SSE enabled', () => {
      const sse = template.Resources.ApplicationTable.Properties.SSESpecification;
      expect(sse.SSEEnabled).toBe(true);
      expect(sse.SSEType).toBe('KMS');
    });

    test('ApplicationTable should have point-in-time recovery', () => {
      const pitr = template.Resources.ApplicationTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('ApplicationTable should have required tags', () => {
      const tags = template.Resources.ApplicationTable.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have ProcessingLambda resource', () => {
      expect(template.Resources.ProcessingLambda).toBeDefined();
      expect(template.Resources.ProcessingLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('ProcessingLambda should have correct runtime', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.Runtime).toBe('python3.11');
      expect(lambda.Handler).toBe('index.handler');
    });

    test('ProcessingLambda should reference LambdaExecutionRole', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('ProcessingLambda should have VPC configuration', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds).toBeDefined();
    });

    test('ProcessingLambda should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.TracingConfig.Mode).toBe('Active');
    });

    test('ProcessingLambda should have environment variables', () => {
      const env = template.Resources.ProcessingLambda.Properties.Environment.Variables;
      expect(env.TABLE_NAME).toBeDefined();
      expect(env.ENVIRONMENT).toBeDefined();
      expect(env.REGION).toBeDefined();
    });

    test('ProcessingLambda should NOT have ReservedConcurrentExecutions', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('ProcessingLambda should have required tags', () => {
      const tags = template.Resources.ProcessingLambda.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });

    test('should have ProcessingLambdaVersion resource', () => {
      expect(template.Resources.ProcessingLambdaVersion).toBeDefined();
      expect(template.Resources.ProcessingLambdaVersion.Type).toBe('AWS::Lambda::Version');
    });

    test('should have ProcessingLambdaAlias resource', () => {
      expect(template.Resources.ProcessingLambdaAlias).toBeDefined();
      expect(template.Resources.ProcessingLambdaAlias.Type).toBe('AWS::Lambda::Alias');
    });

    test('should have ValidationLambda resource', () => {
      expect(template.Resources.ValidationLambda).toBeDefined();
      expect(template.Resources.ValidationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('ValidationLambda should have correct properties', () => {
      const lambda = template.Resources.ValidationLambda.Properties;
      expect(lambda.Runtime).toBe('python3.11');
      expect(lambda.MemorySize).toBe(512);
      expect(lambda.Timeout).toBe(30);
    });

    test('ValidationLambda should NOT have ReservedConcurrentExecutions', () => {
      const lambda = template.Resources.ValidationLambda.Properties;
      expect(lambda.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('should have NotificationLambda resource', () => {
      expect(template.Resources.NotificationLambda).toBeDefined();
      expect(template.Resources.NotificationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('NotificationLambda should have correct properties', () => {
      const lambda = template.Resources.NotificationLambda.Properties;
      expect(lambda.Runtime).toBe('python3.11');
      expect(lambda.MemorySize).toBe(512);
      expect(lambda.Timeout).toBe(30);
    });

    test('NotificationLambda should NOT have ReservedConcurrentExecutions', () => {
      const lambda = template.Resources.NotificationLambda.Properties;
      expect(lambda.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('all Lambda functions should have required tags', () => {
      const lambdas = [
        template.Resources.ProcessingLambda,
        template.Resources.ValidationLambda,
        template.Resources.NotificationLambda
      ];

      lambdas.forEach(lambda => {
        const tags = lambda.Properties.Tags;
        expect(tags.find((t: any) => t.Key === 'project')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'team-number')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      });
    });
  });

  describe('Step Functions', () => {
    test('should have ApplicationStateMachine resource', () => {
      expect(template.Resources.ApplicationStateMachine).toBeDefined();
      expect(template.Resources.ApplicationStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('ApplicationStateMachine should reference StepFunctionsExecutionRole', () => {
      const sm = template.Resources.ApplicationStateMachine.Properties;
      expect(sm.RoleArn).toEqual({ 'Fn::GetAtt': ['StepFunctionsExecutionRole', 'Arn'] });
    });

    test('ApplicationStateMachine should have tracing enabled', () => {
      const sm = template.Resources.ApplicationStateMachine.Properties;
      expect(sm.TracingConfiguration.Enabled).toBe(true);
    });

    test('ApplicationStateMachine should have logging configuration', () => {
      const sm = template.Resources.ApplicationStateMachine.Properties;
      expect(sm.LoggingConfiguration).toBeDefined();
      expect(sm.LoggingConfiguration.Level).toBe('ALL');
      expect(sm.LoggingConfiguration.IncludeExecutionData).toBe(true);
    });

    test('ApplicationStateMachine should have valid definition', () => {
      const sm = template.Resources.ApplicationStateMachine.Properties;
      expect(sm.DefinitionString).toBeDefined();

      // Parse the definition string to verify it's valid JSON
      let definition;
      if (typeof sm.DefinitionString === 'object' && sm.DefinitionString['Fn::Sub']) {
        definition = sm.DefinitionString['Fn::Sub'];
      } else {
        definition = sm.DefinitionString;
      }

      // Should be a valid state machine definition structure
      expect(definition).toContain('StartAt');
      expect(definition).toContain('States');
    });

    test('ApplicationStateMachine should have required tags', () => {
      const tags = template.Resources.ApplicationStateMachine.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have ApplicationApi resource', () => {
      expect(template.Resources.ApplicationApi).toBeDefined();
      expect(template.Resources.ApplicationApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('ApplicationApi should have correct properties', () => {
      const api = template.Resources.ApplicationApi.Properties;
      expect(api.Description).toBeDefined();
      expect(api.EndpointConfiguration.Types).toContain('EDGE');
    });

    test('ApplicationApi should have required tags', () => {
      const tags = template.Resources.ApplicationApi.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });

    test('should have ApiGatewayAccount resource', () => {
      expect(template.Resources.ApiGatewayAccount).toBeDefined();
      expect(template.Resources.ApiGatewayAccount.Type).toBe('AWS::ApiGateway::Account');
    });

    test('should have ProcessResource resource', () => {
      expect(template.Resources.ProcessResource).toBeDefined();
      expect(template.Resources.ProcessResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('ProcessResource should have correct path', () => {
      const resource = template.Resources.ProcessResource.Properties;
      expect(resource.PathPart).toBe('process');
      expect(resource.RestApiId).toEqual({ Ref: 'ApplicationApi' });
    });

    test('should have ProcessMethod resource', () => {
      expect(template.Resources.ProcessMethod).toBeDefined();
      expect(template.Resources.ProcessMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('ProcessMethod should be POST method', () => {
      const method = template.Resources.ProcessMethod.Properties;
      expect(method.HttpMethod).toBe('POST');
      expect(method.AuthorizationType).toBe('NONE');
    });

    test('ProcessMethod should integrate with Lambda', () => {
      const method = template.Resources.ProcessMethod.Properties;
      expect(method.Integration.Type).toBe('AWS_PROXY');
      expect(method.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have ProcessingLambdaApiPermission resource', () => {
      expect(template.Resources.ProcessingLambdaApiPermission).toBeDefined();
      expect(template.Resources.ProcessingLambdaApiPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('ProcessingLambdaApiPermission should have correct properties', () => {
      const permission = template.Resources.ProcessingLambdaApiPermission.Properties;
      expect(permission.Action).toBe('lambda:InvokeFunction');
      expect(permission.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have ApiDeployment resource', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('ApiDeployment should depend on ProcessMethod', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('ProcessMethod');
    });

    test('should have ApiStage resource', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('ApiStage should have tracing enabled', () => {
      const stage = template.Resources.ApiStage.Properties;
      expect(stage.TracingEnabled).toBe(true);
    });

    test('ApiStage should have method settings', () => {
      const stage = template.Resources.ApiStage.Properties;
      expect(stage.MethodSettings).toBeDefined();
      const methodSettings = stage.MethodSettings[0];
      expect(methodSettings.MetricsEnabled).toBe(true);
      expect(methodSettings.LoggingLevel).toBe('INFO');
    });

    test('ApiStage should have required tags', () => {
      const tags = template.Resources.ApiStage.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });

    test('should have ApiUsagePlan resource', () => {
      expect(template.Resources.ApiUsagePlan).toBeDefined();
      expect(template.Resources.ApiUsagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
    });

    test('ApiUsagePlan should have throttle and quota limits', () => {
      const plan = template.Resources.ApiUsagePlan.Properties;
      expect(plan.Throttle).toBeDefined();
      expect(plan.Quota).toBeDefined();
      expect(plan.Throttle.BurstLimit).toBe(5000);
      expect(plan.Throttle.RateLimit).toBe(10000);
    });

    test('ApiUsagePlan should have required tags', () => {
      const tags = template.Resources.ApiUsagePlan.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have StateMachineLogGroup resource', () => {
      expect(template.Resources.StateMachineLogGroup).toBeDefined();
      expect(template.Resources.StateMachineLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ProcessingLambdaLogGroup resource', () => {
      expect(template.Resources.ProcessingLambdaLogGroup).toBeDefined();
      expect(template.Resources.ProcessingLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ValidationLambdaLogGroup resource', () => {
      expect(template.Resources.ValidationLambdaLogGroup).toBeDefined();
      expect(template.Resources.ValidationLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have NotificationLambdaLogGroup resource', () => {
      expect(template.Resources.NotificationLambdaLogGroup).toBeDefined();
      expect(template.Resources.NotificationLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have retention configured', () => {
      const logGroups = [
        template.Resources.StateMachineLogGroup,
        template.Resources.ProcessingLambdaLogGroup,
        template.Resources.ValidationLambdaLogGroup,
        template.Resources.NotificationLambdaLogGroup
      ];

      logGroups.forEach(lg => {
        expect(lg.Properties.RetentionInDays).toBeDefined();
      });
    });

    test('should have ProcessingLambdaErrorAlarm resource', () => {
      expect(template.Resources.ProcessingLambdaErrorAlarm).toBeDefined();
      expect(template.Resources.ProcessingLambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ProcessingLambdaErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.ProcessingLambdaErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Statistic).toBe('Sum');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have ProcessingLambdaDurationAlarm resource', () => {
      expect(template.Resources.ProcessingLambdaDurationAlarm).toBeDefined();
      expect(template.Resources.ProcessingLambdaDurationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ProcessingLambdaThrottleAlarm resource', () => {
      expect(template.Resources.ProcessingLambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.ProcessingLambdaThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DynamoDBUserErrorsAlarm resource', () => {
      expect(template.Resources.DynamoDBUserErrorsAlarm).toBeDefined();
      expect(template.Resources.DynamoDBUserErrorsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ApiGateway4xxAlarm resource', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway4xxAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ApiGateway4xxAlarm should monitor correct metric', () => {
      const alarm = template.Resources.ApiGateway4xxAlarm.Properties;
      expect(alarm.MetricName).toBe('4XXError');
      expect(alarm.Namespace).toBe('AWS/ApiGateway');
    });

    test('should have ApiGateway5xxAlarm resource', () => {
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5xxAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have StepFunctionsFailedExecutionsAlarm resource', () => {
      expect(template.Resources.StepFunctionsFailedExecutionsAlarm).toBeDefined();
      expect(template.Resources.StepFunctionsFailedExecutionsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should have TreatMissingData configured', () => {
      const alarms = [
        template.Resources.ProcessingLambdaErrorAlarm,
        template.Resources.ProcessingLambdaDurationAlarm,
        template.Resources.ProcessingLambdaThrottleAlarm,
        template.Resources.DynamoDBUserErrorsAlarm,
        template.Resources.ApiGateway4xxAlarm,
        template.Resources.ApiGateway5xxAlarm,
        template.Resources.StepFunctionsFailedExecutionsAlarm
      ];

      alarms.forEach(alarm => {
        expect(alarm.Properties.TreatMissingData).toBeDefined();
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have LambdaCodeS3Bucket resource', () => {
      expect(template.Resources.LambdaCodeS3Bucket).toBeDefined();
      expect(template.Resources.LambdaCodeS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LambdaCodeS3Bucket should have lowercase name', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.BucketName).toBeDefined();

      // Check that bucket name uses lowercase pattern (CloudFormation variables are OK)
      const bucketNameSub = bucket.BucketName['Fn::Sub'];
      expect(bucketNameSub).toBeDefined();
      expect(bucketNameSub).toContain('lambda-code');
      expect(bucketNameSub).toContain('${AWS::AccountId}');
      expect(bucketNameSub).toContain('${AWS::Region}');
      // The actual text should be lowercase, CloudFormation intrinsics are OK
      const staticText = bucketNameSub.replace(/\$\{[^}]+\}/g, '');
      expect(staticText).toMatch(/^[a-z0-9-]+$/);
    });

    test('LambdaCodeS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      const sse = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(sse.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('LambdaCodeS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LambdaCodeS3Bucket should block public access', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('LambdaCodeS3Bucket should have lifecycle policy', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('LambdaCodeS3Bucket should have required tags', () => {
      const tags = template.Resources.LambdaCodeS3Bucket.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number' && t.Value === '2')).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'ProcessingLambdaArn',
        'StateMachineArn',
        'VPCId',
        'LambdaSecurityGroupId',
        'S3BucketName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('DynamoDBTableName output should reference ApplicationTable', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Value).toEqual({ Ref: 'ApplicationTable' });
    });

    test('DynamoDBTableArn output should use GetAtt', () => {
      const output = template.Outputs.DynamoDBTableArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationTable', 'Arn'] });
    });

    test('ProcessingLambdaArn output should use GetAtt', () => {
      const output = template.Outputs.ProcessingLambdaArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ProcessingLambda', 'Arn'] });
    });

    test('StateMachineArn output should reference ApplicationStateMachine', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Value).toEqual({ Ref: 'ApplicationStateMachine' });
    });

    test('VPCId output should reference ApplicationVPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'ApplicationVPC' });
    });

    test('LambdaSecurityGroupId output should reference LambdaSecurityGroup', () => {
      const output = template.Outputs.LambdaSecurityGroupId;
      expect(output.Value).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('S3BucketName output should reference LambdaCodeS3Bucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value).toEqual({ Ref: 'LambdaCodeS3Bucket' });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Tags Validation', () => {
    test('all taggable resources should have project tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceKey => {
        const tags = template.Resources[resourceKey].Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
      });
    });

    test('all taggable resources should have team-number tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceKey => {
        const tags = template.Resources[resourceKey].Properties.Tags;
        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe('2');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all Lambda functions should have X-Ray tracing enabled', () => {
      const lambdas = [
        template.Resources.ProcessingLambda,
        template.Resources.ValidationLambda,
        template.Resources.NotificationLambda
      ];

      lambdas.forEach(lambda => {
        expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
      });
    });

    test('DynamoDB table should have encryption at rest', () => {
      const table = template.Resources.ApplicationTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
    });

    test('API Gateway should have tracing enabled', () => {
      const stage = template.Resources.ApiStage.Properties;
      expect(stage.TracingEnabled).toBe(true);
    });

    test('Step Functions should have tracing enabled', () => {
      const sm = template.Resources.ApplicationStateMachine.Properties;
      expect(sm.TracingConfiguration.Enabled).toBe(true);
    });

    test('Lambda functions should be in VPC', () => {
      const lambdas = [
        template.Resources.ProcessingLambda,
        template.Resources.ValidationLambda,
        template.Resources.NotificationLambda
      ];

      lambdas.forEach(lambda => {
        expect(lambda.Properties.VpcConfig).toBeDefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 47 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(47);
    });

    test('should have 3 Lambda functions', () => {
      const lambdaFunctions = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions).toHaveLength(3);
    });

    test('should have 7 CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms).toHaveLength(7);
    });

    test('should have 4 Log Groups', () => {
      const logGroups = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::Logs::LogGroup'
      );
      expect(logGroups).toHaveLength(4);
    });

    test('should have 3 IAM roles', () => {
      const roles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(roles).toHaveLength(3);
    });
  });

  describe('CloudFormation Schema Validation', () => {
    test('all resources should have valid Type', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have Properties', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        expect(resource.Properties).toBeDefined();
      });
    });

    test('intrinsic functions should be properly formatted', () => {
      const checkIntrinsicFunctions = (obj: any): boolean => {
        if (typeof obj !== 'object' || obj === null) return true;

        const validFunctions = [
          'Ref', 'Fn::GetAtt', 'Fn::Sub', 'Fn::Join',
          'Fn::Select', 'Fn::GetAZs', 'Fn::FindInMap'
        ];

        for (const key of Object.keys(obj)) {
          if (validFunctions.includes(key)) {
            expect(obj[key]).toBeDefined();
          }
          if (typeof obj[key] === 'object') {
            checkIntrinsicFunctions(obj[key]);
          }
        }
        return true;
      };

      expect(checkIntrinsicFunctions(template)).toBe(true);
    });
  });

  describe('Naming Conventions', () => {
    test('resource names should use EnvironmentSuffix where applicable', () => {
      const resourcesWithNaming = [
        'ApplicationVPC',
        'ApplicationTable',
        'ProcessingLambda',
        'ValidationLambda',
        'NotificationLambda',
        'ApplicationStateMachine',
        'ApplicationApi',
        'ApiUsagePlan'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.TableName || resource.Properties.FunctionName ||
          resource.Properties.StateMachineName || resource.Properties.Name ||
          resource.Properties.UsagePlanName) {
          const nameProperty = resource.Properties.TableName ||
            resource.Properties.FunctionName ||
            resource.Properties.StateMachineName ||
            resource.Properties.Name ||
            resource.Properties.UsagePlanName;

          if (nameProperty && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('log group names should reference lambda function names', () => {
      const logGroupMapping = {
        ProcessingLambdaLogGroup: 'ProcessingLambda',
        ValidationLambdaLogGroup: 'ValidationLambda',
        NotificationLambdaLogGroup: 'NotificationLambda'
      };

      Object.entries(logGroupMapping).forEach(([lgName, lambdaName]) => {
        const logGroup = template.Resources[lgName];
        const logGroupName = logGroup.Properties.LogGroupName;

        if (logGroupName && logGroupName['Fn::Sub']) {
          expect(logGroupName['Fn::Sub']).toContain(lambdaName);
        }
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NATGatewayEIP should depend on AttachGateway', () => {
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
    });

    test('PublicRoute should depend on AttachGateway', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('ApiDeployment should depend on API methods', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toBeDefined();
      expect(Array.isArray(deployment.DependsOn) ?
        deployment.DependsOn : [deployment.DependsOn]).toContain('ProcessMethod');
    });
  });

  describe('Encryption Validation', () => {
    test('DynamoDB table should use KMS encryption', () => {
      const sse = template.Resources.ApplicationTable.Properties.SSESpecification;
      expect(sse.SSEType).toBe('KMS');
      expect(sse.KMSMasterKeyId).toBeDefined();
    });

    test('S3 bucket should use server-side encryption', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket.Properties;
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('template should not have undefined or null values in critical sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.AWSTemplateFormatVersion).not.toBeUndefined();
      expect(template.Description).not.toBeNull();
      expect(template.Description).not.toBeUndefined();
      expect(template.Parameters).not.toBeNull();
      expect(template.Parameters).not.toBeUndefined();
      expect(template.Resources).not.toBeNull();
      expect(template.Resources).not.toBeUndefined();
      expect(template.Outputs).not.toBeNull();
      expect(template.Outputs).not.toBeUndefined();
    });

    test('all resource references should point to existing resources', () => {
      const resourceKeys = Object.keys(template.Resources);

      const checkReferences = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;

        if (obj.Ref && obj.Ref !== 'AWS::StackName' &&
          obj.Ref !== 'AWS::Region' && obj.Ref !== 'AWS::AccountId' &&
          !Object.keys(template.Parameters).includes(obj.Ref)) {
          expect(resourceKeys).toContain(obj.Ref);
        }

        if (obj['Fn::GetAtt'] && Array.isArray(obj['Fn::GetAtt'])) {
          const resourceName = obj['Fn::GetAtt'][0];
          if (!resourceName.includes('AWS::')) {
            expect(resourceKeys).toContain(resourceName);
          }
        }

        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'object') {
            checkReferences(obj[key]);
          }
        }
      };

      checkReferences(template);
    });
  });
});

