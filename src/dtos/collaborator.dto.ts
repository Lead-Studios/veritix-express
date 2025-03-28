export class CreateCollaboratorDTO {
  name?: string;
  email?: string;
  image?: string;
  event?: string; // Event ID
}

export class UpdateCollaboratorDTO {
  name?: string;
  email?: string;
  image?: string;
}
