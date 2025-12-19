import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Highly Available Load Balancing Architecture for Payment Processing API', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC and Networking Configuration', () => {
    test('should create VPC with DNS support and hostnames enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway and attach to VPC', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should create two public subnets with dynamic AZ selection', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(publicSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should create two private subnets with dynamic AZ selection', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);

      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should create two NAT Gateways with Elastic IPs', () => {
      const natGw1 = template.Resources.NATGateway1;
      const natGw2 = template.Resources.NATGateway2;

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId'] });

      expect(natGw2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });

      const eip1 = template.Resources.NATGateway1EIP;
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip1.DependsOn).toBe('AttachGateway');
    });

    test('should create public route table with route to Internet Gateway', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should create two private route tables with routes to respective NAT Gateways', () => {
      const privateRoute1 = template.Resources.PrivateRoute1;
      const privateRoute2 = template.Resources.PrivateRoute2;

      expect(privateRoute1.Type).toBe('AWS::EC2::Route');
      expect(privateRoute1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });

      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should associate public subnets with public route table', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;

      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });

      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should associate private subnets with respective private route tables', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });

      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create ALBSecurityGroup in VPC with HTTP ingress only (no HTTPS)', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('Allow HTTP traffic from internet');
    });

    test('should create ALBSecurityGroup with all outbound traffic allowed', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe(-1);
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });

    test('should create EC2SecurityGroup allowing traffic only from ALB security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(httpRule.Description).toBe('Allow HTTP traffic from ALB only');
    });

    test('should create EC2SecurityGroup with no SSH access from internet (0.0.0.0/0)', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const sshRuleFromInternet = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22 && rule.CidrIp === '0.0.0.0/0'
      );
      expect(sshRuleFromInternet).toBeUndefined();
    });

    test('should create EC2SecurityGroup with all outbound traffic allowed', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe(-1);
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should tag ALBSecurityGroup with correct tags', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const tags = sg.Properties.Tags;

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('PaymentProcessingAPI');
    });

    test('should tag EC2SecurityGroup with correct tags', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const tags = sg.Properties.Tags;

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('PaymentProcessingAPI');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2InstanceRole with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create EC2InstanceRole with required managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should create EC2InstanceRole with CloudWatchLogsPolicy for logs and metrics', () => {
      const role = template.Resources.EC2InstanceRole;
      const inlinePolicies = role.Properties.Policies;
      expect(inlinePolicies).toHaveLength(1);

      const cwPolicy = inlinePolicies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Version).toBe('2012-10-17');
      expect(cwPolicy.PolicyDocument.Statement).toHaveLength(2);

      const logsStatement = cwPolicy.PolicyDocument.Statement[0];
      expect(logsStatement.Effect).toBe('Allow');
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
      expect(logsStatement.Action).toContain('logs:DescribeLogStreams');

      const metricsStatement = cwPolicy.PolicyDocument.Statement[1];
      expect(metricsStatement.Effect).toBe('Allow');
      expect(metricsStatement.Action).toContain('cloudwatch:PutMetricData');
      expect(metricsStatement.Action).toContain('cloudwatch:GetMetricStatistics');
      expect(metricsStatement.Action).toContain('cloudwatch:ListMetrics');
    });

    test('should create EC2InstanceProfile referencing EC2InstanceRole', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create ApplicationLoadBalancer as internet-facing across two public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.IpAddressType).toBe('ipv4');
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create ApplicationLoadBalancer with ALBSecurityGroup', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toHaveLength(1);
      expect(alb.Properties.SecurityGroups[0]).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should create ApplicationLoadBalancer with cross-zone load balancing enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const crossZoneAttr = attributes.find((attr: any) => attr.Key === 'load_balancing.cross_zone.enabled');
      expect(crossZoneAttr).toBeDefined();
      expect(crossZoneAttr.Value).toBe('true');
    });

    test('should create ApplicationLoadBalancer with deletion protection enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const deletionProtectionAttr = attributes.find((attr: any) => attr.Key === 'deletion_protection.enabled');
      expect(deletionProtectionAttr).toBeDefined();
      expect(deletionProtectionAttr.Value).toBe('true');
    });

    test('should create ApplicationLoadBalancer with idle timeout of 60 seconds', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const idleTimeoutAttr = attributes.find((attr: any) => attr.Key === 'idle_timeout.timeout_seconds');
      expect(idleTimeoutAttr).toBeDefined();
      expect(idleTimeoutAttr.Value).toBe('60');
    });

    test('should create ApplicationLoadBalancer with DependsOn AttachGateway', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Target Group Configuration', () => {
    test('should create ALBTargetGroup with HTTP protocol on port 80', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should create ALBTargetGroup with health check path /health expecting HTTP 200', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.Matcher.HttpCode).toBe('200');
    });

    test('should create ALBTargetGroup with 15-second health check interval and 2 unhealthy threshold', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(15);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(2);
      expect(tg.Properties.HealthyThresholdCount).toBe(3);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
    });

    test('should create ALBTargetGroup with 300-second connection draining (deregistration delay)', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const deregDelayAttr = attributes.find((attr: any) => attr.Key === 'deregistration_delay.timeout_seconds');
      expect(deregDelayAttr).toBeDefined();
      expect(deregDelayAttr.Value).toBe('300');
    });

    test('should create ALBTargetGroup with sticky sessions enabled using app_cookie for 86400 seconds', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const stickinessEnabledAttr = attributes.find((attr: any) => attr.Key === 'stickiness.enabled');
      expect(stickinessEnabledAttr).toBeDefined();
      expect(stickinessEnabledAttr.Value).toBe('true');

      const stickinessTypeAttr = attributes.find((attr: any) => attr.Key === 'stickiness.type');
      expect(stickinessTypeAttr).toBeDefined();
      expect(stickinessTypeAttr.Value).toBe('app_cookie');

      const stickinessDurationAttr = attributes.find((attr: any) => attr.Key === 'stickiness.app_cookie.duration_seconds');
      expect(stickinessDurationAttr).toBeDefined();
      expect(stickinessDurationAttr.Value).toBe('86400');
    });

    test('should create ALBTargetGroup with sticky session cookie name PAYMENT_SESSION', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const cookieNameAttr = attributes.find((attr: any) => attr.Key === 'stickiness.app_cookie.cookie_name');
      expect(cookieNameAttr).toBeDefined();
      expect(cookieNameAttr.Value).toBe('PAYMENT_SESSION');
    });
  });

  describe('ALB Listener Configuration', () => {
    test('should create HTTP listener on port 80 forwarding to target group (no HTTPS)', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should not have HTTPS listener (HTTP only architecture)', () => {
      const httpsListener = template.Resources.ALBHTTPSListener;
      expect(httpsListener).toBeUndefined();
    });
  });

  describe('Launch Template Configuration', () => {
    test('should create LaunchTemplate with dynamic AMI reference', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('should create LaunchTemplate with instance type reference', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should create LaunchTemplate with EC2SecurityGroup', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toHaveLength(1);
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should create LaunchTemplate with IAM instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('should create LaunchTemplate with IMDSv2 enforced', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.MetadataOptions).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpEndpoint).toBe('enabled');
    });

    test('should create LaunchTemplate with detailed monitoring enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.Monitoring).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('should create LaunchTemplate with UserData installing httpd and CloudWatch agent', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();

      const userData = lt.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('yum update -y');
      expect(userData).toContain('yum install -y httpd amazon-cloudwatch-agent amazon-ssm-agent');
      expect(userData).toContain('systemctl enable httpd');
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('echo "OK" > /var/www/html/health');
      expect(userData).toContain('systemctl enable amazon-cloudwatch-agent');
      expect(userData).toContain('systemctl start amazon-cloudwatch-agent');
    });

    test('should create LaunchTemplate with conditional KeyPairName using HasKeyPair condition', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyPairName' }, { Ref: 'AWS::NoValue' }]
      });
    });

  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create AutoScalingGroup with correct launch template reference', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({
        'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber']
      });
    });

    test('should create AutoScalingGroup with size configuration references', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('should create AutoScalingGroup spanning two private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should create AutoScalingGroup with ELB health check and 300-second grace period', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should create AutoScalingGroup registered with ALB target group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toHaveLength(1);
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should create AutoScalingGroup with detailed metrics collection at 1-minute granularity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MetricsCollection).toHaveLength(1);
      expect(asg.Properties.MetricsCollection[0].Granularity).toBe('1Minute');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupMinSize');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupMaxSize');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupDesiredCapacity');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupInServiceInstances');
    });

    test('should create AutoScalingGroup with tags propagated to instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envTag.PropagateAtLaunch).toBe(true);

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('PaymentProcessingAPI');
      expect(projectTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Auto Scaling Policy Configuration', () => {
    test('should create CPUTargetTrackingScalingPolicy with target tracking at 70% CPU utilization', () => {
      const policy = template.Resources.CPUTargetTrackingScalingPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AutoScalingGroupName).toEqual({ Ref: 'AutoScalingGroup' });
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should create ApplicationLogGroup with 30-day retention', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/ec2/${AWS::StackName}/application' });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create SystemLogGroup with 30-day retention', () => {
      const logGroup = template.Resources.SystemLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/ec2/${AWS::StackName}/system' });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create UnhealthyHostCountAlarm triggering when unhealthy hosts exceed 1', () => {
      const alarm = template.Resources.UnhealthyHostCountAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create UnhealthyHostCountAlarm with LoadBalancer and TargetGroup dimensions', () => {
      const alarm = template.Resources.UnhealthyHostCountAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(2);

      const lbDimension = alarm.Properties.Dimensions.find((d: any) => d.Name === 'LoadBalancer');
      expect(lbDimension.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'LoadBalancerFullName'] });

      const tgDimension = alarm.Properties.Dimensions.find((d: any) => d.Name === 'TargetGroup');
      expect(tgDimension.Value).toEqual({ 'Fn::GetAtt': ['ALBTargetGroup', 'TargetGroupFullName'] });
    });

    test('should create TargetResponseTimeAlarm triggering when response time exceeds 1 second', () => {
      const alarm = template.Resources.TargetResponseTimeAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('TargetResponseTime');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create Target5XXErrorsAlarm triggering when targets return more than 10 5xx errors', () => {
      const alarm = template.Resources.Target5XXErrorsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('HTTPCode_Target_5XX_Count');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create ELB5XXErrorsAlarm triggering when ALB generates more than 10 5xx errors', () => {
      const alarm = template.Resources.ELB5XXErrorsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('HTTPCode_ELB_5XX_Count');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create RequestCountAlarm triggering when request count exceeds 100000', () => {
      const alarm = template.Resources.RequestCountAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('RequestCount');
      expect(alarm.Properties.Threshold).toBe(100000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('CloudWatch Dashboard Configuration', () => {
    test('should create MonitoringDashboard with dashboard body', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      expect(dashboard.Properties.DashboardBody['Fn::Sub']).toBeDefined();
    });

    test('should create MonitoringDashboard with ALB Request Count widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('ALB Request Count');
      expect(dashboardBody).toContain('RequestCount');
      expect(dashboardBody).toContain('AWS/ApplicationELB');
    });

    test('should create MonitoringDashboard with Target Health Status widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('Target Health Status');
      expect(dashboardBody).toContain('HealthyHostCount');
      expect(dashboardBody).toContain('UnHealthyHostCount');
    });

    test('should create MonitoringDashboard with Target Response Time widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('Target Response Time');
      expect(dashboardBody).toContain('TargetResponseTime');
    });

    test('should create MonitoringDashboard with HTTP Response Codes widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('HTTP Response Codes');
      expect(dashboardBody).toContain('HTTPCode_Target_2XX_Count');
      expect(dashboardBody).toContain('HTTPCode_Target_4XX_Count');
      expect(dashboardBody).toContain('HTTPCode_Target_5XX_Count');
      expect(dashboardBody).toContain('HTTPCode_ELB_5XX_Count');
    });

    test('should create MonitoringDashboard with Auto Scaling Group Metrics widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('Auto Scaling Group Metrics');
      expect(dashboardBody).toContain('GroupDesiredCapacity');
      expect(dashboardBody).toContain('GroupInServiceInstances');
      expect(dashboardBody).toContain('GroupMinSize');
      expect(dashboardBody).toContain('GroupMaxSize');
    });

    test('should create MonitoringDashboard with EC2 CPU Utilization widget', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('EC2 CPU Utilization');
      expect(dashboardBody).toContain('CPUUtilization');
      expect(dashboardBody).toContain('AWS/EC2');
    });
  });

});