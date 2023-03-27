import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as _ from 'lodash';
import { CollectionsRepository } from 'src/collections/collections.repository';
import { Collection } from 'src/collections/entities/collection.entity';
import { CollectionKeyword } from 'src/collections/entities/collection.keyword.entity';
import { CreateCollectionDto } from 'src/collections/dto/create.collection.dto';
import { UpdateCollectionDto } from 'src/collections/dto/update.collection.dto';
import { GetCollectionIdDto } from 'src/collections/dto/get.collection.id.dto';
import { GetCollectionsListQueryDto } from 'src/collections/dto/get.collections.list.query.dto';
import { CollectionLike } from './entities/collection.like.entity';
import { Photo } from 'src/photospot/entities/photo.entity';
import { CollectionList } from 'src/collections/collection.types';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionKeyword) private readonly collectionKeywordsRepository: Repository<CollectionKeyword>,
    @InjectRepository(CollectionLike) private readonly collectionLikesRepository: Repository<CollectionLike>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    private readonly collectionsRepository: CollectionsRepository,
  ) { }

  // 콜렉션
  async getCollectionsList(getCollectionsListQueryDto: GetCollectionsListQueryDto, user: any): Promise<CollectionList[]> {
    const collections = await this.collectionsRepository.getCollectionsList(getCollectionsListQueryDto);
    const collectionsLikesData = collections.map((collection) => ({
      ...collection,
      isCollectionLiked: user ? collection.collectionLikes.some(like => like.userId === user.id) : false,
      likes: collection.collectionLikes.length
    }))
    return collectionsLikesData
  }

  async getTopCollectionsListForMain(user: any): Promise<CollectionList[]> {
    const collections = await this.collectionsRepository.getTopCollectionsListForMain();
    const collectionsLikesData = collections.map((collection) => ({
      ...collection,
      isCollectionLiked: user ? collection.collectionLikes.some(like => like.userId === user.id) : false,
      likes: collection.collectionLikes.length
    }))
    return collectionsLikesData
  }

  async getCollection(collectionId: GetCollectionIdDto['collectionId']): Promise<Collection> {
    const collection = await this.collectionsRepository.getCollection(collectionId);
    if (!collection) {
      throw new NotFoundException(`해당 콜렉션을 찾을 수 없습니다.`);
    }
    return collection;
  }

  async createCollection(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    const { userId, title, description, keywords } = createCollectionDto;
    const collection = this.collectionsRepository.create({ userId, title, description })
    const keywordsArray = await this.createCollectionKeyword(keywords)
    collection.collectionKeywords = keywordsArray
    return await this.collectionsRepository.save(collection)
  };

  async createCollectionKeyword(keywords: string[]): Promise<CollectionKeyword[]> {
    const existingKeywords = await this.collectionKeywordsRepository.find({
      where: { keyword: In(keywords) },
    });
    const existingKeywordSet = new Set(existingKeywords.map((keyword) => keyword.keyword));
    const newKeywords = keywords.filter((keyword) => !existingKeywordSet.has(keyword));
    const newCollectionKeywords = newKeywords.map((keyword) => {
      const collectionKeyword = new CollectionKeyword();
      collectionKeyword.keyword = keyword;
      return collectionKeyword;
    });
    await this.collectionKeywordsRepository.save(newCollectionKeywords);
    return [...existingKeywords, ...newCollectionKeywords];
  }

  async updateCollection(updateCollectionDto: UpdateCollectionDto, collectionId: number, userId: number): Promise<void> {
    const { title, description, keywords } = updateCollectionDto;
    const collection = await this.getCollection(collectionId);
    if (collection.userId !== userId) {
      throw new ForbiddenException('해당 콜렉션 내용의 수정 권한이 없습니다.');
    }
    await this.collectionsRepository.update({ id: collectionId }, { title, description });
    if (_.isNil(keywords)) {
      throw new NotFoundException('해당 콜렉션의 키워드를 찾을 수 없습니다.');
    }
    const keywordsArray = await this.createCollectionKeyword(keywords)
    collection.collectionKeywords = keywordsArray
    await this.collectionsRepository.save(collection)
  }

  async deleteCollection(collectionId: number, userId: number): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (userId !== collection.userId) {
      throw new ForbiddenException('해당 콜렉션의 삭제 권한이 없습니다.');
    }
    const photospotIds = collection.photospots.map((photopsot) => photopsot.id);
    await Promise.all([
      this.collectionsRepository.softRemove(collection),
      photospotIds.length > 0 ? this.photoRepository.createQueryBuilder('p')
        .delete()
        .where('photospotId IN (:...photospotIds)', { photospotIds })
        .execute()
        : Promise.resolve(),
    ]);
  }

  // 콜렉션 좋아요
  async getCollectionLikeById(userId: number, collectionId: number): Promise<CollectionLike | null> {
    await this.getCollection(collectionId)
    return await this.collectionLikesRepository.createQueryBuilder('collectionLike')
      .where('collectionLike.userId = :userId AND collectionLike.collectionId = :collectionId', {
        userId, collectionId
      })
      .getOne();
  }

  async addCollectionLike(userId: number, collectionId: number): Promise<CollectionLike> {
    await this.getCollectionLikeById(userId, collectionId)
    const collectionLike = new CollectionLike();
    collectionLike.userId = userId;
    collectionLike.collectionId = collectionId;
    await this.collectionLikesRepository.save(collectionLike);
    return collectionLike;
  }

  async removeCollectionLike(userId: number, collectionId: number): Promise<void> {
    await this.getCollectionLikeById(userId, collectionId)
    const collectionLike = new CollectionLike();
    collectionLike.userId = userId;
    collectionLike.collectionId = collectionId;
    await this.collectionLikesRepository.remove(collectionLike);
  }
}

