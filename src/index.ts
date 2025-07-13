import 'dotenv/config'
import { app } from "./app";
import { connectDatabase } from './database/mongo';

app.listen(9999, async () => {
  console.log(`Server open on port 9999`);
  connectDatabase();
})




