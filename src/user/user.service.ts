import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<void> {
    const { email, password } = createUserDto;

    const exists: boolean = await this.userRepository.existsBy({ email });
    if (exists) throw new ConflictException('EXISTS_EMAIL');

    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User> {
    const foundUser = await this.userRepository.findOneBy({ email });
    if (!foundUser) throw new NotFoundException('NOT_FOUND_USER');

    return foundUser;
  }

  async findOneById(id: number): Promise<User> {
    const foundUser = await this.userRepository.findOneBy({ id });
    if (!foundUser) throw new NotFoundException('NOT_FOUND_USER');

    return foundUser;
  }
}
