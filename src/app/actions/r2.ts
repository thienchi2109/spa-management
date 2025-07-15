'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const getSignedURLSchema = z.object({
  fileType: z.string(),
  fileSize: z.number(),
  patientId: z.string(),
});

// A hard limit to prevent abuse (50MB)
const MAX_FILE_SIZE = 1024 * 1024 * 50; 

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getSignedURL(
  props: z.infer<typeof getSignedURLSchema>
) {
  const { fileType, fileSize, patientId } = getSignedURLSchema.parse(props);
  
  if (!process.env.R2_BUCKET_NAME || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return { failure: 'Cloudflare R2 is not configured on the server.' };
  }
  
  if (fileSize > MAX_FILE_SIZE) {
      return { failure: `File size cannot exceed ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  const fileExtension = fileType.split('/')[1];
  const key = `${patientId}/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 minutes
    return { success: { url, key } };
  } catch(e) {
    return { failure: 'Could not get signed URL.' };
  }
}
