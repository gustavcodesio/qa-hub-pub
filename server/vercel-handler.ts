import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app.ts";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  (app as unknown as (request: IncomingMessage, response: ServerResponse) => void)(
    req,
    res,
  );
}
