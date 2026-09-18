const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const ACCOUNT_ID = "2604e12e7f799e4e440edaeba8db3d20";
const ACCESS_KEY = "762534b8472c635b562556734a5a3b58";
const SECRET_KEY = "2397ba96b3235b86776e6c694204906220f384c3db03acf62bffce8696119e8a";
const BUCKET_NAME = "abeerx";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true
});

async function run() {
  try {
      const resp = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 5
      }));
      console.log("SUCCESS! Found items: ", resp.Contents ? resp.Contents.length : 0);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
