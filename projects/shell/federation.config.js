const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',

  // Angular, Material, RxJS və @exam/shared (tsconfig path mapping) singleton paylaşılır —
  // remote-lar shell-in injector-u, servis instansiyaları və stilləri ilə işləyir.
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  // Animasiyalar istifadə olunmur və @angular/animations quraşdırılmayıb.
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    '@angular/platform-browser/animations',
    '@angular/platform-browser/animations/async',
  ],
});
