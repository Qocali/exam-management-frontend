import { initFederation } from '@angular-architects/native-federation';

// Manifest remote-ların ünvanlarını saxlayır; production-da deploy zamanı əvəz olunur
// (bax: docker/shell-entrypoint.sh). Remote əlçatan olmasa belə shell açılır.
initFederation('federation.manifest.json')
  .catch((err: unknown) => console.error('[shell] federation init xətası', err))
  .then(() => import('./bootstrap'))
  .catch((err: unknown) => console.error(err));
