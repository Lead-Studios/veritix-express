import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,  } from "typeorm"
import { Admin } from "./admin.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(
    () => Admin,
    (admin) => admin.role,
  )
  admins!: Admin[]

  @Column("simple-array")
  permissions!: string[]

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

