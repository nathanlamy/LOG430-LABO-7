import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion avec identifiants (temporaire)' })
  @ApiResponse({
    status: 200,
    description: 'Retourne un token JWT',
    content: {
      'application/json': {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Identifiants invalides',
          error: 'Unauthorized',
        },
      },
    },
  })
  login(@Body() body: LoginDto) {
    const user = this.authService.validateUser(body.username, body.password);
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    return this.authService.login(user);
  }
}
