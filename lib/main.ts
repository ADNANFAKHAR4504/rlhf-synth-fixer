import { App } from 'cdktf';
import { FinancialProcessorStack } from './financial-processor-stack';

const app = new App();

new FinancialProcessorStack(app, 'financial-processor', {
  environment: 'production',
  appName: 'financial-processor',
  costCenter: 'FinOps',
  primaryRegion: 'us-east-2',
  secondaryRegion: 'us-west-2',
  domainName: 'finproc-demo.internal',
});

app.synth();
