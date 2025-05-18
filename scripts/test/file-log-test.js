/**
 * 파일 로깅을 사용하는 테스트 스크립트
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 로그 파일 경로
const LOG_FILE = path.join(__dirname, 'test-log.txt');

// 로그 함수
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // 파일에 로그 추가
  fs.appendFileSync(LOG_FILE, logMessage);
  
  // 콘솔에도 출력
  console.log(message);
}

// 파일 초기화
function initLogFile() {
  const header = `===== 테스트 로그 - ${new Date().toISOString()} =====\n\n`;
  fs.writeFileSync(LOG_FILE, header);
  
  logToFile('로그 파일이 초기화되었습니다.');
  logToFile(`로그 파일 위치: ${LOG_FILE}`);
}

// 테스트 함수
async function fileLogTest() {
  initLogFile();
  
  logToFile('===== API 테스트 시작 =====');
  
  // API 엔드포인트 설정
  const API_URL = 'http://localhost:3000';
  logToFile(`API 서버: ${API_URL}`);
  
  // 테스트 계정
  const testUser = {
    email: 'newuser123@example.com',
    password: 'password123'
  };
  
  logToFile(`테스트 계정: ${JSON.stringify(testUser)}`);
  
  try {
    // 1. 로그인 테스트
    logToFile('\n1. 로그인 테스트 시작...');
    
    try {
      logToFile('POST 요청 보내는 중: /users/login');
      const loginResponse = await axios.post(`${API_URL}/users/login`, testUser);
      
      logToFile(`응답 상태: ${loginResponse.status}`);
      logToFile('로그인 성공!');
      logToFile(`액세스 토큰: ${loginResponse.data.access_token}`);
      
      // 2. 프로필 조회 테스트
      logToFile('\n2. 프로필 조회 테스트 시작...');
      
      try {
        logToFile('GET 요청 보내는 중: /users/profile');
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.access_token}`
          }
        });
        
        logToFile(`응답 상태: ${profileResponse.status}`);
        logToFile('프로필 조회 성공!');
        logToFile(`사용자 정보: ${JSON.stringify(profileResponse.data)}`);
        
        logToFile('\n✅ 모든 테스트 성공!');
        return { success: true };
      } catch (profileError) {
        logToFile('프로필 조회 실패!');
        
        if (profileError.response) {
          logToFile(`응답 상태: ${profileError.response.status}`);
          logToFile(`오류 메시지: ${JSON.stringify(profileError.response.data)}`);
        } else {
          logToFile(`오류: ${profileError.message}`);
        }
        
        return { success: false, error: 'profile_error' };
      }
    } catch (loginError) {
      logToFile('로그인 실패!');
      
      if (loginError.response) {
        logToFile(`응답 상태: ${loginError.response.status}`);
        logToFile(`오류 메시지: ${JSON.stringify(loginError.response.data)}`);
      } else {
        logToFile(`오류: ${loginError.message}`);
      }
      
      return { success: false, error: 'login_error' };
    }
  } catch (error) {
    logToFile(`\n❌ 테스트 중 예상치 못한 오류 발생: ${error.message}`);
    return { success: false, error: 'unexpected_error' };
  }
}

// 스크립트 실행
if (require.main === module) {
  fileLogTest()
    .then(result => {
      logToFile(`\n테스트 결과: ${result.success ? '성공' : '실패'}`);
      
      if (!result.success) {
        logToFile(`실패 원인: ${result.error}`);
      }
      
      logToFile(`\n로그 파일 위치: ${LOG_FILE}`);
      console.log(`\n테스트가 완료되었습니다. 로그 파일을 확인하세요: ${LOG_FILE}`);
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logToFile(`\n테스트 실행 중 오류 발생: ${error.stack || error.message}`);
      console.error(`\n테스트 실행 중 오류 발생. 로그 파일을 확인하세요: ${LOG_FILE}`);
      process.exit(1);
    });
} else {
  module.exports = { fileLogTest };
} 