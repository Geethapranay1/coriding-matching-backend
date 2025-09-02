import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.error('redis err', err));

(async () => {
  try {
    await client.connect();
    console.log('redis ok');
  } catch (error) {
    console.error('redis fail', error);
  }
})();

export const getCache = async <T>(key: string): Promise<T | null> => {
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
};

export const setCache = async (key: string, value: any, ttl = 3600): Promise<void> => {
  await client.set(key, JSON.stringify(value), { EX: ttl });
};

export default client;
