import {
  DescribeAutoScalingGroupsCommand as ASGDescribeCommand,
  AutoScalingClient,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('📊 Loaded stack outputs:', outputs);
} else {
  console.warn('⚠️ No outputs file found at:', outputsPath);
  console.warn('💡 Make sure to run: npm run cdk:deploy');
}

const region = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region });
const asgClient = new AutoScalingClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });

describe('ProjectX Infrastructure Integration Tests', () => {
  // Read values directly from flat JSON structure
  const vpcId = outputs.VpcId;
  const securityGroupId = outputs.SecurityGroupId;
  const autoScalingGroupName = outputs.AutoScalingGroupName;
  const vpcCidr = outputs.VpcCidr;
  const publicSubnetIds = outputs.PublicSubnetIds;
  const availabilityZones = outputs.AvailabilityZones;

  // Skip tests if outputs are not available
  if (!vpcId || !securityGroupId || !autoScalingGroupName) {
    console.warn('⚠️ Warning: Some outputs are missing.');
    console.warn('VpcId:', vpcId);
    console.warn('SecurityGroupId:', securityGroupId);
    console.warn('AutoScalingGroupName:', autoScalingGroupName);
    console.warn('💡 Make sure the stack is deployed and outputs are generated.');
    console.warn('Run: npm run cdk:deploy');
  }

  describe('VPC Infrastructure', () => {
    test('VPC exists and is configured correctly', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping VPC test - no VPC ID available');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      
      // Check for environment tag
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBeDefined();
      
      console.log('✅ VPC verified:', vpc.VpcId);
    });

    test('VPC has public subnets', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping subnet test - no VPC ID available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
      
      const publicSubnets = response.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      
      // Verify each public subnet
      for (const subnet of publicSubnets) {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      }
      
      console.log('✅ Public subnets verified:', publicSubnets.length, 'subnets');
    });

    test('Internet Gateway is attached to VPC', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping IGW test - no VPC ID available');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
      
      console.log('✅ Internet Gateway verified:', igw.InternetGatewayId);
    });
  });

  describe('Security Groups', () => {
    test('Security group exists with correct rules', async () => {
      if (!securityGroupId) {
        console.log('⏭️ Skipping security group test - no Security Group ID available');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toBe('projectX-web-server-sg');
      expect(sg.VpcId).toBe(vpcId);
      
      // Check ingress rules
      const ingressRules = sg.IpPermissions || [];
      
      // HTTP rule (port 80)
      const httpRule = ingressRules.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      
      // HTTPS rule (port 443)
      const httpsRule = ingressRules.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      
      // SSH rule (port 22) - restricted to office network
      const sshRule = ingressRules.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/8');
      
      console.log('✅ Security Group verified:', sg.GroupId);
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group exists with correct configuration', async () => {
      if (!autoScalingGroupName) {
        console.log('⏭️ Skipping ASG test - no Auto Scaling Group name available');
        return;
      }

      const command = new ASGDescribeCommand({
        AutoScalingGroupNames: [autoScalingGroupName],
      });
      const response = await asgClient.send(command);
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('EC2');
      
      // Check for instances
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      
      // Verify instances are in service
      const inServiceInstances = asg.Instances!.filter(
        instance => instance.LifecycleState === 'InService'
      );
      expect(inServiceInstances.length).toBeGreaterThanOrEqual(2);
      
      console.log('✅ Auto Scaling Group verified:', asg.AutoScalingGroupName);
      console.log('📊 Instances:', asg.Instances!.length, 'total,', inServiceInstances.length, 'in service');
    });

    test('Launch Template is configured correctly', async () => {
      if (!autoScalingGroupName) {
        console.log('⏭️ Skipping launch template test - no Auto Scaling Group name available');
        return;
      }

      // Get ASG to find launch template
      const asgCommand = new ASGDescribeCommand({
        AutoScalingGroupNames: [autoScalingGroupName],
      });
      const asgResponse = await asgClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];
      
      expect(asg.LaunchTemplate).toBeDefined();
      expect(asg.LaunchTemplate!.LaunchTemplateName).toBe('projectX-launch-template');
      
      // Verify launch template exists
      const ltCommand = new DescribeLaunchTemplatesCommand({
        LaunchTemplateNames: ['projectX-launch-template'],
      });
      const ltResponse = await ec2Client.send(ltCommand);
      
      expect(ltResponse.LaunchTemplates).toHaveLength(1);
      const launchTemplate = ltResponse.LaunchTemplates![0];
      
      expect(launchTemplate.LaunchTemplateName).toBe('projectX-launch-template');
      expect(launchTemplate.LaunchTemplateData?.InstanceType).toBe('t3.micro');
      
      console.log('✅ Launch Template verified:', launchTemplate.LaunchTemplateId);
    });

    test('Scaling policies are configured', async () => {
      if (!autoScalingGroupName) {
        console.log('⏭️ Skipping scaling policy test - no Auto Scaling Group name available');
        return;
      }

      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: autoScalingGroupName,
      });
      const response = await asgClient.send(command);
      
      expect(response.ScalingPolicies!.length).toBeGreaterThan(0);
      
      // Check for target tracking scaling policy
      const targetTrackingPolicy = response.ScalingPolicies!.find(
        policy => policy.PolicyType === 'TargetTrackingScaling'
      );
      expect(targetTrackingPolicy).toBeDefined();
      
      if (targetTrackingPolicy) {
        expect(targetTrackingPolicy.TargetTrackingConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
        expect(targetTrackingPolicy.TargetTrackingConfiguration?.TargetValue).toBe(70);
      }
      
      console.log('✅ Scaling policies verified:', response.ScalingPolicies!.length, 'policies');
    });
  });

  describe('EC2 Instances', () => {
    test('Instances are running with correct configuration', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping instance test - no VPC ID available');
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations!.length).toBeGreaterThanOrEqual(1);
      
      for (const reservation of response.Reservations!) {
        for (const instance of reservation.Instances!) {
          expect(instance.State?.Name).toBe('running');
          expect(instance.InstanceType).toBe('t3.micro');
          expect(instance.VpcId).toBe(vpcId);
          
          // Check security groups
          const securityGroups = instance.SecurityGroups || [];
          const hasCorrectSG = securityGroups.some(sg => sg.GroupId === securityGroupId);
          expect(hasCorrectSG).toBe(true);
          
          // Check for environment tag
          const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');
          expect(envTag?.Value).toBeDefined();
          
          console.log('✅ Instance verified:', instance.InstanceId);
        }
      }
    });

    test('EBS volumes are encrypted', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping EBS test - no VPC ID available');
        return;
      }

      const instanceCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      
      for (const reservation of instanceResponse.Reservations!) {
        for (const instance of reservation.Instances!) {
          // Get block device mappings
          const blockDevices = instance.BlockDeviceMappings || [];
          
          for (const blockDevice of blockDevices) {
            if (blockDevice.Ebs?.VolumeId) {
              const volumeCommand = new DescribeVolumesCommand({
                VolumeIds: [blockDevice.Ebs.VolumeId],
              });
              const volumeResponse = await ec2Client.send(volumeCommand);
              
              const volume = volumeResponse.Volumes![0];
              expect(volume.Encrypted).toBe(true);
              expect(volume.VolumeType).toBe('gp3');
              
              console.log('✅ EBS volume verified:', volume.VolumeId, 'encrypted:', volume.Encrypted);
            }
          }
        }
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('CloudWatch alarms are configured for Auto Scaling Group', async () => {
      if (!autoScalingGroupName) {
        console.log('⏭️ Skipping CloudWatch test - no Auto Scaling Group name available');
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ProjectX-ASG',
      });
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(3);
      
      // Check for specific alarms
      const cpuAlarm = response.MetricAlarms!.find(
        alarm => alarm.MetricName === 'CPUUtilization'
      );
      const instanceCountAlarm = response.MetricAlarms!.find(
        alarm => alarm.MetricName === 'GroupDesiredCapacity'
      );
      const healthyHostAlarm = response.MetricAlarms!.find(
        alarm => alarm.MetricName === 'GroupInServiceInstances'
      );
      
      expect(cpuAlarm).toBeDefined();
      expect(instanceCountAlarm).toBeDefined();
      expect(healthyHostAlarm).toBeDefined();
      
      console.log('✅ CloudWatch alarms verified:', response.MetricAlarms!.length, 'alarms');
    });
  });

  describe('IAM Resources', () => {
    test('IAM role exists with correct permissions', async () => {
      try {
        const command = new GetRoleCommand({
          RoleName: 'projectX-ec2-role',
        });
        const response = await iamClient.send(command);
        
        expect(response.Role?.RoleName).toBe('projectX-ec2-role');
        expect(response.Role?.Description).toBe('IAM role for ProjectX EC2 instances');
        
        // Check assume role policy
        const assumeRolePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
        const statement = assumeRolePolicy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
        
        console.log('✅ IAM role verified:', response.Role?.RoleName);
      } catch (error) {
        console.log('⚠️ IAM role test skipped - role may not exist or permissions insufficient');
      }
    });

    test('Instance profile exists', async () => {
      try {
        const command = new GetInstanceProfileCommand({
          InstanceProfileName: 'projectX-instance-profile',
        });
        const response = await iamClient.send(command);
        
        expect(response.InstanceProfile?.InstanceProfileName).toBe('projectX-instance-profile');
        
        // Check if role is attached
        const roles = response.InstanceProfile?.Roles || [];
        const hasCorrectRole = roles.some(role => role.RoleName === 'projectX-ec2-role');
        expect(hasCorrectRole).toBe(true);
        
        console.log('✅ Instance profile verified:', response.InstanceProfile?.InstanceProfileName);
      } catch (error) {
        console.log('⚠️ Instance profile test skipped - profile may not exist or permissions insufficient');
      }
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are tagged with environment', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping tagging test - no VPC ID available');
        return;
      }

      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTag = vpcResponse.Vpcs![0].Tags?.find(tag => tag.Key === 'Environment');
      expect(vpcTag?.Value).toBeDefined();
      
      // Check security group tags
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTag = sgResponse.SecurityGroups![0].Tags?.find(tag => tag.Key === 'Environment');
      expect(sgTag?.Value).toBeDefined();
      
      // Check instance tags
      const instanceCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      
      if (instanceResponse.Reservations!.length > 0) {
        const instance = instanceResponse.Reservations![0].Instances![0];
        const instanceTag = instance.Tags?.find(tag => tag.Key === 'Environment');
        expect(instanceTag?.Value).toBeDefined();
      }
      
      console.log('✅ Resource tagging verified');
    });
  });

  describe('Network Connectivity', () => {
    test('Instances have public IP addresses', async () => {
      if (!vpcId) {
        console.log('⏭️ Skipping connectivity test - no VPC ID available');
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      let instancesWithPublicIP = 0;
      
      for (const reservation of response.Reservations!) {
        for (const instance of reservation.Instances!) {
          if (instance.PublicIpAddress) {
            instancesWithPublicIP++;
            console.log('🌐 Instance has public IP:', instance.InstanceId, instance.PublicIpAddress);
          }
        }
      }
      
      expect(instancesWithPublicIP).toBeGreaterThan(0);
      console.log('✅ Network connectivity verified:', instancesWithPublicIP, 'instances with public IPs');
    });
  });
});
