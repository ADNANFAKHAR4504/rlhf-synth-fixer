"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const migration_stack_1 = require("../lib/migration-stack");
const assertions_2 = require("aws-cdk-lib/assertions");
describe('MigrationStack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new cdk.App();
        stack = new migration_stack_1.MigrationStack(app, 'TestMigrationStack', {});
        template = assertions_1.Template.fromStack(stack);
    });
    test('should create a VPC with the correct properties', () => {
        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '192.168.0.0/16',
        });
    });
    test('should create the correct number of subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 6);
    });
    test('should create public subnets', () => {
        const subnets = template.findResources('AWS::EC2::Subnet', {
            Properties: {
                Tags: assertions_2.Match.arrayWith([
                    {
                        Key: 'aws-cdk:subnet-type',
                        Value: 'Public',
                    },
                ]),
            },
        });
        expect(Object.keys(subnets).length).toBe(2);
    });
    test('should create private application subnets', () => {
        const subnets = template.findResources('AWS::EC2::Subnet', {
            Properties: {
                Tags: assertions_2.Match.arrayWith([
                    {
                        Key: 'aws-cdk:subnet-type',
                        Value: 'Private',
                    },
                ]),
            },
        });
        expect(Object.keys(subnets).length).toBe(2);
    });
    test('should create private database subnets', () => {
        const subnets = template.findResources('AWS::EC2::Subnet', {
            Properties: {
                Tags: assertions_2.Match.arrayWith([
                    {
                        Key: 'aws-cdk:subnet-type',
                        Value: 'Isolated',
                    },
                ]),
            },
        });
        expect(Object.keys(subnets).length).toBe(2);
    });
    test('should create NAT gateways', () => {
        template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
    test('should create security groups', () => {
        template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });
    test('should create the ALB security group with the correct rules', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for the Application Load Balancer',
            VpcId: assertions_2.Match.anyValue(),
            SecurityGroupIngress: [
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow HTTP traffic from the internet',
                    FromPort: 80,
                    IpProtocol: 'tcp',
                    ToPort: 80,
                },
            ],
        });
    });
    test('should create the web tier security group with the correct rules', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for the Web Tier EC2 instances',
            VpcId: assertions_2.Match.anyValue(),
            SecurityGroupIngress: [
                {
                    Description: 'Allow HTTP traffic from ALB only',
                    FromPort: 80,
                    IpProtocol: 'tcp',
                    SourceSecurityGroupId: assertions_2.Match.anyValue(),
                    ToPort: 80,
                },
            ],
        });
    });
    test('should create the bastion host security group with the correct rules', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for the Bastion Host',
            VpcId: assertions_2.Match.anyValue(),
            SecurityGroupIngress: [
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow SSH traffic from specified IP',
                    FromPort: 22,
                    IpProtocol: 'tcp',
                    ToPort: 22,
                },
            ],
        });
    });
    test('should create an Auto Scaling Group with the correct properties', () => {
        template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
        template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
            MinSize: '2',
            MaxSize: '4',
            DesiredCapacity: '2',
        });
    });
    test('should create an Application Load Balancer with the correct properties', () => {
        template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
            Scheme: 'internet-facing',
        });
    });
    test('should create a bastion host with the correct properties', () => {
        template.resourceCountIs('AWS::EC2::Instance', 1);
        template.hasResourceProperties('AWS::EC2::Instance', {
            InstanceType: 't3.nano',
        });
    });
    test('should create the correct outputs', () => {
        template.hasOutput('LoadBalancerDNS', {});
        template.hasOutput('BastionHostIP', {});
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbi1zdGFjay51bml0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQWtEO0FBQ2xELDREQUF3RDtBQUV4RCx1REFBK0M7QUFFL0MsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQXFCLENBQUM7SUFDMUIsSUFBSSxRQUFrQixDQUFDO0lBRXZCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxHQUFHLElBQUksZ0NBQWMsQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUQsUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtRQUMzRCxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QyxRQUFRLENBQUMscUJBQXFCLENBQUMsZUFBZSxFQUFFO1lBQzlDLFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1FBQ3ZELFFBQVEsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxh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QW9CLEVBQUU7WUFDbkQsWUFBWSxFQUFFLFNBQVM7U0FDeEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1FBQzdDLFFBQVEsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgTWlncmF0aW9uU3RhY2sgfSBmcm9tICcuLi9saWIvbWlncmF0aW9uLXN0YWNrJztcblxuaW1wb3J0IHsgTWF0Y2ggfSBmcm9tICdhd3MtY2RrLWxpYi9hc3NlcnRpb25zJztcblxuZGVzY3JpYmUoJ01pZ3JhdGlvblN0YWNrJywgKCkgPT4ge1xuICBsZXQgYXBwOiBjZGsuQXBwO1xuICBsZXQgc3RhY2s6IE1pZ3JhdGlvblN0YWNrO1xuICBsZXQgdGVtcGxhdGU6IFRlbXBsYXRlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgc3RhY2sgPSBuZXcgTWlncmF0aW9uU3RhY2soYXBwLCAnVGVzdE1pZ3JhdGlvblN0YWNrJywge30pO1xuICAgIHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBhIFZQQyB3aXRoIHRoZSBjb3JyZWN0IHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkVDMjo6VlBDJywgMSk7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6VlBDJywge1xuICAgICAgQ2lkckJsb2NrOiAnMTkyLjE2OC4wLjAvMTYnLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHRoZSBjb3JyZWN0IG51bWJlciBvZiBzdWJuZXRzJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpFQzI6OlN1Ym5ldCcsIDYpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHB1YmxpYyBzdWJuZXRzJywgKCkgPT4ge1xuICAgIGNvbnN0IHN1Ym5ldHMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6OkVDMjo6U3VibmV0Jywge1xuICAgICAgUHJvcGVydGllczoge1xuICAgICAgICBUYWdzOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEtleTogJ2F3cy1jZGs6c3VibmV0LXR5cGUnLFxuICAgICAgICAgICAgVmFsdWU6ICdQdWJsaWMnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBleHBlY3QoT2JqZWN0LmtleXMoc3VibmV0cykubGVuZ3RoKS50b0JlKDIpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHByaXZhdGUgYXBwbGljYXRpb24gc3VibmV0cycsICgpID0+IHtcbiAgICBjb25zdCBzdWJuZXRzID0gdGVtcGxhdGUuZmluZFJlc291cmNlcygnQVdTOjpFQzI6OlN1Ym5ldCcsIHtcbiAgICAgIFByb3BlcnRpZXM6IHtcbiAgICAgICAgVGFnczogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBLZXk6ICdhd3MtY2RrOnN1Ym5ldC10eXBlJyxcbiAgICAgICAgICAgIFZhbHVlOiAnUHJpdmF0ZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGV4cGVjdChPYmplY3Qua2V5cyhzdWJuZXRzKS5sZW5ndGgpLnRvQmUoMik7XG4gIH0pO1xuXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgcHJpdmF0ZSBkYXRhYmFzZSBzdWJuZXRzJywgKCkgPT4ge1xuICAgIGNvbnN0IHN1Ym5ldHMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6OkVDMjo6U3VibmV0Jywge1xuICAgICAgUHJvcGVydGllczoge1xuICAgICAgICBUYWdzOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEtleTogJ2F3cy1jZGs6c3VibmV0LXR5cGUnLFxuICAgICAgICAgICAgVmFsdWU6ICdJc29sYXRlZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGV4cGVjdChPYmplY3Qua2V5cyhzdWJuZXRzKS5sZW5ndGgpLnRvQmUoMik7XG4gIH0pO1xuXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgTkFUIGdhdGV3YXlzJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpFQzI6Ok5hdEdhdGV3YXknLCAyKTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBzZWN1cml0eSBncm91cHMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkVDMjo6U2VjdXJpdHlHcm91cCcsIDMpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHRoZSBBTEIgc2VjdXJpdHkgZ3JvdXAgd2l0aCB0aGUgY29ycmVjdCBydWxlcycsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUMyOjpTZWN1cml0eUdyb3VwJywge1xuICAgICAgR3JvdXBEZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciB0aGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcicsXG4gICAgICBWcGNJZDogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgIFNlY3VyaXR5R3JvdXBJbmdyZXNzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBDaWRySXA6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgIERlc2NyaXB0aW9uOiAnQWxsb3cgSFRUUCB0cmFmZmljIGZyb20gdGhlIGludGVybmV0JyxcbiAgICAgICAgICBGcm9tUG9ydDogODAsXG4gICAgICAgICAgSXBQcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgVG9Qb3J0OiA4MCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgdGhlIHdlYiB0aWVyIHNlY3VyaXR5IGdyb3VwIHdpdGggdGhlIGNvcnJlY3QgcnVsZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6U2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIEdyb3VwRGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgdGhlIFdlYiBUaWVyIEVDMiBpbnN0YW5jZXMnLFxuICAgICAgVnBjSWQ6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICBTZWN1cml0eUdyb3VwSW5ncmVzczogW1xuICAgICAgICB7XG4gICAgICAgICAgRGVzY3JpcHRpb246ICdBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSBBTEIgb25seScsXG4gICAgICAgICAgRnJvbVBvcnQ6IDgwLFxuICAgICAgICAgIElwUHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgIFNvdXJjZVNlY3VyaXR5R3JvdXBJZDogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgICBUb1BvcnQ6IDgwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSB0aGUgYmFzdGlvbiBob3N0IHNlY3VyaXR5IGdyb3VwIHdpdGggdGhlIGNvcnJlY3QgcnVsZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6U2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIEdyb3VwRGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgdGhlIEJhc3Rpb24gSG9zdCcsXG4gICAgICBWcGNJZDogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgIFNlY3VyaXR5R3JvdXBJbmdyZXNzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBDaWRySXA6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgIERlc2NyaXB0aW9uOiAnQWxsb3cgU1NIIHRyYWZmaWMgZnJvbSBzcGVjaWZpZWQgSVAnLFxuICAgICAgICAgIEZyb21Qb3J0OiAyMixcbiAgICAgICAgICBJcFByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICBUb1BvcnQ6IDIyLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBhbiBBdXRvIFNjYWxpbmcgR3JvdXAgd2l0aCB0aGUgY29ycmVjdCBwcm9wZXJ0aWVzJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpBdXRvU2NhbGluZzo6QXV0b1NjYWxpbmdHcm91cCcsIDEpO1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpBdXRvU2NhbGluZzo6QXV0b1NjYWxpbmdHcm91cCcsIHtcbiAgICAgIE1pblNpemU6ICcyJyxcbiAgICAgIE1heFNpemU6ICc0JyxcbiAgICAgIERlc2lyZWRDYXBhY2l0eTogJzInLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIGFuIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXIgd2l0aCB0aGUgY29ycmVjdCBwcm9wZXJ0aWVzJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpFbGFzdGljTG9hZEJhbGFuY2luZ1YyOjpMb2FkQmFsYW5jZXInLCAxKTtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RWxhc3RpY0xvYWRCYWxhbmNpbmdWMjo6TG9hZEJhbGFuY2VyJywge1xuICAgICAgU2NoZW1lOiAnaW50ZXJuZXQtZmFjaW5nJyxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBhIGJhc3Rpb24gaG9zdCB3aXRoIHRoZSBjb3JyZWN0IHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkVDMjo6SW5zdGFuY2UnLCAxKTtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUMyOjpJbnN0YW5jZScsIHtcbiAgICAgIEluc3RhbmNlVHlwZTogJ3QzLm5hbm8nLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHRoZSBjb3JyZWN0IG91dHB1dHMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdMb2FkQmFsYW5jZXJETlMnLCB7fSk7XG4gICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdCYXN0aW9uSG9zdElQJywge30pO1xuICB9KTtcbn0pO1xuIl19