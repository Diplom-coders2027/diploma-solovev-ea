import express from 'express';
import cors from 'cors';
import path from 'path';
import personsRouter from './routes/persons';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Раздача загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/persons', personsRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});