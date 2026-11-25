/* SHA-256 is calculated incrementally: local files never leave this device. */
importScripts('sha256-4.12.0.min.js');
self.onmessage = async ({ data }) => {
  try {
    const { file, url, expectedSize, expectedHash } = data;
    if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0 ||
        !/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error('metadata');
    if (file && file.size !== expectedSize) throw new Error('size');
    const hash = await hashwasm.createSHA256();
    hash.init();
    let received = 0;
    const chunks = [];
    const update = chunk => {
      received += chunk.byteLength;
      if (received > expectedSize) throw new Error('size');
      hash.update(chunk);
      self.postMessage({ type: 'progress', received, total: expectedSize });
    };
    if (file) {
      for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
        update(new Uint8Array(await file.slice(offset, offset + 1024 * 1024).arrayBuffer()));
      }
    } else {
      // Downloads are same-origin; the independent mirror only verifies saved files.
      if (new URL(url, self.location.href).origin !== self.location.origin) throw new Error('origin');
      const response = await fetch(url, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok || response.status !== 200 || !response.body) throw new Error('network');
      const reader = response.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          update(value);
          chunks.push(value);
        }
      } finally {
        await reader.cancel();
      }
    }
    if (received !== expectedSize) throw new Error('size');
    if (hash.digest('hex') !== expectedHash) throw new Error('digest');
    self.postMessage({ type: 'verified', blob: file ? null :
      new Blob(chunks, { type: 'application/vnd.android.package-archive' }) });
  } catch (error) {
    self.postMessage({ type: 'error', reason: ['size', 'digest', 'metadata'].includes(error.message)
      ? error.message : 'unavailable' });
  }
};
