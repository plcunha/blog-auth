import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from './DTO/users.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  getUsersList() {
    return this.userRepository.find();
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  @Post()
  async createUser(@Body() userDto: UserDTO) {
    const user = this.userRepository.create();

    user.name = userDto.name;
    user.email = userDto.email;
    user.username = userDto.username;
    user.password = await bcrypt.hash(userDto.password, 10);
    user.role = userDto.role;
    user.isActive = userDto.isActive;

    return this.userRepository.save(user);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.delete({ id: user.id });
  }
}