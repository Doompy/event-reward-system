/**
 * 테스트 사용자 비밀번호 직접 업데이트 스크립트
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
  oldPassword: process.env.TEST_USER_OLD_PASSWORD || 'wrongpassword',  // 현재 잘못된 비밀번호
  newPassword: process.env.TEST_USER_NEW_PASSWORD || 'testpassword'    // 새로 설정할 비밀번호
};

async function createNewUser() {
  try {
    console.log(`새로운 테스트 사용자 생성 시도: ${TEST_USER.email}`);
    
    // 기존 사용자 삭제 API 호출 (관리자 권한 필요할 수 있음)
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${TEST_USER.email}`);
      console.log('기존 사용자가 삭제되었습니다.');
    } catch (deleteError) {
      console.log('기존 사용자 삭제 시도 중 오류 (무시됨):', deleteError.message);
    }
    
    // 새 사용자 생성
    const response = await axios.post(`${API_BASE_URL}/users`, {
      email: TEST_USER.email,
      password: TEST_USER.newPassword,
      nickname: 'Test User'
    });
    
    console.log('응답 상태:', response.status);
    console.log('사용자 생성 성공:', response.data);
    
    // 로그인 시도
    await loginWithNewPassword();
    
    return response.data;
  } catch (error) {
    console.error('사용자 생성 오류:', error.message);
    
    // 이미 존재하는 사용자라면 로그인 시도
    if (error.response && error.response.status === 400 && 
        error.response.data.message && error.response.data.message.includes('already exists')) {
      console.log('사용자가 이미 존재합니다. 로그인을 시도합니다.');
      await loginWithNewPassword();
    } else {
      throw new Error('테스트 사용자 생성 실패');
    }
  }
}

async function loginWithNewPassword() {
  try {
    console.log(`새 비밀번호로 로그인 시도: ${TEST_USER.email}`);
    
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
      email: TEST_USER.email,
      password: TEST_USER.newPassword
    });
    
    console.log('로그인 성공:', loginResponse.data);
    return { message: '새 비밀번호로 로그인 성공', ...loginResponse.data };
  } catch (loginError) {
    console.error('새 비밀번호로 로그인 실패:', 
      loginError.response ? loginError.response.data : loginError.message);
    throw new Error('새 비밀번호로 로그인 실패');
  }
}

// 스크립트 실행
if (require.main === module) {
  createNewUser()
    .then(() => {
      console.log('테스트 사용자 설정 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error.message);
      process.exit(1);
    });
} else {
  module.exports = { createNewUser, loginWithNewPassword }; 