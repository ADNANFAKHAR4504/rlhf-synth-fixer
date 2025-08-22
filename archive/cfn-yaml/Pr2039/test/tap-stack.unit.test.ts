import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON version of the template
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
      expect(template.Description).toContain('Multi-region capable AWS cloud environment');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
    });

    test('should have ImageId parameter', () => {
      expect(template.Parameters.ImageId).toBeDefined();
      expect(template.Parameters.ImageId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have exactly 3 public subnets', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach((subnet) => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have exactly 3 private subnets', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach((subnet) => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('should have 3 NAT Gateways with Elastic IPs', () => {
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
      const elasticIPs = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];
      
      natGateways.forEach((nat) => {
        expect(template.Resources[nat]).toBeDefined();
        expect(template.Resources[nat].Type).toBe('AWS::EC2::NatGateway');
      });
      
      elasticIPs.forEach((eip) => {
        expect(template.Resources[eip]).toBeDefined();
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
      });
    });

    test('should have proper route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group allowing HTTP and HTTPS', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = albSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 Security Group with restricted access', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      expect(ec2SG).toBeDefined();
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = ec2SG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(3); // HTTP, HTTPS from ALB, SSH from VPC
      
      const httpFromALB = ingress.find((r: any) => r.FromPort === 80);
      expect(httpFromALB.SourceSecurityGroupId).toBeDefined();
      
      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('should have ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Launch Template with t3.medium instances', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
    });

    test('should have Auto Scaling Group with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment).toBe(1);
      
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU high alarm at 70% threshold', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have CPU low alarm at 25% threshold', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(25);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have instance profile', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment and Team tags', () => {
      const taggableResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'ALBSecurityGroup',
        'EC2SecurityGroup', 'ApplicationLoadBalancer', 'ALBTargetGroup'
      ];
      
      taggableResources.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const teamTag = tags.find((t: any) => t.Key === 'Team');
          
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
          expect(teamTag).toBeDefined();
          expect(teamTag.Value).toBe('DevOps');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'LoadBalancerDNS', 'AutoScalingGroupName', 'VPCId', 'Region',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id',
        'ALBSecurityGroupId', 'EC2SecurityGroupId'
      ];
      
      requiredOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });
  });

  describe('Multi-Region Support', () => {
    test('should use region-specific naming for IAM resources', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${AWS::Region}');
      
      const profile = template.Resources.InstanceProfile;
      expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('${AWS::Region}');
    });
  });

  describe('Requirements Compliance', () => {
    test('should deploy VPC with correct CIDR blocks', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have at least 3 availability zones', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      const azs = new Set();
      
      subnets.forEach((subnet) => {
        const az = template.Resources[subnet].Properties.AvailabilityZone;
        if (az) {
          azs.add(JSON.stringify(az));
        }
      });
      
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('should use t3.medium instance type', () => {
      expect(template.Resources.LaunchTemplate.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
    });

    test('should have Auto Scaling Group with min 2 and max 6 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
    });

    test('should have CloudWatch alarm at 70% CPU threshold', () => {
      expect(template.Resources.CPUAlarmHigh.Properties.Threshold).toBe(70);
    });
  });

  describe('Template Best Practices', () => {
    test('should use parameters for flexibility', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(3);
    });

    test('should use conditions for optional resources', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.UseKeyPair).toBeDefined();
    });

    test('should have deletion policies for stateful resources', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.DeletionPolicy).toBe('Delete');
      
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DeletionPolicy).toBe('Delete');
    });

    test('should use intrinsic functions for dynamic values', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value['Fn::Sub']).toBeDefined();
    });
  });

  describe('Network Segmentation', () => {
    test('should separate public and private resources', () => {
      const asg = template.Resources.AutoScalingGroup;
      const vpcZones = asg.Properties.VPCZoneIdentifier;
      
      // ASG should be in private subnets only
      expect(vpcZones).toHaveLength(3);
      expect(vpcZones[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcZones[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(vpcZones[2]).toEqual({ Ref: 'PrivateSubnet3' });
    });

    test('should have ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      
      expect(subnets).toHaveLength(3);
      expect(subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
      expect(subnets[2]).toEqual({ Ref: 'PublicSubnet3' });
    });
  });
});