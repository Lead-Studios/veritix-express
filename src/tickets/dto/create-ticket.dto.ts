import { IsUUID, IsNotEmpty } from "class-validator"

export class CreateTicketDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string

  @IsUUID()
  @IsNotEmpty()
  userId: string
}

