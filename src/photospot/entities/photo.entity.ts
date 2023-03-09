import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Photospot } from './photospot.entity';
import { User } from './../../auth/entities/user.entity';

@Entity({schema:'chalkak', name: 'photo'})
export class Photo {
  @PrimaryGeneratedColumn({type: 'int', name: 'id'})
  id: number;

  @Column('int')
  userId: number;

  @Column('int')
  photospotId: number;

  @Column('varchar')
  image: string;

  @CreateDateColumn()
  createAt: Date;

  @ManyToOne(() => User, (user) => user.photos)
  user: User;

  @ManyToOne(() => Photospot, (photospot) => photospot.photos)
  photospot: Photospot;
  
}