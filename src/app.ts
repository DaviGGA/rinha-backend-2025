import * as service from "./payment/service"
import { URL } from "node:url";
import { createServer } from "node:http";
import { Queue } from "./queue";

Queue.loop();

setInterval(() => {
  service.savePaymentProcessorHealth();
}, 5_000);

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
      Queue.add(body);
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