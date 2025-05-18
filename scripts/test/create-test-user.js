/**
 * 테스트 사용자 생성 스크립트
 */

const axios = require('axios');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// 비밀번호 관련 디버깅 로그 추가
console.log('환경 변수에서 가져온 비밀번호:', process.env.TEST_USER_PASSWORD);
console.log('비밀번호가 설정되지 않은 경우 기본값 사용');

// 테스트 계정 정보
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword',
  nickname: 'Test User'
};

// 사용할 계정 정보 출력
console.log('사용할 테스트 계정 정보:', { ...TEST_USER, password: '********' });

async function createTestUser() {
  try {
    console.log(`테스트 사용자 생성 시도: ${TEST_USER.email}`);
    
    const response = await axios.post(`${API_BASE_URL}/users`, TEST_USER);
    
    console.log('응답 상태:', response.status);
    console.log('사용자 생성 성공:', response.data);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`오류 (${error.response.status}):`, error.response.data);
      
      // 이미 존재하는 사용자인 경우 로그인 시도
      if (error.response.status === 400 && error.response.data.message && 
          error.response.data.message.includes('already exists')) {
        console.log('사용자가 이미 존재합니다. 로그인을 시도합니다.');
        
        try {
          const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
          });
          
          console.log('로그인 성공:', loginResponse.data);
          return { message: '기존 사용자로 로그인 성공', ...loginResponse.data };
        } catch (loginError) {
          console.error('로그인 실패:', loginError.response ? loginError.response.data : loginError.message);
          throw new Error('기존 사용자 로그인 실패');
        }
      }
    } else {
      console.error('오류:', error.message);
    }
    
    throw new Error('테스트 사용자 생성 실패');
  }
}

// 스크립트 실행
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('테스트 사용자 설정 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error.message);
      process.exit(1);
    });
} else {
  module.exports = { createTestUser };
} 