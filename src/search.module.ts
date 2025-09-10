import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from './shared.module';
import { GetAvailabilityHandler } from './domain/handlers/get-availability.handler';
import { SearchController } from './infrastructure/controllers/search.controller';

@Module({
  imports: [CqrsModule, SharedModule],
  controllers: [SearchController],
  providers: [GetAvailabilityHandler],
})
export class SearchModule {}