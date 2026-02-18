import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly expiresIn: number;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET', '');
    this.expiresIn = this.config.get<number>('S3_URL_EXPIRES_IN', 3600);

    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION', 'us-east-1'),
      endpoint: this.config.get<string>('S3_ENDPOINT', ''),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY', ''),
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY', ''),
      },
      forcePathStyle: true, // Wasabi usa path-style
    });
  }

  /**
   * Gera uma presigned URL para um objeto no S3/Wasabi.
   * @param key - chave do objeto (ex: "videos/meu-video.mp4")
   * @returns URL pré-assinada válida por `expiresIn` segundos
   */
  async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }
}
