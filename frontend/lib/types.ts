// ── 공통 유저 정보 ───────────────────────────────────────────────────────────────
export interface UserInfo {
  id: number;
  nickname: string;
  profile_image: string | null;
}

// ── 장소 ─────────────────────────────────────────────────────────────────────
export interface Place {
  id: number;
  place_name: string;
  category: string;
  region: string | null;
  address: string | null;
  phone_number: string | null;
  place_image: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: string;
}

// ── 코스 ─────────────────────────────────────────────────────────────────────
export interface CoursePlace {
  id: number;
  place_id: number | null;
  visit_order: number;
  day: number;
  place_name: string | null;
  category: string | null;
  time: string | null;
  memo: string | null;
  place_image: string | null;
}

export interface Course {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  travel_image: string | null;
  duration_days: number | null;
  travel_style: string | null;
  region: string | null;
  transport: string | null;
  is_shared: boolean;
  is_recruiting: boolean;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string | null;
  user: UserInfo | null;
  like_count: number;
  course_places: CoursePlace[];
}

export interface CourseLikeStatus {
  liked: boolean;
  like_count: number;
}

// ── 동행 게시글 ───────────────────────────────────────────────────────────────
export type CompanionGender = "any" | "male" | "female";
export type CompanionAgeGroup = "20s" | "30s" | "40s" | "50s+";

export const COMPANION_GENDER_LABELS: Record<CompanionGender, string> = {
  any: "성별 무관", male: "남성만", female: "여성만",
};
export const COMPANION_AGE_LABELS: Record<CompanionAgeGroup, string> = {
  "20s": "20대", "30s": "30대", "40s": "40대", "50s+": "50대 이상",
};

export interface CompanionPost {
  id: number;
  course_id: number;
  user_id: number;
  title: string;
  content: string | null;
  max_people: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  recruit_deadline: string | null;
  gender: CompanionGender;
  age_groups: CompanionAgeGroup[];
  created_at: string;
  updated_at: string | null;
  user: UserInfo | null;
  current_people: number;
  like_count: number;
}

// ── AI 생성 ───────────────────────────────────────────────────────────────────
export interface GeneratedPlace {
  day: number;
  visit_order: number;
  place_name: string;
  category: string;
  time: string | null;
  memo: string | null;
}

export interface GeneratedCourse {
  title: string;
  description: string;
  places: GeneratedPlace[];
}

// ── 채팅 ──────────────────────────────────────────────────────────────────────
export interface ChatRoom {
  id: number;
  post_id: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user: UserInfo | null;
}

export interface DirectRoom {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  other_user: UserInfo | null;
}

export interface DirectMessage {
  id: number;
  room_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: UserInfo | null;
}
