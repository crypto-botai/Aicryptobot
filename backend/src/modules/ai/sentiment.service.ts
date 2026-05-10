import { Injectable } from '@nestjs/common';
@Injectable()
export class SentimentService {
  async analyze(text: string): Promise<{ score: number; label: string }> {
    return { score: 0.5, label: 'neutral' };
  }
}
