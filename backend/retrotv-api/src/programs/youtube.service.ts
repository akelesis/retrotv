import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class YoutubeService {
  private readonly apiKey: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY', '');
  }

  extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new BadRequestException('Invalid YouTube URL');
  }

  parseDuration(iso8601: string): number {
    const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 60 + minutes + (seconds > 0 ? 1 : 0);
  }

  async getVideoMetadata(url: string) {
    const videoId = this.extractVideoId(url);

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`;

    const { data } = await firstValueFrom(this.http.get(apiUrl));

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Video not found');
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    return {
      title: snippet.title,
      description: snippet.description,
      thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      duration_minutes: this.parseDuration(contentDetails.duration),
    };
  }
}
