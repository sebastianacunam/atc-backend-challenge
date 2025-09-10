import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ALQUILA_TU_CANCHA_CLIENT } from './domain/ports/aquila-tu-cancha.client';
import { HTTPAlquilaTuCanchaClient } from './infrastructure/clients/http-alquila-tu-cancha.client';
import { CacheService } from './infrastructure/cache/cache.service';
import { ConfigModule } from '@nestjs/config';

const AlquilaTuCanchaClientProvider = {
  provide: ALQUILA_TU_CANCHA_CLIENT,
  useClass: HTTPAlquilaTuCanchaClient,
};

@Module({
  imports: [
    HttpModule,
    ConfigModule 
  ],
  providers: [CacheService, AlquilaTuCanchaClientProvider],
  exports: [CacheService, AlquilaTuCanchaClientProvider],
})
export class SharedModule {}