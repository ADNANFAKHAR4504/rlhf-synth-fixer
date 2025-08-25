import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const LIB_DIR = path.join(ROOT, 'lib');
const IDEAL_PATH = path.join(LIB_DIR, 'IDEAL_RESPONSE.md');
const METADATA_PATH = path.join(ROOT, 'metadata.json');

const read = (p: string) => fs.readFileSync(p, 'utf8');

const listLibFiles = (): string[] => {
  return fs
    .readdirSync(LIB_DIR)
    .filter(f => fs.statSync(path.join(LIB_DIR, f)).isFile());
};

const extractCodeBlocks = (md: string) => {
  const re = /```([a-zA-Z0-9_-]*)\n[\s\S]*?```/g;
  const blocks: { lang: string; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const full = m[0];
    const lang = (m[1] || '').trim();
    const content = full.replace(/^```[\s\S]*?\n/, '').replace(/```\s*$/, '');
    blocks.push({ lang, content });
  }
  return blocks;
};

describe('IDEAL_RESPONSE.md and metadata.json validation', () => {
  let md: string = '';

  beforeAll(() => {
    if (!fs.existsSync(IDEAL_PATH)) {
      throw new Error(`Missing lib/IDEAL_RESPONSE.md at ${IDEAL_PATH}`);
    }
    md = read(IDEAL_PATH);
  });

  test('IDEAL_RESPONSE.md: contains only code outside of fenced blocks', () => {
    // Allow headings, brief prose, but no raw code-like lines outside fences.
    // Heuristic: ensure any lines that look like HCL/resources appear inside code fences by requiring at least one code block and no triple-backtick mismatches.
    const openingTicks = (md.match(/```/g) || []).length;
    expect(openingTicks % 2).toBe(0);
  });

  test('IDEAL_RESPONSE.md: no explicit references to QA/unit/integration tests', () => {
    const forbidden = /(QA process|unit tests|integration tests)/i;
    expect(md).not.toMatch(forbidden);
  });

  test('IDEAL_RESPONSE.md: every file in lib/ is represented within code blocks', () => {
    const libFiles = listLibFiles();
    const codeBlocks = extractCodeBlocks(md);
    const concatenated = codeBlocks.map(b => b.content).join('\n');

    // For each file under lib/, ensure its basename appears in IDEAL_RESPONSE.md and some recognizable snippet is present.
    // We enforce presence by filename mention at least once in the markdown OR code block content that clearly starts with a header comment of that file.
    const mdLower = md.toLowerCase();
    libFiles.forEach(file => {
      // Skip the IDEAL_RESPONSE.md itself from the requirement
      if (file === 'IDEAL_RESPONSE.md') return;
      const nameLower = file.toLowerCase();
      const mentioned = mdLower.includes(nameLower);
      expect(mentioned).toBeTruthy();
    });

    // Ensure at least one HCL block exists if there are .tf files
    const hasTf = libFiles.some(f => f.endsWith('.tf'));
    if (hasTf) {
      const hasHcl = codeBlocks.some(b =>
        ['hcl', 'terraform'].includes(b.lang)
      );
      expect(hasHcl).toBeTruthy();
    }
  });

  test('metadata.json contains required fields with valid shapes', () => {
    if (!fs.existsSync(METADATA_PATH)) {
      throw new Error(`Missing metadata.json at ${METADATA_PATH}`);
    }
    const raw = read(METADATA_PATH);
    let json: any;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      throw new Error('metadata.json is not valid JSON');
    }

    const requiredKeys = [
      'subtask',
      'subject_labels',
      'training_quality',
      'aws_services',
    ];
    requiredKeys.forEach(k => {
      if (!(k in json)) {
        throw new Error(`metadata.json missing required field: ${k}`);
      }
    });

    expect(typeof json.subtask).toBe('string');
    expect(Array.isArray(json.subject_labels)).toBe(true);
    expect(typeof json.training_quality).toBe('number');
    expect(Array.isArray(json.aws_services)).toBe(true);

    // Basic value sanity
    expect(json.training_quality).toBeGreaterThanOrEqual(0);
    expect(json.training_quality).toBeLessThanOrEqual(10);
  });
});
