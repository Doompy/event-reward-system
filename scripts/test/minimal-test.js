// 최소한의 테스트 스크립트
console.log('테스트가 시작되었습니다.');

const fs = require('fs');
const path = require('path');

// 로그 파일 경로
const logFile = path.join(__dirname, 'minimal-test-log.txt');

// 로그 파일에 데이터 기록
fs.writeFileSync(logFile, '테스트 실행 완료: ' + new Date().toISOString());

console.log('로그 파일이 생성되었습니다:', logFile);
console.log('테스트가 완료되었습니다.'); 