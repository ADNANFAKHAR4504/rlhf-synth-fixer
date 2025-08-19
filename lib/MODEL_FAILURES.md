S3 Replication cannot be created cross-region in a single stack

 configure cross-region replication to a bucket in ReplicationRegion (us-west-2) but do not create that destination bucket or its KMS key/alias, and CloudFormation cannot create resources in multiple regions in one stack.

Result: AWS::S3::Bucket (source) fails validation on ReplicationConfiguration because the destination bucket/KMS don’t exist/aren’t accessible in the other region.

Fix options (pick one):

A. Remove ReplicationConfiguration from the source bucket in this stack and set it up in a follow-up step (second stack in the destination region, then attach replication).

B. Parameterize DestinationBucketArn and ReplicaKmsKeyArn and pass existing values (created by a separate stack in the replica region).

Minimal safe change (disable CRR for now):

S3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub '${EnvironmentName}-primary-bucket-${AWS::AccountId}'
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref KMSKey
    VersioningConfiguration: { Status: Enabled }
    # Remove ReplicationConfiguration for initial deploy


IAM policies use bucket NAMEs where ARNs are required

In EC2Role → inline policy S3Access and in S3ReplicationRole  use !Sub '${S3Bucket}/*' and !Ref S3Bucket. Ref S3Bucket returns the bucket name, not an ARN, so these policies are invalid.

Fix:

# EC2Role  Policies S3Access
- Effect: Allow
  Action: [ s3:GetObject, s3:PutObject, s3:DeleteObject ]
  Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
- Effect: Allow
  Action: s3:ListBucket
  Resource: !Sub 'arn:aws:s3:::${S3Bucket}'

# S3ReplicationRole  PolicyDocument statements that reference the source bucket:
- Effect: Allow
  Action:
    - s3:GetObjectVersionForReplication
    - s3:GetObjectVersionAcl
  Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
- Effect: Allow
  Action: s3:ListBucket
  Resource: !Sub 'arn:aws:s3:::${S3Bucket}'


Route 53 Health Check type/port mismatch

HealthCheck uses Type: HTTPS_STR_MATCH but Port: 80. HTTPS checks must use port 443, or switch the type to HTTP_STR_MATCH.

Fix :

HealthCheck:
  Type: AWS::Route53::HealthCheck
  Properties:
    Type: HTTP_STR_MATCH
    ResourcePath: /health
    FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
    Port: 80
    RequestInterval: 30
    FailureThreshold: 3
    SearchString: "OK"


SSM Automation document is truncated/incomplete

The FailoverAutomationDocument ends mid-step (action: 'aws:executeAwsApi') with no closing content/structure. That’s a YAML/CFN validation failure.

Fix: Either remove the whole document for now, or include a valid minimal document. Example:

FailoverAutomationDocument:
  Type: AWS::SSM::Document
  Properties:
    DocumentType: Automation
    DocumentFormat: YAML
    Name: !Sub '${EnvironmentName}-FailoverAutomation'
    Content:
      schemaVersion: '0.3'
      description: 'Stub automation'
      assumeRole: !GetAtt FailoverAutomationRole.Arn
      parameters:
        AutoScalingGroupName:
          type: String
          default: !Ref AutoScalingGroup
      mainSteps:
        - name: DescribeASG
          action: 'aws:executeAwsApi'
          inputs:
            Service: autoscaling
            Api: DescribeAutoScalingGroups
            AutoScalingGroupNames:
              - '{{ AutoScalingGroupName }}'


Failover DNS is configured as PRIMARY only

DNSRecord uses Failover: PRIMARY with a health check but there’s no SECONDARY record with the same name/type. That change batch is typically invalid for failover sets.

Fix: Either remove Failover/SetIdentifier/HealthCheckId untill add a secondary record, or add a SECONDARY record (e.g., to a static maintenance IP or another ALB).

Target replication KMS alias not created in replica region

ReplicaKmsKeyID: arn:aws:kms:${ReplicationRegion}:...:alias/${EnvironmentName}-replica-key is referenced but never created. Also, it must live in the destination region. This ties back to (1); resolve via a second regional stack or remove for now.

Risky / brittle choices (fix recommended)

Hard-coded AMI IDs.  RegionMap pins specific AMIs that can be deprecated. Prefer the SSM parameter:

ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"


Many explicit names (RoleName, InstanceProfileName, LaunchTemplateName, SG GroupName, ALB/TG Name). These can collide on re-deploys. Consider letting CFN auto-name where possible.

RDS class & Multi-AZ. db.t3.micro + MultiAZ: true may be unavailable in some regions/versions. If it errors, move to db.t3.medium (what the ideal used) or check the class availability.

S3 Replication rule uses Prefix (deprecated). Use Filter:

Rules:
  - Status: Enabled
    Filter: { Prefix: "" }
    Destination: { Bucket: <dest-arn> }


Bastion SG allows SSH from 0.0.0.0/0. Fine for demos; restrict in production.

No HTTPS listener/cert.  open 443 on the ALB SG but only attach an HTTP listener. Consider an ACM cert + HTTPS listener + redirect.

Where the Ideal_response already aligns (no action)

ASG uses ELB health checks and a proper Target Group.

CPU target-tracking policy.

Clean VPC, public/private subnets, NATs, and instance bootstrap serving /health.

Corrected snippets (drop-in)
1) IAM S3 policy & replication role resource ARNs
EC2Role:
  Type: AWS::IAM::Role
  Properties:
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
    Policies:
      - PolicyName: S3Access
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: [ s3:GetObject, s3:PutObject, s3:DeleteObject ]
              Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
            - Effect: Allow
              Action: s3:ListBucket
              Resource: !Sub 'arn:aws:s3:::${S3Bucket}'

S3ReplicationRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal: { Service: s3.amazonaws.com }
          Action: sts:AssumeRole
    Policies:
      - PolicyName: S3ReplicationPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObjectVersionForReplication
                - s3:GetObjectVersionAcl
              Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
            - Effect: Allow
              Action: s3:ListBucket
              Resource: !Sub 'arn:aws:s3:::${S3Bucket}'
            # Destination bucket/KMS permissions must reference ARNs in the replica region (provided externally)

2) Route 53 health check aligned to HTTP:80
HealthCheck:
  Type: AWS::Route53::HealthCheck
  Properties:
    Type: HTTP_STR_MATCH
    ResourcePath: /health
    FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
    Port: 80
    RequestInterval: 30
    FailureThreshold: 3
    SearchString: "OK"

3) DNS record: remove failover until  add a secondary
DNSRecord:
  Type: AWS::Route53::RecordSet
  Properties:
    HostedZoneId: !Ref HostedZone
    Name: !Sub '${EnvironmentName}.example.com'
    Type: A
    AliasTarget:
      DNSName: !GetAtt ApplicationLoadBalancer.DNSName
      HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID