"use client";

import { useState, useEffect } from "react";

export interface ScholarProfile {
  alias: string;
  username: string; // unique handle e.g. @alex_vance
  college: string;
  course: string;
  year: string;
  bio: string;
  avatarUrl?: string;
  isSetupComplete: boolean;
}

export interface Comment {
  id: string;
  authorAlias: string;
  authorUsername: string;
  authorCollege: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  communityName: string;
  authorAlias: string;
  authorUsername: string;
  authorCollege: string;
  authorCourse: string;
  authorYear: string;
  title: string;
  description: string;
  category: "Notes & Cheatsheets" | "Study Groups" | "Exam Prep" | "Discussions" | "Q&A";
  tags: string[];
  likes: number;
  likedByUser: boolean;
  comments: Comment[];
  createdAt: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface Community {
  id: string;
  name: string;
  college: string;
  course: string;
  yearRange: string;
  description: string;
  icon: string;
  color: string;
  membersCount: number;
  isJoined: boolean;
}

export interface Friend {
  id: string;
  alias: string;
  username: string;
  college: string;
  course: string;
  year: string;
  status: "friends" | "pending_sent" | "pending_received";
  avatarColor: string;
  online: boolean;
}

export const COLLEGES: string[] = [
  "Stanford University",
  "Massachusetts Institute of Technology (MIT)",
  "UC Berkeley",
  "Carnegie Mellon University (CMU)",
  "IIT Bombay",
  "IIT Delhi",
  "Oxford University",
  "Harvard University",
  "Georgia Tech",
  "University of Washington",
  "National University of Singapore (NUS)",
  "Other / Global Academy",
];

export const COURSES: string[] = [
  "B.S. Computer Science & AI",
  "M.S. Artificial Intelligence & ML",
  "B.Tech Electrical & Computer Engineering",
  "Data Science & Applied Statistics",
  "Software Engineering & Systems",
  "Mathematics & Quantum Computing",
  "Mechanical & Robotics Engineering",
  "Biomedical Engineering",
  "Cybersecurity & Cloud Systems",
];

export const YEARS: string[] = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "Master's Degree Candidate",
  "PhD & Doctoral Scholar",
];

const DEFAULT_PROFILE: ScholarProfile = {
  alias: "Scholar",
  username: "@scholar",
  college: "Stanford University",
  course: "B.S. Computer Science & AI",
  year: "1st Year (Freshman)",
  bio: "Specializing in Intelligent Systems and Grounded Knowledge Graphs.",
  isSetupComplete: true,
};

const INITIAL_COMMUNITIES: Community[] = [
  {
    id: "comm-global-cs",
    name: "Global Algorithms & Systems Nexus",
    college: "Other / Global Academy",
    course: "B.S. Computer Science & AI",
    yearRange: "All Years",
    description: "Multi-university study circle focusing on distributed systems, algorithms, and graph theory.",
    icon: "Network",
    color: "from-blue-500/20 to-indigo-500/20",
    membersCount: 1420,
    isJoined: true,
  },
  {
    id: "comm-stanford-ai",
    name: "Stanford CS224N & CS229 AI Circle",
    college: "Stanford University",
    course: "M.S. Artificial Intelligence & ML",
    yearRange: "Graduate & Senior",
    description: "Deep learning transformer architectures, attention mechanisms, and LangGraph agents.",
    icon: "Brain",
    color: "from-purple-500/20 to-pink-500/20",
    membersCount: 890,
    isJoined: true,
  },
  {
    id: "comm-mit-eecs",
    name: "MIT 6.004 / 6.033 EECS Lab",
    college: "Massachusetts Institute of Technology (MIT)",
    course: "B.Tech Electrical & Computer Engineering",
    yearRange: "2nd & 3rd Year",
    description: "Computation structures, digital systems hardware, and distributed networking review notes.",
    icon: "Cpu",
    color: "from-emerald-500/20 to-teal-500/20",
    membersCount: 650,
    isJoined: false,
  },
  {
    id: "comm-berkeley-os",
    name: "UC Berkeley CS162 Operating Systems",
    college: "UC Berkeley",
    course: "B.S. Computer Science & AI",
    yearRange: "3rd Year (Junior)",
    description: "Pintos kernel projects, concurrency synchronization, virtual memory paging, and file systems.",
    icon: "Layers",
    color: "from-amber-500/20 to-orange-500/20",
    membersCount: 780,
    isJoined: false,
  },
  {
    id: "comm-iit-algorithms",
    name: "IIT Bombay Advanced Graph Theory",
    college: "IIT Bombay",
    course: "Mathematics & Quantum Computing",
    yearRange: "3rd & 4th Year",
    description: "Max-Flow Min-Cut, dynamic programming proofs, and randomized algorithms study group.",
    icon: "Sparkles",
    color: "from-rose-500/20 to-red-500/20",
    membersCount: 540,
    isJoined: false,
  },
];

// No fake pre-seeded users in DB per user request
const INITIAL_FRIENDS: Friend[] = [];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    communityId: "comm-stanford-ai",
    communityName: "Stanford CS224N & CS229 AI Circle",
    authorAlias: "Academic Scholar",
    authorUsername: "@scholar_ai",
    authorCollege: "Stanford University",
    authorCourse: "M.S. Artificial Intelligence & ML",
    authorYear: "Master's Degree Candidate",
    title: "CS224N Transformer Attention & Rotary Positional Embeddings (RoPE) Mathematical Derivation",
    description: "Synthesized complete matrix derivations for Scaled Dot-Product Attention, Multi-Head projections, and RoPE coordinate rotations with 1024-dim tensors.",
    category: "Notes & Cheatsheets",
    tags: ["#CS224N", "#Transformers", "#Attention", "#DeepLearning"],
    likes: 12,
    likedByUser: false,
    createdAt: "2 hours ago",
    attachmentName: "Transformer_Attention_Derivations.pdf",
    attachmentType: "Course PDF",
    comments: [],
  },
  {
    id: "post-2",
    communityId: "comm-global-cs",
    communityName: "Global Algorithms & Systems Nexus",
    authorAlias: "Distributed Systems Group",
    authorUsername: "@raft_consensus",
    authorCollege: "UC Berkeley",
    authorCourse: "B.S. Computer Science & AI",
    authorYear: "3rd Year (Junior)",
    title: "Distributed Raft Consensus: Leader Election Split-Brain Edge Cases Study Guide",
    description: "Study notes on network partition recovery, term increment rules, and log replication consistency across asynchronous node clusters.",
    category: "Study Groups",
    tags: ["#DistributedSystems", "#Raft", "#Consensus"],
    likes: 8,
    likedByUser: false,
    createdAt: "5 hours ago",
    attachmentName: "Raft_Consensus_EdgeCases.pdf",
    attachmentType: "Problem Set",
    comments: [],
  },
];

const STORAGE_KEYS = {
  PROFILE: "polaris_comm_profile_v2",
  COMMUNITIES: "polaris_comm_communities_v2",
  POSTS: "polaris_comm_posts_v2",
  FRIENDS: "polaris_comm_friends_v2",
};

// Global in-memory cache to sync across components
let globalProfile: ScholarProfile = DEFAULT_PROFILE;
let globalCommunities: Community[] = INITIAL_COMMUNITIES;
let globalPosts: CommunityPost[] = INITIAL_POSTS;
let globalFriends: Friend[] = INITIAL_FRIENDS;
let globalCollegeFilter: string = "All Colleges";
let globalCourseFilter: string = "All Courses";
let globalYearFilter: string = "All Years";

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const p = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (p) globalProfile = JSON.parse(p);
    const c = localStorage.getItem(STORAGE_KEYS.COMMUNITIES);
    if (c) globalCommunities = JSON.parse(c);
    const postData = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (postData) globalPosts = JSON.parse(postData);
    const f = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (f) globalFriends = JSON.parse(f);
  } catch {
    // fallback
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(globalProfile));
    localStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(globalCommunities));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(globalPosts));
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(globalFriends));
    window.dispatchEvent(new Event("polaris:community-updated"));
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  loadFromStorage();
}

export function useCommunityStore() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    loadFromStorage();
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener("polaris:community-updated", handleUpdate);
    return () => window.removeEventListener("polaris:community-updated", handleUpdate);
  }, []);

  const updateProfile = (updates: Partial<ScholarProfile>) => {
    globalProfile = { ...globalProfile, ...updates };
    saveToStorage();
  };

  const setFilters = (filters: { college?: string; course?: string; year?: string }) => {
    if (filters.college !== undefined) globalCollegeFilter = filters.college;
    if (filters.course !== undefined) globalCourseFilter = filters.course;
    if (filters.year !== undefined) globalYearFilter = filters.year;
    saveToStorage();
  };

  const toggleJoinCommunity = (communityId: string) => {
    globalCommunities = globalCommunities.map((c) =>
      c.id === communityId
        ? {
            ...c,
            isJoined: !c.isJoined,
            membersCount: c.isJoined ? c.membersCount - 1 : c.membersCount + 1,
          }
        : c
    );
    saveToStorage();
  };

  const createPost = (newPostData: Omit<CommunityPost, "id" | "likes" | "likedByUser" | "comments" | "createdAt">) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      likes: 0,
      likedByUser: false,
      comments: [],
      createdAt: "Just now",
      ...newPostData,
    };
    globalPosts = [newPost, ...globalPosts];
    saveToStorage();
  };

  const toggleLikePost = (postId: string) => {
    globalPosts = globalPosts.map((p) => {
      if (p.id !== postId) return p;
      const liked = !p.likedByUser;
      return {
        ...p,
        likedByUser: liked,
        likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
      };
    });
    saveToStorage();
  };

  const addComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorAlias: globalProfile.alias,
      authorUsername: globalProfile.username,
      authorCollege: globalProfile.college,
      content: content.trim(),
      createdAt: "Just now",
      likes: 0,
    };
    globalPosts = globalPosts.map((p) =>
      p.id === postId
        ? {
            ...p,
            comments: [...p.comments, newComment],
          }
        : p
    );
    saveToStorage();
  };

  const toggleFriendStatus = (friendId: string) => {
    globalFriends = globalFriends.map((f) => {
      if (f.id !== friendId) return f;
      if (f.status === "friends") return { ...f, status: "pending_sent" };
      if (f.status === "pending_sent") return { ...f, status: "friends" };
      if (f.status === "pending_received") return { ...f, status: "friends" };
      return f;
    });
    saveToStorage();
  };

  const sendFriendRequest = (userData: { alias: string; username: string; college: string; course: string; year: string }) => {
    const existing = globalFriends.find((f) => f.username === userData.username);
    if (existing) {
      globalFriends = globalFriends.map((f) =>
        f.username === userData.username ? { ...f, status: "friends" } : f
      );
    } else {
      const colors = ["bg-indigo-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)] || "bg-indigo-500";
      const newFriend: Friend = {
        id: `user-${Date.now()}`,
        alias: userData.alias,
        username: userData.username,
        college: userData.college,
        course: userData.course,
        year: userData.year,
        status: "pending_sent",
        avatarColor: randomColor,
        online: true,
      };
      globalFriends = [newFriend, ...globalFriends];
    }
    saveToStorage();
  };

  return {
    profile: globalProfile,
    communities: globalCommunities,
    posts: globalPosts,
    friends: globalFriends,
    selectedCollegeFilter: globalCollegeFilter,
    selectedCourseFilter: globalCourseFilter,
    selectedYearFilter: globalYearFilter,
    updateProfile,
    setFilters,
    toggleJoinCommunity,
    createPost,
    toggleLikePost,
    addComment,
    toggleFriendStatus,
    sendFriendRequest,
  };
}
