import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmailToken } from './entities/email-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailTokenType, UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EmailToken)
    private readonly tokenRepo: Repository<EmailToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password,
      role: UserRole.CLIENT,
    });

    const saved = await this.userRepo.save(user);
    const token = await this.createToken(saved.id, EmailTokenType.VERIFICATION, 24 * 60);
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new BadRequestException('APP_URL is not configured');
    }
    await this.mailService.sendVerificationEmail(saved.email, token.token, appUrl);

    return { id: saved.id, email: saved.email, name: saved.name };
  }

  async verifyEmail(token: string) {
    const record = await this.findValidToken(token, EmailTokenType.VERIFICATION);
    const user = await this.userRepo.findOneByOrFail({ id: record.user_id });
    user.is_email_verified = true;
    record.used = true;
    await this.userRepo.save(user);
    await this.tokenRepo.save(record);

    /**
     * Changed to return a JWT after successful verification.
     * The frontend verification flow must redirect to /profile immediately, which requires
     * an authenticated state because /profile is protected.
     */
    const payload = { sub: user.id, role: user.role };
    return {
      verified: true,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.is_suspended) {
      throw new UnauthorizedException('Account is suspended');
    }

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      return { sent: true };
    }

    const token = await this.createToken(user.id, EmailTokenType.PASSWORD_RESET, 15);
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new BadRequestException('APP_URL is not configured');
    }
    await this.mailService.sendPasswordResetEmail(user.email, token.token, appUrl);

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.findValidToken(dto.token, EmailTokenType.PASSWORD_RESET);
    const user = await this.userRepo.findOneByOrFail({ id: record.user_id });

    user.password = await bcrypt.hash(dto.password, 10);
    record.used = true;

    await this.userRepo.save(user);
    await this.tokenRepo.save(record);

    return { updated: true };
  }

  private async createToken(userId: string, type: EmailTokenType, ttlMinutes: number) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    const token = this.tokenRepo.create({
      user_id: userId,
      token: randomUUID(),
      type,
      expires_at: expiresAt,
      used: false,
    });

    return this.tokenRepo.save(token);
  }

  private async findValidToken(token: string, type: EmailTokenType) {
    const record = await this.tokenRepo.findOne({ where: { token, type } });
    if (!record || record.used || record.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired token');
    }
    return record;
  }
}
