// src/user/users.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ unique: true })  
  username: string;

  @Column()
  password: string; 
  @Column()
  role: string;

  @Column()
  isActive: boolean;
}
