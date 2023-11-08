import { ObjectId } from "mongodb";

export interface EVENT_DATA_TYPE {
  _id: ObjectId;
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  image: string;
  flyer: string;
  isFeatured: boolean;
  isGuestOnly: boolean;
}

export interface ITEM_ENTRY_TYPE {
  _id: ObjectId;
  itemEntry: object;
  itemType: string;
  item: string;
  eventId: string;
}
