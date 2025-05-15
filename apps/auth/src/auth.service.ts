import { ConflictException, Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'libs/database/schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이미 존재하는 사용자인지 확인
    const existingUser = await this.userModel.findOne({ 
      email: createUserDto.email 
    }).exec();
    
    if (existingUser) {
      throw new ConflictException('email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // 새 사용자 생성
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER,
    });
    
    return newUser.save();
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userModel.findOne({ email: loginDto.email }).exec();

      if (!user) {
        throw new UnauthorizedException('Invalid email');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // JWT 페이로드 생성
      const payload = { 
        email: user.email, 
        sub: user._id.toString(),
        role: user.role,
        nickname: user.nickname
      };
      
      // 비밀번호를 제외한 사용자 정보 반환
      const { password, ...userData } = user.toObject();
      
      return {
        success: true,
        user: userData,
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userModel.findById(payload.sub).exec();
      
      if (!user) {
        return { isValid: false };
      }
      
      const { password, ...userData } = user.toObject();
      return { 
        isValid: true,
        user: userData
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  async updateUserRole(data: UpdateUserRoleDto, adminId: string) {
    try {
      // 관리자 권한 확인
      const admin = await this.userModel.findById(adminId).exec();
      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can update user roles');
      }

      // 대상 사용자 찾기
      const user = await this.userModel.findOne({ email: data.email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 자신의 역할은 변경할 수 없음
      if (user._id.toString() === adminId) {
        throw new ForbiddenException('Cannot change your own role');
      }

      // 역할 업데이트
      user.role = data.role;
      await user.save();

      const { password, ...result } = user.toObject();
      return {
        success: true,
        user: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async findAllUsers() {
    const users = await this.userModel.find().exec();
    const result = users.map(user => {
      const { password, ...userData } = user.toObject();
      return userData;
    });
    
    return {
      success: true,
      users: result
    };
  }

  async getUserRole(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      role: user.role
    };
  }
}
