import express from 'express';
import bodyParser from 'body-parser';
import tripsRouter from './routes/trips';
import matchesRouter from './routes/matches';

const app = express();
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use('/trips', tripsRouter);
app.use('/matches', matchesRouter);
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
export default app;


//jp nagar > airport
// lalbagh > airport


//jp nagar > lalbagh
//south end circle > lalbagh

//jp nagar > peenya
//banashankari > peenya

