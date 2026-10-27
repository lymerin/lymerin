import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const login = 'lymerin';
const projects = [
  { key: 'shenyu', repository: 'apache/shenyu' },
  { key: 'browserskill', repository: 'Tencent/BrowserSkill' },
  { key: 'octop', repository: 'TencentCloud/Octop' },
  { key: 'opentelemetry', repository: 'open-telemetry/opentelemetry-java-instrumentation' },
];
const api = endpoint => JSON.parse(execFileSync('gh', ['api', endpoint], {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true,
}));
const query = repository => `is:pr is:merged is:public author:${login} repo:${repository}`;

function collect() {
  const repositories = projects.map(project => {
    const prs = [];
    for (let page = 1; ; page++) {
      const result = api(`search/issues?q=${encodeURIComponent(query(project.repository))}&per_page=100&page=${page}`);
      if (result.incomplete_results || result.total_count > 1000) throw new Error('Incomplete search; keep the previous profile.');
      prs.push(...result.items.map(pr => {
        if (!pr.pull_request?.merged_at) throw new Error('Unexpected unmerged PR in search.');
        return { number: pr.number, title: pr.title, url: pr.html_url, mergedAt: pr.pull_request.merged_at };
      }));
      if (prs.length >= result.total_count) break;
      if (!result.items.length) throw new Error('Missing search page.');
    }
    if (new Set(prs.map(pr => pr.number)).size !== prs.length) throw new Error('Duplicate PR search results.');
    return { ...project, count: prs.length, prs };
  });
  return { login, updated: new Date().toISOString(), repositories };
}

const snapshot = process.argv.includes('--from-snapshot')
  ? JSON.parse(readFileSync(path.join(root, 'data/profile.json'), 'utf8')) : collect();
let readme = readFileSync(path.join(root, 'profile.template.md'), 'utf8');
for (const project of projects) {
  const record = snapshot.repositories.find(r => r.repository === project.repository);
  if (!record || record.prs.some(pr => !pr.mergedAt) || record.count !== record.prs.length) throw new Error(`Invalid snapshot: ${project.repository}`);
  readme = readme.replaceAll(`{{${project.key}.count}}`, String(record.count));
  const url = `https://github.com/${project.repository}/pulls?q=${encodeURIComponent(query(project.repository))}`;
  readme = readme.replaceAll(`{{${project.key}.url}}`, url);
}
readme = readme.replaceAll('{{verified.date}}', new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(snapshot.updated)));
if (/\{\{.*?\}\}/.test(readme)) throw new Error('Unresolved template value.');
// Keep only the chosen upstream projects, including when rendering a stored snapshot.
snapshot.repositories = snapshot.repositories.filter(r => projects.some(p => p.repository === r.repository));
mkdirSync(path.join(root, 'data'), { recursive: true });
writeFileSync(path.join(root, 'README.md'), readme);
writeFileSync(path.join(root, 'data/profile.json'), JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify(snapshot.repositories.map(r => ({ repository: r.repository, merged: r.count })), null, 2));
