import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Query, 
  UseGuards, 
  Request, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'libs/database/schema/user.schema';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // 이벤트 관리 API
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async createEvent(@Body() createEventDto: any, @Request() req) {
    try {
      return await this.eventsService.createEvent(createEventDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAllEvents(@Query() filters?: Record<string, any>) {
    try {
      return await this.eventsService.findAllEvents(filters);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('active')
  async findActiveEvents() {
    try {
      return await this.eventsService.findActiveEvents();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    try {
      return await this.eventsService.findEventById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async updateEvent(
    @Param('id') id: string, 
    @Body() updateEventDto: any, 
    @Request() req
  ) {
    try {
      return await this.eventsService.updateEvent(id, updateEventDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 보상 관리 API
  @Post(':eventId/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async createReward(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: any,
    @Request() req
  ) {
    try {
      const fullRewardDto = { ...createRewardDto, eventId };
      return await this.eventsService.createReward(fullRewardDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':eventId/rewards')
  async findRewardsByEventId(@Param('eventId') eventId: string) {
    try {
      return await this.eventsService.findRewardsByEventId(eventId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('rewards/:id')
  async findRewardById(@Param('id') id: string) {
    try {
      return await this.eventsService.findRewardById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put('rewards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async updateReward(
    @Param('id') id: string,
    @Body() updateRewardDto: any,
    @Request() req
  ) {
    try {
      return await this.eventsService.updateReward(id, updateRewardDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 보상 요청 API
  @Post(':eventId/request')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  async createRewardRequest(
    @Param('eventId') eventId: string,
    @Body() verificationData: Record<string, any>,
    @Request() req
  ) {
    try {
      const createRewardRequestDto = { eventId, verificationData };
      return await this.eventsService.createRewardRequest(createRewardRequestDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async updateRewardRequest(
    @Param('id') id: string,
    @Body() updateRewardRequestDto: any,
    @Request() req
  ) {
    try {
      return await this.eventsService.updateRewardRequest(id, updateRewardRequestDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  async findRewardRequestById(@Param('id') id: string, @Request() req) {
    try {
      const request = await this.eventsService.findRewardRequestById(id);
      
      // 일반 사용자는 자신의 요청만 볼 수 있음
      if (req.user.role === UserRole.USER && request.userId.toString() !== req.user._id) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      
      return request;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('user/requests')
  @UseGuards(JwtAuthGuard)
  async findMyRewardRequests(@Request() req) {
    try {
      return await this.eventsService.findRewardRequestsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async findRewardRequests(@Query() filters?: Record<string, any>) {
    try {
      return await this.eventsService.findRewardRequests(filters);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 유저 보상 관리
  @Get('user/rewards')
  @UseGuards(JwtAuthGuard)
  async findMyRewards(@Request() req) {
    try {
      return await this.eventsService.findUserRewardsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:userId/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async findUserRewards(@Param('userId') userId: string) {
    try {
      return await this.eventsService.findUserRewardsByUserId(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 이벤트 참여 관련 API
  @Post(':eventId/participate')
  @UseGuards(JwtAuthGuard)
  async participateInEvent(
    @Param('eventId') eventId: string,
    @Body() participationData: Record<string, any>,
    @Request() req
  ) {
    try {
      const createParticipationDto = { 
        eventId, 
        verificationData: participationData.verificationData,
        additionalData: participationData.additionalData
      };
      return await this.eventsService.createParticipation(createParticipationDto, req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':eventId/participations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async findEventParticipations(@Param('eventId') eventId: string) {
    try {
      return await this.eventsService.findParticipationsByEventId(eventId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/participations')
  @UseGuards(JwtAuthGuard)
  async findMyParticipations(@Request() req) {
    try {
      return await this.eventsService.findParticipationsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:userId/participations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async findUserParticipations(@Param('userId') userId: string) {
    try {
      return await this.eventsService.findParticipationsByUserId(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':eventId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  async getParticipationStats(@Param('eventId') eventId: string) {
    try {
      return await this.eventsService.getParticipationStats(eventId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 