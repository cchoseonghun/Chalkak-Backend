import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AdminService } from 'src/admin/admin.service';
import { SigninAdminDto } from 'src/admin/dto/signin.admin.dto';
import { SignupAdminReqDto } from 'src/admin/dto/signup.admin.req.dto';
import { AdminToken } from 'src/admin/auth.admin.decorator';
import { BlockAdminUserDto } from 'src/admin/dto/block.admin.user.dto';
import { User } from 'src/auth/entities/user.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { Photospot } from 'src/photospot/entities/photospot.entity';
import { Meetup } from 'src/meetups/entities/meetup.entity';
import { Faq } from 'src/admin/entities/faq.entity';
import { CreateAdminFaqDto } from './dto/create.admin.faq.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // 관리자 관리
  @Get('auth')
  async getAdminsList(@Req() req: Request) {
    const result = await this.adminService.getAdminsList('admin');
    if (req.query.keyword) {
      result.where('admin.account LIKE :keyword OR admin.responsibility LIKE :keyword', { keyword: `%${req.query.keyword}` });
    }
    const p: number = parseInt(req.query.p as any) || 1;
    const perPage = 6;
    const total = await result.getCount();
    result.offset((p - 1) * perPage).limit(perPage);
    return {
      data: await result.getMany(),
      total,
      p,
      lastPage: Math.ceil(total / perPage),
    };
  }

  @Post('auth/signup')
  async signupAdmin(@Body() data: SignupAdminReqDto) {
    return await this.adminService.signupAdmin(data);
  }

  @Post('auth/signin')
  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  async signinAdmin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const admin = req.user as SigninAdminDto;
    const accessToken = await this.adminService.issueAccessToken(admin);
    const refreshToken = await this.adminService.issueRefreshToken(admin.id);
    const jwtData = { accessToken, refreshToken };
    res.cookie('auth-cookie', jwtData, { httpOnly: true });
    return { data: jwtData, message: '로그인에 성공하였습니다.' };
  }

  @Get('auth/signin')
  @UseGuards(AuthGuard('refresh'))
  async reissueTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @AdminToken('refreshToken') refreshToken: string
  ) {
    const admin = req.user as SigninAdminDto;
    const accessToken = await this.adminService.issueAccessToken(admin);
    const jwtData = { accessToken, refreshToken };
    res.cookie('auth-cookie', jwtData, { httpOnly: true });
    return { message: 'Access 토큰이 정상적으로 재발급 되었습니다.' };
  }

  @Delete('auth/:id')
  async deleteAdmin(@Param('id') id: number) {
    return this.adminService.deleteAdmin(id);
  }

  @Post('auth/signout')
  signoutAdmin(@Req() req: Request, @Res() res: Response): any {
    res.cookie('jwt', '', { maxAge: 0 });
    return res.send({ message: '정상적으로 로그아웃 되었습니다.' });
  }

  // 유저 관리
  @Get('users')
  async getAdminUsersList(@Query('keyword') keyword: string, @Query('p') p: number = 1): Promise<User[]> {
    return await this.adminService.getAdminUsersList(keyword, p);
  }

  @Put('users/:id')
  async blockAdminUser(@Param('id') id: string, @Body() blockUser: BlockAdminUserDto) {
    const { isBlock } = blockUser;
    return await this.adminService.blockAdminUser(id, { isBlock: !isBlock });
  }

  // 콜렉션 관리
  @Get('collections')
  async getAdminCollectionsList(@Query('keyword') keyword: string, @Query('p') p: number = 1): Promise<Collection[]> {
    return await this.adminService.getAdminCollectionsList(keyword, p);
  }

  @Delete('collections/:id')
  async deleteAdminCollection(@Param('id') id: number) {
    return await this.adminService.deleteAdminCollection(id);
  }

  // 포토스팟 관리
  @Get('photospots/:id')
  async getAdminAllPhotospot(@Param('id') id: number): Promise<Photospot[]> {
    return this.adminService.getAdminAllPhotospot(id);
  }

  @Get('photospots/:id/:photospotId')
  async getAdminPhotospot(@Param('photospotId') photospotId: number): Promise<Photospot> {
    return this.adminService.getAdminPhotospot(photospotId);
  }

  @Delete('photospots/:id/:photospotId')
  async deleteAdminPhotospot(@Param('photospotId') photospotId: number) {
    await this.adminService.deleteAdminPhotospot(photospotId);
  }

  // 모임 관리
  @Get('meetups')
  async getAdminMeetupsList(@Query('keyword') keyword: string, @Query('p') p: number = 1): Promise<Meetup[]> {
    return await this.adminService.getAdminMeetupsList(keyword, p);
  }

  @Delete('meetups/:id')
  async deleteAdminMeetup(@Param('id') id: number) {
    return await this.adminService.deleteAdminMeetup(id);
  }

  // 자주찾는질문 관리
  @Get('faq')
  async getAdminFaqList(@Query('keyword') keyword: string, @Query('p') p: number = 1): Promise<Faq[]> {
    return await this.adminService.getAdminFaqList(keyword, p);
  }

  @Get('faq/:id')
  async getAdminFaq(@Param('id') id: number): Promise<Faq> {
    return this.adminService.getAdminFaq(id);
  }

  @Post('faq')
  async createAdminFaq(@Body() data: CreateAdminFaqDto) {
    return await this.adminService.createAdminFaq(data);
  }
}
