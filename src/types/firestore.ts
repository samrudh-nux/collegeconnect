
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  collegeId: string;
  collegeName?: string;
  bio?: string;
  interests?: string[];
  profileImageUrl?: string;
  highScore: number;
  badgeNames: string[];
  enrolledCourseIds: string[];
}

export interface GlobalFeedMessage {
  id: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: Timestamp;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  adminId: string;
  type: 'one-to-one' | 'group';
  name?: string;
  description?: string;
  createdAt: Timestamp;
  lastMessageTimestamp: Timestamp;
  category?: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  groupAdminId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  timestamp: Timestamp;
}

export interface Document {
    id: string;
    name: string;
    url: string;
    uploaderId: string;
    uploaderEmail: string;
    createdAt: Timestamp;
}
