// test/tap-stack.unit.test.ts
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load the TapStack.yml template
const tplPath = path.resolve(__dirname, '..', 'lib', 'TapStack.yml');
const tpl = yaml.load(fs.readFileSync(tplPath, 'utf8'));

describe('TapStack.yml Structural and Property Validation (CFN Unit Tests)', () => {

  test('Template structure and required resources are present', () => {
    expect(tpl).toBeDefined();
    expect(tpl.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(tpl.Description).toContain('Fully self-contained CI/CD for ECS Fargate');

    const r = tpl.Resources || {};
    const required = [
      'VPC', 'InternetGateway', 'AttachGateway', 'LoadBalancer', 'ECSCluster', 'ECSService',
      'TaskDefinition', 'ArtifactBucket', 'EcrRepository', 'Pipeline', 'CodeBuildProject',
      'ALBSecurityGroup', 'ECSSecurityGroup', 'TargetGroup', 'ALBListener', 'ApplicationSecrets',
      'CloudTrail', 'ConfigConfigurationRecorder', 'ALBResponseTimeAlarm', 'ALBErrorRateAlarm',
      'EventBridgeRule', 'EventBridgeDeadLetterQueue', 'EventBridgeRole', 'WAFWebACL', 'WAFAssociation',
      'CloudWatchDashboard'
    ];
    required.forEach((name) => {
      expect(r[name]).toBeDefined();
    });
  });

  // --- Networking & Security Checks ---

  test('VPC has the correct 3 Public and 3 Private subnet count and configuration', () => {
    const r = tpl.Resources;
    const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
    const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];

    // Check count
    expect(publicSubnets.every(s => r[s])).toBe(true);
    expect(privateSubnets.every(s => r[s])).toBe(true);

    // Check public IP mapping for public subnets (Must be ENABLED)
    publicSubnets.forEach(s => {
      expect(r[s].Properties.MapPublicIpOnLaunch).toBe(true);
    });

    // Check private subnets don't have MapPublicIpOnLaunch (defaults to false)
    privateSubnets.forEach(s => {
      expect(r[s].Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    // Check NAT Gateway exists and is properly configured
    expect(r.NatGateway).toBeDefined();
    expect(r.EIP).toBeDefined();
    expect(r.PrivateRoute).toBeDefined();
    expect(r.PrivateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
  });

  test('ECSSecurityGroup ingress is restricted ONLY to the ALB Security Group (Critical)', () => {
    const svcIngress = tpl.Resources.ECSSecurityGroup.Properties.SecurityGroupIngress;

    // Should be exactly one ingress rule
    expect(svcIngress.length).toBe(1);
    const rule = svcIngress[0];

    // Source must be the ALB Security Group
    expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });

    // Port must be 80 (HTTP)
    expect(rule.FromPort).toBe(80);
    expect(rule.ToPort).toBe(80);
    expect(rule.IpProtocol).toBe('tcp');
  });

  test('ALBSecurityGroup allows public access on port 80 only', () => {
    const albIngress = tpl.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;

    // Should be exactly one ingress rule
    expect(albIngress.length).toBe(1);
    const rule = albIngress[0];

    // Should allow from anywhere (0.0.0.0/0) on port 80
    expect(rule.CidrIp).toBe('0.0.0.0/0');
    expect(rule.FromPort).toBe(80);
    expect(rule.ToPort).toBe(80);
    expect(rule.IpProtocol).toBe('tcp');
  });

  test('ECSService uses Private subnets and DISABLED public IP', () => {
    const svc = tpl.Resources.ECSService;
    const awsvpc = svc.Properties.NetworkConfiguration.AwsvpcConfiguration;

    expect(awsvpc.AssignPublicIp).toBe('DISABLED');

    // Checks that it uses the private subnets
    expect(awsvpc.Subnets).toEqual([
      { Ref: 'PrivateSubnet1' },
      { Ref: 'PrivateSubnet2' },
      { Ref: 'PrivateSubnet3' }
    ]);

    // Check security groups
    expect(awsvpc.SecurityGroups).toEqual([{ Ref: 'ECSSecurityGroup' }]);

    // Check dependency on ALBListener
    expect(svc.DependsOn).toBe('ALBListener');
  });

  test('ArtifactBucket blocks public access fully and has proper configuration', () => {
    const b = tpl.Resources.ArtifactBucket;
    const pab = b.Properties.PublicAccessBlockConfiguration;

    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);

    // Check versioning is enabled
    expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');

    // Check bucket policy exists for security
    expect(tpl.Resources.ArtifactBucketPolicy).toBeDefined();
  });

  // --- IAM and Role Checks ---

  test('TaskRole is properly configured for ECS tasks', () => {
    const taskRole = tpl.Resources.TaskRole;
    expect(taskRole.Type).toBe('AWS::IAM::Role');

    // Check assume role policy
    const assumeRolePolicy = taskRole.Properties.AssumeRolePolicyDocument;
    expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
    expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');

    // TaskRole now has Secrets Manager access policy
    expect(taskRole.Properties.Policies).toBeDefined();
    expect(taskRole.Properties.Policies[0].PolicyName).toBe('SecretsManagerAccess');
  });

  test('TaskExecutionRole has proper ECS task execution permissions', () => {
    const execRole = tpl.Resources.TaskExecutionRole;
    expect(execRole.Type).toBe('AWS::IAM::Role');

    // Check assume role policy
    const assumeRolePolicy = execRole.Properties.AssumeRolePolicyDocument;
    expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');

    // Check managed policy for ECS task execution
    expect(execRole.Properties.ManagedPolicyArns).toContain(
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
    );
  });

  test('CodePipeline IAM Role has PassRole for Task/Execution Roles with Service restriction', () => {
    const cpRole = tpl.Resources.CodePipelineRole;
    expect(cpRole.Type).toBe('AWS::IAM::Role');

    const statements = cpRole.Properties.Policies[0].PolicyDocument.Statement;
    const passRoleStmt = statements.find(s =>
      s.Action.includes('iam:PassRole') && s.Condition
    );

    expect(passRoleStmt).toBeDefined();

    // Must restrict which service the role is passed to
    expect(passRoleStmt.Condition.StringEquals['iam:PassedToService']).toBe('ecs-tasks.amazonaws.com');
  });

  // --- ECS and CI/CD Checks ---

  test('CodeBuild Project is properly configured for Docker operations', () => {
    const cb = tpl.Resources.CodeBuildProject;
    expect(cb.Properties.Environment.Type).toBe('LINUX_CONTAINER');
    expect(cb.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
    expect(cb.Properties.Environment.Image).toBe('aws/codebuild/standard:5.0');

    // Check environment variables
    const envVars = cb.Properties.Environment.EnvironmentVariables;
    expect(envVars.find(v => v.Name === 'ECR_REPO_NAME')).toBeDefined();
    expect(envVars.find(v => v.Name === 'CONTAINER_NAME' && v.Value === 'nginx')).toBeDefined();
  });

  test('ECR Repository has Image Scanning enabled on push', () => {
    const e = tpl.Resources.EcrRepository;
    expect(e.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
  });

  test('Auto Scaling policy uses ECSServiceAverageCPUUtilization as the metric', () => {
    const asp = tpl.Resources.ServiceScalingPolicy.Properties.TargetTrackingScalingPolicyConfiguration;
    expect(asp.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
    expect(asp.TargetValue).toBe(50);
    expect(asp.ScaleInCooldown).toBe(60);
    expect(asp.ScaleOutCooldown).toBe(60);
  });

  test('Auto Scaling target has correct capacity limits for 10k RPS', () => {
    const target = tpl.Resources.ServiceScalableTarget;
    expect(target.Properties.MinCapacity).toBe(2);
    expect(target.Properties.MaxCapacity).toBe(50);
    expect(target.Properties.ServiceNamespace).toBe('ecs');
    expect(target.Properties.ScalableDimension).toBe('ecs:service:DesiredCount');
  });

  test('Billing Alarm is correctly conditional to us-east-1', () => {
    const ba = tpl.Resources.BillingAlarm;
    expect(ba.Type).toBe('AWS::CloudWatch::Alarm');
    expect(ba.Condition).toBe('IsUSEast1');
    expect(ba.Properties.MetricName).toBe('EstimatedCharges');
    expect(ba.Properties.Namespace).toBe('AWS/Billing');
  });

  // --- Additional Resource Checks ---

  test('ECS LogGroup retention is 30 days', () => {
    const lg = tpl.Resources.LogGroup;
    expect(lg.Properties.RetentionInDays).toBe(30);
  });

  test('TargetGroup target type and matcher', () => {
    const tg = tpl.Resources.TargetGroup;
    expect(tg.Properties.TargetType).toBe('ip');
    expect(tg.Properties.Matcher.HttpCode).toBe('200-399');
    expect(tg.Properties.HealthCheckPath).toBe('/');
    expect(tg.Properties.HealthCheckIntervalSeconds).toBe(10);
  });

  test('TaskDefinition container configuration', () => {
    const td = tpl.Resources.TaskDefinition;
    const cd = td.Properties.ContainerDefinitions[0];

    expect(cd.Name).toBe('nginx');
    expect(cd.PortMappings[0].ContainerPort).toBe(80);
    expect(cd.PortMappings[0].Protocol).toBe('tcp');

    // Check log configuration
    expect(cd.LogConfiguration.LogDriver).toBe('awslogs');
    expect(cd.LogConfiguration.Options['awslogs-group']).toEqual({ Ref: 'LogGroup' });
  });

  test('Load Balancer configuration', () => {
    const lb = tpl.Resources.LoadBalancer;
    expect(lb.Properties.Scheme).toBe('internet-facing');
    expect(lb.Properties.Subnets).toHaveLength(3);
    expect(lb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
  });

  test('ALB Listener configuration', () => {
    const listener = tpl.Resources.ALBListener;
    expect(listener.Properties.Port).toBe(80);
    expect(listener.Properties.Protocol).toBe('HTTP');
    expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'LoadBalancer' });
    expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
  });

  test('Pipeline configuration', () => {
    const pipeline = tpl.Resources.Pipeline;
    expect(pipeline.Properties.Stages).toHaveLength(3);
    expect(pipeline.Properties.Stages[0].Name).toBe('Source');
    expect(pipeline.Properties.Stages[1].Name).toBe('Build');
    expect(pipeline.Properties.Stages[2].Name).toBe('Deploy');
  });

  test('Custom Resource for S3 seeding', () => {
    expect(tpl.Resources.SourceSeederLambda).toBeDefined();
    expect(tpl.Resources.SourceSeeder).toBeDefined();
    expect(tpl.Resources.LambdaExecutionRole).toBeDefined();
  });

  test('Outputs include critical deployment keys', () => {
    const outputs = tpl.Outputs || {};
    const requiredOutputs = [
      'VPCId', 'LoadBalancerDNS', 'ClusterName', 'ServiceName',
      'EcrRepositoryUri', 'PipelineName', 'AlertsTopicArn', 'TargetGroupArn'
    ];
    requiredOutputs.forEach(k => expect(outputs[k]).toBeDefined());
  });

  // --- Security Validation Tests ---

  test('S3 bucket policy denies insecure connections', () => {
    const bucketPolicy = tpl.Resources.ArtifactBucketPolicy;
    const statements = bucketPolicy.Properties.PolicyDocument.Statement;

    const denyInsecureStatement = statements.find(s => s.Sid === 'DenyInsecureConnections');
    expect(denyInsecureStatement).toBeDefined();
    expect(denyInsecureStatement.Effect).toBe('Deny');
    expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
  });

  test('CodeBuild role has minimal required permissions', () => {
    const cbRole = tpl.Resources.CodeBuildRole;
    const policies = cbRole.Properties.Policies[0].PolicyDocument.Statement;

    // Check ECR GetAuthorizationToken has account-level permissions (required by AWS)
    const ecrAuthStatement = policies.find(s =>
      s.Action && s.Action.includes && s.Action.includes('ecr:GetAuthorizationToken')
    );
    expect(ecrAuthStatement).toBeDefined();
    expect(ecrAuthStatement.Resource).toBe('*');

    // Check other ECR permissions are scoped to specific repository
    const ecrRepoStatement = policies.find(s =>
      s.Action && s.Action.some && s.Action.some(action =>
        action.includes('ecr:') && action !== 'ecr:GetAuthorizationToken'
      )
    );
    expect(ecrRepoStatement).toBeDefined();
    expect(ecrRepoStatement.Resource).toEqual({ 'Fn::GetAtt': ['EcrRepository', 'Arn'] });

    // Check S3 permissions are scoped to artifact bucket
    const s3Statement = policies.find(s => s.Action && s.Action.some && s.Action.some(action => action.includes('s3:')));
    expect(s3Statement).toBeDefined();
    expect(s3Statement.Resource).toContainEqual({ 'Fn::GetAtt': ['ArtifactBucket', 'Arn'] });
  });

  test('Lambda execution role has minimal permissions', () => {
    const lambdaRole = tpl.Resources.LambdaExecutionRole;
    const policies = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;

    // Check S3 permissions are scoped to specific object
    const s3Statement = policies.find(s => s.Action.includes('s3:PutObject'));
    expect(s3Statement).toBeDefined();
    expect(s3Statement.Resource).toEqual({ 'Fn::Sub': '${ArtifactBucket.Arn}/source/source.zip' });
  });

  // --- Networking Validation Tests ---

  test('VPC has proper DNS configuration', () => {
    const vpc = tpl.Resources.VPC;
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
  });

  test('Public subnets have proper route table associations', () => {
    const r = tpl.Resources;
    const publicSubnetAssociations = [
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'PublicSubnet3RouteTableAssociation'
    ];

    publicSubnetAssociations.forEach(assoc => {
      expect(r[assoc]).toBeDefined();
      expect(r[assoc].Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });
  });

  test('Private subnets have proper route table associations', () => {
    const r = tpl.Resources;
    const privateSubnetAssociations = [
      'PrivateSubnet1RouteTableAssociation',
      'PrivateSubnet2RouteTableAssociation',
      'PrivateSubnet3RouteTableAssociation'
    ];

    privateSubnetAssociations.forEach(assoc => {
      expect(r[assoc]).toBeDefined();
      expect(r[assoc].Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  test('Internet Gateway is properly attached to VPC', () => {
    const attachGateway = tpl.Resources.AttachGateway;
    expect(attachGateway.Properties.VpcId).toEqual({ Ref: 'VPC' });
    expect(attachGateway.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
  });

  // --- CI/CD Pipeline Validation Tests ---

  test('CodePipeline has proper source configuration', () => {
    const pipeline = tpl.Resources.Pipeline;
    const sourceStage = pipeline.Properties.Stages[0];
    const sourceAction = sourceStage.Actions[0];

    expect(sourceAction.ActionTypeId.Provider).toBe('S3');
    expect(sourceAction.Configuration.S3Bucket).toEqual({ Ref: 'ArtifactBucket' });
    expect(sourceAction.Configuration.S3ObjectKey).toBe('source/source.zip');
  });

  test('CodePipeline has proper build configuration', () => {
    const pipeline = tpl.Resources.Pipeline;
    const buildStage = pipeline.Properties.Stages[1];
    const buildAction = buildStage.Actions[0];

    expect(buildAction.ActionTypeId.Provider).toBe('CodeBuild');
    expect(buildAction.Configuration.ProjectName).toEqual({ Ref: 'CodeBuildProject' });
  });

  test('CodePipeline has proper deploy configuration', () => {
    const pipeline = tpl.Resources.Pipeline;
    const deployStage = pipeline.Properties.Stages[2];
    const deployAction = deployStage.Actions[0];

    expect(deployAction.ActionTypeId.Provider).toBe('ECS');
    expect(deployAction.Configuration.ClusterName).toEqual({ Ref: 'ECSCluster' });
    expect(deployAction.Configuration.ServiceName).toEqual({ Ref: 'ECSService' });
    expect(deployAction.Configuration.FileName).toBe('imagedefinitions.json');
  });

  test('CodeBuild buildspec is properly configured', () => {
    const cb = tpl.Resources.CodeBuildProject;
    const buildspec = cb.Properties.Source.BuildSpec;

    expect(buildspec).toContain('version: 0.2');
    expect(buildspec).toContain('phases:');
    expect(buildspec).toContain('pre_build:');
    expect(buildspec).toContain('build:');
    expect(buildspec).toContain('artifacts:');
    expect(buildspec).toContain('imagedefinitions.json');
  });

  // --- PROMPT.md Compliance Tests ---

  test('AWS Secrets Manager is configured for sensitive data handling', () => {
    const secrets = tpl.Resources.ApplicationSecrets;
    expect(secrets.Type).toBe('AWS::SecretsManager::Secret');
    expect(secrets.Properties.SecretString).toContain('database_host');
    expect(secrets.Properties.SecretString).toContain('api_key');
    expect(secrets.Properties.SecretString).toContain('jwt_secret');

    // Verify SecretString is not wrapped in unnecessary Fn::Sub
    expect(typeof secrets.Properties.SecretString).toBe('string');
    expect(secrets.Properties.SecretString).not.toMatch(/^Fn::Sub/);
  });

  test('TaskRole has Secrets Manager permissions', () => {
    const taskRole = tpl.Resources.TaskRole;
    const policies = taskRole.Properties.Policies[0].PolicyDocument.Statement;

    const secretsStatement = policies.find(s => s.Action.includes('secretsmanager:GetSecretValue'));
    expect(secretsStatement).toBeDefined();
    expect(secretsStatement.Resource).toEqual([{ 'Ref': 'ApplicationSecrets' }]);
  });

  test('CloudWatch alarms monitor response time and error rates', () => {
    const responseTimeAlarm = tpl.Resources.ALBResponseTimeAlarm;
    expect(responseTimeAlarm.Properties.MetricName).toBe('TargetResponseTime');
    expect(responseTimeAlarm.Properties.Threshold).toBe(2.0);

    const errorRateAlarm = tpl.Resources.ALBErrorRateAlarm;
    expect(errorRateAlarm.Properties.MetricName).toBe('HTTPCode_Target_5XX_Count');
    expect(errorRateAlarm.Properties.Threshold).toBe(10);
  });

  test('Data encryption is implemented at rest', () => {
    const artifactBucket = tpl.Resources.ArtifactBucket;
    expect(artifactBucket.Properties.BucketEncryption).toBeDefined();
    expect(artifactBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

    const cloudtrailBucket = tpl.Resources.CloudTrailBucket;
    expect(cloudtrailBucket.Properties.BucketEncryption).toBeDefined();
    expect(cloudtrailBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
  });

  test('Compliance resources are configured', () => {
    const cloudtrail = tpl.Resources.CloudTrail;
    expect(cloudtrail.Properties.IsLogging).toBe(true);
    expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
    expect(cloudtrail.Properties.IncludeGlobalServiceEvents).toBe(true);

    const configRecorder = tpl.Resources.ConfigConfigurationRecorder;
    expect(configRecorder.Properties.RecordingGroup.AllSupported).toBe(true);
    expect(configRecorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);

    // Check ConfigRole has correct managed policy
    const configRole = tpl.Resources.ConfigRole;
    expect(configRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
  });

  test('Enhanced resource tagging for cost management', () => {
    const secrets = tpl.Resources.ApplicationSecrets;
    const tags = secrets.Properties.Tags;

    expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
    expect(tags.find(t => t.Key === 'Project')).toBeDefined();
    expect(tags.find(t => t.Key === 'CostCenter')).toBeDefined();
    expect(tags.find(t => t.Key === 'Compliance')).toBeDefined();
  });

  test('Multiple scaling policies for high performance', () => {
    expect(tpl.Resources.ServiceScalingPolicy).toBeDefined();
    expect(tpl.Resources.ServiceMemoryScalingPolicy).toBeDefined();
    expect(tpl.Resources.ServiceStepScalingPolicy).toBeDefined();

    const memoryPolicy = tpl.Resources.ServiceMemoryScalingPolicy;
    expect(memoryPolicy.Properties.TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageMemoryUtilization');
  });

  test('Outputs include compliance and security resources', () => {
    const outputs = tpl.Outputs || {};
    const requiredOutputs = [
      'VPCId', 'LoadBalancerDNS', 'ClusterName', 'ServiceName',
      'EcrRepositoryUri', 'PipelineName', 'AlertsTopicArn', 'TargetGroupArn',
      'ApplicationSecretsArn', 'CloudTrailArn', 'ConfigRecorderName', 'MaxCapacity', 'MinCapacity',
      'EventBridgeRuleArn', 'EventBridgeDeadLetterQueueUrl', 'WAFWebACLArn', 'CloudWatchDashboardUrl'
    ];
    requiredOutputs.forEach(k => expect(outputs[k]).toBeDefined());
  });

  test('ApplicationSecretsArn output uses Ref instead of Fn::GetAtt', () => {
    const outputs = tpl.Outputs || {};
    const secretsOutput = outputs.ApplicationSecretsArn;
    expect(secretsOutput.Value).toEqual({ Ref: 'ApplicationSecrets' });
  });

  // --- EventBridge Tests ---
  test('EventBridge resources are properly configured', () => {
    const r = tpl.Resources;

    // EventBridge Rule
    const eventBridgeRule = r.EventBridgeRule;
    expect(eventBridgeRule.Type).toBe('AWS::Events::Rule');
    expect(eventBridgeRule.Properties.State).toBe('ENABLED');
    expect(eventBridgeRule.Properties.EventPattern.source).toContain('aws.ecs');
    expect(eventBridgeRule.Properties.EventPattern.source).toContain('aws.elasticloadbalancing');

    // EventBridge Dead Letter Queue
    const dlq = r.EventBridgeDeadLetterQueue;
    expect(dlq.Type).toBe('AWS::SQS::Queue');
    expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);

    // EventBridge Role
    const eventBridgeRole = r.EventBridgeRole;
    expect(eventBridgeRole.Type).toBe('AWS::IAM::Role');
    expect(eventBridgeRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('events.amazonaws.com');
  });

  // --- WAF Tests ---
  test('WAF Web ACL is properly configured', () => {
    const r = tpl.Resources;

    const wafWebACL = r.WAFWebACL;
    expect(wafWebACL.Type).toBe('AWS::WAFv2::WebACL');
    expect(wafWebACL.Condition).toBe('EnableWAF');
    expect(wafWebACL.Properties.Scope).toBe('REGIONAL');
    expect(wafWebACL.Properties.DefaultAction).toEqual({ Allow: {} });
    expect(wafWebACL.Properties.Rules).toHaveLength(3);

    // Check for AWS managed rules
    const commonRuleSet = wafWebACL.Properties.Rules.find(rule => rule.Name === 'AWSManagedRulesCommonRuleSet');
    expect(commonRuleSet).toBeDefined();
    expect(commonRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');

    // Check rate limiting rule
    const rateLimitRule = wafWebACL.Properties.Rules.find(rule => rule.Name === 'RateLimitRule');
    expect(rateLimitRule).toBeDefined();
    expect(rateLimitRule.Action).toEqual({ Block: {} });
    expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
  });

  test('WAF Association is properly configured', () => {
    const r = tpl.Resources;

    const wafAssociation = r.WAFAssociation;
    expect(wafAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    expect(wafAssociation.Condition).toBe('EnableWAF');
    expect(wafAssociation.Properties.ResourceArn).toEqual({
      'Fn::GetAtt': ['LoadBalancer', 'LoadBalancerArn']
    });
    expect(wafAssociation.Properties.WebACLArn).toEqual({
      'Fn::GetAtt': ['WAFWebACL', 'Arn']
    });
  });

  // --- CloudWatch Dashboard Tests ---
  test('CloudWatch Dashboard is properly configured', () => {
    const r = tpl.Resources;

    const dashboard = r.CloudWatchDashboard;
    expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');

    // Check that DashboardBody is a Fn::Sub with the expected content
    expect(dashboard.Properties.DashboardBody).toHaveProperty('Fn::Sub');
    const dashboardBodySub = dashboard.Properties.DashboardBody['Fn::Sub'];

    // Fn::Sub can be either a string or [string, map]. For proper substitution with variables, it should be an array
    expect(Array.isArray(dashboardBodySub)).toBe(true);

    const dashboardBody = dashboardBodySub[0];
    expect(dashboardBody).toContain('ALB Metrics');
    expect(dashboardBody).toContain('ECS Service Metrics');

    // Verify substitution variables exist
    const substitutions = dashboardBodySub[1];
    expect(substitutions).toHaveProperty('LoadBalancerFullName');
    expect(substitutions).toHaveProperty('ServiceName');
    expect(substitutions).toHaveProperty('ClusterName');
  });

  // --- New Outputs Tests ---
  test('New outputs are properly configured', () => {
    const outputs = tpl.Outputs || {};

    // EventBridge outputs
    expect(outputs.EventBridgeRuleArn.Value).toEqual({
      'Fn::GetAtt': ['EventBridgeRule', 'Arn']
    });
    expect(outputs.EventBridgeDeadLetterQueueUrl.Value).toEqual({
      Ref: 'EventBridgeDeadLetterQueue'
    });

    // WAF output (conditional)
    expect(outputs.WAFWebACLArn.Value).toHaveProperty('Fn::If');
    expect(outputs.WAFWebACLArn.Value['Fn::If'][0]).toBe('EnableWAF');
    expect(outputs.WAFWebACLArn.Value['Fn::If'][1]).toEqual({
      'Fn::GetAtt': ['WAFWebACL', 'Arn']
    });
    expect(outputs.WAFWebACLArn.Value['Fn::If'][2]).toBe('WAF-disabled');

    // CloudWatch Dashboard output
    expect(outputs.CloudWatchDashboardUrl.Value).toHaveProperty('Fn::Sub');
    expect(outputs.CloudWatchDashboardUrl.Value['Fn::Sub']).toContain('console.aws.amazon.com');
  });
});
