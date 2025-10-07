import { App } from 'cdktf';
import { FinancialProcessorStack } from './financial-processor-stack';

const app = new App();

new FinancialProcessorStack(app, 'financial-processor', {
  environment: 'production',
  appName: 'financial-processor',
  costCenter: 'FinOps',
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  domainName: 'financial-processor.example.com',
});

app.synth();
