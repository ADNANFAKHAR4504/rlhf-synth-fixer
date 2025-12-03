import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap-stack', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    Project: 'DataProcessing',
    ManagedBy: 'Pulumi',
  },
});

// Export stack outputs
export const tableName = stack.table;
export const processorFunctionArn = stack.processorFunctionArn;
export const dlqUrl = stack.dlqUrl;
