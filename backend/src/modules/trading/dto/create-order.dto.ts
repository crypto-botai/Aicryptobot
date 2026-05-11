import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  exchangeId: string;

  @ApiProperty({ example: 'BTC/USDT' })
  @IsString()
  symbol: string;

  @ApiProperty({ enum: ['buy', 'sell'] })
  @IsEnum(['buy', 'sell'])
  side: string;

  @ApiProperty({ enum: ['market', 'limit', 'stop_market', 'stop_limit'] })
  @IsEnum(['market', 'limit', 'stop_market', 'stop_limit'])
  type: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  stopLoss?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  takeProfit?: number;

  @ApiProperty({ required: false, default: 'paper' })
  @IsOptional()
  @IsEnum(['live', 'paper'])
  mode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  botId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  useAiValidation?: boolean;

  @ApiProperty({ required: false, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.99)
  aiConfidenceThreshold?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  overrideAI?: boolean;
}
