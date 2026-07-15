import { google } from "googleapis";

if (!process.env.GOOGLE_CLIENT_ID)
  throw new Error("No google client id provided in .env");
if (!process.env.GOOGLE_CLIENT_SECRET)
  throw new Error("No google client secret provided in .env");
if (!process.env.GOOGLE_REFRESH_TOKEN)
  throw new Error("No google refresh token provided in .env");

const oauth2Client = new google.auth.OAuth2({
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: "http://localhost",
});
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
// const client = await auth.getClient();
const drive = google.drive({ version: "v3", auth: oauth2Client });

export default drive;
