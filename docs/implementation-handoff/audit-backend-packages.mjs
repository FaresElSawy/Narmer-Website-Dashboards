// Read-only checks: no API, provider, database, or application writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = process.cwd();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }).sort();
}
function loadPackage(name) {
  const dir = path.join(root, 'Backend Files', name);
  const files = walk(dir).map(file => {
    const bytes = fs.readFileSync(file);
    const text = bytes.toString('utf8').replace(/^\uFEFF/, '');
    const relative = path.relative(dir, file).replaceAll('\\', '/');
    let json;
    if (relative.endsWith('.json')) json = JSON.parse(text);
    if (relative.endsWith('.jsonl')) text.split(/\r?\n/).filter(Boolean).forEach(line => JSON.parse(line));
    return { file: relative, bytes: bytes.length, sha256: sha(bytes), lines: text.split(/\r?\n/).length, text, json };
  });
  const byName = new Map(files.map(f => [f.file, f]));
  const manifest = byName.get('handoff-manifest.json').json;
  const manifestProblems = manifest.files.flatMap(entry => {
    const actual = byName.get(entry.file);
    return !actual ? [`Missing ${entry.file}`] : actual.sha256 !== entry.sha256 ? [`Hash mismatch ${entry.file}`] : [];
  });
  const linkProblems = [], fencedJsonProblems = [];
  let localLinkCount = 0, fencedJsonCount = 0;
  for (const file of files.filter(f => f.file.endsWith('.md'))) {
    for (const match of file.text.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      const target = decodeURIComponent(href.split('#')[0]);
      localLinkCount++;
      const resolved = path.resolve(dir, path.dirname(file.file), target);
      if (!resolved.startsWith(dir + path.sep) || !fs.existsSync(resolved)) linkProblems.push({file:file.file,target});
    }
    for (const match of file.text.matchAll(/```json\s*\r?\n([\s\S]*?)```/g)) {
      fencedJsonCount++;
      try { JSON.parse(match[1]); } catch(error) { fencedJsonProblems.push({file:file.file,error:error.message}); }
    }
  }
  const api = byName.get('api/narmer.openapi.json').json;
  const methods = new Set(['get','post','put','patch','delete','head','options']);
  const operations = Object.entries(api.paths).flatMap(([route, item]) => Object.keys(item).filter(k => methods.has(k)).map(method => `${method.toUpperCase()} ${route}`));
  const normalize = route => route.replace(/:([A-Za-z][\w]*)/g, '{$1}');
  const routes = byName.get('api/routes.json').json;
  const routeSet = new Set(routes.map(r => normalize(`${r.method} ${r.path}`)));
  const specSet = new Set(operations);
  const routeProblems = [...routeSet].filter(r => !specSet.has(r)).map(r=>'Missing OpenAPI '+r).concat([...specSet].filter(r=>!routeSet.has(r)).map(r=>'Extra OpenAPI '+r));
  const refProblems = []; let localRefs = 0;
  function checkRefs(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
      localRefs++;
      let node = api;
      for (const key of value.$ref.slice(2).split('/').map(k=>decodeURIComponent(k).replaceAll('~1','/').replaceAll('~0','~'))) node = node?.[key];
      if (node === undefined) refProblems.push(value.$ref);
    }
    for (const child of Object.values(value)) checkRefs(child);
  }
  checkRefs(api);
  const postman = byName.get('api/narmer.postman.json').json;
  let requests = 0, savedResponses = 0, responseJsonProblems = [];
  function checkItems(items) {
    for (const item of items || []) {
      if (item.item) checkItems(item.item);
      if (item.request) requests++;
      for (const response of item.response || []) {
        savedResponses++;
        if (response.body?.trim().startsWith('{') || response.body?.trim().startsWith('[')) {
          try { JSON.parse(response.body); } catch(error) { responseJsonProblems.push({name:item.name,error:error.message}); }
        }
      }
    }
  }
  checkItems(postman.item);
  const coverage = byName.get('contract-coverage.json').json;
  const coverageRoutes = new Set(Object.values(coverage.modules).flatMap(m=>m.operations || []));
  const business = routes.filter(r=>r.path.startsWith('/api/'));
  const coverageProblems = business.filter(r=>!coverageRoutes.has(`${r.method} ${r.path}`)).map(r=>`${r.method} ${r.path}`);
  const result = {name,files:files.map(({text,json,...entry})=>entry),moduleDocuments:files.filter(f=>/^modules\/.*\.md$/.test(f.file)).length,
    businessOperations:business.length,healthOperations:routes.length-business.length,openapiOperations:operations.length,openapiPaths:Object.keys(api.paths).length,
    postmanRequests:requests,savedResponses,localRefs,localLinkCount,fencedJsonCount,
    manifestProblems,linkProblems,fencedJsonProblems,routeProblems,refProblems:[...new Set(refProblems)],responseJsonProblems,coverageProblems};
  return {result,byName,operations};
}
const old = loadPackage('Old Backend Files');
const current = loadPackage('New Backend Files');
const names = [...new Set([...old.byName.keys(),...current.byName.keys()])].sort();
const comparison = names.map(file=>({file,state:!old.byName.has(file)?'added':!current.byName.has(file)?'removed':old.byName.get(file).sha256===current.byName.get(file).sha256?'identical':'changed'}));
const report={checkedAt:'2026-10-23',scope:'Static delivered-package verification only; backend source, running API, provider state and production deployment are not present/verified.',old:old.result,current:current.result,comparison,addedOperations:current.operations.filter(op=>!old.operations.includes(op)),removedOperations:old.operations.filter(op=>!current.operations.includes(op))};
assert.equal(current.result.businessOperations,159);
assert.equal(current.result.healthOperations,2);
assert.equal(current.result.openapiOperations,161);
assert.equal(current.result.postmanRequests,161);
assert.equal(report.removedOperations.length,0);
for(const item of [old.result,current.result]) for(const key of ['manifestProblems','linkProblems','fencedJsonProblems','routeProblems','refProblems','responseJsonProblems','coverageProblems']) assert.equal(item[key].length,0,`${item.name}: ${key}: ${JSON.stringify(item[key])}`);
process.stdout.write(JSON.stringify(report,null,2));
