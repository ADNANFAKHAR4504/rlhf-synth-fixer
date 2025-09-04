import * as cdk from 'aws-cdk-lib';

export class TaggingAspects {
  constructor(accountConfig) {
    this.accountConfig = accountConfig;
  }

  visit(node) {
    // Apply tags to all taggable resources
    if (cdk.Tags.of(node)) {
      const tags = this.getStandardTags();
      
      // Apply standard tags
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value, {
          priority: 100 // Set priority lower than default to avoid conflicts
        });
      });

      // Apply resource-specific tags based on resource type if it's a CfnResource
      if (node instanceof cdk.CfnResource) {
        this.applyResourceSpecificTags(node);
      }
    }
  }

  getStandardTags() {
    return {
      Department: this.accountConfig.department || 'IT',
      Project: this.accountConfig.project || 'SharedInfrastructure', 
      Environment: this.accountConfig.environment || 'dev',
      Owner: this.accountConfig.owner || 'InfrastructureTeam',
      CostCenter: this.accountConfig.costCenter || 'IT-OPS',
      ManagedBy: 'CDK',
      CreatedDate: new Date().toISOString().split('T')[0],
      ComplianceRequired: this.accountConfig.complianceRequired || 'true',
      BackupRequired: this.accountConfig.backupRequired || 'false',
      MonitoringLevel: this.accountConfig.monitoringLevel || 'standard'
    };
  }

  applyResourceSpecificTags(resource) {
    const resourceType = resource.cfnResourceType;
    const priority = 100; // Use same priority for consistency

    switch (resourceType) {
      case 'AWS::S3::Bucket':
        cdk.Tags.of(resource).add('DataClassification', 'internal', { priority });
        cdk.Tags.of(resource).add('RetentionPeriod', '90days', { priority });
        break;
        
      case 'AWS::KMS::Key':
        cdk.Tags.of(resource).add('KeyRotation', 'enabled', { priority });
        cdk.Tags.of(resource).add('KeyUsage', 'shared-encryption', { priority });
        break;
        
      case 'AWS::SNS::Topic':
        cdk.Tags.of(resource).add('MessageType', 'notifications', { priority });
        cdk.Tags.of(resource).add('IntegrationPattern', 'pub-sub', { priority });
        break;
        
      case 'AWS::SQS::Queue':
        cdk.Tags.of(resource).add('MessageType', 'processing', { priority });
        cdk.Tags.of(resource).add('IntegrationPattern', 'queue', { priority });
        break;
        
      case 'AWS::IAM::Role':
        cdk.Tags.of(resource).add('AccessLevel', 'cross-account', { priority });
        cdk.Tags.of(resource).add('SecurityReviewRequired', 'true', { priority });
        break;
        
      case 'AWS::Logs::LogGroup':
        cdk.Tags.of(resource).add('LogType', 'application', { priority });
        cdk.Tags.of(resource).add('RetentionPolicy', 'standard', { priority });
        break;
        
      default:
        // Apply default resource tags
        cdk.Tags.of(resource).add('ResourceType', resourceType, { priority });
        break;
    }
  }
}

// Tag compliance validation aspect
export class TagComplianceAspect {
  constructor(requiredTags = ['Department', 'Project', 'Environment', 'Owner']) {
    this.requiredTags = requiredTags;
  }

  visit(node) {
    if (node instanceof cdk.CfnResource) {
      const appliedTags = this.getAppliedTags(node);
      const missingTags = this.requiredTags.filter(tag => !appliedTags.includes(tag));
      
      if (missingTags.length > 0) {
        node.node.addWarning(`Missing required tags: ${missingTags.join(', ')}`);
      }
    }
  }

  getAppliedTags(resource) {
    const tagManager = cdk.Tags.of(resource);
    return tagManager.tagValues() ? Object.keys(tagManager.tagValues()) : [];
  }
}