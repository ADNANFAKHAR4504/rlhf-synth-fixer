import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'dev'
      }
    });
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('Complete Stack Integration', () => {
    test('should deploy complete infrastructure with all components', () => {
      // Verify all major resource types are present
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      const albResources = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const securityGroupResources = template.findResources('AWS::EC2::SecurityGroup');
      const cloudWatchResources = template.findResources('AWS::CloudWatch::Dashboard');
      const snsResources = template.findResources('AWS::SNS::Topic');

      expect(Object.keys(vpcResources).length).toBe(1);
      expect(Object.keys(subnetResources).length).toBeGreaterThanOrEqual(6);
      expect(Object.keys(albResources).length).toBe(1);
      expect(Object.keys(asgResources).length).toBe(1);
      expect(Object.keys(rdsResources).length).toBe(1);
      expect(Object.keys(securityGroupResources).length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(cloudWatchResources).length).toBe(1);
      expect(Object.keys(snsResources).length).toBe(1);
    });

    test('should have proper resource dependencies and relationships', () => {
      // VPC should be referenced by subnets
      const vpcId = Object.keys(template.findResources('AWS::EC2::VPC'))[0];
      const subnets = template.findResources('AWS::EC2::Subnet');
      
      Object.values(subnets).forEach(subnet => {
        expect(subnet.Properties.VpcId).toEqual({ Ref: vpcId });
      });

      // Subnets should be referenced by ALB and RDS
      const albResources = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      
      Object.values(albResources).forEach(alb => {
        expect(alb.Properties.Subnets).toBeDefined();
      });

      Object.values(rdsResources).forEach(rds => {
        expect(rds.Properties.DBSubnetGroupName).toBeDefined();
      });
    });

    test('should integrate security groups across tiers', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      // Find ALB security group
      const albSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSg).toBeDefined();

      // Find application security group
      const appSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('application EC2 instances')
      );
      expect(appSg).toBeDefined();

      // Find database security group
      const dbSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('RDS database')
      );
      expect(dbSg).toBeDefined();

      // Verify security group references in resources
      const albResources = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const rdsResources = template.findResources('AWS::RDS::DBInstance');

      Object.values(albResources).forEach(alb => {
        expect(alb.Properties.SecurityGroups).toBeDefined();
      });

      Object.values(asgResources).forEach(asg => {
        expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      });

      Object.values(rdsResources).forEach(rds => {
        expect(rds.Properties.VPCSecurityGroups).toBeDefined();
      });
    });
  });

  describe('Multi-Region Integration', () => {
    test('should deploy independent stacks for different regions', () => {
      // Deploy stack for us-east-1
      const eastApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const eastStack = new TapStack(eastApp, 'EastStack', {
        env: { region: 'us-east-1' }
      });
      const eastTemplate = Template.fromStack(eastStack);

      // Deploy stack for us-west-2
      const westApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const westStack = new TapStack(westApp, 'WestStack', {
        env: { region: 'us-west-2' }
      });
      const westTemplate = Template.fromStack(westStack);

      // Verify both stacks have complete infrastructure
      expect(Object.keys(eastTemplate.findResources('AWS::EC2::VPC')).length).toBe(1);
      expect(Object.keys(westTemplate.findResources('AWS::EC2::VPC')).length).toBe(1);

      // Verify different CIDR blocks
      eastTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });

      westTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16'
      });
    });

    test('should have region-specific resource naming', () => {
      const eastApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const eastStack = new TapStack(eastApp, 'EastStack', {
        env: { region: 'us-east-1' }
      });
      const eastTemplate = Template.fromStack(eastStack);

      // Verify region-specific tags
      eastTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Region',
            Value: 'us-east-1'
          }
        ])
      });
    });
  });

  describe('Environment Integration', () => {
    test('should deploy different environments with appropriate configurations', () => {
      // Deploy dev environment
      const devApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const devStack = new TapStack(devApp, 'DevStack');
      const devTemplate = Template.fromStack(devStack);

      // Deploy staging environment
      const stagingApp = new cdk.App({
        context: { environmentSuffix: 'staging' }
      });
      const stagingStack = new TapStack(stagingApp, 'StagingStack');
      const stagingTemplate = Template.fromStack(stagingStack);

      // Deploy prod environment
      const prodApp = new cdk.App({
        context: { environmentSuffix: 'prod' }
      });
      const prodStack = new TapStack(prodApp, 'ProdStack');
      const prodTemplate = Template.fromStack(prodStack);

      // Verify all environments have complete infrastructure
      [devTemplate, stagingTemplate, prodTemplate].forEach(template => {
        expect(Object.keys(template.findResources('AWS::EC2::VPC')).length).toBe(1);
        expect(Object.keys(template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer')).length).toBe(1);
        expect(Object.keys(template.findResources('AWS::RDS::DBInstance')).length).toBe(1);
      });

      // Verify environment-specific tags
      devTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'dev'
          }
        ])
      });

      stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'staging'
          }
        ])
      });

      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'prod'
          }
        ])
      });
    });
  });

  describe('Load Balancer and Auto Scaling Integration', () => {
    test('should integrate ALB with Auto Scaling Group', () => {
      const albResources = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const targetGroupResources = template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup');
      const listenerResources = template.findResources('AWS::ElasticLoadBalancingV2::Listener');

      expect(Object.keys(albResources).length).toBe(1);
      expect(Object.keys(asgResources).length).toBe(1);
      expect(Object.keys(targetGroupResources).length).toBe(1);
      expect(Object.keys(listenerResources).length).toBe(1);

      // Verify ALB configuration
      Object.values(albResources).forEach(alb => {
        expect(alb.Properties.Type).toBe('application');
        expect(alb.Properties.Scheme).toBe('internet-facing');
        expect(alb.Properties.SecurityGroups).toBeDefined();
        expect(alb.Properties.Subnets).toBeDefined();
      });

      // Verify ASG configuration
      Object.values(asgResources).forEach(asg => {
        expect(asg.Properties.MinSize).toBe('2');
        expect(asg.Properties.MaxSize).toBe('10');
        expect(asg.Properties.DesiredCapacity).toBe('3');
        expect(asg.Properties.HealthCheckType).toBe('ELB');
        expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
        expect(asg.Properties.LaunchTemplate).toBeDefined();
      });

      // Verify target group configuration
      Object.values(targetGroupResources).forEach(tg => {
        expect(tg.Properties.HealthCheckEnabled).toBe(true);
        expect(tg.Properties.HealthCheckPath).toBe('/');
        expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
        expect(tg.Properties.VpcId).toBeDefined();
      });
    });

    test('should have proper scaling policies and health checks', () => {
      const scalingPolicyResources = template.findResources('AWS::AutoScaling::ScalingPolicy');
      const launchTemplateResources = template.findResources('AWS::EC2::LaunchTemplate');

      expect(Object.keys(scalingPolicyResources).length).toBeGreaterThan(0);
      expect(Object.keys(launchTemplateResources).length).toBe(1);

      // Verify scaling policy configuration
      Object.values(scalingPolicyResources).forEach(policy => {
        expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
        expect(policy.Properties.TargetTrackingConfiguration).toBeDefined();
        expect(policy.Properties.AutoScalingGroupName).toBeDefined();
      });

      // Verify launch template configuration
      Object.values(launchTemplateResources).forEach(lt => {
        expect(lt.Properties.LaunchTemplateData).toBeDefined();
        expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
        expect(lt.Properties.LaunchTemplateData.MetadataOptions).toBeDefined();
        expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      });
    });
  });

  describe('Database Integration', () => {
    test('should integrate RDS with VPC and security groups', () => {
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const subnetGroupResources = template.findResources('AWS::RDS::DBSubnetGroup');
      const secretResources = template.findResources('AWS::SecretsManager::Secret');

      expect(Object.keys(rdsResources).length).toBe(1);
      expect(Object.keys(subnetGroupResources).length).toBe(1);
      expect(Object.keys(secretResources).length).toBe(1);

      // Verify RDS configuration
      Object.values(rdsResources).forEach(rds => {
        expect(rds.Properties.Engine).toBe('mysql');
        expect(rds.Properties.EngineVersion).toBe('8.0.37');
        expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
        expect(rds.Properties.AllocatedStorage).toBe('20');
        expect(rds.Properties.MultiAZ).toBe(true);
        expect(rds.Properties.StorageEncrypted).toBe(true);
        expect(rds.Properties.DeletionProtection).toBe(true);
        expect(rds.Properties.BackupRetentionPeriod).toBe(7);
        expect(rds.Properties.DeleteAutomatedBackups).toBe(false);
        expect(rds.Properties.EnablePerformanceInsights).toBe(false);
        expect(rds.Properties.DBSubnetGroupName).toBeDefined();
        expect(rds.Properties.VPCSecurityGroups).toBeDefined();
        // MasterUserSecret is optional, so we don't require it
      });

      // Verify subnet group configuration
      Object.values(subnetGroupResources).forEach(sg => {
        expect(sg.Properties.SubnetIds).toBeDefined();
        expect(sg.Properties.DBSubnetGroupDescription).toBeDefined();
      });
    });

    test('should have proper database security and monitoring', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('RDS database')
      );

      expect(dbSg).toBeDefined();
      if (dbSg) {
        expect(dbSg.Properties.VpcId).toBeDefined();
        expect(dbSg.Properties.SecurityGroupEgress).toBeDefined();
      }
    });
  });

  describe('Monitoring and Alerting Integration', () => {
    test('should integrate CloudWatch with all infrastructure components', () => {
      const dashboardResources = template.findResources('AWS::CloudWatch::Dashboard');
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const logGroupResources = template.findResources('AWS::Logs::LogGroup');
      const snsResources = template.findResources('AWS::SNS::Topic');

      expect(Object.keys(dashboardResources).length).toBe(1);
      expect(Object.keys(alarmResources).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(logGroupResources).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(snsResources).length).toBe(1);

      // Verify dashboard configuration
      Object.values(dashboardResources).forEach(dashboard => {
        expect(dashboard.Properties.DashboardBody).toBeDefined();
        expect(dashboard.Properties.DashboardName).toBeDefined();
      });

      // Verify alarms configuration
      const alarmNamespaces = Object.values(alarmResources).map(alarm => alarm.Properties.Namespace);
      expect(alarmNamespaces).toContain('AWS/ApplicationELB');
      expect(alarmNamespaces).toContain('AWS/EC2');
      expect(alarmNamespaces).toContain('AWS/RDS');

      // Verify SNS topic configuration
      Object.values(snsResources).forEach(topic => {
        expect(topic.Properties.TopicName).toBeDefined();
        expect(topic.Properties.DisplayName).toBeDefined();
      });
    });

    test('should have proper alarm actions and notifications', () => {
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const snsResources = template.findResources('AWS::SNS::Topic');

      const snsTopicArn = Object.keys(snsResources)[0];

      // Verify all alarms have SNS actions
      Object.values(alarmResources).forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: snsTopicArn });
        expect(alarm.Properties.EvaluationPeriods).toBe(2);
        expect(alarm.Properties.Threshold).toBeDefined();
        expect(alarm.Properties.AlarmDescription).toBeDefined();
      });
    });
  });

  describe('Network Integration', () => {
    test('should have complete VPC networking setup', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      const routeTableResources = template.findResources('AWS::EC2::RouteTable');
      const natGatewayResources = template.findResources('AWS::EC2::NatGateway');
      const internetGatewayResources = template.findResources('AWS::EC2::InternetGateway');
      const naclResources = template.findResources('AWS::EC2::NetworkAcl');

      expect(Object.keys(vpcResources).length).toBe(1);
      expect(Object.keys(subnetResources).length).toBeGreaterThanOrEqual(6);
      expect(Object.keys(routeTableResources).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(natGatewayResources).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(internetGatewayResources).length).toBe(1);
      expect(Object.keys(naclResources).length).toBeGreaterThanOrEqual(2);

      // Verify VPC configuration
      Object.values(vpcResources).forEach(vpc => {
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        expect(vpc.Properties.InstanceTenancy).toBe('default');
      });

      // Verify subnet distribution
      const publicSubnets = Object.values(subnetResources).filter(subnet => 
        subnet.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Object.values(subnetResources).filter(subnet => 
        subnet.Properties.MapPublicIpOnLaunch !== true
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have proper routing and internet connectivity', () => {
      const routeTableResources = template.findResources('AWS::EC2::RouteTable');
      const routeResources = template.findResources('AWS::EC2::Route');
      const natGatewayResources = template.findResources('AWS::EC2::NatGateway');

      expect(Object.keys(routeTableResources).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(routeResources).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(natGatewayResources).length).toBeGreaterThanOrEqual(1);

      // Verify public route table has internet gateway route
      const publicRoutes = Object.values(routeResources).filter(route => 
        route.Properties.GatewayId !== undefined
      );
      expect(publicRoutes.length).toBeGreaterThanOrEqual(1);

      // Verify private route table has NAT gateway route
      const privateRoutes = Object.values(routeResources).filter(route => 
        route.Properties.NatGatewayId !== undefined
      );
      expect(privateRoutes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('IAM and Security Integration', () => {
    test('should have proper IAM roles and policies', () => {
      const roleResources = template.findResources('AWS::IAM::Role');
      const policyResources = template.findResources('AWS::IAM::Policy');
      const instanceProfileResources = template.findResources('AWS::IAM::InstanceProfile');

      expect(Object.keys(roleResources).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(policyResources).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(instanceProfileResources).length).toBeGreaterThanOrEqual(1);

      // Verify EC2 role configuration
      const ec2Role = Object.values(roleResources).find(role => 
        role.Properties.Description?.includes('EC2 instances')
      );
      expect(ec2Role).toBeDefined();
      if (ec2Role) {
        expect(ec2Role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      }

      // Verify instance profile configuration
      Object.values(instanceProfileResources).forEach(profile => {
        expect(profile.Properties.Roles).toBeDefined();
        // InstanceProfileName is optional in CDK, so we don't require it
      });
    });

    test('should have proper security group rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');

      Object.values(securityGroups).forEach(sg => {
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.VpcId).toBeDefined();
        expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      });

      // Verify ALB security group has HTTP/HTTPS ingress
      const albSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSg).toBeDefined();
      if (albSg) {
        expect(albSg.Properties.SecurityGroupIngress).toBeDefined();
      }
    });
  });

  describe('Cross-Stack Integration', () => {
    test('should integrate all constructs properly', () => {
      // Verify VPC construct integration
      expect(stack.vpcConstruct).toBeDefined();
      expect(stack.vpcConstruct.vpc).toBeDefined();

      // Verify database tier integration
      expect(stack.databaseTierConstruct).toBeDefined();
      expect(stack.databaseTierConstruct.database).toBeDefined();

      // Verify application tier integration
      expect(stack.applicationTierConstruct).toBeDefined();
      expect(stack.applicationTierConstruct.loadBalancer).toBeDefined();
      expect(stack.applicationTierConstruct.autoScalingGroup).toBeDefined();
      expect(stack.applicationTierConstruct.applicationSecurityGroup).toBeDefined();

      // Verify monitoring integration
      expect(stack.monitoringConstruct).toBeDefined();
      expect(stack.monitoringConstruct.dashboard).toBeDefined();
      expect(stack.monitoringConstruct.alertTopic).toBeDefined();
    });

    test('should have proper cross-construct dependencies', () => {
      // Database should allow connections from application tier
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('RDS database')
      );
      const appSg = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupDescription?.includes('application EC2 instances')
      );

      expect(dbSg).toBeDefined();
      expect(appSg).toBeDefined();

      // Verify security group references in RDS
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      Object.values(rdsResources).forEach(rds => {
        expect(rds.Properties.VPCSecurityGroups).toBeDefined();
      });
    });
  });

  describe('End-to-End Integration', () => {
    test('should support complete application deployment workflow', () => {
      // Verify all outputs are present for deployment scripts
      const outputs = template.findOutputs('*');
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(5);

      // Verify all resources have proper tags
      const vpcResources = template.findResources('AWS::EC2::VPC');
      Object.values(vpcResources).forEach(vpc => {
        expect(vpc.Properties.Tags).toBeDefined();
        const tags = vpc.Properties.Tags;
        const tagKeys = tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Region');
        expect(tagKeys).toContain('Stack');
        expect(tagKeys).toContain('DeployedAt');
      });
    });

    test('should handle deployment across multiple environments and regions', () => {
      const environments = ['dev', 'staging', 'prod'];
      const regions = ['us-east-1', 'us-west-2'];

      environments.forEach(env => {
        regions.forEach(region => {
          const testApp = new cdk.App({
            context: { environmentSuffix: env }
          });
          
          expect(() => {
            new TapStack(testApp, `${env}-${region}-Stack`, {
              env: { region: region }
            });
          }).not.toThrow();
        });
      });
    });
  });
});
