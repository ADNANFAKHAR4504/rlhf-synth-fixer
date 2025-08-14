import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';

interface TerraformResource {
  type: string;
  name: string;
  config: any;
}

interface TerraformVariable {
  name: string;
  config: any;
}

interface TerraformOutput {
  name: string;
  config: any;
}

describe('Terraform Stack Unit Tests', () => {
  let terraformContent: string;
  let resources: TerraformResource[];
  let variables: TerraformVariable[];
  let outputs: TerraformOutput[];

  beforeAll(() => {
    const terraformPath = path.resolve(__dirname, '../lib/tap_stack.tf');
    expect(fs.
