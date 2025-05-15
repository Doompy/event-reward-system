import { Controller, Get } from '@nestjs/common';
import { EventService } from './event.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  getHello(): string {
    return this.eventService.getHello();
  }

  @MessagePattern({ cmd: 'health' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'event',
      timestamp: new Date().toISOString(),
    };
  }
}
