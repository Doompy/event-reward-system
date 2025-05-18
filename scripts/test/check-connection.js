/**
 * API 서버 연결 확인 스크립트
 */

const axios = require('axios');

// 환경 설정
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

console.log('API 연결 정보:', API_BASE_URL);

async function checkConnection() {
  try {
    console.log('API 서버 연결 시도...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', response.data);
    return { 
      success: true, 
      status: response.status,
      data: response.data 
    };
  } catch (error) {
    console.error('오류:');
    if (error.response) {
      console.error(`상태 코드: ${error.response.status}`);
      console.error('응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('요청 후 응답 없음:', error.request);
    } else {
      console.error('기타 오류:', error.message);
    }
    return { 
      success: false, 
      error: error.response ? error.response.data : error.message 
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  console.log('연결 확인 스크립트 시작...');
  checkConnection()
    .then((result) => {
      console.log('결과:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('예상치 못한 오류:', error);
      process.exit(1);
    });
} else {
  module.exports = { checkConnection };
} 