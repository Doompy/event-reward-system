# Event Reward System

마이크로서비스 아키텍처를 사용한 이벤트 리워드 시스템입니다.

## 목차
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [주요 기능](#주요-기능)
- [시작하기](#시작하기)
- [API 문서](#api-문서)
- [설계 의도 및 구현 방식](#설계-의도-및-구현-방식)
- [테스트](#테스트)
- [배포](#배포)

## 기술 스택

- **Backend Framework**: NestJS
- **Database**: MongoDB
- **Container**: Docker
- **Architecture**: Microservices
- **Language**: TypeScript
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI

## 시스템 아키텍처

### 서비스 구성
- **Gateway Service** (포트: 3000)
  - 모든 API 요청의 진입점
  - 인증 및 권한 검사
  - 요청 라우팅
  - API 문서화 (Swagger)

- **Auth Service** (포트: 3001)
  - 사용자 관리
  - 인증 처리
  - JWT 토큰 관리
  - 역할 기반 권한 관리

- **Event Service** (포트: 3002)
  - 이벤트 관리
  - 보상 관리
  - 참여 관리

### 데이터베이스
- MongoDB를 사용하여 각 서비스별 독립적인 데이터 저장
- 기본적인 인덱스 설정

## 주요 기능

### 1. 이벤트 관리
- 이벤트 생성 및 수정
- 다양한 조건 설정:
  - LOGIN_DAYS: 로그인 일수
  - INVITE_FRIENDS: 친구 초대
  - PURCHASE_AMOUNT: 구매 금액
  - QUEST_COMPLETION: 퀘스트 완료
  - ATTENDANCE: 출석
  - CUSTOM: 커스텀 조건
- 기간 및 상태 관리
- 참여자 관리

### 2. 보상 관리
- 다양한 타입 보상 지원
  - POINT: 포인트 보상
  - COUPON: 쿠폰 보상
  - ITEM: 아이템 보상
- 보상 수량 설정
- 자동 보상 지급
- 보상 이력 관리

### 3. 사용자 관리
- 회원가입 및 로그인
- 역할 기반 권한 관리
  - USER: 일반 사용자, 보상 요청 가능
  - OPERATOR: 이벤트/보상 관리
  - AUDITOR: 보상 이력 조회만 가능
  - ADMIN: 전체 관리

### 4. 보상 요청 처리
- 조건 충족 검증
- 중복 요청 방지
- 요청 상태 관리

## 시작하기

### 환경 설정

1. `.env` 파일 생성
```bash
# MongoDB 설정
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/event-reward?authSource=admin

# 서비스 포트 설정
GATEWAY_PORT=3000
AUTH_PORT=3001
EVENT_PORT=3002

# Service Hosts
AUTH_SERVICE_HOST=auth
AUTH_SERVICE_PORT=3001
EVENT_SERVICE_HOST=event
EVENT_SERVICE_PORT=3002

# JWT 설정
JWT_SECRET=7532a59908c37afba34d244a468e6731f27f8b9d8a636dfc1adc547e42f6d39c
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRATION=7d
```

### 개발 환경 실행

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn start:dev
```

### Docker로 실행 (권장)

```bash
# Docker 컨테이너 빌드 및 실행
docker-compose up -d
```

## API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
- Gateway: `http://localhost:3000/api-docs`

API 문서는 다음과 같은 섹션으로 구성되어 있습니다:
- 사용자 API: 사용자 인증 및 권한 관리
- 이벤트 API: 이벤트 및 보상 관리

### API 인증

대부분의 API는 JWT 토큰 인증이 필요합니다. 토큰은 다음과 같이 얻을 수 있습니다:
1. `/users/register` 엔드포인트로 사용자 생성
2. `/users/login` 엔드포인트로 로그인하여 토큰 발급
3. 발급받은 토큰을 Authorization 헤더에 포함하여 API 요청
   
예시:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 주요 API 예시

1. 사용자 등록
```
POST /users/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "nickname": "사용자1"
}
```

2. 로그인
```
POST /users/login
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

3. 이벤트 생성 (OPERATOR, ADMIN 권한 필요)
```
POST /events
{
  "title": "신규 사용자 이벤트",
  "description": "신규 가입 사용자 대상 보상 이벤트",
  "startDate": "2023-09-01T00:00:00Z",
  "endDate": "2023-09-30T23:59:59Z",
  "status": "ACTIVE",
  "conditionType": "ATTENDANCE",
  "conditionValue": {
    "count": 5,
    "days": 7
  },
  "autoReward": false,
  "maxParticipants": 1000
}
```

4. 보상 생성 (OPERATOR, ADMIN 권한 필요)
```
POST /events/{eventId}/rewards
{
  "name": "가입 축하 포인트",
  "description": "신규 가입 사용자 대상 포인트 보상",
  "type": "POINT",
  "value": "1000",
  "totalQuantity": 1000,
  "metadata": {
    "pointExpiry": "30d"
  }
}
```

5. 보상 요청
```
POST /events/{eventId}/request
{
  "rewardIds": ["60a1b2c3d4e5f6g7h8i9j0k1"],
  "verificationData": {
    "registrationDate": "2023-09-05T10:00:00Z"
  }
}
```

## 설계 의도 및 구현 방식

### 1. 마이크로서비스 아키텍처
- 서비스별 독립적인 배포와 확장 가능
- 기술 스택의 유연한 변경 가능
- 서비스별 독립적인 데이터베이스 관리

### 2. 인증 및 권한 관리
- JWT를 사용한 무상태(Stateless) 인증
- 역할 기반 접근 제어(RBAC) 구현
- 토큰 갱신 및 폐기 메커니즘

### 3. 이벤트 및 보상 시스템
- 이벤트 조건의 유연한 확장 가능
- 보상 지급의 원자성 보장
- 중복 참여 및 보상 방지

### 4. 데이터베이스 설계
- MongoDB를 사용한 유연한 스키마
- 기본적인 인덱스 설정

## 테스트 (TEST_COVERAGE.md 참조)

```bash
# 단위 테스트
yarn test

# 통합 테스트
yarn test:integration
```

## 배포

### Docker 배포 (권장)
```bash
# Docker 컨테이너 빌드 및 실행
docker-compose up --build
```

### 환경별 설정
- 개발 환경: `docker-compose.yml`