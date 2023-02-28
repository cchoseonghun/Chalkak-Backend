import _ from 'lodash';
import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { Meetup } from './entities/meetup.entity';
import { MeetupsRepository } from './meetups.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Join } from './entities/join.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MeetupsService {
  constructor(
    private meetupsRepository: MeetupsRepository, 
    @InjectRepository(Join) private joinRepository: Repository<Join>,
    // private dataSource: DataSource
    ) {}

  async getMeetups(): Promise<Meetup[]> {
    return await this.meetupsRepository.getMeetups();
  }

  async createMeetup(meetupDto: CreateMeetupDto): Promise<void> {
    await this.meetupsRepository.createMeetup(meetupDto);
  }

  async getMeetup(meetupId: number): Promise<Meetup> {
    return await this.meetupsRepository.getMeetup(meetupId);
  }

  async deleteMeetup(meetupId: number, userId: number) {
    const meetup = await this.getMeetup(meetupId);
    if (userId !== meetup.userId) {
      throw new ForbiddenException(`모임을 만든 사람만 삭제할 수 있습니다.`);
    }
    await this.meetupsRepository.delete(meetupId);
  }

  async getJoin(meetupId: number, userId: number): Promise<Join | null> {
    return await this.joinRepository.findOne({
      where: { meetupId, userId },
    });
  }

  async addJoin(meetupId: number, userId: number) {
    const meetup = await this.getMeetup(meetupId);
    const join = await this.getJoin(meetupId, userId);
    if (!_.isNil(join)) {
      throw new ConflictException(`이미 참여하고 있는 유저입니다.`);
    }
    if (meetup.headcount <= meetup.joins.length) {
      throw new ForbiddenException('정원이 다 찼습니다.');
    }
    await this.joinRepository.insert({
      meetupId, userId
    });
  }
}
