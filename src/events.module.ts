import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from './shared.module';
import { ClubUpdatedHandler } from './domain/handlers/club-updated.handler';
import { EventsController } from './infrastructure/controllers/events.controller';

@Module({
  imports: [CqrsModule, SharedModule],
  controllers: [EventsController],
  providers: [ClubUpdatedHandler],
})
export class EventsModule {}