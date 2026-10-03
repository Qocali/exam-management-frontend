const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mfe-tests',

  exposes: {
    './routes': './projects/mfe-tests/src/app/tests.routes.ts',
  },

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
