import { resolveAny } from 'node:dns/promises';

const apex = (process.env.DOMAIN_APEX || 'usemewithstyle.shop').trim().toLowerCase();
const hosts = [apex, `www.${apex}`, `ao.${apex}`, `pt.${apex}`, `cms.${apex}`];
let failed = false;

for (const host of hosts) {
  try {
    const records = await resolveAny(host);
    const response = await fetch(`https://${host}`, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
    console.log(`PASS ${host}: DNS=${records.map((record) => record.type).join(',')} HTTP=${response.status}`);
  } catch (error) {
    failed = true;
    console.error(`WAIT ${host}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  console.error('\nProduction domains are not ready. Follow docs/production-domain-cutover.md.');
  process.exitCode = 1;
}
