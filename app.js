const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.json({
    name: '전준연',
    school: 'Gwangju Software Meister High School',
    major: 'Front-End Development',
    skills: ['TypeScript', 'Next.js'],
    blog: 'https://velog.io/@junjuny0227',
    email: 'junjuny.dev@gmail.com',
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
