import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared.module';
import { SearchModule } from './search.module';
import { EventsModule } from './events.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'redis',
      port: 6379,
    }),
    ConfigModule.forRoot(),
    SharedModule,
    SearchModule,
    EventsModule,
  ],
  controllers: [], 
  providers: [],
})
export class AppModule {}