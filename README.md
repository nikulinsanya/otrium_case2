docker run --name otrium-mongodb -d -p 27017:27017 mongo:latest

npm run dev

npx ts-node src/scripts/seed-db.ts

npm run build
