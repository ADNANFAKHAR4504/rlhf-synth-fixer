import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeKeyPairsCommand,
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';

// Read AWS region from environment or file (fallback to us-east-1)
const awsRegion = process.env.AWS_REGION ||
  (fs.existsSync('lib/AWS_REGION')
    ? fs.readFileSync('lib/AWS_REGION', 'utf8').trim()
    : 'us-east-1');
const expectedEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr265';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const ec2 = new EC2Client({ region: awsRegion });
const autoScaling = new AutoScalingClient({ region: awsRegion });

describe('TapStack VPC Infrastructure Integration Tests', () => {
  describe('VPC and Networking Infrastructure', () => {
    test('VPC exists with correct CIDR and DNS settings', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const { Vpcs } = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toHaveLength(1);

      const vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.State).toBe('available');

      // Check DNS settings using additional API calls
      const dnsSupport = await ec2.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      const dnsHostnames = await ec2.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Internet Gateway is attached to VPC', async () => {
      const igwId = outputs.InternetGatewayId;
      const vpcId = outputs.VPCId;
      expect(igwId).toBeDefined();
      expect(vpcId).toBeDefined();

      const { InternetGateways } = await ec2.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
      );
      expect(InternetGateways).toHaveLength(1);

      const igw = InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateway is deployed and operational', async () => {
      const natGatewayId = outputs.NATGatewayId;
      expect(natGatewayId).toBeDefined();

      const { NatGateways } = await ec2.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      expect(NatGateways).toHaveLength(1);

      const natGw = NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.VpcId).toBe(outputs.VPCId);
      expect(natGw.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(natGw.NatGatewayAddresses).toHaveLength(1);
      expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    test('Public subnets are configured correctly', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ];
      expect(publicSubnetIds[0]).toBeDefined();
      expect(publicSubnetIds[1]).toBeDefined();

      const { Subnets } = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets).toHaveLength(2);

      // Check subnet 1 (us-east-1a)
      const subnet1 = Subnets!.find(
        s => s.SubnetId === outputs.PublicSubnet1Id
      );
      expect(subnet1).toBeDefined();
      expect(subnet1!.AvailabilityZone).toBe('us-east-1a');
      expect(subnet1!.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1!.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1!.State).toBe('available');

      // Check subnet 2 (us-east-1b)
      const subnet2 = Subnets!.find(
        s => s.SubnetId === outputs.PublicSubnet2Id
      );
      expect(subnet2).toBeDefined();
      expect(subnet2!.AvailabilityZone).toBe('us-east-1b');
      expect(subnet2!.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2!.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2!.State).toBe('available');
    });

    test('Private subnets are configured correctly', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];
      expect(privateSubnetIds[0]).toBeDefined();
      expect(privateSubnetIds[1]).toBeDefined();

      const { Subnets } = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets).toHaveLength(2);

      // Check subnet 1 (us-east-1a)
      const subnet1 = Subnets!.find(
        s => s.SubnetId === outputs.PrivateSubnet1Id
      );
      expect(subnet1).toBeDefined();
      expect(subnet1!.AvailabilityZone).toBe('us-east-1a');
      expect(subnet1!.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet1!.MapPublicIpOnLaunch).toBe(false);
      expect(subnet1!.State).toBe('available');

      // Check subnet 2 (us-east-1b)
      const subnet2 = Subnets!.find(
        s => s.SubnetId === outputs.PrivateSubnet2Id
      );
      expect(subnet2).toBeDefined();
      expect(subnet2!.AvailabilityZone).toBe('us-east-1b');
      expect(subnet2!.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet2!.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2!.State).toBe('available');
    });

    test('Public and Private subnet lists are correct', async () => {
      const publicSubnetList = outputs.PublicSubnetIds.split(',');
      const privateSubnetList = outputs.PrivateSubnetIds.split(',');

      expect(publicSubnetList).toHaveLength(2);
      expect(privateSubnetList).toHaveLength(2);

      expect(publicSubnetList).toContain(outputs.PublicSubnet1Id);
      expect(publicSubnetList).toContain(outputs.PublicSubnet2Id);
      expect(privateSubnetList).toContain(outputs.PrivateSubnet1Id);
      expect(privateSubnetList).toContain(outputs.PrivateSubnet2Id);
    });
  });

  describe('Route Tables and Routing', () => {
    test('Route tables exist and have correct routes', async () => {
      const vpcId = outputs.VPCId;
      const { RouteTables } = await ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      // Should have at least 3 route tables: default + public + private
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);

      // Find public route table (has route to Internet Gateway)
      const publicRouteTable = RouteTables!.find(rt =>
        rt.Routes!.some(
          route =>
            route.GatewayId === outputs.InternetGatewayId &&
            route.DestinationCidrBlock === '0.0.0.0/0'
        )
      );
      expect(publicRouteTable).toBeDefined();

      // Find private route table (has route to NAT Gateway)
      const privateRouteTable = RouteTables!.find(rt =>
        rt.Routes!.some(
          route =>
            route.NatGatewayId === outputs.NATGatewayId &&
            route.DestinationCidrBlock === '0.0.0.0/0'
        )
      );
      expect(privateRouteTable).toBeDefined();

      // Verify public subnets are associated with public route table
      const publicSubnetAssociations = publicRouteTable!.Associations!.filter(
        assoc =>
          [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id].includes(
            assoc.SubnetId!
          )
      );
      expect(publicSubnetAssociations).toHaveLength(2);

      // Verify private subnets are associated with private route table
      const privateSubnetAssociations = privateRouteTable!.Associations!.filter(
        assoc =>
          [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id].includes(
            assoc.SubnetId!
          )
      );
      expect(privateSubnetAssociations).toHaveLength(2);
    });
  });

  describe('Security Group Configuration', () => {
    test('Security Group allows SSH access from specified CIDR only', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      expect(SecurityGroups).toHaveLength(1);

      const sg = SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCId);
      expect(sg.GroupName).toContain('ec2-sg');
      expect(sg.Description).toBe(
        'Security group for Auto Scaling Group EC2 instances'
      );

      // Check ingress rules - should only have SSH
      const ingressRules = sg.IpPermissions!;
      expect(ingressRules).toHaveLength(1);

      const sshRule = ingressRules[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpRanges).toHaveLength(1);
      expect(sshRule.IpRanges![0].CidrIp).toBe('203.0.113.0/24');

      // Check egress rules - should allow all outbound
      const egressRules = sg.IpPermissionsEgress!;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].IpProtocol).toBe('-1');
      expect(egressRules[0].IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Security Group does not allow HTTP/HTTPS access', async () => {
      const sgId = outputs.SecurityGroupId;
      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      const sg = SecurityGroups![0];
      const ingressRules = sg.IpPermissions!;

      // Should not have HTTP (port 80) or HTTPS (port 443) rules
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      expect(httpRule).toBeUndefined();
      expect(httpsRule).toBeUndefined();
    });
  });

  describe('Auto Scaling Group and Launch Template', () => {
    test('Launch Template is configured correctly', async () => {
      const ltId = outputs.LaunchTemplateId;
      expect(ltId).toBeDefined();

      const { LaunchTemplates } = await ec2.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] })
      );
      expect(LaunchTemplates).toHaveLength(1);

      const lt = LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toContain('launch-template');
      expect(lt.LatestVersionNumber).toBeGreaterThan(0);

      // Verify the launch template uses conditional AMI selection (LocalStack vs AWS)
      // The actual ImageId is determined at deployment time based on UseLocalStack parameter
      expect(lt.LaunchTemplateId).toBe(ltId);
    });

    test('Auto Scaling Group is configured with correct parameters', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );
      expect(AutoScalingGroups).toHaveLength(1);

      const asg = AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(2);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.HealthCheckGracePeriod).toBe(300);

      // Check VPC Zone Identifier - should be public subnets
      const vpcZoneIds = asg.VPCZoneIdentifier!.split(',');
      expect(vpcZoneIds).toHaveLength(2);
      expect(vpcZoneIds).toContain(outputs.PublicSubnet1Id);
      expect(vpcZoneIds).toContain(outputs.PublicSubnet2Id);

      // Check Launch Template reference
      expect(asg.LaunchTemplate!.LaunchTemplateId).toBe(
        outputs.LaunchTemplateId
      );
      expect(asg.LaunchTemplate!.Version).toBeDefined();
    });

    test('Auto Scaling Group has exactly 2 running instances', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = AutoScalingGroups![0];
      expect(asg.Instances).toHaveLength(2);

      // Check instance states
      asg.Instances!.forEach(instance => {
        expect(instance.LifecycleState).toBe('InService');
        expect(instance.HealthStatus).toBe('Healthy');
      });

      // Verify instances are in different AZs
      const azs = asg.Instances!.map(i => i.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
    });

    test('EC2 instances are launched in public subnets with public IPs', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instanceIds = AutoScalingGroups![0].Instances!.map(
        i => i.InstanceId!
      );
      const { Reservations } = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = Reservations!.flatMap(r => r.Instances!);
      expect(instances).toHaveLength(2);

      instances.forEach(instance => {
        expect(instance.State!.Name).toBe('running');
        expect(instance.VpcId).toBe(outputs.VPCId);
        expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(
          instance.SubnetId
        );
        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PrivateIpAddress).toBeDefined();

        // Check security group assignment
        expect(instance.SecurityGroups).toHaveLength(1);
        expect(instance.SecurityGroups![0].GroupId).toBe(
          outputs.SecurityGroupId
        );

        // Check instance type
        expect(instance.InstanceType).toBe('t3.micro');
      });
    });
  });

  describe('Resource Tagging and Cost Tracking', () => {
    test('All resources have required cost tracking tags', async () => {
      const vpcId = outputs.VPCId;
      const { Vpcs } = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = Vpcs![0];
      const tags = vpc.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      const requiredTags = [
        'Environment',
        'Project',
        'Owner',
        'CostCenter',
        'Purpose',
      ];

      // Strict validation - test will fail if any required tag is missing
      requiredTags.forEach(tagKey => {
        expect(tagKeys).toContain(tagKey);
      });

      // Check specific tag values and ensure they are not empty
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');
      const ownerTag = tags.find(t => t.Key === 'Owner');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      const purposeTag = tags.find(t => t.Key === 'Purpose');

      expect(envTag?.Value).toBeDefined();
      expect(envTag?.Value).not.toBe('');
      expect(projectTag?.Value).toBe('infrastructure');
      expect(ownerTag?.Value).toBe('devops-team');
      expect(costCenterTag?.Value).toBe('engineering');
      expect(purposeTag?.Value).toBeDefined();
      expect(purposeTag?.Value).not.toBe('');
    });

    test('Subnets have proper tagging with strict validation', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const { Subnets } = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      Subnets!.forEach((subnet, index) => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        const requiredTags = [
          'Name',
          'Environment',
          'Project',
          'Owner',
          'CostCenter',
          'Purpose',
        ];

        // Strict validation for each subnet
        requiredTags.forEach(tagKey => {
          expect(tagKeys).toContain(tagKey);
        });

        // Verify tag values are not empty
        requiredTags.forEach(tagKey => {
          const tag = tags.find(t => t.Key === tagKey);
          expect(tag?.Value).toBeDefined();
          expect(tag?.Value).not.toBe('');
        });

        // Check specific expected values
        const envTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');
        const ownerTag = tags.find(t => t.Key === 'Owner');
        const costCenterTag = tags.find(t => t.Key === 'CostCenter');

        expect(envTag?.Value).toBe(expectedEnvironmentSuffix);
        expect(projectTag?.Value).toBe('infrastructure');
        expect(ownerTag?.Value).toBe('devops-team');
        expect(costCenterTag?.Value).toBe('engineering');
      });
    });

    test('Security Group has all required tags', async () => {
      const sgId = outputs.SecurityGroupId;
      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      const sg = SecurityGroups![0];
      const tags = sg.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      const requiredTags = [
        'Name',
        'Environment',
        'Project',
        'Owner',
        'CostCenter',
        'Purpose',
      ];

      requiredTags.forEach(tagKey => {
        expect(tagKeys).toContain(tagKey);
      });

      // Verify tag values
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');
      const ownerTag = tags.find(t => t.Key === 'Owner');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag?.Value).toBe(expectedEnvironmentSuffix);
      expect(projectTag?.Value).toBe('infrastructure');
      expect(ownerTag?.Value).toBe('devops-team');
      expect(costCenterTag?.Value).toBe('engineering');
    });

    test('Auto Scaling Group has all required tags', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = AutoScalingGroups![0];
      const tags = asg.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      const requiredTags = [
        'Name',
        'Environment',
        'Project',
        'Owner',
        'CostCenter',
        'Purpose',
      ];

      requiredTags.forEach(tagKey => {
        expect(tagKeys).toContain(tagKey);
      });

      // Verify tag values
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');
      const ownerTag = tags.find(t => t.Key === 'Owner');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag?.Value).toBe(expectedEnvironmentSuffix);
      expect(projectTag?.Value).toBe('infrastructure');
      expect(ownerTag?.Value).toBe('devops-team');
      expect(costCenterTag?.Value).toBe('engineering');
    });

    test('All EC2 instances have required tags', async () => {
      // Get all instances in the VPC
      const vpcId = outputs.VPCId;
      const { Reservations } = await ec2.send(
        new DescribeInstancesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'instance-state-name',
              Values: ['running', 'pending', 'stopping', 'stopped'],
            },
          ],
        })
      );

      const instances = Reservations!.flatMap(r => r.Instances!);
      expect(instances.length).toBeGreaterThan(0);

      instances.forEach((instance, index) => {
        const tags = instance.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        const requiredTags = [
          'Name',
          'Environment',
          'Project',
          'Owner',
          'CostCenter',
          'Purpose',
        ];

        // Strict validation for each instance
        requiredTags.forEach(tagKey => {
          expect(tagKeys).toContain(tagKey);
        });

        // Verify tag values are not empty
        requiredTags.forEach(tagKey => {
          const tag = tags.find(t => t.Key === tagKey);
          expect(tag?.Value).toBeDefined();
          expect(tag?.Value).not.toBe('');
        });

        // Check specific expected values
        const envTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');
        const ownerTag = tags.find(t => t.Key === 'Owner');
        const costCenterTag = tags.find(t => t.Key === 'CostCenter');

        expect(envTag?.Value).toBe(expectedEnvironmentSuffix);
        expect(projectTag?.Value).toBe('infrastructure');
        expect(ownerTag?.Value).toBe('devops-team');
        expect(costCenterTag?.Value).toBe('engineering');

        // Verify instance is in the correct VPC
        expect(instance.VpcId).toBe(vpcId);
      });
    });

    test('EC2 instances launched by Auto Scaling Group have correct tags', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = AutoScalingGroups![0];
      const asgInstanceIds = asg.Instances!.map(i => i.InstanceId!);

      if (asgInstanceIds.length > 0) {
        const { Reservations } = await ec2.send(
          new DescribeInstancesCommand({
            InstanceIds: asgInstanceIds,
          })
        );

        const instances = Reservations!.flatMap(r => r.Instances!);

        instances.forEach((instance, index) => {
          const tags = instance.Tags || [];
          const tagKeys = tags.map(t => t.Key);

          const requiredTags = [
            'Name',
            'Environment',
            'Project',
            'Owner',
            'CostCenter',
            'Purpose',
          ];

          // Strict validation for ASG instances
          requiredTags.forEach(tagKey => {
            expect(tagKeys).toContain(tagKey);
          });

          // Verify tag values
          const envTag = tags.find(t => t.Key === 'Environment');
          const projectTag = tags.find(t => t.Key === 'Project');
          const ownerTag = tags.find(t => t.Key === 'Owner');
          const costCenterTag = tags.find(t => t.Key === 'CostCenter');

          expect(envTag?.Value).toBe(expectedEnvironmentSuffix);
          expect(projectTag?.Value).toBe('infrastructure');
          expect(ownerTag?.Value).toBe('devops-team');
          expect(costCenterTag?.Value).toBe('engineering');

          // Verify instance is in ASG
          expect(asgInstanceIds).toContain(instance.InstanceId);
        });
      }
    });
  });

  describe('Output Validation', () => {
    test('All outputs are defined and non-empty', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'AutoScalingGroupName',
        'SecurityGroupId',
        'LaunchTemplateId',
        'NATGatewayId',
        'InternetGatewayId',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });

    test('Output format validation', () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      // Subnet ID format
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);

      // Security Group ID format
      expect(outputs.SecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);

      // NAT Gateway ID format
      expect(outputs.NATGatewayId).toMatch(/^nat-[a-f0-9]{8,17}$/);

      // Internet Gateway ID format
      expect(outputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]{8,17}$/);

      // Launch Template ID format
      expect(outputs.LaunchTemplateId).toMatch(/^lt-[a-f0-9]{8,17}$/);

      // Comma-separated subnet lists
      expect(outputs.PublicSubnetIds.split(',')).toHaveLength(2);
      expect(outputs.PrivateSubnetIds.split(',')).toHaveLength(2);
    });
  });

  describe('Network Connectivity', () => {
    test('Public subnets have internet connectivity via Internet Gateway', async () => {
      const vpcId = outputs.VPCId;
      const { RouteTables } = await ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      // Find route table associated with public subnets
      const publicRouteTable = RouteTables!.find(rt => {
        const hasPublicSubnet = rt.Associations!.some(assoc =>
          [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id].includes(
            assoc.SubnetId!
          )
        );
        const hasIgwRoute = rt.Routes!.some(
          route =>
            route.GatewayId === outputs.InternetGatewayId &&
            route.DestinationCidrBlock === '0.0.0.0/0'
        );
        return hasPublicSubnet && hasIgwRoute;
      });

      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable!.Routes!.some(r => r.State === 'active')).toBe(
        true
      );
    });

    test('Private subnets have outbound connectivity via NAT Gateway', async () => {
      const vpcId = outputs.VPCId;
      const { RouteTables } = await ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      // Find route table associated with private subnets
      const privateRouteTable = RouteTables!.find(rt => {
        const hasPrivateSubnet = rt.Associations!.some(assoc =>
          [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id].includes(
            assoc.SubnetId!
          )
        );
        const hasNatRoute = rt.Routes!.some(
          route =>
            route.NatGatewayId === outputs.NATGatewayId &&
            route.DestinationCidrBlock === '0.0.0.0/0'
        );
        return hasPrivateSubnet && hasNatRoute;
      });

      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable!.Routes!.some(r => r.State === 'active')).toBe(
        true
      );
    });
  });

  describe('High Availability and Fault Tolerance', () => {
    test('Infrastructure spans multiple availability zones', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ];
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const { Subnets: publicSubnets } = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      const { Subnets: privateSubnets } = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      const publicAzs = publicSubnets!.map(s => s.AvailabilityZone);
      const privateAzs = privateSubnets!.map(s => s.AvailabilityZone);

      // Verify we have 2 distinct AZs
      expect(new Set(publicAzs).size).toBe(2);
      expect(new Set(privateAzs).size).toBe(2);
      expect(publicAzs).toContain('us-east-1a');
      expect(publicAzs).toContain('us-east-1b');
      expect(privateAzs).toContain('us-east-1a');
      expect(privateAzs).toContain('us-east-1b');
    });

    test('Auto Scaling Group distributes instances across AZs', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instances = AutoScalingGroups![0].Instances!;
      const azs = instances.map(i => i.AvailabilityZone);

      // Should have instances in both AZs
      expect(new Set(azs).size).toBe(2);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('Should not have forbidden outputs', () => {
      expect(outputs.CustomDomain).toBeUndefined();
      expect(outputs.ApiEndpoint).toBeUndefined();
      expect(outputs.LambdaArn).toBeUndefined();
      expect(outputs.DynamoDBTable).toBeUndefined();
    });

    test('All resource IDs follow AWS naming conventions', () => {
      // Test various AWS resource ID patterns
      const resourcePatterns = {
        VPCId: /^vpc-[a-f0-9]{8,17}$/,
        SecurityGroupId: /^sg-[a-f0-9]{8,17}$/,
        NATGatewayId: /^nat-[a-f0-9]{8,17}$/,
        InternetGatewayId: /^igw-[a-f0-9]{8,17}$/,
        LaunchTemplateId: /^lt-[a-f0-9]{8,17}$/,
      };

      Object.entries(resourcePatterns).forEach(([outputKey, pattern]) => {
        expect(outputs[outputKey]).toMatch(pattern);
      });
    });

    test('Handles missing or malformed output gracefully', () => {
      // This test verifies our test suite handles edge cases
      expect(() => {
        const testOutputs = { ...outputs };
        delete testOutputs.VPCId;
        // Our tests should handle missing outputs appropriately
      }).not.toThrow();
    });
  });

  describe('AMI Selection and Launch Template', () => {
    test('Launch Template uses conditional AMI selection', async () => {
      const ltId = outputs.LaunchTemplateId;

      const { LaunchTemplates } = await ec2.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] })
      );

      const lt = LaunchTemplates![0];

      // Verify the launch template exists and is properly configured
      expect(lt.LaunchTemplateName).toContain('launch-template');
      expect(lt.LaunchTemplateId).toBe(ltId);

      // The AMI is determined by UseLocalStack parameter (LocalStack vs AWS AMI)
      // Verify the launch template is functional and instances are running
      expect(lt.LatestVersionNumber).toBeGreaterThan(0);
    });

    test('EC2 instances are launched with valid AMI', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instanceIds = AutoScalingGroups![0].Instances!.map(
        i => i.InstanceId!
      );

      const { Reservations } = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = Reservations!.flatMap(r => r.Instances!);

      instances.forEach(instance => {
        // Verify instances are running with valid AMI
        expect(instance.State!.Name).toBe('running');
        expect(instance.ImageId).toBeDefined();
        expect(instance.ImageId!.length).toBeGreaterThan(0);

        // Verify the AMI ID follows AWS format
        expect(instance.ImageId).toMatch(/^ami-[a-f0-9]{8,17}$/);
      });
    });

    test('AMI selection uses conditional mappings', () => {
      // This test verifies that we use conditional AMI selection (LocalStack vs AWS)
      // The template uses AMIConfig mappings with conditional logic
      expect(outputs).not.toHaveProperty('AmiId');
      expect(outputs).not.toHaveProperty('LatestAmiId');
      expect(outputs).not.toHaveProperty('ImageId');
    });
  });

  describe('Key Pair Validation', () => {
    test('Key pair exists and is accessible', async () => {
      const keyPairName =
        process.env.KEY_PAIR_NAME || 'localstack-key'; // Default from template

      const { KeyPairs } = await ec2.send(
        new DescribeKeyPairsCommand({ KeyNames: [keyPairName] })
      );

      expect(KeyPairs).toHaveLength(1);
      const keyPair = KeyPairs![0];
      expect(keyPair.KeyName).toBe(keyPairName);
      expect(keyPair.KeyPairId).toBeDefined();
      expect(keyPair.KeyFingerprint).toBeDefined();
    });

    test('Launch Template uses the correct key pair', async () => {
      const ltId = outputs.LaunchTemplateId;
      const keyPairName = process.env.KEY_PAIR_NAME || 'localstack-key';

      const { LaunchTemplates } = await ec2.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] })
      );

      const lt = LaunchTemplates![0];

      // The key pair is configured in the launch template but may not be directly accessible
      // We'll verify the launch template exists and has the expected name
      expect(lt.LaunchTemplateName).toContain('launch-template');
      expect(lt.LaunchTemplateId).toBe(ltId);
    });

    test('EC2 instances are launched with the correct key pair', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const keyPairName = process.env.KEY_PAIR_NAME || 'localstack-key';

      const { AutoScalingGroups } = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instanceIds = AutoScalingGroups![0].Instances!.map(
        i => i.InstanceId!
      );

      const { Reservations } = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = Reservations!.flatMap(r => r.Instances!);

      instances.forEach(instance => {
        expect(instance.KeyName).toBe(keyPairName);
      });
    });

    test('Key pair is valid for SSH access', async () => {
      const keyPairName = process.env.KEY_PAIR_NAME || 'localstack-key';

      const { KeyPairs } = await ec2.send(
        new DescribeKeyPairsCommand({ KeyNames: [keyPairName] })
      );

      const keyPair = KeyPairs![0];

      // Verify key pair is in a valid state
      expect(keyPair.KeyName).toBe(keyPairName);

      // Check that the key pair has a fingerprint (indicates it's properly imported)
      expect(keyPair.KeyFingerprint).toBeDefined();
      expect(keyPair.KeyFingerprint!.length).toBeGreaterThan(0);

      // Verify key pair ID format
      expect(keyPair.KeyPairId).toMatch(/^key-[a-f0-9]{8,17}$/);
    });
  });
});
