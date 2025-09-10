// Ruta: src/infrastructure/controllers/events.controller.ts

import { Body, Controller, Post, Inject, Logger } from '@nestjs/common';
import { UseZodGuard } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { CacheService } from '../cache/cache.service';
import { ALQUILA_TU_CANCHA_CLIENT, AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

// Asumimos que el payload de los eventos de booking también incluye placeId
const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string(),
  start: z.string(),
  end: z.string(),
  _priority: z.number(),
  placeId: z.string().optional(), 
});

export const ExternalEventSchema = z.union([
  z.object({
    type: z.enum(['booking_cancelled', 'booking_created']),
    clubId: z.number().int(),
    courtId: z.number().int(),
    slot: SlotSchema,
  }),
  z.object({
    type: z.literal('club_updated'),
    clubId: z.number().int(),
    placeId: z.string().optional(), 
    fields: z.array(
      z.enum(['attributes', 'openhours', 'logo_url', 'background_url']),
    ),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    placeId: z.string().optional(), 
    fields: z.array(z.enum(['attributes', 'name'])),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly cacheService: CacheService,
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly alquilaTuCanchaClient: AlquilaTuCanchaClient,
  ) {}

  @Post()
  @UseZodGuard('body', ExternalEventSchema)
  async receiveEvent(@Body() externalEvent: ExternalEventDTO) {
    this.logger.log(`Event received: ${externalEvent.type}`);

    switch (externalEvent.type) {
      // CASO 1: BOOKING CREADO O CANCELADO (El más simple)
      case 'booking_created':
      case 'booking_cancelled': {
        const { clubId, courtId, slot } = externalEvent;
        const { placeId, datetime } = slot;
        const dateString = datetime.split('T')[0];

        const newSlots = await this.alquilaTuCanchaClient.getAvailableSlots(
          clubId,
          courtId,
          new Date(dateString),
        );

        await this.cacheService.updateCourtSlots(placeId, dateString, courtId, newSlots);
        this.logger.log(`Cache updated for court ${courtId} on date ${dateString}`);
        break;
      }

      // CASO 2: CANCHA ACTUALIZADA (Info estática)
      case 'court_updated': {
        const { placeId, clubId, courtId } = externalEvent;
        // La info de la cancha puede afectar la disponibilidad de los próximos 7 días
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateString = date.toISOString().split('T')[0];

          // Forzamos un "cache miss" para esta zona/fecha para que la próxima vez se recargue con los datos nuevos
          // Una solución más avanzada sería actualizar solo la info de la cancha sin recargar todo
          await this.cacheService.deleteAvailability(placeId, dateString);
        }
        this.logger.log(`Cache invalidated for court ${courtId} for the next 7 days.`);
        break;
      }
      
      // CASO 3: CLUB ACTUALIZADO (El más complejo)
      case 'club_updated': {
        const { placeId, clubId, fields } = externalEvent;

        // Si cambia el horario de apertura, la disponibilidad se ve afectada
        if (fields.includes('openhours')) {
          this.logger.log(`Club ${clubId} open_hours changed. Invalidating cache for the next 7 days.`);
          // Invalidamos el caché para los próximos 7 días para forzar la recarga
           for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            await this.cacheService.deleteAvailability(placeId, dateString);
          }
        } else {
          // Si solo cambia info estática (nombre, logo), también forzamos la recarga
          this.logger.log(`Club ${clubId} static info changed. Invalidating cache for the next 7 days.`);
           for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            await this.cacheService.deleteAvailability(placeId, dateString);
          }
        }
        break;
      }
    }
  }
}