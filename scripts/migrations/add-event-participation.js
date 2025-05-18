/**
 * 이벤트 참여 스키마 추가를 위한 마이그레이션 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. event_participations 컬렉션 생성
 * 2. 기존 reward_requests 데이터를 기반으로 event_participations 데이터 생성
 * 3. 인덱스 생성
 * 
 * 사용법: 
 * node scripts/migrations/add-event-participation.js
 */

const { MongoClient, ObjectId } = require('mongodb');

// 환경 설정
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_reward_system';
const DB_NAME = process.env.DB_NAME || 'event_reward_system';

async function migrateData() {
  console.log('마이그레이션 시작: EventParticipation 스키마 추가');
  
  let client;
  
  try {
    // MongoDB 연결
    client = new MongoClient(DB_URI);
    await client.connect();
    console.log('MongoDB 연결 성공');
    
    const db = client.db(DB_NAME);
    
    // 기존 컬렉션들
    const eventsCollection = db.collection('events');
    const rewardRequestsCollection = db.collection('reward_requests');
    
    // 새 컬렉션
    const participationsCollection = db.collection('event_participations');
    
    // 이미 컬렉션이 존재하는지 확인
    const collections = await db.listCollections({ name: 'event_participations' }).toArray();
    
    if (collections.length > 0) {
      console.log('event_participations 컬렉션이 이미 존재합니다');
      
      // 데이터가 이미 존재하는지 확인
      const participationCount = await participationsCollection.countDocuments();
      
      if (participationCount > 0) {
        console.log(`이미 ${participationCount}개의 참여 데이터가 존재합니다. 마이그레이션 건너뜁니다.`);
        return;
      }
    }
    
    // 모든 보상 요청 가져오기
    const rewardRequests = await rewardRequestsCollection.find({}).toArray();
    console.log(`${rewardRequests.length}개의 보상 요청 데이터 발견`);
    
    // 보상 요청을 참여 데이터로 변환
    const participations = [];
    
    for (const request of rewardRequests) {
      const event = await eventsCollection.findOne({ _id: request.eventId });
      
      if (!event) {
        console.warn(`이벤트를 찾을 수 없음: ${request.eventId}`);
        continue;
      }
      
      // 참여 상태 설정
      let status = 'PARTICIPATED';
      
      if (request.status === 'ISSUED') {
        status = 'REWARDED';
      } else if (request.status === 'REJECTED') {
        status = 'FAILED';
      }
      
      // 참여 데이터 생성
      const participation = {
        _id: new ObjectId(),
        userId: request.userId,
        eventId: request.eventId,
        status: status,
        participatedAt: request.createdAt || new Date(),
        verificationData: request.verificationData || {},
        isRewardRequested: true,
        rewardRequestId: request._id,
        rewardRequestedAt: request.createdAt || new Date(),
        rewardedAt: request.issuedAt || null,
        participationCount: 1,
        additionalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      participations.push(participation);
    }
    
    // 참여 데이터 저장
    if (participations.length > 0) {
      const result = await participationsCollection.insertMany(participations);
      console.log(`${result.insertedCount}개의 참여 데이터 생성 완료`);
    } else {
      console.log('변환할 데이터가 없습니다');
    }
    
    // 인덱스 생성
    console.log('인덱스 생성 중...');
    await participationsCollection.createIndex({ userId: 1 });
    await participationsCollection.createIndex({ eventId: 1 });
    await participationsCollection.createIndex({ rewardRequestId: 1 }, { unique: true, sparse: true });
    await participationsCollection.createIndex({ participatedAt: -1 });
    
    console.log('마이그레이션 완료: EventParticipation 스키마 추가');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB 연결 종료');
    }
  }
}

// 스크립트를 직접 실행한 경우에만 마이그레이션 수행
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('마이그레이션 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('마이그레이션 스크립트 실패:', error);
      process.exit(1);
    });
} else {
  module.exports = { migrateData };
} 