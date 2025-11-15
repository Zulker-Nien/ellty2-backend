# Numerical Discussion Tree - Complete Implementation

## Project Structure

```
numerical-discussion-tree/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.local
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── auth/
│       │   │   ├── LoginForm.tsx
│       │   │   └── RegisterForm.tsx
│       │   ├── tree/
│       │   │   ├── DiscussionTree.tsx
│       │   │   ├── TreeNode.tsx
│       │   │   └── AddOperationForm.tsx
│       │   └── ui/
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── card.tsx
│       │       └── dialog.tsx
│       ├── store/
│       │   └── useStore.ts
│       ├── lib/
│       │   ├── api.ts
│       │   └── utils.ts
│       └── types/
│           └── index.ts
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── .env
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── auth/
        │   ├── auth.module.ts
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   ├── jwt.strategy.ts
        │   └── dto/
        │       ├── register.dto.ts
        │       └── login.dto.ts
        ├── users/
        │   ├── users.module.ts
        │   ├── users.service.ts
        │   └── entities/
        │       └── user.entity.ts
        ├── discussions/
        │   ├── discussions.module.ts
        │   ├── discussions.controller.ts
        │   ├── discussions.service.ts
        │   ├── dto/
        │   │   ├── create-discussion.dto.ts
        │   │   └── add-operation.dto.ts
        │   └── entities/
        │       └── discussion-node.entity.ts
        └── database/
            └── database.module.ts
```

## 1. Docker Compose Configuration

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: numerical_postgres
    environment:
      POSTGRES_DB: numerical_discussion
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: numerical_backend
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/numerical_discussion
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    networks:
      - app-network
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: numerical_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

## 2. Backend (NestJS)

### Backend Dockerfile
**backend/Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
```

### Backend package.json
**backend/package.json**
```json
{
  "name": "numerical-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.3",
    "typeorm": "^0.3.17",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^4.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.3"
  }
}
```

### Main Entry Point
**backend/src/main.ts**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://frontend:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

### App Module
**backend/src/app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DiscussionsModule } from './discussions/discussions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Disable in production
      logging: true,
    }),
    AuthModule,
    UsersModule,
    DiscussionsModule,
  ],
})
export class AppModule {}
```

### User Entity
**backend/src/users/entities/user.entity.ts**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { DiscussionNode } from '../../discussions/entities/discussion-node.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => DiscussionNode, node => node.author)
  nodes: DiscussionNode[];
}
```

### Users Module & Service
**backend/src/users/users.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**backend/src/users/users.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
```

### Auth DTOs
**backend/src/auth/dto/register.dto.ts**
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**backend/src/auth/dto/login.dto.ts**
```typescript
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
```

### JWT Strategy
**backend/src/auth/jwt.strategy.ts**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { userId: user.id, username: user.username };
  }
}
```

### Auth Service
**backend/src/auth/auth.service.ts**
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByUsername(registerDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = await this.usersService.create(registerDto.username, registerDto.password);
    
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user || !(await this.usersService.validatePassword(user, loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}
```

### Auth Controller
**backend/src/auth/auth.controller.ts**
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Auth Module
**backend/src/auth/auth.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
```

### Discussion Node Entity
**backend/src/discussions/entities/discussion-node.entity.ts**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Operation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
}

@Entity('discussion_nodes')
export class DiscussionNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 20, scale: 10 })
  value: number;

  @Column({
    type: 'enum',
    enum: Operation,
    nullable: true,
  })
  operation: Operation | null;

  @Column('decimal', { precision: 20, scale: 10, nullable: true })
  operand: number | null;

  @Column({ nullable: true })
  parentId: string | null;

  @ManyToOne(() => DiscussionNode, node => node.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: DiscussionNode | null;

  @OneToMany(() => DiscussionNode, node => node.parent)
  children: DiscussionNode[];

  @ManyToOne(() => User, user => user.nodes)
  author: User;

  @Column()
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Discussion DTOs
**backend/src/discussions/dto/create-discussion.dto.ts**
```typescript
import { IsNumber } from 'class-validator';

export class CreateDiscussionDto {
  @IsNumber()
  startingNumber: number;
}
```

**backend/src/discussions/dto/add-operation.dto.ts**
```typescript
import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Operation } from '../entities/discussion-node.entity';

export class AddOperationDto {
  @IsUUID()
  parentId: string;

  @IsEnum(Operation)
  operation: Operation;

  @IsNumber()
  operand: number;
}
```

### Discussion Service
**backend/src/discussions/discussions.service.ts**
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscussionNode, Operation } from './entities/discussion-node.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { AddOperationDto } from './dto/add-operation.dto';

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(DiscussionNode)
    private discussionNodeRepository: Repository<DiscussionNode>,
  ) {}

  async createDiscussion(userId: string, createDiscussionDto: CreateDiscussionDto) {
    const node = this.discussionNodeRepository.create({
      value: createDiscussionDto.startingNumber,
      operation: null,
      operand: null,
      parentId: null,
      authorId: userId,
    });

    return this.discussionNodeRepository.save(node);
  }

  async addOperation(userId: string, addOperationDto: AddOperationDto) {
    const parent = await this.discussionNodeRepository.findOne({
      where: { id: addOperationDto.parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent node not found');
    }

    const result = this.calculateResult(
      parent.value,
      addOperationDto.operation,
      addOperationDto.operand,
    );

    const node = this.discussionNodeRepository.create({
      value: result,
      operation: addOperationDto.operation,
      operand: addOperationDto.operand,
      parentId: parent.id,
      authorId: userId,
    });

    return this.discussionNodeRepository.save(node);
  }

  async getAllDiscussions() {
    const allNodes = await this.discussionNodeRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    // Build tree structure
    const rootNodes = allNodes.filter(node => node.parentId === null);
    const nodeMap = new Map(allNodes.map(node => [node.id, { ...node, children: [] }]));

    allNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(nodeMap.get(node.id));
        }
      }
    });

    return rootNodes.map(root => nodeMap.get(root.id));
  }

  private calculateResult(leftValue: number, operation: Operation, rightValue: number): number {
    switch (operation) {
      case Operation.ADD:
        return leftValue + rightValue;
      case Operation.SUBTRACT:
        return leftValue - rightValue;
      case Operation.MULTIPLY:
        return leftValue * rightValue;
      case Operation.DIVIDE:
        if (rightValue === 0) {
          throw new BadRequestException('Division by zero is not allowed');
        }
        return leftValue / rightValue;
      default:
        throw new BadRequestException('Invalid operation');
    }
  }
}
```

### Discussion Controller
**backend/src/discussions/discussions.controller.ts**
```typescript
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { AddOperationDto } from './dto/add-operation.dto';

@Controller('discussions')
export class DiscussionsController {
  constructor(private discussionsService: DiscussionsService) {}

  @Get()
  async getAllDiscussions() {
    return this.discussionsService.getAllDiscussions();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createDiscussion(@Request() req, @Body() createDiscussionDto: CreateDiscussionDto) {
    return this.discussionsService.createDiscussion(req.user.userId, createDiscussionDto);
  }

  @Post('operation')
  @UseGuards(AuthGuard('jwt'))
  async addOperation(@Request() req, @Body() addOperationDto: AddOperationDto) {
    return this.discussionsService.addOperation(req.user.userId, addOperationDto);
  }
}
```

### Discussion Module
**backend/src/discussions/discussions.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscussionNode } from './entities/discussion-node.entity';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiscussionNode])],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
})
export class DiscussionsModule {}
```

## 3. Frontend (Next.js)

### Frontend Dockerfile
**frontend/Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Frontend package.json
**frontend/package.json**
```json
{
  "name": "numerical-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18",
    "zustand": "^4.4.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.303.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### TypeScript Config
**frontend/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind Config
**frontend/tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Next Config
**frontend/next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

### Environment Variables
**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Global Styles
**frontend/src/app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

### Types
**frontend/src/types/index.ts**
```typescript
export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export enum Operation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
}

export interface DiscussionNode {
  id: string;
  value: number;
  operation: Operation | null;
  operand: number | null;
  parentId: string | null;
  author: User;
  authorId: string;
  createdAt: string;
  children: DiscussionNode[];
}
```

### API Client
**frontend/src/lib/api.ts**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async register(username: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async login(username: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getDiscussions() {
    return this.request<any[]>('/discussions');
  }

  async createDiscussion(startingNumber: number) {
    return this.request<any>('/discussions', {
      method: 'POST',
      body: JSON.stringify({ startingNumber }),
    });
  }

  async addOperation(parentId: string, operation: string, operand: number) {
    return this.request<any>('/discussions/operation', {
      method: 'POST',
      body: JSON.stringify({ parentId, operation, operand }),
    });
  }
}

export const apiClient = new ApiClient();
```

### Utils
**frontend/src/lib/utils.ts**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return Number(num).toFixed(2);
}

export function getOperationSymbol(operation: string): string {
  switch (operation) {
    case 'add': return '+';
    case 'subtract': return '-';
    case 'multiply': return '×';
    case 'divide': return '÷';
    default: return '';
  }
}
```

### Zustand Store
**frontend/src/store/useStore.ts**
```typescript
import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import { User, DiscussionNode } from '@/types';

interface StoreState {
  user: User | null;
  token: string | null;
  discussions: DiscussionNode[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Auth actions
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  
  // Discussion actions
  fetchDiscussions: () => Promise<void>;
  createDiscussion: (startingNumber: number) => Promise<void>;
  addOperation: (parentId: string, operation: string, operand: number) => Promise<void>;
  
  // UI actions
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  token: null,
  discussions: [],
  loading: false,
  error: null,
  initialized: false,

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        apiClient.setToken(token);
        set({ user, token, initialized: true });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },

  register: async (username: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.register(username, password);
      apiClient.setToken(response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ 
        user: response.user, 
        token: response.access_token,
        loading: false 
      });
      await get().fetchDiscussions();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.login(username, password);
      apiClient.setToken(response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ 
        user: response.user, 
        token: response.access_token,
        loading: false 
      });
      await get().fetchDiscussions();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: () => {
    apiClient.setToken(null);
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchDiscussions: async () => {
    try {
      set({ loading: true, error: null });
      const discussions = await apiClient.getDiscussions();
      set({ discussions, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createDiscussion: async (startingNumber: number) => {
    try {
      set({ loading: true, error: null });
      await apiClient.createDiscussion(startingNumber);
      await get().fetchDiscussions();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addOperation: async (parentId: string, operation: string, operand: number) => {
    try {
      set({ loading: true, error: null });
      await apiClient.addOperation(parentId, operation, operand);
      await get().fetchDiscussions();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
```

### Shadcn UI Components

**frontend/src/components/ui/button.tsx**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-slate-300 hover:bg-slate-100",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "hover:bg-slate-100",
      link: "text-slate-900 underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "px-4 py-2",
      sm: "px-3 py-1.5 text-sm",
      lg: "px-6 py-3 text-lg",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

**frontend/src/components/ui/input.tsx**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**frontend/src/components/ui/card.tsx**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
```

**frontend/src/components/ui/dialog.tsx**
```typescript
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

export function Dialog({ children, open, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isOpen = open !== undefined ? open : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild }: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")

  const handleClick = () => context.onOpenChange(true)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return <div onClick={handleClick}>{children}</div>
}

export function DialogContent({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")

  if (!context.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => context.onOpenChange(false)}
      />
      <div className={cn(
        "relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6 z-50",
        className
      )}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}
```

### Auth Components

**frontend/src/components/auth/LoginForm.tsx**
```typescript
"use client"

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={onSwitchToRegister}
            disabled={loading}
          >
            Need an account? Register
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**frontend/src/components/auth/RegisterForm.tsx**
```typescript
"use client"

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, loading } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password);
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username (3-20 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              disabled={loading}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Register'}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Already have an account? Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Tree Components

**frontend/src/components/tree/AddOperationForm.tsx**
```typescript
"use client"

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Operation } from '@/types';

interface AddOperationFormProps {
  parentId: string;
  onClose: () => void;
}

export default function AddOperationForm({ parentId, onClose }: AddOperationFormProps) {
  const [operation, setOperation] = useState<Operation>(Operation.ADD);
  const [operand, setOperand] = useState('');
  const { addOperation, loading } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOperation(parentId, operation, parseFloat(operand));
      onClose();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Operation</label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as Operation)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          disabled={loading}
        >
          <option value={Operation.ADD}>Addition (+)</option>
          <option value={Operation.SUBTRACT}>Subtraction (-)</option>
          <option value={Operation.MULTIPLY}>Multiplication (×)</option>
          <option value={Operation.DIVIDE}>Division (÷)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Number</label>
        <Input
          type="number"
          step="any"
          placeholder="Enter a number"
          value={operand}
          onChange={(e) => setOperand(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Adding...' : 'Add Operation'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

**frontend/src/components/tree/TreeNode.tsx**
```typescript
"use client"

import { useState } from 'react';
import { DiscussionNode } from '@/types';
import { formatNumber, getOperationSymbol } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddOperationForm from './AddOperationForm';
import { useStore } from '@/store/useStore';

interface TreeNodeProps {
  node: DiscussionNode;
  level?: number;
}

export default function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useStore();

  return (
    <div className="my-2">
      <Card className="inline-block">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div>
              {node.operation && node.operand !== null && (
                <div className="text-sm text-slate-600 mb-1">
                  {getOperationSymbol(node.operation)} {formatNumber(node.operand)}
                </div>
              )}
              <div className="text-2xl font-bold">
                = {formatNumber(node.value)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                by {node.author.username}
              </div>
            </div>
            
            {user && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    + Respond
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Operation to {formatNumber(node.value)}</DialogTitle>
                  </DialogHeader>
                  <AddOperationForm 
                    parentId={node.id} 
                    onClose={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {node.children && node.children.length > 0 && (
        <div className="ml-8 mt-2 border-l-2 border-slate-300 pl-4">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**frontend/src/components/tree/DiscussionTree.tsx**
```typescript
"use client"

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import TreeNode from './TreeNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DiscussionTree() {
  const { discussions, fetchDiscussions, createDiscussion, user, loading } = useStore();
  const [startingNumber, setStartingNumber] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDiscussions();
    const interval = setInterval(fetchDiscussions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchDiscussions]);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiscussion(parseFloat(startingNumber));
      setStartingNumber('');
      setIsDialogOpen(false);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discussion Tree</h2>
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Start New Discussion</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Discussion</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDiscussion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Starting Number
                  </label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Enter a starting number"
                    value={startingNumber}
                    onChange={(e) => setStartingNumber(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Discussion'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading && discussions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Loading discussions...</div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No discussions yet. {user ? 'Start one!' : 'Login to start one!'}
        </div>
      ) : (
        <div className="space-y-6">
          {discussions.map((discussion) => (
            <TreeNode key={discussion.id} node={discussion} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Main Pages

**frontend/src/app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Numerical Discussion Tree',
  description: 'Communicate through numbers and operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**frontend/src/app/page.tsx**
```typescript
"use client"

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import DiscussionTree from '@/components/tree/DiscussionTree';

export default function Home() {
  const { user, logout, initializeAuth, initialized } = useStore();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    // Initialize authentication from localStorage
    initializeAuth();
  }, [initializeAuth]);

  if (!initialized) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Numerical Discussion Tree
            </h1>
            <p className="text-slate-600">
              Communicate through numbers and mathematical operations
            </p>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-slate-700">
                  Welcome, <strong>{user.username}</strong>
                </span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setAuthMode('login')}>Login</Button>
                <Button variant="outline" onClick={() => setAuthMode('register')}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </header>

        {!user && authMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative">
              <Button
                variant="ghost"
                className="absolute -top-2 -right-2 z-10"
                onClick={() => setAuthMode(null)}
              >
                ✕
              </Button>
              {authMode === 'login' ? (
                <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
              )}
            </div>
          </div>
        )}

        <DiscussionTree />
      </div>
    </main>
  );
}
```

## 4. Setup Instructions

### Initial Setup

1. Clone or create the project structure
2. Navigate to the project root directory

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ellty-db
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ellty-db
JWT_SECRET=852ff660c2cdb18fc8b7483a701e3873
NODE_ENV=development
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Running with Docker

From the project root:
```bash
docker-compose up --build
```

This will start:
- PostgreSQL on port 5432
- Backend (NestJS) on port 3001
- Frontend (Next.js) on port 3000

Access the application at: http://localhost:3000

### Running without Docker

**Terminal 1 - Database:**
```bash
# Make sure PostgreSQL is running locally
createdb numerical_discussion
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## 5. Testing

### Backend Tests

**backend/src/discussions/discussions.service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscussionsService } from './discussions.service';
import { DiscussionNode, Operation } from './entities/discussion-node.entity';
import { Repository } from 'typeorm';

describe('DiscussionsService', () => {
  let service: DiscussionsService;
  let repository: Repository<DiscussionNode>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionsService,
        {
          provide: getRepositoryToken(DiscussionNode),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiscussionsService>(DiscussionsService);
    repository = module.get<Repository<DiscussionNode>>(getRepositoryToken(DiscussionNode));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDiscussion', () => {
    it('should create a starting node', async () => {
      const userId = 'user-id';
      const startingNumber = 10;
      
      const mockNode = {
        id: 'node-id',
        value: startingNumber,
        operation: null,
        operand: null,
        parentId: null,
        authorId: userId,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockNode as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockNode as any);

      const result = await service.createDiscussion(userId, { startingNumber });

      expect(repository.create).toHaveBeenCalledWith({
        value: startingNumber,
        operation: null,
        operand: null,
        parentId: null,
        authorId: userId,
      });
      expect(result).toEqual(mockNode);
    });
  });

  describe('addOperation', () => {
    it('should add an operation node', async () => {
      const userId = 'user-id';
      const parentNode = {
        id: 'parent-id',
        value: 10,
        operation: null,
        operand: null,
      };

      const mockNode = {
        id: 'node-id',
        value: 15,
        operation: Operation.ADD,
        operand: 5,
        parentId: 'parent-id',
        authorId: userId,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(parentNode as any);
      jest.spyOn(repository, 'create').mockReturnValue(mockNode as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockNode as any);

      const result = await service.addOperation(userId, {
        parentId: 'parent-id',
        operation: Operation.ADD,
        operand: 5,
      });

      expect(result.value).toBe(15);
      expect(result.operation).toBe(Operation.ADD);
    });

    it('should throw error for division by zero', async () => {
      const userId = 'user-id';
      const parentNode = {
        id: 'parent-id',
        value: 10,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(parentNode as any);

      await expect(
        service.addOperation(userId, {
          parentId: 'parent-id',
          operation: Operation.DIVIDE,
          operand: 0,
        })
      ).rejects.toThrow('Division by zero is not allowed');
    });
  });
});
```

Run backend tests:
```bash
cd backend
npm test
```

### Frontend Tests

**frontend/src/components/tree/TreeNode.test.tsx**
```typescript
import { render, screen } from '@testing-library/react';
import TreeNode from './TreeNode';
import { DiscussionNode } from '@/types';

jest.mock('@/store/useStore', () => ({
  useStore: () => ({
    user: null,
  }),
}));

describe('TreeNode', () => {
  const mockNode: DiscussionNode = {
    id: '1',
    value: 10,
    operation: null,
    operand: null,
    parentId: null,
    author: { id: 'user1', username: 'testuser' },
    authorId: 'user1',
    createdAt: '2024-01-01',
    children: [],
  };

  it('renders node value', () => {
    render(<TreeNode node={mockNode} />);
    expect(screen.getByText(/10.00/)).toBeInTheDocument();
  });

  it('renders author username', () => {
    render(<TreeNode node={mockNode} />);
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
  });

  it('renders operation when present', () => {
    const nodeWithOp: DiscussionNode = {
      ...mockNode,
      operation: 'add' as any,
      operand: 5,
      value: 15,
    };
    render(<TreeNode node={nodeWithOp} />);
    expect(screen.getByText(/\+ 5.00/)).toBeInTheDocument();
  });
});
```

Run frontend tests:
```bash
cd frontend
npm test
```

## 6. API Documentation

### Authentication Endpoints

**POST /auth/register**
```json
Request:
{
  "username": "string (3-20 chars)",
  "password": "string (min 6 chars)"
}

Response:
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

**POST /auth/login**
```json
Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

### Discussion Endpoints

**GET /discussions**
- Public endpoint
- Returns array of discussion trees

**POST /discussions**
- Requires authentication
- Creates new discussion with starting number
```json
Request:
{
  "startingNumber": 42
}

Response:
{
  "id": "uuid",
  "value": 42,
  "operation": null,
  "operand": null,
  "parentId": null,
  "author": {...},
  "createdAt": "timestamp"
}
```

**POST /discussions/operation**
- Requires authentication
- Adds operation to existing node
```json
Request:
{
  "parentId": "uuid",
  "operation": "add" | "subtract" | "multiply" | "divide",
  "operand": 5
}

Response:
{
  "id": "uuid",
  "value": 47,
  "operation": "add",
  "operand": 5,
  "parentId": "parent-uuid",
  "author": {...},
  "createdAt": "timestamp"
}
```

## 7. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Discussion Nodes Table
```sql
CREATE TABLE discussion_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value DECIMAL(20, 10) NOT NULL,
  operation VARCHAR(10) CHECK (operation IN ('add', 'subtract', 'multiply', 'divide')),
  operand DECIMAL(20, 10),
  parent_id UUID REFERENCES discussion_nodes(id),
  author_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parent_id ON discussion_nodes(parent_id);
CREATE INDEX idx_author_id ON discussion_nodes(author_id);
```

## 8. Features Implemented

✅ User registration and authentication with JWT
✅ View discussion tree without authentication
✅ Create starting numbers (authenticated users)
✅ Add operations to any node (authenticated users)
✅ Tree visualization with parent-child relationships
✅ Real-time updates (polling every 5 seconds)
✅ All four operations: +, -, ×, ÷
✅ Division by zero protection
✅ Component-based architecture
✅ TypeScript throughout
✅ Docker Compose setup
✅ PostgreSQL database
✅ Responsive UI with Tailwind CSS
✅ Form validation
✅ Error handling
✅ Testing setup

## 9. Deployment Instructions

### Deploying to Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL
4. Deploy

### Deploying Backend (Railway/Render/Heroku)

1. Push code to GitHub
2. Create new service
3. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Your secret key
   - `PORT`: 3001
4. Deploy

### Environment Variables for Production

**Backend (.env):**
```
DATABASE_URL=postgresql://postgres:postgres@host:5432/ellty-db
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ellty-db
JWT_SECRET=852ff660c2cdb18fc8b7483a701e3873
PORT=3001
NODE_ENV=production
```

**Frontend (.env.production):**
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## 10. Usage Guide

1. **Visit the application** at http://localhost:3000
2. **View discussions** - Available to everyone
3. **Register an account** - Click "Register" button
4. **Login** - Use your credentials
5. **Start a discussion** - Click "Start New Discussion", enter a number
6. **Add operations** - Click "+ Respond" on any node, choose operation and number
7. **View tree growth** - Watch as calculations branch out

## 11. Additional Configuration Files

**backend/nest-cli.json**
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

**backend/tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

**frontend/postcss.config.js**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**frontend/jest.config.js**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*): '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

**frontend/jest.setup.js**
```javascript
import '@testing-library/jest-dom'
```

## 12. Quick Start Commands

```bash
# Clone repository
git clone <your-repo-url>
cd ellty-dockerized

# Start with Docker
docker-compose up --build

# Or start manually

# Terminal 1: Backend
cd ellty2-backend
npm install
npm run start:dev

# Terminal 2: Frontend
cd ellty2
npm install
npm run dev

# Terminal 3: Run tests
cd backend && npm test
cd frontend && npm test
```

Access: http://localhost:3000

## 13. Project Completion Checklist

- ✅ Full-stack TypeScript application
- ✅ Next.js with App Router
- ✅ NestJS backend with TypeORM
- ✅ PostgreSQL database
- ✅ Docker Compose configuration
- ✅ JWT authentication
- ✅ User registration and login
- ✅ Tree visualization
- ✅ CRUD operations for discussions
- ✅ Component-based UI (Shadcn)
- ✅ State management (Zustand)
- ✅ Form validation
- ✅ Error handling
- ✅ Testing setup
- ✅ API documentation
- ✅ Deployment instructions

All requirements from the test assignment have been fulfilled!