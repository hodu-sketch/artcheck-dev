// PreToolUse guard for the dev project: exit 2 blocks the tool call and sends stderr to Claude.
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const tool = input.tool_name ?? '';
const cmd = input.tool_input?.command ?? '';
const file = (input.tool_input?.file_path ?? '').replace(/\\/g, '/');
const name = basename(file);
const block = (msg) => { process.stderr.write(msg + '\n'); process.exit(2); };

// 1. Maven: this project builds with the Gradle Wrapper only
if (tool === 'Bash' && /(^|[\s;&|(`])(\.\/)?mvnw?(\.cmd)?(\s|$)/.test(cmd))
  block('Blocked: this project uses Gradle only. Run ./gradlew in backend/ instead of Maven.');
if (tool !== 'Bash' && name === 'pom.xml')
  block('Blocked: do not create or edit pom.xml. This project uses Gradle (backend/build.gradle).');

// 2. Secrets: .env files are edited by the user, not by Claude (.env.example is allowed)
if (tool !== 'Bash' && /^\.env(\..+)?$/.test(name) && name !== '.env.example')
  block(`Blocked: ${name} may hold secrets. Ask the user to edit it; you may update .env.example instead.`);

// 3. Liquibase: existing changelogs may already be applied (checksum error if edited)
if (tool !== 'Bash' && file.includes('/backend/src/main/resources/db/changelog/')
    && name !== 'db.changelog-master.yaml' && existsSync(file)) {
  const body = readFileSync(file, 'utf8');
  if (!/runOnChange\s*:\s*true/.test(body))
    block(`Blocked: ${name} is an existing Liquibase changelog and may already be applied. Add a new changeset file and include it from db.changelog-master.yaml instead.`);
}

// 4. The plan project (sibling folder: this folder's name with -dev replaced by -plan) is read-only from here
const planName = basename((process.env.CLAUDE_PROJECT_DIR ?? '').replace(/\\/g, '/')).replace(/-dev$/i, '-plan');
if (planName.endsWith('-plan')) {
  const esc = planName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (tool !== 'Bash' && new RegExp(`/${esc}(/|$)`, 'i').test(file))
    block(`Blocked: ${planName} is read-only from the dev project. Tell the user what should change in the plan; it is recorded there in the next cycle.`);
  if (tool === 'Bash' && new RegExp(esc, 'i').test(cmd)
      && /(>|\btee\b|\bsed\s+-i|\b(rm|mv|cp|mkdir|touch|git)\b|Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item)/i.test(cmd))
    block(`Blocked: shell commands must not write to ${planName}. Reading it with the Read tool is fine.`);
}
process.exit(0);
