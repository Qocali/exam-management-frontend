import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

// Standalone rejim (http://localhost:4203) — modulu shell-siz müstəqil inkişaf/test etmək üçün.
bootstrapApplication(App, appConfig).catch((err: unknown) => console.error(err));
