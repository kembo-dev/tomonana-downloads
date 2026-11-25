(() => {
  const panel = document.querySelector('[data-apk-check]');
  if (!panel) return;
  const download = document.querySelector('[data-checked-download]');
  const input = panel.querySelector('input');
  const status = panel.querySelector('[role="status"]');
  const progress = panel.querySelector('progress');
  const cancel = panel.querySelector('button');
  const save = panel.querySelector('[data-save]');
  const supported = typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' &&
    typeof Blob.prototype.arrayBuffer === 'function';
  if (!supported) {
    status.textContent = 'Le contrôle local nécessite un navigateur récent. Utilisez Chrome ou Firefox à jour. Le téléchargement direct reste disponible.';
    input.disabled = true;
    return;
  }
  let worker, timer, objectURL;
  const cleanup = () => {
    clearTimeout(timer);
    worker?.terminate();
    worker = null;
    cancel.hidden = true;
    progress.hidden = true;
    input.disabled = false;
    download?.removeAttribute('aria-disabled');
  };
  const announce = (state, message) => {
    panel.dataset.state = state;
    status.textContent = message;
  };
  const fail = message => { cleanup(); announce('error', message); };
  const watchdog = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fail('Le transfert ou la vérification ne répond plus. Réessayez ou utilisez le lien de secours.'), 90000);
  };
  const start = file => {
    cleanup();
    if (objectURL) URL.revokeObjectURL(objectURL);
    save.hidden = true;
    save.removeAttribute('href');
    input.disabled = true;
    download?.setAttribute('aria-disabled', 'true');
    progress.hidden = false;
    progress.value = 0;
    cancel.hidden = false;
    announce('checking', file ? 'Vérification du fichier sur votre appareil…' : 'Téléchargement et vérification en cours… Gardez cette page ouverte.');
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try {
      worker = new Worker(new URL('verify-worker.js', document.currentScript?.src ||
        new URL('download-check.js', document.baseURI).href));
      worker.onerror = event => {
        event.preventDefault();
        fail('La vérification est indisponible. Réessayez dans un navigateur à jour ou utilisez le lien de secours. Aucun fichier n’a été validé.');
      };
      worker.onmessage = ({ data }) => {
        watchdog();
        if (data.type === 'progress') progress.value = Math.floor(100 * data.received / data.total);
        if (data.type === 'error') {
          const damaged = data.reason === 'size' || data.reason === 'digest';
          fail(damaged
            ? 'Ce fichier est incomplet, altéré ou correspond à une autre version. Ne l’installez pas. Retéléchargez-le, puis vérifiez le nouveau fichier.'
            : 'La vérification a échoué. Vérifiez votre connexion et réessayez, ou utilisez le lien de secours. Aucun fichier n’a été validé.');
        }
        if (data.type === 'verified') {
          cleanup();
          if (data.blob) {
            objectURL = URL.createObjectURL(data.blob);
            save.href = objectURL;
            save.download = `tomonana-${panel.dataset.version}-${panel.dataset.sha256.slice(0, 8)}.apk`;
            save.hidden = false;
            announce('verified', 'Fichier reçu conforme. Enregistrez l’APK, puis ouvrez-le depuis vos téléchargements pour installer Tomonana.');
            save.focus();
          } else announce('verified', `Fichier conforme à Tomonana ${panel.dataset.version}. Vous pouvez maintenant l’ouvrir pour l’installer. Android vérifiera également sa signature.`);
        }
      };
      worker.postMessage({ file, url: download?.href, expectedSize: Number(panel.dataset.size),
        expectedHash: panel.dataset.sha256 });
      watchdog();
    } catch {
      fail('Le contrôle n’a pas pu démarrer. Réessayez ou utilisez le lien de secours.');
    }
  };
  if (download) {
    download.textContent = 'Télécharger et vérifier l’APK';
    download.addEventListener('click', event => {
      event.preventDefault();
      if (!worker) start(null);
    });
  }
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) start(file);
    input.value = '';
  });
  cancel.addEventListener('click', () => {
    cleanup();
    announce('cancelled', 'Opération annulée. Vous pouvez recommencer.');
  });
  window.addEventListener('pagehide', () => {
    cleanup();
    if (objectURL) URL.revokeObjectURL(objectURL);
  });
})();
