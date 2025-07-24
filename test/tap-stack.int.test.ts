import fs from 'fs';
import path from 'path';


describe('TapStackOutputs', () => {
  let outputs: any;

  beforeAll(() => {
    // Get the terraform outputs from the tf-outputs/outputs.json file
    outputs = JSON.parse(fs.readFileSync(path.join(__dirname, '../tf-outputs/outputs.json'), 'utf8'));
  });

  describe("Outputs", () => {
    test("Bucket Name should have the correct prefix", () => {
      expect(outputs.bucket_name).toContain("cdktf-ts-workflow-test");
    });
  });
});