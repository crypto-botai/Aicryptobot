import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';

@ApiTags('Users') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('me') getMe(@CurrentUser() user: UserEntity) { return this.usersService.findById(user.id); }
  @Patch('me') updateMe(@CurrentUser() user: UserEntity, @Body() body: Partial<UserEntity>) { return this.usersService.update(user.id, body); }
}
