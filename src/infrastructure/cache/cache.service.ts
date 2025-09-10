import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getKey(placeId: string, date: string): string {
    return `availability:${placeId}:${date}`;
  }

  async getAvailability(placeId: string, date: string): Promise<any> {
    const key = this.getKey(placeId, date);
    return this.cacheManager.get(key);
  }

  async setAvailability(placeId: string, date: string, data: any) {
    const key = this.getKey(placeId, date);
    await this.cacheManager.set(key, data, { ttl: 0 });
  }

  async updateCourtSlots(placeId: string, date: string, courtId: number, newSlots: any[]) {
    const allData: any[] = await this.getAvailability(placeId, date);
    if (allData) {
      for (const club of allData) {
        const court = club.courts.find((c: any) => c.id === courtId);
        if (court) {
          court.slots = newSlots;
          break;
        }
      }
      await this.setAvailability(placeId, date, allData);
    }
  }

   async deleteAvailability(placeId: string, date: string) {
    const key = this.getKey(placeId, date);
    await this.cacheManager.del(key);
  }
}