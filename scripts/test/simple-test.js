/**
 * 간단한 API 테스트 스크립트
 */

const axios = require('axios');

// 테스트 함수
async function simpleTest() {
  // 즉시 콘솔에 출력하는 커스텀 로그 함수
  function log(message) {
    process.stdout.write(message + '\n');
  }

  log('===== 간단한 API 테스트 시작 =====');
  
  // API 엔드포인트 설정
  const API_URL = 'http://localhost:3000';
  log(`API 서버: ${API_URL}`);
  
  // 테스트 계정
  const testUser = {
    email: 'newuser123@example.com',
    password: 'password123'
  };
  
  log(`\n테스트 계정: ${JSON.stringify(testUser)}`);
  
  try {
    // 1. 로그인 테스트
    log('\n1. 로그인 테스트 시작...');
    
    try {
      log('POST 요청 보내는 중: /users/login');
      const loginResponse = await axios.post(`${API_URL}/users/login`, testUser);
      
      log(`응답 상태: ${loginResponse.status}`);
      log('로그인 성공!');
      log(`액세스 토큰: ${loginResponse.data.access_token}`);
      
      // 2. 프로필 조회 테스트
      log('\n2. 프로필 조회 테스트 시작...');
      
      try {
        log('GET 요청 보내는 중: /users/profile');
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.access_token}`
          }
        });
        
        log(`응답 상태: ${profileResponse.status}`);
        log('프로필 조회 성공!');
        log(`사용자 정보: ${JSON.stringify(profileResponse.data)}`);
        
        log('\n✅ 모든 테스트 성공!');
        return { success: true };
      } catch (profileError) {
        log('프로필 조회 실패!');
        log(`오류: ${profileError.response?.data?.message || profileError.message}`);
        return { success: false, error: 'profile_error' };
      }
    } catch (loginError) {
      log('로그인 실패!');
      log(`오류: ${loginError.response?.data?.message || loginError.message}`);
      return { success: false, error: 'login_error' };
    }
  } catch (error) {
    log(`\n❌ 테스트 중 예상치 못한 오류 발생: ${error.message}`);
    return { success: false, error: 'unexpected_error' };
  }
}

// 스크립트 실행
if (require.main === module) {
  simpleTest()
    .then(result => {
      console.log('\n테스트 결과:', result.success ? '성공' : '실패');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n테스트 실행 중 오류 발생:', error);
      process.exit(1);
    });
} else {
  module.exports = { simpleTest };
} 