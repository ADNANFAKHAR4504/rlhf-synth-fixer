interface ConfigEvent {
  configurationItem: string;
}

interface ConfigurationItem {
  resourceType: string;
  resourceId: string;
  tags?: Record<string, string>;
  configuration?: Record<string, unknown>;
}

interface ComplianceResult {
  compliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  annotation: string;
}

const REQUIRED_TAGS = [
  'Environment',
  'Owner',
  'CostCenter',
  'Compliance',
  'iac-rlhf-amazon',
];

export const handler = async (
  event: ConfigEvent
): Promise<ComplianceResult> => {
  console.log('Checking required tags for resource');

  try {
    const configItem: ConfigurationItem = JSON.parse(event.configurationItem);

    // Check if resource type supports tags
    if (!resourceSupportsTagging(configItem.resourceType)) {
      return {
        compliance: 'NOT_APPLICABLE',
        annotation: `Resource type ${configItem.resourceType} does not support tagging`,
      };
    }

    // Check if resource has all required tags
    if (!configItem.tags) {
      return {
        compliance: 'NON_COMPLIANT',
        annotation: `Resource is missing all required tags: ${REQUIRED_TAGS.join(', ')}`,
      };
    }

    const missingTags: string[] = [];
    for (const requiredTag of REQUIRED_TAGS) {
      if (!configItem.tags[requiredTag]) {
        missingTags.push(requiredTag);
      }
    }

    if (missingTags.length > 0) {
      return {
        compliance: 'NON_COMPLIANT',
        annotation: `Resource is missing required tags: ${missingTags.join(', ')}`,
      };
    }

    // Validate iac-rlhf-amazon tag value
    if (configItem.tags['iac-rlhf-amazon'] !== 'true') {
      return {
        compliance: 'NON_COMPLIANT',
        annotation: 'Tag iac-rlhf-amazon must have value "true"',
      };
    }

    // All tags present and valid
    return {
      compliance: 'COMPLIANT',
      annotation: 'Resource has all required tags with valid values',
    };
  } catch (error) {
    console.error('Error checking tags:', error);
    return {
      compliance: 'NON_COMPLIANT',
      annotation: `Error evaluating tags: ${error}`,
    };
  }
};

function resourceSupportsTagging(resourceType: string): boolean {
  const nonTaggableTypes = [
    'AWS::CloudFormation::Stack',
    'AWS::Config::ResourceCompliance',
    'AWS::Config::ConformancePackCompliance',
  ];

  return !nonTaggableTypes.includes(resourceType);
}
