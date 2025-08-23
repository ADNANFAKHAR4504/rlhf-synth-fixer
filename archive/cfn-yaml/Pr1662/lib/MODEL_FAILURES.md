Way too complex vs  constraints (WAF, many params, extra subnets, NAT x2, CloudTrail, etc.).

Region handling: uses !GetAZs '' (implicit region) instead of hard us-west-2  stack requires.

S3 bucket NotificationConfiguration uses unsupported CloudWatchConfigurations → will fail validation.

CloudTrail present →  already hit trail quota earlier; this will likely fail again.

No S3 access logging for all buckets and mixes in complex policies.

Parameterized everywhere despite  “no parameters at deploy” stance (defaults help, but still noisy).

No clear ASG health readiness .

Do this instead 

 said the current stack is stable. Apply only the edits below to re-attach the TG and run with 2 instances, keeping instances in public subnets so yum install httpd works, no loops, no waits beyond ELB grace.

1) Make the Target Group check the root path


TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    VpcId: !Ref VPC
    TargetType: instance
    Port: 80
    Protocol: HTTP
    HealthCheckPath: /
    Matcher: { HttpCode: "200-399" }

2) Tighten WebSG to only allow HTTP from ALB (optional hardening)

Replace the HTTP ingress on WebSG with:

WebSG:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Web SG allowing HTTP from ALB and SSH from VPC CIDR
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref AlbSG
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: 10.20.0.0/16
    SecurityGroupEgress:
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0

3) Give instances a tiny, non-looping UserData that installs httpd



LaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateData:
      InstanceType: t3.small
      ImageId: !Ref LatestAmiId
      SecurityGroupIds: [ !Ref WebSG ]
      MetadataOptions:
        HttpTokens: required
        HttpEndpoint: enabled
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            Encrypted: true
            KmsKeyId: !Ref KmsKey
            VolumeType: gp3
            VolumeSize: 10
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          set -euxo pipefail
          yum -y makecache
          yum -y install httpd
          systemctl enable httpd
          echo "<h1>${AWS::StackName} - OK</h1>" > /var/www/html/index.html
          systemctl start httpd

4) Re-attach ASG to the TG, run 2 instances, use ELB health with grace

Replace  AutoScalingGroup Properties with:

AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    VPCZoneIdentifier: [ !Ref PublicSubnetA, !Ref PublicSubnetB ]
    MinSize: "2"
    MaxSize: "4"
    DesiredCapacity: "2"
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
    TargetGroupARNs: [ !Ref TargetGroup ]
    LaunchTemplate:
      LaunchTemplateId: !Ref LaunchTemplate
      Version: !GetAtt LaunchTemplate.LatestVersionNumber
    Tags:
      - Key: Name
        Value: !Sub "${AWS::StackName}-web"
        PropagateAtLaunch: true


That’s it. No other parts of  working template need to change.

Why this works (and avoids loops)

Public subnets + httpd install ⇒ instances can reach yum, finish bootstrap fast.

No UserData loops ⇒ instance init completes deterministically.

ELB health w/ 300s grace ⇒ gives Apache time to start; ASG won’t churn.

ALB → WebSG only ⇒ least-privilege ingress while still passing health checks.

Desired=2 & TG attached ⇒  see two healthy targets.