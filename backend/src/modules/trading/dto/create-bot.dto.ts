import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBotDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  exchangeId: string;

  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty({ enum: ['spot', 'futures'] })
  @IsEnum(['spot', 'futures'])
  marketType: string;

  @ApiProperty({ enum: ['scalping', 'swing', 'dca', 'grid', 'sniper', 'arbitrage'] })
  @IsEnum(['scalping', 'swing', 'dca', 'grid', 'sniper', 'arbitrage'])
  strategy: string;

  @ApiProperty({ enum: ['live', 'paper'], default: 'paper' })
  @IsEnum(['live', 'paper'])
  mode: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  positionSize: number;

  @ApiProperty({ enum: ['fixed', 'percentage'] })
  @IsEnum(['fixed', 'percentage'])
  positionSizeType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  stopLoss: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  @Max(500)
  takeProfit: number;

  @ApiProperty({ default: 75 })
  @IsNumber()
  @Min(50)
  @Max(99)
  aiConfidenceThreshold: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  maxDailyLoss: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(125)
  leverage?: number;
}
