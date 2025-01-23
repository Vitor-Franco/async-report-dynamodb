import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { S3MPUManager } from '../../services/S3MPUManager';
import { mbToBytes } from '../../utils/mbToBytes';
import { getLeadsGenerator } from '../db/getLeadsGenerator';
import { getPresignedURL } from '../../utils/getPresignedURL';
import { sendEmail } from '../../utils/sendEmail';
import type { SQSEvent } from 'aws-lambda';

const minChunkSize = mbToBytes(6);

export async function handler(event: SQSEvent) {
  const fileKey = `${new Date().toISOString()}-${randomUUID()}.csv`;

  const mpu = new S3MPUManager(env.REPORTS_BUCKET_NAME, fileKey);
  await mpu.start();

  try {
    const csvHeader = 'Id, Nome, E-mail, Cargo\n';

    let currentChunk = csvHeader;

    for await (const { Items: leads = [] } of getLeadsGenerator()) {
      currentChunk += leads
        .map(
          (lead) =>
            `${lead.id.S},${lead.name.S},${lead.email.S},${lead.jobTitle.S}\n`,
        )
        .join('');

      const currentChunkSize = Buffer.byteLength(currentChunk, 'utf-8');

      const isToAddMoreChunks = currentChunkSize < minChunkSize;
      if (isToAddMoreChunks) {
        continue;
      }

      // Send UploadPart
      await mpu.uploadPart(Buffer.from(currentChunk, 'utf-8'));

      currentChunk = '';
    }

    if (currentChunk) {
      // Chunks que sobraram
      await mpu.uploadPart(Buffer.from(currentChunk, 'utf-8'));
    }

    await mpu.complete();
  } catch {
    await mpu.abort();
  }

  const presignedUrl = await getPresignedURL({
    bucket: env.REPORTS_BUCKET_NAME,
    fileKey,
  });

  await sendEmail({
    from: 'onboard@resend.dev',
    to: ['vitoroliveirafranco@gmail.com'],
    subject: 'O seu relatório está pronto!',
    text: `Aqui está o seu relatório, a URL é válida por 24h: ${presignedUrl}`,
    html: `
      <h1 style="font-size:32px;font-weight:bold;">Seu relatório ficou pronto!</h1>
      <br/>
      Clique <a href="${presignedUrl}">aqui</a> para baixar ou acessar a URL: ${presignedUrl}.
      <br/><br/>
      <small>Este link é válido por apenas 24 horas.</small>
    `,
  });
}
