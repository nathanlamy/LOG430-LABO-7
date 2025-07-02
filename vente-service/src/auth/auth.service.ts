import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(username: string, password: string) {
    // Fausse validation temporaire
    if (username === 'admin' && password === 'admin') {
      return { userId: 1, username: 'admin' };
    }
    return null;
  }

  login(user: { userId: number; username: string }) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
