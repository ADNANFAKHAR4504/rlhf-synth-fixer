import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description.trim()).toBe(
        'CloudFormation template to deploy a high-availability web application in us-west-2'
      );
    });
  });

  describe('Parameters', () => {
    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('LatestAmiId parameter should have correct properties', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(amiParam.Description).toBe('Latest Amazon Linux 2 AMI ID from SSM');
    });
  });

  describe('VPC Resources', () => {
    test('should have ProdVPC resource', () => {
      expect(template.Resources.ProdVPC).toBeDefined();
      const vpc = template.Resources.ProdVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have two public subnets', () => {
      expect(template.Resources.ProdPublicSubnet1).toBeDefined();
      expect(template.Resources.ProdPublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.ProdPublicSubnet1;
      const subnet2 = template.Resources.ProdPublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have internet gateway', () => {
      expect(template.Resources.ProdInternetGateway).toBeDefined();
      expect(template.Resources.ProdIGWAttachment).toBeDefined();
      
      const igw = template.Resources.ProdInternetGateway;
      const attachment = template.Resources.ProdIGWAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have route table and routes', () => {
      expect(template.Resources.ProdRouteTable).toBeDefined();
      expect(template.Resources.ProdRoute).toBeDefined();
      expect(template.Resources.ProdSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.ProdSubnet2RouteTableAssociation).toBeDefined();
      
      const routeTable = template.Resources.ProdRouteTable;
      const route = template.Resources.ProdRoute;
      
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ProdALBSecurityGroup).toBeDefined();
      
      const albSG = template.Resources.ProdALBSecurityGroup;
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.GroupDescription).toBe('Allow HTTP traffic from the internet');
      
      const ingressRule = albSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.ToPort).toBe(80);
      expect(ingressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.ProdEC2SecurityGroup).toBeDefined();
      
      const ec2SG = template.Resources.ProdEC2SecurityGroup;
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2SG.Properties.GroupDescription).toBe('Allow HTTP traffic from ALB');
      
      const ingressRule = ec2SG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.ToPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'ProdALBSecurityGroup' });
    });
  });

  describe('EC2 Instances', () => {
    test('should have two EC2 instances', () => {
      expect(template.Resources.ProdInstance1).toBeDefined();
      expect(template.Resources.ProdInstance2).toBeDefined();
      
      const instance1 = template.Resources.ProdInstance1;
      const instance2 = template.Resources.ProdInstance2;
      
      expect(instance1.Type).toBe('AWS::EC2::Instance');
      expect(instance2.Type).toBe('AWS::EC2::Instance');
      expect(instance1.Properties.InstanceType).toBe('t2.micro');
      expect(instance2.Properties.InstanceType).toBe('t2.micro');
      
      // Instances should be in different subnets
      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'ProdPublicSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'ProdPublicSubnet2' });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ProdLoadBalancer).toBeDefined();
      
      const alb = template.Resources.ProdLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Name).toBe('ProdLoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have target group', () => {
      expect(template.Resources.ProdTargetGroup).toBeDefined();
      
      const targetGroup = template.Resources.ProdTargetGroup;
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Name).toBe('ProdTargetGroup');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.Targets).toHaveLength(2);
    });

    test('should have listener', () => {
      expect(template.Resources.ProdListener).toBeDefined();
      
      const listener = template.Resources.ProdListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.LoadBalancerDNSName).toBeDefined();
      expect(outputs.EC2Instance1Id).toBeDefined();
      expect(outputs.EC2Instance2Id).toBeDefined();
    });

    test('VpcId output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('ID of the created VPC');
      expect(output.Value).toEqual({ Ref: 'ProdVPC' });
      expect(output.Export.Name).toBe('ProdVpcId');
    });

    test('LoadBalancerDNSName output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNSName;
      expect(output.Description).toBe('DNS name of the ALB');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ProdLoadBalancer', 'DNSName'] });
      expect(output.Export.Name).toBe('ProdLoadBalancerDNS');
    });

    test('EC2 instance outputs should be correct', () => {
      const instance1Output = template.Outputs.EC2Instance1Id;
      const instance2Output = template.Outputs.EC2Instance2Id;
      
      expect(instance1Output.Description).toBe('EC2 Instance ID for ProdInstance1');
      expect(instance1Output.Value).toEqual({ Ref: 'ProdInstance1' });
      
      expect(instance2Output.Description).toBe('EC2 Instance ID for ProdInstance2');
      expect(instance2Output.Value).toEqual({ Ref: 'ProdInstance2' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16); // VPC, 2 subnets, IGW, attachment, route table, route, 2 associations, 2 SGs, 2 instances, ALB, target group, listener
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use Prod prefix', () => {
      const resourceNames = Object.keys(template.Resources);
      const prodPrefixedResources = resourceNames.filter(name => name.startsWith('Prod'));
      expect(prodPrefixedResources.length).toBe(resourceNames.length);
    });

    test('all resources should have Name tags where applicable', () => {
      const resourcesWithTags = [
        'ProdVPC', 'ProdPublicSubnet1', 'ProdPublicSubnet2', 'ProdInternetGateway',
        'ProdRouteTable', 'ProdALBSecurityGroup', 'ProdEC2SecurityGroup',
        'ProdInstance1', 'ProdInstance2', 'ProdLoadBalancer'
      ];
      
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toBe(resourceName);
      });
    });
  });
});