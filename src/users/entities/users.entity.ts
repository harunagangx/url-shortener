import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Column,
} from 'typeorm';
import { Link } from '../../links/entities/link.entity.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid', {
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Link, (link) => link.user)
  links: Link[];
}
