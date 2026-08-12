import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { DomainExceptionFilter } from './shared/infrastructure/domain-exception.filter';

// ponytail: wiring compartido entre main.ts y los e2e tests (composición
// real, cero overrides) — para que ambos arranquen exactamente igual.
export function configureApp(app: INestApplication): void {
  app.enableCors();
  app.use(express.text({ type: 'text/csv' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
}
