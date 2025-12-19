# Multi-Environment Payment Processing Infrastructure

This implementation provides a complete AWS CloudFormation nested stack architecture for deploying payment processing infrastructure across multiple environments (dev, staging, prod).

## File: lib/master.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Master Stack - Multi-Environment Payment Processing Infrastructure'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentType
          - EnvironmentSuffix
      - Label:
          default: 'Nested Stack Configuration'
        Parameters:
          - TemplateS3Bucket
          - TemplateS3Prefix

Parameters:
  EnvironmentType:
    Type: String
    Default: 'dev'
    AllowedValues:
      - dev
      - staging
      - prod
    Description: 'Environment type for deployment (determines instance sizes and scaling)'

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Unique suffix for resource naming to prevent conflicts'
    AllowedPattern: '^[a-zA-Z0-9-]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  TemplateS3Bucket:
    Type: String
    Description: 'S3 bucket containing nested stack templates'
    Default: 'cfn-templates-bucket'

  TemplateS3Prefix:
    Type: String
    Description: 'S3 prefix (folder) for nested stack templates'
    Default: 'payment-processing'

Mappings:
  EnvironmentConfig:
    dev:
      VpcCidr: '10.0.0.0/16'
      PublicSubnetCidr1: '10.0.1.0/24'
      PublicSubnetCidr2: '10.0.2.0/24'
      PublicSubnetCidr3: '10.0.3.0/24'
      PrivateSubnetCidr1: '10.0.11.0/24'
      PrivateSubnetCidr2: '10.0.12.0/24'
      PrivateSubnetCidr3: '10.0.13.0/24'
      ECSDesiredCount: 1
      ECSTaskCPU: 512
      ECSTaskMemory: 1024
      RDSInstanceClass: 'db.r5.large'
      RDSInstanceCount: 1
      RDSBackupRetention: 7
      AlarmCPUThreshold: 80
      AlarmMemoryThreshold: 80
      AlarmRDSCPUThreshold: 80
      AlarmRDSConnectionsThreshold: 50
    staging:
      VpcCidr: '10.1.0.0/16'
      PublicSubnetCidr1: '10.1.1.0/24'
      PublicSubnetCidr2: '10.1.2.0/24'
      PublicSubnetCidr3: '10.1.3.0/24'
      PrivateSubnetCidr1: '10.1.11.0/24'
      PrivateSubnetCidr2: '10.1.12.0/24'
      PrivateSubnetCidr3: '10.1.13.0/24'
      ECSDesiredCount: 2
      ECSTaskCPU: 1024
      ECSTaskMemory: 2048
      RDSInstanceClass: 'db.r5.xlarge'
      RDSInstanceCount: 2
      RDSBackupRetention: 14
      AlarmCPUThreshold: 75
      AlarmMemoryThreshold: 75
      AlarmRDSCPUThreshold: 75
      AlarmRDSConnectionsThreshold: 80
    prod:
      VpcCidr: '10.2.0.0/16'
      PublicSubnetCidr1: '10.2.1.0/24'
      PublicSubnetCidr2: '10.2.2.0/24'
      PublicSubnetCidr3: '10.2.3.0/24'
      PrivateSubnetCidr1: '10.2.11.0/24'
      PrivateSubnetCidr2: '10.2.12.0/24'
      PrivateSubnetCidr3: '10.2.13.0/24'
      ECSDesiredCount: 5
      ECSTaskCPU: 2048
      ECSTaskMemory: 4096
      RDSInstanceClass: 'db.r5.2xlarge'
      RDSInstanceCount: 3
      RDSBackupRetention: 30
      AlarmCPUThreshold: 70
      AlarmMemoryThreshold: 70
      AlarmRDSCPUThreshold: 70
      AlarmRDSConnectionsThreshold: 100

Conditions:
  IsProduction: !Equals [!Ref EnvironmentType, 'prod']
  IsStaging: !Equals [!Ref EnvironmentType, 'staging']
  IsDevelopment: !Equals [!Ref EnvironmentType, 'dev']

Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://${TemplateS3Bucket}.s3.${AWS::Region}.amazonaws.com/${TemplateS3Prefix}/vpc.yml'
      Parameters:
        EnvironmentType: !Ref EnvironmentType
        EnvironmentSuffix: !Ref EnvironmentSuffix
        VpcCidr: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, VpcCidr]
        PublicSubnetCidr1: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PublicSubnetCidr1]
        PublicSubnetCidr2: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PublicSubnetCidr2]
        PublicSubnetCidr3: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PublicSubnetCidr3]
        PrivateSubnetCidr1: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PrivateSubnetCidr1]
        PrivateSubnetCidr2: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PrivateSubnetCidr2]
        PrivateSubnetCidr3: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PrivateSubnetCidr3]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: CostCenter
          Value: payments
        - Key: Application
          Value: payment-processor
        - Key: ManagedBy
          Value: CloudFormation

  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: VPCStack
    Properties:
      TemplateURL: !Sub 'https://${TemplateS3Bucket}.s3.${AWS::Region}.amazonaws.com/${TemplateS3Prefix}/database.yml'
      Parameters:
        EnvironmentType: !Ref EnvironmentType
        EnvironmentSuffix: !Ref EnvironmentSuffix
        VpcId: !GetAtt VPCStack.Outputs.VpcId
        PrivateSubnetIds: !GetAtt VPCStack.Outputs.PrivateSubnetIds
        RDSInstanceClass: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, RDSInstanceClass]
        RDSInstanceCount: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, RDSInstanceCount]
        BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, RDSBackupRetention]
        AlarmRDSCPUThreshold: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, AlarmRDSCPUThreshold]
        AlarmRDSConnectionsThreshold: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, AlarmRDSConnectionsThreshold]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: CostCenter
          Value: payments
        - Key: Application
          Value: payment-processor
        - Key: ManagedBy
          Value: CloudFormation

  ComputeStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - VPCStack
      - DatabaseStack
    Properties:
      TemplateURL: !Sub 'https://${TemplateS3Bucket}.s3.${AWS::Region}.amazonaws.com/${TemplateS3Prefix}/compute.yml'
      Parameters:
        EnvironmentType: !Ref EnvironmentType
        EnvironmentSuffix: !Ref EnvironmentSuffix
        VpcId: !GetAtt VPCStack.Outputs.VpcId
        PublicSubnetIds: !GetAtt VPCStack.Outputs.PublicSubnetIds
        PrivateSubnetIds: !GetAtt VPCStack.Outputs.PrivateSubnetIds
        DatabaseSecurityGroupId: !GetAtt DatabaseStack.Outputs.DatabaseSecurityGroupId
        DatabaseEndpoint: !GetAtt DatabaseStack.Outputs.AuroraClusterEndpoint
        DatabaseReaderEndpoint: !GetAtt DatabaseStack.Outputs.AuroraReaderEndpoint
        ECSDesiredCount: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, ECSDesiredCount]
        ECSTaskCPU: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, ECSTaskCPU]
        ECSTaskMemory: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, ECSTaskMemory]
        AlarmCPUThreshold: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, AlarmCPUThreshold]
        AlarmMemoryThreshold: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, AlarmMemoryThreshold]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: CostCenter
          Value: payments
        - Key: Application
          Value: payment-processor
        - Key: ManagedBy
          Value: CloudFormation

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !GetAtt VPCStack.Outputs.VpcId
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PublicSubnetIds:
    Description: 'Public Subnet IDs (comma-separated)'
    Value: !GetAtt VPCStack.Outputs.PublicSubnetIds
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: 'Private Subnet IDs (comma-separated)'
    Value: !GetAtt VPCStack.Outputs.PrivateSubnetIds
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  AuroraClusterEndpoint:
    Description: 'Aurora Cluster Write Endpoint'
    Value: !GetAtt DatabaseStack.Outputs.AuroraClusterEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-AuroraClusterEndpoint'

  AuroraReaderEndpoint:
    Description: 'Aurora Cluster Read Endpoint'
    Value: !GetAtt DatabaseStack.Outputs.AuroraReaderEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-AuroraReaderEndpoint'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !GetAtt DatabaseStack.Outputs.DatabaseSecurityGroupId
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSecurityGroupId'

  ALBSecurityGroupId:
    Description: 'ALB Security Group ID'
    Value: !GetAtt ComputeStack.Outputs.ALBSecurityGroupId
    Export:
      Name: !Sub '${AWS::StackName}-ALBSecurityGroupId'

  ECSSecurityGroupId:
    Description: 'ECS Security Group ID'
    Value: !GetAtt ComputeStack.Outputs.ECSSecurityGroupId
    Export:
      Name: !Sub '${AWS::StackName}-ECSSecurityGroupId'

  LoadBalancerDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ComputeStack.Outputs.LoadBalancerDNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNSName'

  ECSClusterName:
    Description: 'ECS Cluster Name'
    Value: !GetAtt ComputeStack.Outputs.ECSClusterName
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterName'

  EnvironmentType:
    Description: 'Environment Type'
    Value: !Ref EnvironmentType
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentType'

  EnvironmentSuffix:
    Description: 'Environment Suffix'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## File: lib/vpc.yml

Due to length, see the file lib/vpc.yml for the complete VPC nested stack template with:
- VPC with 3 availability zones
- Public and private subnets (3 each)
- Internet Gateway
- 3 NAT Gateways (one per AZ)
- Route tables and associations
- All resources properly tagged

## File: lib/compute.yml

Due to length, see the file lib/compute.yml for the complete compute nested stack template with:
- ECS Cluster with Fargate
- ECS Task Definition
- ECS Service
- Application Load Balancer
- Target Group
- Security Groups
- IAM Roles
- CloudWatch Alarms
- All resources properly tagged

## File: lib/database.yml

Due to length, see the file lib/database.yml for the complete database nested stack template with:
- RDS Aurora PostgreSQL cluster
- 1-3 DB instances (conditional based on environment)
- KMS encryption key
- DB Parameter Groups
- Security Group
- Secrets Manager for passwords
- CloudWatch Alarms
- Conditional DeletionPolicy (Retain/Snapshot/Delete)
- All resources properly tagged

## Key Features

1. **Nested Stack Architecture**: Master stack orchestrates VPC, Database, and Compute stacks
2. **Environment-Specific Mappings**: All config values in mappings (instance sizes, counts, thresholds)
3. **Conditional DeletionPolicy**: Prod=Retain, Staging=Snapshot, Dev=Delete
4. **Cross-Stack References**: Proper use of GetAtt and Exports
5. **Parameter Validation**: AllowedValues for EnvironmentType
6. **Consistent Tagging**: Environment, CostCenter, Application, ManagedBy on all resources
7. **CloudWatch Alarms**: Environment-specific thresholds for all critical metrics
8. **Security**: KMS encryption, Secrets Manager, private subnets, least privilege IAM