/**
 * 새로운 테스트 사용자 생성 스크립트
 */

const axios = require('axios');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// 새 테스트 계정 정보 - 기존과 다른 이메일 사용
const NEW_TEST_USER = {
  email: 'new-test-user@example.com',
  password: 'password123',
  nickname: 'NewTestUser'
};

console.log('새 테스트 계정 정보:', { 
  email: NEW_TEST_USER.email,
  password: NEW_TEST_USER.password,
  nickname: NEW_TEST_USER.nickname
});

async function createNewTestUser() {
  try {
    console.log(`새 테스트 사용자 생성 시도: ${NEW_TEST_USER.email}`);
    
    const response = await axios.post(`${API_BASE_URL}/users`, NEW_TEST_USER);
    
    console.log('응답 상태:', response.status);
    console.log('사용자 생성 성공:', response.data);
    
    // 생성 성공 후 로그인 시도
    await loginNewUser();
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`오류 (${error.response.status}):`, error.response.data);
      
      // 이미 존재하는 사용자인 경우 로그인 시도
      if (error.response.status === 400 && error.response.data.message && 
          error.response.data.message.includes('already exists')) {
        console.log('사용자가 이미 존재합니다. 로그인을 시도합니다.');
        await loginNewUser();
      } else {
        throw new Error(`사용자 생성 실패: ${error.response.data.message}`);
      }
    } else {
      console.error('오류:', error.message);
      throw new Error(`사용자 생성 실패: ${error.message}`);
    }
  }
}

async function loginNewUser() {
  try {
    console.log(`새 사용자로 로그인 시도: ${NEW_TEST_USER.email}`);
    
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
      email: NEW_TEST_USER.email,
      password: NEW_TEST_USER.password
    });
    
    console.log('로그인 성공 상태:', loginResponse.status);
    console.log('액세스 토큰:', loginResponse.data.access_token);
    
    return { 
      message: '새 사용자로 로그인 성공', 
      token: loginResponse.data.access_token 
    };
  } catch (loginError) {
    console.error('로그인 실패:', 
      loginError.response ? loginError.response.data : loginError.message);
    throw new Error('새 사용자 로그인 실패');
  }
}

// 스크립트 실행
if (require.main === module) {
  createNewTestUser()
    .then(() => {
      console.log('새 테스트 사용자 설정 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error.message);
      process.exit(1);
    });
} else {
  module.exports = { createNewTestUser, loginNewUser };
} 