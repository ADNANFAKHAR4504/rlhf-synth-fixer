import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Production CloudFormation Template Unit Tests', () => {
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
      expect(template.Description).toContain('CloudFormation template for prooduction application infrastructure');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags).toEqual([{ Key: 'Environment', Value: 'Production' }]);
    });

    test('should have Internet Gateway properly configured', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Properties.Tags).toEqual([{ Key: 'Environment', Value: 'Production' }]);
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have two private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');

      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have NAT Gateway with EIP', () => {
      const natEIP = template.Resources.NatEIP;
      const natGateway = template.Resources.NatGateway;

      expect(natEIP).toBeDefined();
      expect(natEIP.Type).toBe('AWS::EC2::EIP');
      expect(natEIP.Properties.Domain).toBe('vpc');

      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatEIP', 'AllocationId'] });
    });

    test('should have proper route tables and routes', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable;
      const publicRoute = template.Resources.PublicRoute;
      const privateRoute = template.Resources.PrivateRoute;

      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];

      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with proper configuration', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');

      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy with read-only access', () => {
      const bucketPolicy = template.Resources.S3BucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = bucketPolicy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual(['s3:ListBucket', 's3:GetObject']);
      expect(statement.Principal.AWS).toEqual({ 'Fn::GetAtt': ['InstanceRole', 'Arn'] });
    });

    test('should have DynamoDB table with proper configuration', () => {
      const dynamoTable = template.Resources.AppTable;
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.Type).toBe('AWS::DynamoDB::Table');

      expect(dynamoTable.Properties.TableName).toBe('AppTable');
      expect(dynamoTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(dynamoTable.Properties.AttributeDefinitions[0]).toEqual({ AttributeName: 'Id', AttributeType: 'S' });
      expect(dynamoTable.Properties.KeySchema[0]).toEqual({ AttributeName: 'Id', KeyType: 'HASH' });

      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(dynamoTable.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(dynamoTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with proper configuration', () => {
      const instanceRole = template.Resources.InstanceRole;
      expect(instanceRole).toBeDefined();
      expect(instanceRole.Type).toBe('AWS::IAM::Role');

      expect(instanceRole.Properties.Path).toBe('/');
      expect(instanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(instanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have proper IAM policies for instance role', () => {
      const instanceRole = template.Resources.InstanceRole;
      const policy = instanceRole.Properties.Policies[0];

      expect(policy.PolicyName).toBe('InstanceAccessPolicy');
      expect(policy.PolicyDocument.Statement).toHaveLength(4);

      // S3 permissions
      const s3Statement = policy.PolicyDocument.Statement[0];
      expect(s3Statement.Action).toEqual(['s3:ListBucket', 's3:GetObject']);

      // DynamoDB permissions
      const dynamoStatement = policy.PolicyDocument.Statement[1];
      expect(dynamoStatement.Action).toEqual([
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ]);

      // CloudWatch permissions
      const cloudwatchStatement = policy.PolicyDocument.Statement[2];
      expect(cloudwatchStatement.Action).toBe('cloudwatch:PutMetricData');

      // Logs permissions
      const logsStatement = policy.PolicyDocument.Statement[3];
      expect(logsStatement.Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]);
    });

    test('should have instance profile', () => {
      const instanceProfile = template.Resources.InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'InstanceRole' }]);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.GroupDescription).toBe('Allow inbound HTTP from Internet');

      const ingressRule = albSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.ToPort).toBe(80);
      expect(ingressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have instance security group', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      expect(instanceSG).toBeDefined();
      expect(instanceSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(instanceSG.Properties.GroupDescription).toBe('Allow HTTP from ALB only');

      const ingressRule = instanceSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.ToPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.LoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');

      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    test('should have target group with proper health checks', () => {
      const targetGroup = template.Resources.TargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');

      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.TargetType).toBe('instance');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(3);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');

      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have launch template with proper configuration', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');

      const templateData = launchTemplate.Properties.LaunchTemplateData;
      expect(templateData.InstanceType).toBe('t3.micro');
      expect(templateData.ImageId).toBe('resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateData.IamInstanceProfile.Name).toEqual({ Ref: 'InstanceProfile' });
      expect(templateData.SecurityGroupIds).toEqual([{ Ref: 'InstanceSecurityGroup' }]);
      expect(templateData.UserData).toBeDefined();
    });

    test('should have auto scaling group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');

      expect(asg.Properties.VPCZoneIdentifier).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(10);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'TargetGroup' }]);
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      const restApi = template.Resources.RestApi;
      expect(restApi).toBeDefined();
      expect(restApi.Type).toBe('AWS::ApiGateway::RestApi');
      expect(restApi.Properties.Name).toBe('ExampleApi');
      expect(restApi.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have API resource and method', () => {
      const apiResource = template.Resources.ApiResource;
      const dummyMethod = template.Resources.DummyGetMethod;

      expect(apiResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(apiResource.Properties.PathPart).toBe('dummy');

      expect(dummyMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(dummyMethod.Properties.HttpMethod).toBe('GET');
      expect(dummyMethod.Properties.AuthorizationType).toBe('NONE');
      expect(dummyMethod.Properties.Integration.Type).toBe('MOCK');
    });

    test('should have API deployment and stage', () => {
      const deployment = template.Resources.ApiDeployment;
      const stage = template.Resources.ApiStage;

      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');
    });
  });

  describe('WAF Resources', () => {
    test('should have WAF IP set', () => {
      const ipSet = template.Resources.WAFIPSet;
      expect(ipSet).toBeDefined();
      expect(ipSet.Type).toBe('AWS::WAFv2::IPSet');
      expect(ipSet.Properties.Name).toBe('BlockList');
      expect(ipSet.Properties.IPAddressVersion).toBe('IPV4');
      expect(ipSet.Properties.Scope).toBe('REGIONAL');
      expect(ipSet.Properties.Addresses).toEqual(['203.0.113.0/24']);
    });

    test('should have WAF Web ACL with proper rules', () => {
      const webACL = template.Resources.WAFWebACL;
      expect(webACL).toBeDefined();
      expect(webACL.Type).toBe('AWS::WAFv2::WebACL');

      expect(webACL.Properties.Name).toBe('ApiWebACL');
      expect(webACL.Properties.Scope).toBe('REGIONAL');
      expect(webACL.Properties.DefaultAction.Allow).toEqual({});

      const rule = webACL.Properties.Rules[0];
      expect(rule.Name).toBe('BlockSpecificIP');
      expect(rule.Priority).toBe(0);
      expect(rule.Action.Block).toEqual({});
    });

    test('should have WAF Web ACL association', () => {
      const association = template.Resources.WAFWebACLAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS topic for alarms', () => {
      const topic = template.Resources.AlarmTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('High NetworkOut Alarm Topic');
    });

    test('should have CloudWatch alarm', () => {
      const alarm = template.Resources.HighNetworkOutAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      expect(alarm.Properties.AlarmDescription).toContain('NetworkOut > 5 GB');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.MetricName).toBe('NetworkOut');
      expect(alarm.Properties.Statistic).toBe('Maximum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.Threshold).toBe(5368709120);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'S3BucketName',
        'DynamoDBTableArn',
        'AutoScalingGroupName',
        'ApiInvokeURL',
        'CloudWatchAlarmArn',
        'WAFWebACLID'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have proper values', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
      expect(template.Outputs.DynamoDBTableArn.Value).toEqual({ 'Fn::GetAtt': ['AppTable', 'Arn'] });
      expect(template.Outputs.AutoScalingGroupName.Value).toEqual({ Ref: 'AutoScalingGroup' });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PrivateRouteTable',
        'NatEIP', 'NatGateway', 'S3Bucket', 'AppTable', 'InstanceRole',
        'ALBSecurityGroup', 'InstanceSecurityGroup', 'LoadBalancer', 'TargetGroup',
        'RestApi', 'WAFIPSet', 'WAFWebACL', 'AlarmTopic', 'HighNetworkOutAlarm'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toBe('Production');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(39); // Total number of resources in template
    });

    test('all resources should have proper CloudFormation types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('should not have any undefined references', () => {
      const jsonString = JSON.stringify(template);
      expect(jsonString).not.toContain('undefined');
      expect(jsonString).not.toContain('null');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block all public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB should have encryption enabled', () => {
      const dynamoTable = template.Resources.AppTable;
      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('private subnets should not auto-assign public IPs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('IAM policies should follow least privilege', () => {
      const instanceRole = template.Resources.InstanceRole;
      const policy = instanceRole.Properties.Policies[0];

      // Check that we only have specific actions, not wildcards
      policy.PolicyDocument.Statement.forEach((statement: any) => {
        expect(statement.Action).not.toContain('*');
        if (Array.isArray(statement.Action)) {
          statement.Action.forEach((action: string) => {
            expect(action).not.toBe('*');
          });
        }
      });
    });
  });
});