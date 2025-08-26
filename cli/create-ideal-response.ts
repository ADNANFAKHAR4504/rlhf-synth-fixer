import { promises as fs } from "fs";
import * as path from "path";

class CreateIdealResponse {
  private readonly searchDirs = ["./bin", "./lib", "./test"];
  private readonly extraFiles = ["./cdk.json"];
  private readonly outputFile = "./lib/IDEAL_RESPONSE.md";
  private readonly exts = [
    ".mjs",
    ".ts",
    ".go",
    ".cs",
    ".java",
    ".yaml",
    ".yml",
    ".json",
  ];

  async run(): Promise<void> {
    try {
      console.log("🔍 Scanning for source files...");
      const files = await this.collectFiles();
      if (files.length === 0) {
        console.warn("⚠️ No matching files found.");
        return;
      }

      console.log(`📂 Found ${files.length} files. Generating IDEAL_RESPONSE.md...`);
      const content = await this.generateMarkdown(files);
      await fs.mkdir(path.dirname(this.outputFile), { recursive: true });
      await fs.writeFile(this.outputFile, content, "utf-8");
      console.log(`✅ IDEAL_RESPONSE.md created at ${this.outputFile}`);
    } catch (err) {
      console.error("❌ Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  private async collectFiles(): Promise<string[]> {
    const foundFiles: string[] = [];

    for (const dir of this.searchDirs) {
      const exists = await this.exists(dir);
      if (exists) {
        foundFiles.push(...(await this.walkDir(dir)));
      }
    }

    for (const file of this.extraFiles) {
      if (await this.exists(file)) {
        foundFiles.push(file);
      }
    }

    return foundFiles;
  }

  private async walkDir(dir: string): Promise<string[]> {
    let results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.walkDir(fullPath)));
        } else if (this.exts.includes(path.extname(entry.name))) {
          results.push(fullPath);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Skipping directory ${dir}:`, (err as Error).message);
    }
    return results;
  }

  private async generateMarkdown(files: string[]): Promise<string> {
    let md = "# Overview\n\nPlease find solution files below.\n\n";

    for (const file of files) {
      try {
        const relPath = "./" + path.relative(process.cwd(), file).replace(/\\/g, "/");
        const lang = this.detectLanguage(file);
        const content = await fs.readFile(file, "utf-8");

        md += `## ${relPath}\n\n`;
        md += "```" + lang + "\n";
        md += content + "\n";
        md += "```\n\n";
      } catch (err) {
        console.warn(`⚠️ Could not read file ${file}:`, (err as Error).message);
      }
    }

    return md.trim() + "\n";
  }

  private detectLanguage(file: string): string {
    const ext = path.extname(file).toLowerCase();
    switch (ext) {
      case ".mjs":
      case ".js":
        return "javascript";
      case ".ts":
        return "typescript";
      case ".go":
        return "go";
      case ".cs":
        return "csharp";
      case ".java":
        return "java";
      case ".yaml":
      case ".yml":
        return "yaml";
      case ".json":
        return "json";
      default:
        return "plaintext";
    }
  }

  private async exists(target: string): Promise<boolean> {
    try {
      await fs.access(target);
      return true;
    } catch {
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  new CreateIdealResponse().run();
}

export default CreateIdealResponse;