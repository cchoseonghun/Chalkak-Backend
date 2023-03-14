import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { multerOptionsFactory } from '../common/multer/multer.options.factory';
import { PhotospotController } from './photospot.controller';
import { PhotospotService } from './photospot.service';
import { Photospot } from './entities/photospot.entity';
import { Photo } from './entities/photo.entity';
import { Collection } from '../collections/entities/collection.entity';
import { S3Service } from './../common/aws/s3.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: multerOptionsFactory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Photospot, Collection, Photo]),
  ],
  controllers: [PhotospotController],
  providers: [PhotospotService, S3Service],
})
export class PhotospotModule {}
