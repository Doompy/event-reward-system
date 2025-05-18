# 테스트 실행 스크립트

# 현재 디렉토리 출력
Write-Host "현재 경로: $PWD" -ForegroundColor Green

# 기존 테스트 컨테이너 중지 및 삭제
Write-Host "기존 테스트 컨테이너 정리 중..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down

# 테스트 컨테이너 빌드 및 실행
Write-Host "테스트 컨테이너 빌드 및 실행 중..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml up --build

# 종료 코드 확인
if ($LASTEXITCODE -ne 0) {
    Write-Host "테스트 실패: 종료 코드 $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
} else {
    Write-Host "테스트 성공!" -ForegroundColor Green
}

# 테스트 컨테이너 정리
Write-Host "테스트 컨테이너 정리 중..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down 