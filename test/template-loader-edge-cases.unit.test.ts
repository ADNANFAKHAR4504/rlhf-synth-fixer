import * as fs from 'fs';
import * as path from 'path';
import { TemplateLoader } from '../lib/template-loader';

describe('TemplateLoader Edge Cases', () => {
  let originalTemplate: string;
  const testTemplatePath = path.join(__dirname, '../lib/TapStack-test.json');

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    originalTemplate = fs.readFileSync(templatePath, 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(testTemplatePath)) {
      fs.unlinkSync(testTemplatePath);
    }
  });

  test('should handle template without Parameters', () => {
    const template = JSON.parse(originalTemplate);
    delete template.Parameters;
    fs.writeFileSync(testTemplatePath, JSON.stringify(template));

    const loader = new TemplateLoader(testTemplatePath);
    expect(loader.getParameterCount()).toBe(0);
    expect(loader.validateParameterExists('AnyParam')).toBe(false);
    expect(loader.getParameter('AnyParam')).toBeUndefined();
  });

  test('should handle template without Outputs', () => {
    const template = JSON.parse(originalTemplate);
    delete template.Outputs;
    fs.writeFileSync(testTemplatePath, JSON.stringify(template));

    const loader = new TemplateLoader(testTemplatePath);
    expect(loader.getOutputCount()).toBe(0);
    expect(loader.validateOutputExists('AnyOutput')).toBe(false);
    expect(loader.getOutput('AnyOutput')).toBeUndefined();
  });

  test('should cache loaded template', () => {
    fs.writeFileSync(testTemplatePath, originalTemplate);
    const loader = new TemplateLoader(testTemplatePath);

    const template1 = loader.loadTemplate();
    const template2 = loader.loadTemplate();

    expect(template1).toBe(template2);
  });

  test('should handle resource without Properties field', () => {
    const template = JSON.parse(originalTemplate);
    template.Resources.TestResource = {
      Type: 'AWS::Test::Resource'
    };
    fs.writeFileSync(testTemplatePath, JSON.stringify(template));

    const loader = new TemplateLoader(testTemplatePath);
    const tags = loader.getResourceTags('TestResource');
    expect(tags).toEqual([]);
  });
});
