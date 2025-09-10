// Ruta: src/infrastructure/cache/cache.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManagerMock: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get availability from cache', async () => {
    const placeId = 'test-place';
    const date = '2025-09-10';
    const key = `availability:${placeId}:${date}`;
    
    await service.getAvailability(placeId, date);
    
    // Verificamos que se llamó al método 'get' del cache manager con la clave correcta
    expect(cacheManagerMock.get).toHaveBeenCalledWith(key);
  });

  it('should set availability in cache', async () => {
    const placeId = 'test-place';
    const date = '2025-09-10';
    const data = { info: 'test-data' };
    const key = `availability:${placeId}:${date}`;
    
    await service.setAvailability(placeId, date, data);
    
    // Verificamos que se llamó al método 'set' con la clave y los datos correctos
    expect(cacheManagerMock.set).toHaveBeenCalledWith(key, data, { ttl: 0 });
  });
});