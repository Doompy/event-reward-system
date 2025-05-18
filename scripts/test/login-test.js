/**
 * 테스트 사용자 로그인 스크립트
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

async function loginTest() {
  try {
    console.log(`테스트 로그인 시도: ${TEST_USER.email}`);
    console.log(`사용 비밀번호: ${TEST_USER.password}`);
    
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('로그인 성공:', loginResponse.status);
    console.log('응답 데이터:', loginResponse.data);
    
    return {
      success: true,
      message: '로그인 성공',
      data: loginResponse.data
    };
  } catch (error) {
    console.error('로그인 실패:');
    
    if (error.response) {
      console.error(`상태 코드: ${error.response.status}`);
      console.error('응답 데이터:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    return {
      success: false,
      message: '로그인 실패',
      error: error.response ? error.response.data : error.message
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  loginTest()
    .then((result) => {
      console.log('테스트 완료:', result.success ? '성공' : '실패');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('스크립트 실행 중 예상치 못한 오류:', error);
      process.exit(1);
    });
} else {
  module.exports = { loginTest };
} 