import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CacheService } from 'src/infrastructure/cache/cache.service';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query'; // Asegúrate de que esta ruta sea correcta
import {
  ALQUILA_TU_CANCHA_CLIENT,
  AlquilaTuCanchaClient,
} from '../ports/aquila-tu-cancha.client';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly alquilaTuCanchaClient: AlquilaTuCanchaClient,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const { placeId, date } = query; // 'date' es un objeto Date

    // 1. Convertimos la fecha a un string para usarlo como CLAVE en el caché
    const dateString = date.toISOString().split('T')[0];

    console.log(`[Cache] Buscando en caché para ${placeId}:${dateString}...`);
    const cachedData = await this.cacheService.getAvailability(placeId, dateString);

    if (cachedData) {
      console.log(`[Cache] HIT! Sirviendo desde caché.`);
      return cachedData;
    }

    console.log(`[Cache] MISS! Yendo a la API mock...`);

    const clubs_with_availability: ClubWithAvailability[] = [];
    const clubs = await this.alquilaTuCanchaClient.getClubs(placeId);
    for (const club of clubs) {
      const courts = await this.alquilaTuCanchaClient.getCourts(club.id);
      const courts_with_availability: ClubWithAvailability['courts'] = [];
      for (const court of courts) {
        const slots = await this.alquilaTuCanchaClient.getAvailableSlots(
          club.id,
          court.id,
          date, 
        );

        courts_with_availability.push({
          ...court,
          available: slots,
        });
      }
      clubs_with_availability.push({
        ...club,
        courts: courts_with_availability,
      });
    }
    
    console.log(`[Cache] Guardando el nuevo resultado en caché...`);
    await this.cacheService.setAvailability(
      placeId,
      dateString,
      clubs_with_availability,
    );

    return clubs_with_availability;
  }
}