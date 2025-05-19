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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('이벤트')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // 이벤트 관리 API
  @ApiOperation({ summary: '이벤트 생성', description: '새로운 이벤트를 생성합니다.' })
  @ApiBearerAuth()
  @ApiBody({ schema: { 
    properties: { 
      title: { type: 'string', example: '신규 사용자 이벤트' },
      description: { type: 'string', example: '신규 가입 사용자 대상 보상 이벤트' },
      startDate: { type: 'string', format: 'date-time', example: '2023-09-01T00:00:00Z' },
      endDate: { type: 'string', format: 'date-time', example: '2023-09-30T23:59:59Z' },
      verificationCondition: { type: 'object', example: { type: 'REGISTRATION', requiredFields: ['email'] } },
      status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ENDED', 'CANCELED'], example: 'DRAFT' },
      maxParticipations: { type: 'number', example: 1000 },
      participationLimit: { type: 'number', example: 1 }
    }
  }})
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
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

  @ApiOperation({ summary: '모든 이벤트 조회', description: '모든 이벤트를 조회합니다. 필터링 가능합니다.' })
  @ApiQuery({ name: 'status', required: false, description: '이벤트 상태로 필터링 (DRAFT, ACTIVE, ENDED, CANCELED)' })
  @ApiResponse({ status: 200, description: '이벤트 목록 반환 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get()
  async findAllEvents(@Query() filters?: Record<string, any>) {
    try {
      return await this.eventsService.findAllEvents(filters);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '활성화된 이벤트 조회', description: '현재 활성화된 이벤트만 조회합니다.' })
  @ApiResponse({ status: 200, description: '활성화된 이벤트 목록 반환 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get('active')
  async findActiveEvents() {
    try {
      return await this.eventsService.findActiveEvents();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '이벤트 상세 조회', description: '특정 이벤트의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 상세 정보 반환 성공' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @Get(':id')
  async findEventById(@Param('id') id: string) {
    try {
      return await this.eventsService.findEventById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @ApiOperation({ summary: '이벤트 수정', description: '특정 이벤트의 정보를 수정합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiBody({ schema: { 
    properties: { 
      title: { type: 'string', example: '수정된 이벤트 제목' },
      description: { type: 'string', example: '수정된 이벤트 설명' },
      status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ENDED', 'CANCELED'], example: 'ACTIVE' }
    }
  }})
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
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
  @ApiOperation({ summary: '보상 생성', description: '특정 이벤트에 새로운 보상을 추가합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiBody({ schema: { 
    properties: { 
      name: { type: 'string', example: '가입 축하 포인트' },
      description: { type: 'string', example: '신규 가입 사용자 대상 포인트 보상' },
      type: { type: 'string', enum: ['POINT', 'COUPON', 'ITEM'], example: 'POINT' },
      value: { type: 'string', example: '1000' },
      totalQuantity: { type: 'number', example: 1000 },
      metadata: { type: 'object', example: { pointExpiry: '30d' } }
    }
  }})
  @ApiResponse({ status: 201, description: '보상 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
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

  @ApiOperation({ summary: '이벤트에 연결된 보상 조회', description: '특정 이벤트에 연결된 모든 보상을 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '보상 목록 반환 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get(':eventId/rewards')
  async findRewardsByEventId(@Param('eventId') eventId: string) {
    try {
      return await this.eventsService.findRewardsByEventId(eventId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '보상 상세 조회', description: '특정 보상의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiResponse({ status: 200, description: '보상 상세 정보 반환 성공' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  @Get('rewards/:id')
  async findRewardById(@Param('id') id: string) {
    try {
      return await this.eventsService.findRewardById(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @ApiOperation({ summary: '보상 정보 수정', description: '특정 보상의 정보를 수정합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiBody({ schema: { 
    properties: { 
      name: { type: 'string', example: '수정된 보상 이름' },
      description: { type: 'string', example: '수정된 보상 설명' },
      totalQuantity: { type: 'number', example: 2000 }
    }
  }})
  @ApiResponse({ status: 200, description: '보상 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
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
  @ApiOperation({ summary: '보상 요청 생성', description: '이벤트 참여 후 보상을 요청합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiBody({ schema: { 
    properties: { 
      verificationData: { type: 'object', example: { registrationDate: '2023-09-05T10:00:00Z' } }
    }
  }})
  @ApiResponse({ status: 201, description: '보상 요청 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
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

  @ApiOperation({ summary: '보상 요청 상태 업데이트', description: '보상 요청 상태를 업데이트합니다 (승인/거부).' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '보상 요청 ID' })
  @ApiBody({ schema: { 
    properties: { 
      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' },
      note: { type: 'string', example: '요청이 승인되었습니다.' }
    }
  }})
  @ApiResponse({ status: 200, description: '보상 요청 업데이트 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
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

  @ApiOperation({ summary: '보상 요청 상세 조회', description: '특정 보상 요청의 상세 정보를 조회합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '보상 요청 ID' })
  @ApiResponse({ status: 200, description: '보상 요청 상세 정보 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 404, description: '보상 요청을 찾을 수 없음' })
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

  @ApiOperation({ summary: '내 보상 요청 목록 조회', description: '로그인한 사용자의 모든 보상 요청을 조회합니다.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 요청 목록 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get('user/requests')
  @UseGuards(JwtAuthGuard)
  async findMyRewardRequests(@Request() req) {
    try {
      return await this.eventsService.findRewardRequestsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '모든 보상 요청 조회', description: '모든 보상 요청을 조회합니다 (관리자용).' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, description: '요청 상태로 필터링 (PENDING, APPROVED, REJECTED)' })
  @ApiResponse({ status: 200, description: '보상 요청 목록 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
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
  @ApiOperation({ summary: '내 보상 목록 조회', description: '로그인한 사용자가 받은 모든 보상을 조회합니다.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 목록 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get('user/rewards')
  @UseGuards(JwtAuthGuard)
  async findMyRewards(@Request() req) {
    try {
      return await this.eventsService.findUserRewardsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '사용자 보상 목록 조회', description: '특정 사용자가 받은 모든 보상을 조회합니다 (관리자용).' })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '보상 목록 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
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
  @ApiOperation({ summary: '이벤트 참여', description: '특정 이벤트에 참여합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiBody({ schema: { 
    properties: { 
      verificationData: { type: 'object', example: { code: 'EVENT123' } },
      additionalData: { type: 'object', example: { source: 'mobile_app' } }
    }
  }})
  @ApiResponse({ status: 201, description: '이벤트 참여 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
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

  @ApiOperation({ summary: '이벤트 참여자 조회', description: '특정 이벤트의 모든 참여자를 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '참여자 목록 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
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

  @ApiOperation({ summary: '내 이벤트 참여 내역 조회', description: '현재 로그인한 사용자의 이벤트 참여 내역을 조회합니다.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '참여 내역 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @Get('user/participations')
  @UseGuards(JwtAuthGuard)
  async findMyParticipations(@Request() req) {
    try {
      return await this.eventsService.findParticipationsByUserId(req.user._id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '사용자 이벤트 참여 내역 조회', description: '특정 사용자의 이벤트 참여 내역을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '참여 내역 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
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

  @ApiOperation({ summary: '이벤트 참여 통계 조회', description: '특정 이벤트의 참여 통계를 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '통계 데이터 반환 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
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