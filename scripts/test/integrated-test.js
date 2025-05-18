/**
 * 이벤트 리워드 시스템 통합 테스트 스크립트
 * 
 * 이 스크립트는 시스템의 주요 기능들을 순차적으로 테스트합니다:
 * 1. 인증 (로그인, 토큰 검증)
 * 2. 이벤트 관리 (조회, 생성)
 * 3. 이벤트 참여
 * 4. 보상 요청
 * 
 * 사용법:
 * - 테스트 사용자 계정 정보와 환경 변수 설정 후 실행
 * - node scripts/test/integrated-test.js
 */

const axios = require('axios');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// 테스트 계정 정보
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword'
};

// 상태 저장용 객체
const state = {
  userToken: null,
  adminToken: null,
  testEventId: null,
  participationId: null,
  rewardRequestId: null
};

// HTTP 요청 유틸리티 함수
async function makeRequest(method, path, data, token) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios(config);
    
    return {
      statusCode: response.status,
      headers: response.headers,
      data: response.data
    };
  } catch (error) {
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      };
    }
    throw error;
  }
}

// 테스트 러너 유틸리티
async function runTest(name, testFn, results) {
  console.log(`\n[테스트] ${name}`);
  console.log('-'.repeat(50));
  
  try {
    await testFn();
    console.log('✅ 성공');
    results.passed++;
  } catch (error) {
    console.error('❌ 실패:', error.message);
    if (error.response) {
      console.error('응답:', error.response.data);
    }
    results.failed++;
  }
}

// 인증 테스트
async function testAuthentication(results) {
  await runTest('사용자 로그인', async () => {
    const response = await makeRequest('POST', '/users/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('응답 상태:', response.statusCode);
    console.log('응답 데이터:', response.data);
    
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`로그인 실패: ${response.statusCode}`);
    }
    
    if (!response.data.access_token) {
      throw new Error('액세스 토큰이 반환되지 않았습니다');
    }
    
    state.userToken = response.data.access_token;
    console.log('액세스 토큰 획득 성공');
  }, results);
  
  // 추가 토큰 획득 로직이 필요한 경우 여기에 작성
}

// 이벤트 관리 테스트
async function testEventManagement(results) {
  // 활성 이벤트 목록 조회
  await runTest('활성 이벤트 목록 조회', async () => {
    const response = await makeRequest(
      'GET',
      '/events/active',
      null,
      state.userToken
    );
    
    console.log('응답 상태:', response.statusCode);
    console.log('활성 이벤트 수:', response.data.length);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('이벤트 목록이 배열 형태가 아닙니다');
    }
    
    // 테스트를 위한 이벤트 ID 저장
    if (response.data.length > 0) {
      state.testEventId = response.data[0]._id || response.data[0].id;
      console.log('테스트용 이벤트 ID:', state.testEventId);
    } else {
      console.log('경고: 테스트용 활성 이벤트가 없습니다');
    }
  }, results);
  
  // 이벤트 ID가 없으면 이벤트 생성 시도
  if (!state.testEventId) {
    await runTest('테스트 이벤트 생성', async () => {
      // 관리자 토큰이 필요하므로 먼저 관리자 로그인이 필요할 수 있음
      const newEvent = {
        title: '통합 테스트용 이벤트',
        description: '자동화된 통합 테스트를 위한 이벤트입니다',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7일 후
        type: 'LOGIN',
        conditions: {
          loginCount: 1
        },
        status: 'ACTIVE'
      };
      
      const response = await makeRequest(
        'POST',
        '/events',
        newEvent,
        state.adminToken || state.userToken // 관리자 토큰이 있으면 사용, 없으면 일반 사용자 토큰 시도
      );
      
      console.log('응답 상태:', response.statusCode);
      
      if (response.statusCode !== 201 && response.statusCode !== 200) {
        throw new Error(`이벤트 생성 실패: ${response.statusCode}`);
      }
      
      state.testEventId = response.data._id || response.data.id;
      console.log('생성된 테스트 이벤트 ID:', state.testEventId);
    }, results);
  }
}

// 이벤트 참여 테스트
async function testEventParticipation(results) {
  // 이벤트 참여 요청
  await runTest('이벤트 참여', async () => {
    if (!state.testEventId) {
      throw new Error('테스트할 이벤트 ID가 없습니다');
    }
    
    const response = await makeRequest(
      'POST',
      `/events/${state.testEventId}/participate`,
      {
        verificationData: { source: '통합 테스트' },
        additionalData: { comment: '자동화된 통합 테스트를 통한 참여' }
      },
      state.userToken
    );
    
    console.log('응답 상태:', response.statusCode);
    
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      throw new Error(`이벤트 참여 실패: ${response.statusCode}`);
    }
    
    state.participationId = response.data._id;
    console.log('참여 ID:', state.participationId);
  }, results);
  
  // 사용자 참여 목록 조회
  await runTest('사용자 참여 목록 조회', async () => {
    const response = await makeRequest(
      'GET',
      '/events/user/participations',
      null,
      state.userToken
    );
    
    console.log('응답 상태:', response.statusCode);
    console.log('참여 수:', response.data.length);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('참여 목록이 배열 형태가 아닙니다');
    }
  }, results);
}

// 보상 요청 테스트
async function testRewardRequest(results) {
  // 보상 요청 생성
  await runTest('보상 요청 생성', async () => {
    if (!state.testEventId) {
      throw new Error('테스트할 이벤트 ID가 없습니다');
    }
    
    const response = await makeRequest(
      'POST',
      `/events/${state.testEventId}/reward-requests`,
      {
        rewardId: 'dummy-reward-id', // 실제 보상 ID가 필요할 수 있음
        participationId: state.participationId,
        requestData: { source: '통합 테스트' }
      },
      state.userToken
    );
    
    console.log('응답 상태:', response.statusCode);
    
    // 201: 생성됨, 200: 이미 생성됨 (중복 요청)
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      throw new Error(`보상 요청 실패: ${response.statusCode}`);
    }
    
    if (response.data._id) {
      state.rewardRequestId = response.data._id;
      console.log('보상 요청 ID:', state.rewardRequestId);
    }
  }, results);
  
  // 보상 요청 상태 조회
  await runTest('보상 요청 상태 조회', async () => {
    if (!state.rewardRequestId) {
      console.log('경고: 보상 요청 ID가 없어 테스트를 건너뜁니다');
      return;
    }
    
    const response = await makeRequest(
      'GET',
      `/events/reward-requests/${state.rewardRequestId}`,
      null,
      state.userToken
    );
    
    console.log('응답 상태:', response.statusCode);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    console.log('보상 요청 상태:', response.data.status);
  }, results);
}

// 전체 테스트 실행
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('이벤트 리워드 시스템 통합 테스트 시작');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    startTime: Date.now()
  };
  
  try {
    // 1. 인증 테스트
    await testAuthentication(results);
    
    // 토큰이 없으면 추가 테스트 실행 불가
    if (!state.userToken) {
      throw new Error('인증 실패로 테스트를 중단합니다');
    }
    
    // 2. 이벤트 관리 테스트
    await testEventManagement(results);
    
    // 3. 이벤트 참여 테스트
    await testEventParticipation(results);
    
    // 4. 보상 요청 테스트
    await testRewardRequest(results);
    
  } catch (error) {
    console.error('\n⛔ 테스트 실행 중 치명적 오류:', error);
  }
  
  // 결과 계산
  results.total = results.passed + results.failed;
  results.duration = (Date.now() - results.startTime) / 1000;
  
  // 요약 출력
  console.log('\n='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`실행 시간: ${results.duration.toFixed(2)}초`);
  console.log(`총 테스트: ${results.total}`);
  console.log(`성공: ${results.passed}`);
  console.log(`실패: ${results.failed}`);
  console.log(`성공률: ${results.total > 0 ? (results.passed / results.total * 100).toFixed(2) : 0}%`);
  console.log('='.repeat(60));
  
  return results;
}

// 스크립트 실행
if (require.main === module) {
  runAllTests()
    .then(results => {
      const exitCode = results.failed > 0 ? 1 : 0;
      console.log(`테스트 완료, 종료 코드: ${exitCode}`);
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('테스트 실행 실패:', error);
      process.exit(1);
    });
} else {
  // 모듈로 사용 시 함수 내보내기
  module.exports = { runAllTests };
} 