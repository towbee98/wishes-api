import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AdminsDocument = Admins & Document;

export enum AdminRoles {
  createStore = 'create_store',
  deleteStore = 'delete_store',
  addAdmin = 'add_admin',
  deleteAdmin = 'delete_admin',
}
@Schema({
  timestamps: true,
})
export class Admins {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: null, type: [String], enum: Object.values(AdminRoles) })
  roles: string[];
}

export const AdminsModel = SchemaFactory.createForClass(Admins);
