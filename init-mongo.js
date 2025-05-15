db = db.getSiblingDB('event-reward');

db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: [
    {
      role: 'readWrite',
      db: 'event-reward'
    }
  ]
});

// 필요한 기본 컬렉션들 생성
db.createCollection('users');
db.createCollection('events');
db.createCollection('rewards'); 