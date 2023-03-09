import { Controller, Post, Get, Put, Delete, Body, Param, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePhotospotDto } from './dto/create-photospot.dto';
import { ModifyPhotospotDto } from './dto/modify-photospot.dto';
import { PhotospotService } from './photospot.service';
import { Photospot } from './entities/photospot.entity';
import { InjectUser, UserGuard } from '../auth/auth.decorator';
import { FileVaildationPipe } from '../common/multer/FileValidation.pipe';

@Controller('/api/collections/:collectionId/photospots')
export class PhotospotController {
  constructor(private readonly photospotService: PhotospotService) {}

  @Post()
  @UserGuard
  @UseInterceptors(FilesInterceptor('files'))
  async createPhotospot(
    @UploadedFiles(FileVaildationPipe) files: Express.Multer.File[],
    @Body() createPhtospotDto: CreatePhotospotDto,
    @Param('collectionId') collectionId: number,
    @InjectUser('id') userId: number
  ): Promise<void> {
    await this.photospotService.createPhotospot(createPhtospotDto, files, userId, collectionId);
  }

  @Get()
  async getAllPhotospot(@Param('collectionId') collectionId: number): Promise<Photospot[]> {
    return this.photospotService.getAllPhotospot(collectionId);
  }

  @Get('/:photospotId')
  async getPhotospot(@Param('photospotId') photospotId: number): Promise<Photospot> {
    return this.photospotService.getPhotospot(photospotId);
  }


  @Put('/:photospotId')
  @UserGuard
  @UseInterceptors(FilesInterceptor('images'))
  async modifyPhotospot(
    @UploadedFile(FileVaildationPipe) images: Express.Multer.File[],
    @Body() modifyPhotospot: ModifyPhotospotDto,
    @Param('photospotId') photospotId: number,
    @InjectUser('id') userId: number
  ): Promise<void> {    
    await this.photospotService.modifyPhotospot(modifyPhotospot, photospotId, userId);
  }

  @Delete('/:photospotId')
  @UserGuard
  async deletePhotospot(@Param('photospotId') photospotId: number, @InjectUser('id') userId: number) {
    await this.photospotService.deletePhotospot(photospotId, userId);
  }
}
