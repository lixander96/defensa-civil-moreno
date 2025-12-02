import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Patch, Post, SerializeOptions, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUserReqDTO } from './dtos/create-user-req.dto';
import { UpdateUserReqDTO } from './dtos/update-user-req.dto';
import { UserService } from './user.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues:true, groups: ['onlyUsers'] })
@ApiTags('users')
export class UserController {
    constructor(private readonly _userService: UserService) {}

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    create_user(@Body() dto: CreateUserReqDTO) {
        return this._userService.create(dto)
    }
    
    @Get(':user_id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiParam({name: 'user_id'})
    get_one_user(@Param('user_id') id: number) {
        return this._userService.getOne(id)
    }
    
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @Get()
    get_users() {
        return this._userService.getAll()
    }
    
    @Patch(':user_id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiParam({name: 'user_id'})
    @ApiBody({type: UpdateUserReqDTO})
    update_user(
        @Param('user_id') id: number,
        @Body() body: UpdateUserReqDTO
    ) {
        return this._userService.update(id, body)
    }
    
    @Delete(':user_id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiParam({name: 'user_id'})
    delete_user(@Param('user_id') id: number) {
        return this._userService.delete(id)
    }
}
