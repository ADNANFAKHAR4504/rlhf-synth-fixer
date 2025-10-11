import * as fs from 'fs';


const template = JSON.parse(fs.readFileSync('lib/TapStack.json', 'utf8'));


describe('CloudFormation Template Integration', () => {
  test('EC2 Instances reference LaunchTemplate and Subnet', () => {
    for (let i = 1; i <= 10; i++) {
      const instance = template.Resources[`EC2Instance${i}`];
      expect(instance).toBeDefined();
      expect(instance.Properties.LaunchTemplate.LaunchTemplateId.Ref).toBe('EC2LaunchTemplate');
      expect(instance.Properties.SubnetId.Ref).toBe('PublicSubnet');
    }
  });


  test('LaunchTemplate references IAM InstanceProfile and SecurityGroup', () => {
    const lt = template.Resources.EC2LaunchTemplate;
    expect(lt).toBeDefined();
    expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn['Fn::GetAtt'][0]).toBe('EC2InstanceProfile');
    expect(lt.Properties.LaunchTemplateData.SecurityGroupIds[0].Ref).toBe('EC2SecurityGroup');
  });


  test('Subnets are associated with the correct RouteTable', () => {
    const assoc = template.Resources.SubnetRouteTableAssociation;
    expect(assoc.Properties.SubnetId.Ref).toBe('PublicSubnet');
    expect(assoc.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
  });


  test('InternetGateway is attached to VPC before PublicRoute is created', () => {
    const route = template.Resources.PublicRoute;
    expect(route.DependsOn).toBe('AttachGateway');
    expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
    expect(route.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
  });


  test('CloudWatch Alarms reference correct EC2 Instances and SNS Topic', () => {
    for (let i = 1; i <= 10; i++) {
      const alarm = template.Resources[`CPUAlarm${i}`];
      expect(alarm.Properties.Dimensions[0].Value.Ref).toBe(`EC2Instance${i}`);
      expect(alarm.Properties.AlarmActions[0].Ref).toBe('AlarmTopic');
    }
  });


  test('Outputs correctly reference resources', () => {
    expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
    expect(template.Outputs.S3BucketName.Value.Ref).toBe('LogsBucket');
    expect(template.Outputs.CloudWatchLogGroup.Value.Ref).toBe('EC2LogGroup');
    expect(template.Outputs.SNSTopicArn.Value.Ref).toBe('AlarmTopic');
  });
});
