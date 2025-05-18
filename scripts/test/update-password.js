/**
 * 테스트 사용자 비밀번호 업데이트 스크립트
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// 환경 설정
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/event-reward-system';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'testpassword';

async function updatePassword() {
  console.log(`사용자 비밀번호 업데이트 시도: ${USER_EMAIL}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 사용자 찾기
    const user = await usersCollection.findOne({ email: USER_EMAIL });
    
    if (!user) {
      console.error('사용자를 찾을 수 없습니다.');
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    
    // 비밀번호 업데이트
    const result = await usersCollection.updateOne(
      { email: USER_EMAIL },
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('비밀번호가 성공적으로 업데이트되었습니다.');
      return { success: true, message: '비밀번호가 성공적으로 업데이트되었습니다.' };
    } else {
      console.error('비밀번호 업데이트에 실패했습니다.');
      return { success: false, message: '비밀번호 업데이트에 실패했습니다.' };
    }
  } catch (error) {
    console.error('오류 발생:', error);
    return { success: false, message: error.message };
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  updatePassword()
    .then((result) => {
      console.log('실행 결과:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('스크립트 실행 중 오류 발생:', error);
      process.exit(1);
    });
} else {
  module.exports = { updatePassword };
} 