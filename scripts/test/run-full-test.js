/**
 * 이벤트 리워드 시스템 통합 테스트 스크립트
 */

const axios = require('axios');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// 테스트 상태 관리
const state = {
  userToken: null,
  operatorToken: null,
  userId: null,
  eventId: null,
  rewardId: null
};

// 테스트 계정 정보
const testAccounts = {
  user: {
    email: 'testuser@example.com',
    password: 'password123',
    nickname: 'TestUser'
  },
  operator: {
    email: 'operator@example.com',
    password: 'password123',
    nickname: 'TestOperator',
    role: 'OPERATOR'
  }
};

// 테스트 이벤트 정보
const testEvent = {
  name: '테스트 이벤트',
  description: '통합 테스트를 위한 테스트 이벤트입니다.',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1주일 후
  isActive: true,
  conditions: [
    {
      type: 'MANUAL',
      description: '간단한 수동 조건',
      verificationFields: ['testField']
    }
  ]
};

// 테스트 보상 정보
const testReward = {
  name: '테스트 보상',
  description: '테스트 보상 설명',
  type: 'VIRTUAL_ITEM',
  quantity: 100,
  value: 1000
};

// 유틸리티 함수 - API 호출
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    console.log(`${method} 요청: ${endpoint}`);
    const response = await axios(config);
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error(`API 오류 (${error.response?.status || 'unknown'}):`, 
      error.response?.data || error.message);
    
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

// 테스트 러너
async function runTest(name, testFn) {
  console.log(`\n===== 테스트 시작: ${name} =====`);
  
  try {
    const result = await testFn();
    console.log(`✅ 테스트 성공: ${name}`);
    return { name, success: true, result };
  } catch (error) {
    console.error(`❌ 테스트 실패: ${name}`);
    console.error(error);
    return { name, success: false, error: error.message };
  }
}

// 사용자 관련 테스트
async function testUserManagement() {
  // 일반 사용자 생성
  const userResult = await runTest('일반 사용자 생성', async () => {
    const response = await makeRequest('POST', '/users', testAccounts.user);
    
    if (!response.success) {
      if (response.status === 400 && response.error.message.includes('already exists')) {
        console.log('사용자가 이미 존재합니다. 로그인을 시도합니다.');
      } else {
        throw new Error(`사용자 생성 실패: ${response.error.message}`);
      }
    }
    
    // 사용자 로그인
    const loginResponse = await makeRequest('POST', '/users/login', {
      email: testAccounts.user.email,
      password: testAccounts.user.password
    });
    
    if (!loginResponse.success) {
      throw new Error(`로그인 실패: ${loginResponse.error.message}`);
    }
    
    state.userToken = loginResponse.data.access_token;
    state.userId = loginResponse.data.user._id;
    
    return loginResponse.data;
  });
  
  // 운영자 사용자 생성
  const operatorResult = await runTest('운영자 사용자 생성', async () => {
    const response = await makeRequest('POST', '/users', testAccounts.operator);
    
    if (!response.success) {
      if (response.status === 400 && response.error.message.includes('already exists')) {
        console.log('운영자가 이미 존재합니다. 로그인을 시도합니다.');
      } else {
        throw new Error(`운영자 생성 실패: ${response.error.message}`);
      }
    }
    
    // 운영자 로그인
    const loginResponse = await makeRequest('POST', '/users/login', {
      email: testAccounts.operator.email,
      password: testAccounts.operator.password
    });
    
    if (!loginResponse.success) {
      throw new Error(`운영자 로그인 실패: ${loginResponse.error.message}`);
    }
    
    state.operatorToken = loginResponse.data.access_token;
    
    return loginResponse.data;
  });
  
  return { userResult, operatorResult };
}

// 이벤트 관련 테스트
async function testEventManagement() {
  // 이벤트 생성
  const createEventResult = await runTest('이벤트 생성', async () => {
    const response = await makeRequest('POST', '/events', testEvent, state.operatorToken);
    
    if (!response.success) {
      throw new Error(`이벤트 생성 실패: ${response.error.message}`);
    }
    
    state.eventId = response.data._id;
    return response.data;
  });
  
  // 이벤트 조회
  const getEventResult = await runTest('이벤트 조회', async () => {
    const response = await makeRequest('GET', `/events/${state.eventId}`, null, state.userToken);
    
    if (!response.success) {
      throw new Error(`이벤트 조회 실패: ${response.error.message}`);
    }
    
    return response.data;
  });
  
  return { createEventResult, getEventResult };
}

// 보상 관련 테스트
async function testRewardManagement() {
  // 보상 생성
  const createRewardResult = await runTest('보상 생성', async () => {
    const rewardData = {
      ...testReward,
      eventId: state.eventId
    };
    
    const response = await makeRequest('POST', '/events/rewards', rewardData, state.operatorToken);
    
    if (!response.success) {
      throw new Error(`보상 생성 실패: ${response.error.message}`);
    }
    
    state.rewardId = response.data._id;
    return response.data;
  });
  
  // 보상 조회
  const getRewardResult = await runTest('보상 조회', async () => {
    const response = await makeRequest('GET', `/events/rewards/${state.rewardId}`, null, state.userToken);
    
    if (!response.success) {
      throw new Error(`보상 조회 실패: ${response.error.message}`);
    }
    
    return response.data;
  });
  
  return { createRewardResult, getRewardResult };
}

// 보상 요청 테스트
async function testRewardRequest() {
  const requestResult = await runTest('보상 요청', async () => {
    const requestData = {
      verificationData: {
        testField: 'test value'
      }
    };
    
    const response = await makeRequest('POST', `/events/${state.eventId}/request`, requestData, state.userToken);
    
    if (!response.success) {
      throw new Error(`보상 요청 실패: ${response.error.message}`);
    }
    
    return response.data;
  });
  
  return { requestResult };
}

// 통합 테스트 실행
async function runFullTest() {
  console.log('===== 이벤트 리워드 시스템 통합 테스트 시작 =====');
  console.log(`API 서버: ${API_BASE_URL}`);
  
  const results = {
    userManagement: await testUserManagement(),
    eventManagement: await testEventManagement(),
    rewardManagement: await testRewardManagement(),
    rewardRequest: await testRewardRequest()
  };
  
  // 결과 요약
  console.log('\n===== 테스트 결과 요약 =====');
  let allSuccess = true;
  
  Object.entries(results).forEach(([category, tests]) => {
    console.log(`\n${category}:`);
    
    Object.entries(tests).forEach(([testName, result]) => {
      const success = result.success !== false;
      console.log(`  - ${testName}: ${success ? '✅ 성공' : '❌ 실패'}`);
      
      if (!success) {
        allSuccess = false;
      }
    });
  });
  
  console.log(`\n전체 테스트 결과: ${allSuccess ? '✅ 성공' : '❌ 실패'}`);
  
  return {
    success: allSuccess,
    results
  };
}

// 스크립트 실행
if (require.main === module) {
  runFullTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('테스트 실행 중 오류 발생:', error);
      process.exit(1);
    });
} else {
  module.exports = { runFullTest };
} 