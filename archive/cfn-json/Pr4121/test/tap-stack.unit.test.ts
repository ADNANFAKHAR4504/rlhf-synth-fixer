import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Conditions Configuration', () => {
    test('HasKeyPair condition should check if KeyPairName is not empty', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KeyPairName' }, ''] }],
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should have correct CIDR block 10.0.0.0/16', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support and DNS hostnames enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should be tagged with Environment=Production', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Subnet Configuration', () => {
    test('PublicSubnet1 should have correct CIDR block 10.0.1.0/24', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test('PublicSubnet2 should have correct CIDR block 10.0.2.0/24', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('PublicSubnet1 should use dynamic AZ selection with Fn::GetAZs', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe(
        ''
      );
    });

    test('PublicSubnet2 should use dynamic AZ selection with Fn::GetAZs', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe(
        ''
      );
    });

    test('Both subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(
        true
      );
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(
        true
      );
    });
  });

  describe('Security Group Configuration', () => {
    test('WebSecurityGroup should allow HTTP traffic on port 80', () => {
      const sg = template.Resources.WebSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebSecurityGroup should allow HTTPS traffic on port 443', () => {
      const sg = template.Resources.WebSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebSecurityGroup should allow SSH traffic on port 22', () => {
      const sg = template.Resources.WebSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebSecurityGroup ingress rules should have descriptions', () => {
      const sg = template.Resources.WebSecurityGroup;
      sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.Description).toBeDefined();
        expect(rule.Description.length).toBeGreaterThan(0);
      });
    });

    test('WebSecurityGroup should have exactly 3 ingress rules', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);
    });
  });

  describe('Route Table Configuration', () => {
    test('PublicRouteTable should have DependsOn InternetGatewayAttachment', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('PublicRoute should route 0.0.0.0/0 to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('PublicRoute should have DependsOn InternetGatewayAttachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('PublicSubnet1 should be associated with PublicRouteTable', () => {
      const association = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });

    test('PublicSubnet2 should be associated with PublicRouteTable', () => {
      const association = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('EC2Instance1 should use latest Amazon Linux 2 AMI via SSM parameter', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('EC2Instance2 should use latest Amazon Linux 2 AMI via SSM parameter', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('EC2Instance1 should have detailed monitoring enabled', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('EC2Instance2 should have detailed monitoring enabled', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('EC2Instance1 should have IamInstanceProfile configured', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.IamInstanceProfile).toEqual({
        Ref: 'EC2InstanceProfile',
      });
    });

    test('EC2Instance2 should have IamInstanceProfile configured', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.IamInstanceProfile).toEqual({
        Ref: 'EC2InstanceProfile',
      });
    });

    test('EC2Instance1 should have UserData with httpd installation', () => {
      const instance = template.Resources.EC2Instance1;
      const userData = instance.Properties.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('yum install -y httpd');
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('systemctl enable httpd');
    });

    test('EC2Instance2 should have UserData with httpd installation', () => {
      const instance = template.Resources.EC2Instance2;
      const userData = instance.Properties.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('yum install -y httpd');
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('systemctl enable httpd');
    });

    test('EC2Instance1 should have KeyName parameter configured conditionally', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyPairName' }, { Ref: 'AWS::NoValue' }],
      });
    });

    test('EC2Instance2 should have KeyName parameter configured conditionally', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyPairName' }, { Ref: 'AWS::NoValue' }],
      });
    });

    test('EC2Instance1 should be in PublicSubnet1', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.NetworkInterfaces[0].SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
    });

    test('EC2Instance2 should be in PublicSubnet2', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.NetworkInterfaces[0].SubnetId).toEqual({
        Ref: 'PublicSubnet2',
      });
    });

    test('EC2Instance1 should have AssociatePublicIpAddress enabled', () => {
      const instance = template.Resources.EC2Instance1;
      expect(
        instance.Properties.NetworkInterfaces[0].AssociatePublicIpAddress
      ).toBe(true);
    });

    test('EC2Instance2 should have AssociatePublicIpAddress enabled', () => {
      const instance = template.Resources.EC2Instance2;
      expect(
        instance.Properties.NetworkInterfaces[0].AssociatePublicIpAddress
      ).toBe(true);
    });

    test('EC2Instance1 should be tagged with AutoStartStop=true', () => {
      const instance = template.Resources.EC2Instance1;
      const autoStartStopTag = instance.Properties.Tags.find(
        (tag: any) => tag.Key === 'AutoStartStop'
      );
      expect(autoStartStopTag).toBeDefined();
      expect(autoStartStopTag.Value).toBe('true');
    });

    test('EC2Instance2 should be tagged with AutoStartStop=true', () => {
      const instance = template.Resources.EC2Instance2;
      const autoStartStopTag = instance.Properties.Tags.find(
        (tag: any) => tag.Key === 'AutoStartStop'
      );
      expect(autoStartStopTag).toBeDefined();
      expect(autoStartStopTag.Value).toBe('true');
    });
  });

  describe('IAM Role Configuration', () => {
    test('EC2InstanceRole should have CloudWatchAgentServerPolicy attached', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('EC2InstanceRole should have AmazonSSMManagedInstanceCore policy attached', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('LambdaExecutionRole should have AWSLambdaBasicExecutionRole attached', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have EC2StartStopPolicy with specific instance permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'EC2StartStopPolicy'
      );
      expect(policy).toBeDefined();

      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('ec2:StartInstances');
      expect(statement.Action).toContain('ec2:StopInstances');
      expect(statement.Resource).toHaveLength(2);
      expect(statement.Resource[0]['Fn::Sub']).toContain('instance/${EC2Instance1}');
      expect(statement.Resource[1]['Fn::Sub']).toContain('instance/${EC2Instance2}');
    });

    test('VPCFlowLogsRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogsRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');

      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('StartEC2InstancesFunction should use Python 3.13 runtime', () => {
      const lambda = template.Resources.StartEC2InstancesFunction;
      expect(lambda.Properties.Runtime).toBe('python3.13');
    });

    test('StopEC2InstancesFunction should use Python 3.13 runtime', () => {
      const lambda = template.Resources.StopEC2InstancesFunction;
      expect(lambda.Properties.Runtime).toBe('python3.13');
    });

    test('StartEC2InstancesFunction should have 60 second timeout', () => {
      const lambda = template.Resources.StartEC2InstancesFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('StopEC2InstancesFunction should have 60 second timeout', () => {
      const lambda = template.Resources.StopEC2InstancesFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('StartEC2InstancesFunction should have correct handler', () => {
      const lambda = template.Resources.StartEC2InstancesFunction;
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('StopEC2InstancesFunction should have correct handler', () => {
      const lambda = template.Resources.StopEC2InstancesFunction;
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('StartEC2InstancesFunction code should contain start_instances call', () => {
      const lambda = template.Resources.StartEC2InstancesFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain('start_instances');
      expect(code).toContain('InstanceIds');
    });

    test('StopEC2InstancesFunction code should contain stop_instances call', () => {
      const lambda = template.Resources.StopEC2InstancesFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain('stop_instances');
      expect(code).toContain('InstanceIds');
    });
  });

  describe('EventBridge Schedule Configuration', () => {
    test('StartInstancesSchedule should have State ENABLED', () => {
      const schedule = template.Resources.StartInstancesSchedule;
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    test('StopInstancesSchedule should have State ENABLED', () => {
      const schedule = template.Resources.StopInstancesSchedule;
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    test('StartInstancesSchedule should target StartEC2InstancesFunction', () => {
      const schedule = template.Resources.StartInstancesSchedule;
      expect(schedule.Properties.Targets[0].Arn['Fn::GetAtt'][0]).toBe(
        'StartEC2InstancesFunction'
      );
    });

    test('StopInstancesSchedule should target StopEC2InstancesFunction', () => {
      const schedule = template.Resources.StopInstancesSchedule;
      expect(schedule.Properties.Targets[0].Arn['Fn::GetAtt'][0]).toBe(
        'StopEC2InstancesFunction'
      );
    });

    test('StartInstancesSchedule should use StartSchedule parameter', () => {
      const schedule = template.Resources.StartInstancesSchedule;
      expect(schedule.Properties.ScheduleExpression).toEqual({
        Ref: 'StartSchedule',
      });
    });

    test('StopInstancesSchedule should use StopSchedule parameter', () => {
      const schedule = template.Resources.StopInstancesSchedule;
      expect(schedule.Properties.ScheduleExpression).toEqual({
        Ref: 'StopSchedule',
      });
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    test('HighCPUAlarmInstance1 should monitor CPUUtilization metric', () => {
      const alarm = template.Resources.HighCPUAlarmInstance1;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
    });

    test('HighCPUAlarmInstance1 should have 70% threshold', () => {
      const alarm = template.Resources.HighCPUAlarmInstance1;
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('HighCPUAlarmInstance1 should have 60 second period with 2 evaluation periods', () => {
      const alarm = template.Resources.HighCPUAlarmInstance1;
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('LowCPUAlarmInstance1 should have 10% threshold', () => {
      const alarm = template.Resources.LowCPUAlarmInstance1;
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('LowCPUAlarmInstance1 should have 300 second period with 3 evaluation periods', () => {
      const alarm = template.Resources.LowCPUAlarmInstance1;
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(3);
    });

    test('HighCPUAlarmInstance1 should monitor EC2Instance1', () => {
      const alarm = template.Resources.HighCPUAlarmInstance1;
      const dimension = alarm.Properties.Dimensions.find(
        (d: any) => d.Name === 'InstanceId'
      );
      expect(dimension).toBeDefined();
      expect(dimension.Value).toEqual({ Ref: 'EC2Instance1' });
    });

    test('HighCPUAlarmInstance2 should monitor EC2Instance2', () => {
      const alarm = template.Resources.HighCPUAlarmInstance2;
      const dimension = alarm.Properties.Dimensions.find(
        (d: any) => d.Name === 'InstanceId'
      );
      expect(dimension).toBeDefined();
      expect(dimension.Value).toEqual({ Ref: 'EC2Instance2' });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('VPCFlowLog should capture ALL traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPCFlowLog should use cloud-watch-logs destination', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPCFlowLogsLogGroup should have 7 day retention', () => {
      const logGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('VPCFlowLog should reference VPC resource', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Lambda Permission Configuration', () => {
    test('StartInstancesSchedulePermission should allow EventBridge to invoke Lambda', () => {
      const permission = template.Resources.StartInstancesSchedulePermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('StopInstancesSchedulePermission should allow EventBridge to invoke Lambda', () => {
      const permission = template.Resources.StopInstancesSchedulePermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('StartInstancesSchedulePermission should reference correct function and schedule', () => {
      const permission = template.Resources.StartInstancesSchedulePermission;
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'StartEC2InstancesFunction',
      });
      expect(permission.Properties.SourceArn['Fn::GetAtt'][0]).toBe(
        'StartInstancesSchedule'
      );
    });

    test('StopInstancesSchedulePermission should reference correct function and schedule', () => {
      const permission = template.Resources.StopInstancesSchedulePermission;
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'StopEC2InstancesFunction',
      });
      expect(permission.Properties.SourceArn['Fn::GetAtt'][0]).toBe(
        'StopInstancesSchedule'
      );
    });
  });
});
