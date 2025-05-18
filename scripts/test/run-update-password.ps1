# MongoDB 컨테이너 이름
$MONGODB_CONTAINER = "mongodb"

# 테스트 사용자 이메일과 새 비밀번호
$TEST_USER_EMAIL = "test@example.com"
$NEW_PASSWORD = "testpassword"

Write-Host "MongoDB 컨테이너에 스크립트 복사 중..."
docker cp .\scripts\test\update-password.js ${MONGODB_CONTAINER}:/tmp/update-password.js

Write-Host "MongoDB 컨테이너에서 스크립트 실행 중..."
docker exec -it $MONGODB_CONTAINER /bin/bash -c "
  apt-get update && 
  apt-get install -y nodejs npm && 
  cd /tmp && 
  npm init -y && 
  npm install mongodb bcrypt && 
  TEST_USER_EMAIL=$TEST_USER_EMAIL NEW_PASSWORD=$NEW_PASSWORD node update-password.js
"

Write-Host "비밀번호 업데이트 완료" 