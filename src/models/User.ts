import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "boolean", default: false })
  isVerified: boolean;

  @Column({ type: "varchar", nullable: true })
  googleId?: string;

  @Column({ type: "enum", enum: ["user", "admin"], default: "user" })
  role: "user" | "admin";

  constructor(name: string, email: string, password: string) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.isVerified = false;
    this.role = "user";
  }
}
