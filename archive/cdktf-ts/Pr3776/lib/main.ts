import { App } from 'cdktf';
import { FinancialProcessorStack } from './financial-processor-stack';

const app = new App();

new FinancialProcessorStack(app, 'financial-processor', {
  environment: 'production',
  appName: 'financial-processor',
  costCenter: 'FinOps',
  primaryRegion: 'eu-central-1',
  secondaryRegion: 'eu-west-1',
  domainName: 'finproc-demo.internal',
});

app.synth();
