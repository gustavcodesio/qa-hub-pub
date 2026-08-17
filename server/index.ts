import app from "./app.ts";

const PORT = Number(process.env.PORT ?? 5174);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`QA Hub API em http://127.0.0.1:${PORT}`);
  });
}

export default app;
