import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import config from './firebase-applet-config.json' with { type: "json" };

async function test() {
  try {
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: config.projectId
    });
    const auth = getAuth(app);
    const list = await auth.listUsers(1);
    console.log("Success! Users:", list.users.length);
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();
