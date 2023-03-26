import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { DataSource, Repository } from 'typeorm';
import { Collection } from 'src/collections/entities/collection.entity';
import { GetCollectionsListQueryDto } from 'src/collections/dto/get.collections.list.query.dto';

@Injectable()
export class CollectionUserKeywordRepository extends Repository<Collection> {
  constructor(private readonly dataSource: DataSource) {
    super(Collection, dataSource.createEntityManager());
  }

  async getCollectionsList({ p, search, userId }: GetCollectionsListQueryDto): Promise<Collection[]> {
    const take = 18;
    const whereQuery = this.isThereSearchUserid(search, userId)
    return await this.createQueryBuilder('c')
      .where(whereQuery.q1, whereQuery.q2)
      .select(['c.id', 'c.userId', 'c.title', 'c.description', 'c.createdAt'])
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('c.collectionKeywords', 'ck')
      .leftJoinAndSelect('c.collectionLikes', 'cl')
      .orderBy('c.id', 'DESC')
      .take(take)
      .skip((p - 1) * take)
      .getMany()
  }

  isThereSearchUserid(search?: string, userId?: number): { q1: string; q2: {}; } {
    const myCollectionQuery = 'c.userId = :userId';
    const searchCollectionQuery = 'c.title LIKE :search OR c.description LIKE :search';
    const query = { q1: '', q2: {} };

    if (search && !userId) {
      query.q1 = searchCollectionQuery
      query.q2 = { search: `%${search}%` }
    } else if (!search && userId) {
      query.q1 = myCollectionQuery
      query.q2 = { userId }
    } else if (search && userId) {
      query.q1 = `${myCollectionQuery} AND (${searchCollectionQuery})`
      query.q2 = { userId, search: `%${search}%` }
    } return query
  }

  async getTopCollectionsListForMain(): Promise<Collection[]> {
    return await this.createQueryBuilder('c')
      .select(['c.id', 'c.userId', 'c.title', 'c.description', 'c.createdAt'])
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('c.collectionKeywords', 'ck')
      .leftJoinAndSelect('c.collectionLikes', 'cl')
      .leftJoin('c.collectionLikes', 'clikes')
      .addSelect('COUNT(clikes.userId) as clikesCount')
      .groupBy('c.id, cu.id, ck.id, cl.userId, cl.collectionId')
      .orderBy('clikesCount', 'DESC')
      .getMany()
  }

  async getCollection(collectionId: number): Promise<Collection | null> {
    return await this.createQueryBuilder('c')
      .where('c.id = :id', { id: collectionId })
      .select(['c.id', 'c.userId', 'c.title', 'c.description', 'c.createdAt'])
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('c.photospots', 'cp')
      .leftJoinAndSelect('cp.photos', 'cpt')
      .leftJoinAndSelect('c.collectionKeywords', 'ck')
      .leftJoinAndSelect('c.collectionLikes', 'cl')
      .getOne();
  }
}
