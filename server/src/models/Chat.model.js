// server/src/models/Chat.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'status', 'file', 'system'], default: 'text' },
    text: { type: String },
    attachmentUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { _id: false }
);

const ChatRoomSchema = new Schema(
  {
    name: { type: String }, // optional (e.g., "Hospital A - Lab B")
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }], // usually 2 or multiple
    messages: [MessageSchema],
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// index participants for quick lookups
ChatRoomSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model('ChatRoom', ChatRoomSchema);
