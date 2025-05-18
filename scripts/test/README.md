# 이벤트 리워드 시스템 통합 테스트

이 디렉토리에는 이벤트 리워드 시스템의 통합 테스트를 위한 스크립트들이 포함되어 있습니다.

## 스크립트 목록

1. `integrated-test.js` - 전체 시스템 통합 테스트 (인증, 이벤트, 참여, 보상)
2. `participation-http-test.js` - 이벤트 참여 API 테스트 (Node.js http 모듈 사용)
3. `participation.api.test.ts` - 이벤트 참여 API 테스트 (axios 사용)

## 통합 테스트 실행 방법

### 1. 서비스 실행

통합 테스트를 실행하기 전에 모든 서비스가 실행 중이어야 합니다:

```bash
# 터미널 1: Gateway 서비스
npm run start:dev gateway

# 터미널 2: Auth 서비스
npm run start:dev auth

# 터미널 3: Event 서비스
npm run start:dev event
```

### 2. 테스트 환경 설정

테스트에 필요한 환경 변수를 설정합니다:

```bash
# Windows
set API_HOST=localhost
set API_PORT=3000
set API_PROTOCOL=http
set TEST_USER_EMAIL=test@example.com
set TEST_USER_PASSWORD=testpassword
set TEST_EVENT_ID=your_event_id  # 선택 사항: 특정 이벤트 테스트

# Linux/Mac
export API_HOST=localhost
export API_PORT=3000
export API_PROTOCOL=http
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpassword
export TEST_EVENT_ID=your_event_id  # 선택 사항: 특정 이벤트 테스트
```

### 3. 통합 테스트 실행

```bash
# 전체 통합 테스트 실행
node scripts/test/integrated-test.js

# 이벤트 참여 테스트만 실행 (http 모듈)
node scripts/test/participation-http-test.js

# 이벤트 참여 테스트만 실행 (axios)
node scripts/test/participation.api.test.js
```

## Jest E2E 테스트 실행

NestJS의 기본 테스트 프레임워크인 Jest를 사용한 E2E 테스트를 실행하려면:

```bash
# 게이트웨이 서비스 E2E 테스트
npm test -- --config ./apps/gateway/test/jest-e2e.json

# 이벤트 서비스 E2E 테스트
npm test -- --config ./apps/event/test/jest-e2e.json

# 인증 서비스 E2E 테스트
npm test -- --config ./apps/auth/test/jest-e2e.json
```

## 테스트 결과 해석

통합 테스트는 다음과 같은 결과 요약을 제공합니다:

- 실행 시간: 테스트 실행에 걸린 총 시간
- 총 테스트: 실행된 테스트 케이스 수
- 성공: 성공한 테스트 케이스 수
- 실패: 실패한 테스트 케이스 수
- 성공률: 테스트 성공 비율

## 문제 해결

1. 연결 오류 (ECONNREFUSED)
   - 모든 서비스가 실행 중인지 확인
   - 환경 변수의 호스트와 포트가 올바른지 확인

2. 인증 오류
   - 테스트 사용자 계정 정보가 올바른지 확인
   - JWT 시크릿이 모든 서비스에서 동일한지 확인

3. 테스트 데이터 오류
   - 테스트에 필요한 이벤트와 보상이 데이터베이스에 존재하는지 확인 