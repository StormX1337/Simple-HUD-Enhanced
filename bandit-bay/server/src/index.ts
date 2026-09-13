import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

createApp().listen(PORT, () => {
  console.log(`[bandit-bay] Server laeuft auf http://localhost:${PORT}`);
});
