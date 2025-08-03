import * as service from "./payment/service"
import { URL } from "node:url";
import { createServer } from "node:http";
import { queue } from "./payment/queue";

const app = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/payments-summary") {
    const searchParams = url.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const summary = await service.paymentSummary(
      from as string | undefined, 
      to as string | undefined
    );

    res.writeHead(200, { 'Content-Type': 'application/json'});
    res.end(JSON.stringify(summary))
    return;
  }

  if (req.method === "POST" && url.pathname === "/payments") {
    let body = '';

    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      queue.add("process-payment", JSON.parse(body), {
        attempts: 3, 
        backoff: {
          type :"exponential", 
          delay: 1_000
        }
      })

      res.writeHead(200, { 'Content-Type': 'application/json'});
      res.end(JSON.stringify({ message: "Pagamento na fila" }))
    })
    return
  }

   if (req.method === "POST" && url.pathname === "/purge-payments") {
      res.writeHead(200);
      res.end();
      return
   }


  res.writeHead(404);
  res.end(JSON.stringify({ message: 'Not Found' }));

})

export { app }