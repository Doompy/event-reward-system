/**
 * 이벤트 참여 API 테스트 (Node.js http 모듈 사용)
 */

const http = require('http');
const https = require('https');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http'; // 'http' 또는 'https'
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 실제 토큰으로 교체 필요
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 실제 토큰으로 교체 필요
const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '6579adc32e1c4c43b4c36e32'; // 실제 이벤트 ID로 교체 필요

// HTTP 요청 유틸리티 함수
function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      host: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const httpModule = API_PROTOCOL === 'https' ? https : http;
    
    const req = httpModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        
        try {
          parsedData = responseData ? JSON.parse(responseData) : {};
        } catch (e) {
          parsedData = responseData;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 테스트 함수
async function runTests() {
  console.log('이벤트 참여 API 테스트 시작...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  async function runTest(name, testFn) {
    results.total++;
    console.log(`테스트: ${name}`);
    
    try {
      await testFn();
      console.log('✅ 성공');
      results.passed++;
    } catch (error) {
      console.error('❌ 실패:', error.message);
      results.failed++;
    }
    
    console.log('-----------------------------------');
  }
  
  // 1. 이벤트 참여 테스트
  await runTest('이벤트 참여 생성', async () => {
    const response = await makeRequest(
      'POST',
      `/events/${TEST_EVENT_ID}/participate`,
      {
        verificationData: { testData: 'HTTP 모듈 테스트' },
        additionalData: { source: 'node-http-test' }
      },
      TEST_USER_TOKEN
    );
    
    console.log('응답:', response.statusCode);
    console.log('참여 ID:', response.data._id);
    
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!response.data._id) {
      throw new Error('참여 ID가 반환되지 않았습니다');
    }
  });
  
  // 2. 사용자 참여 목록 조회 테스트
  await runTest('사용자 참여 목록 조회', async () => {
    const response = await makeRequest(
      'GET',
      '/events/user/participations',
      null,
      TEST_USER_TOKEN
    );
    
    console.log('응답:', response.statusCode);
    console.log('참여 수:', response.data.length);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('참여 목록이 배열 형태가 아닙니다');
    }
  });
  
  // 3. 이벤트별 참여 목록 조회 테스트 (관리자)
  await runTest('이벤트별 참여 목록 조회 (관리자)', async () => {
    const response = await makeRequest(
      'GET',
      `/events/${TEST_EVENT_ID}/participations`,
      null,
      TEST_ADMIN_TOKEN
    );
    
    console.log('응답:', response.statusCode);
    console.log('참여 수:', response.data.length);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('참여 목록이 배열 형태가 아닙니다');
    }
  });
  
  // 4. 참여 통계 조회 테스트 (관리자)
  await runTest('참여 통계 조회 (관리자)', async () => {
    const response = await makeRequest(
      'GET',
      `/events/${TEST_EVENT_ID}/stats`,
      null,
      TEST_ADMIN_TOKEN
    );
    
    console.log('응답:', response.statusCode);
    console.log('통계 데이터:', response.data);
    
    if (response.statusCode !== 200) {
      throw new Error(`API 요청 실패: ${response.statusCode}`);
    }
    
    if (!response.data.totalParticipations && response.data.totalParticipations !== 0) {
      throw new Error('통계 데이터가 올바르지 않습니다');
    }
  });
  
  // 결과 출력
  console.log('\n테스트 결과 요약:');
  console.log(`총 테스트: ${results.total}`);
  console.log(`성공: ${results.passed}`);
  console.log(`실패: ${results.failed}`);
  
  return results;
}

// 스크립트를 직접 실행한 경우에만 테스트 수행
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n테스트 완료');
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('테스트 실행 중 오류 발생:', error);
      process.exit(1);
    });
} else {
  module.exports = { runTests };
} 