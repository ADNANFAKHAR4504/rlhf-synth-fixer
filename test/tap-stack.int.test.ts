import fs from 'fs';
import path from 'path';

describe('Terraform Outputs', () => {
  let outputFilePath: string;
  let outputData: string;
  let outputs: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    outputFilePath = path.join(__dirname, 'cfn-outputs/flat-outputs.json');
    outputData = fs.readFileSync(outputFilePath, 'utf-8');
    outputs = JSON.parse(outputData);
  });

  describe('Bucket Name', () => {
    test('Bucket Name should contain the correct prefix', () => {
      expect(outputs.bucket_name.split('-').pop()).toBe('cdktftest');
    });
  });
});
