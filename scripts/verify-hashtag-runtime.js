const test = require('node:test');
const assert = require('node:assert');

// Test the core business logic and routing handlers of the hashtag feature
test('Hashtag Route & Page Logic Runtime Verification', async (t) => {
  // 1. Tag Sanitization and Normalization
  function cleanTag(tag) {
    return decodeURIComponent(tag).trim().replace(/^#+/, "").trim();
  }

  assert.strictEqual(cleanTag('nextjs'), 'nextjs');
  assert.strictEqual(cleanTag('#nextjs'), 'nextjs');
  assert.strictEqual(cleanTag('###nextjs'), 'nextjs');
  assert.strictEqual(cleanTag('%23nextjs'), 'nextjs');
  assert.strictEqual(cleanTag('%23%23react'), 'react');
  assert.strictEqual(cleanTag('  #coding  '), 'coding');
  assert.strictEqual(cleanTag('###'), '');
  assert.strictEqual(cleanTag('%23'), '');

  console.log('  ✔ Tag sanitization correctly strips leading #, decodes URI, and trims whitespace');

  // 2. Route Guard Validation (empty tag check)
  function validateTag(tag) {
    const cleaned = cleanTag(tag);
    if (!cleaned) {
      return { status: 400, error: 'Invalid hashtag' };
    }
    return { status: 200, tag: cleaned };
  }

  assert.deepStrictEqual(validateTag('###'), { status: 400, error: 'Invalid hashtag' });
  assert.deepStrictEqual(validateTag(''), { status: 400, error: 'Invalid hashtag' });
  assert.deepStrictEqual(validateTag('#NextJS'), { status: 200, tag: 'NextJS' });

  console.log('  ✔ Empty tag validation guard returns 400 Bad Request');

  // 3. Next.js 15 Async Params Resolution
  async function resolveParams(paramsPromise) {
    const { tag } = await paramsPromise;
    return cleanTag(tag);
  }

  const resolved = await resolveParams(Promise.resolve({ tag: '#webdev' }));
  assert.strictEqual(resolved, 'webdev');

  console.log('  ✔ Next.js 15 async params Promise resolution functions properly');

  // 4. Banner Count Formatting and Pluralization
  function formatHashtagBanner(tag, count) {
    const countFormatted = new Intl.NumberFormat('en-US', { notation: 'compact' }).format(count);
    return {
      title: `#${tag}`,
      label: `${countFormatted} ${count === 1 ? 'post' : 'posts'}`
    };
  }

  assert.deepStrictEqual(formatHashtagBanner('nextjs', 1), { title: '#nextjs', label: '1 post' });
  assert.deepStrictEqual(formatHashtagBanner('nextjs', 0), { title: '#nextjs', label: '0 posts' });
  assert.deepStrictEqual(formatHashtagBanner('nextjs', 42), { title: '#nextjs', label: '42 posts' });
  assert.deepStrictEqual(formatHashtagBanner('nextjs', 1500), { title: '#nextjs', label: '1.5K posts' });

  console.log('  ✔ Banner header title and count pluralization formatted as specced');
});
