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
  avatarColor?: string;
  isSetupComplete: boolean;
  isCloudflareVerified?: boolean;
  cfRayId?: string;
  verifiedAt?: string;
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
  authorAvatarColor?: string;
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
  imageUrl?: string;
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
  bio?: string;
}

export interface DirectMessage {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  content: string;
  createdAt: string;
  timestamp: number;
}

export interface Conversation {
  peerUsername: string;
  peerAlias: string;
  peerCollege: string;
  peerAvatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
  online: boolean;
  messages: DirectMessage[];
}

export interface CommunityStory {
  id: string;
  username: string;
  alias: string;
  college: string;
  avatarColor: string;
  previewNote: string;
  timestamp: string;
  hasUnread: boolean;
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
  "Princeton University",
  "ETH Zurich",
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
  "Physics & Quantitative Finance",
];

export const YEARS: string[] = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "Master's Degree Candidate",
  "PhD & Doctoral Scholar",
];

export const TRENDING_TOPICS = [
  { tag: "#CS229_MachineLearning", postsCount: 1240, college: "Stanford University", category: "AI & ML" },
  { tag: "#TransformersRoPE", postsCount: 980, college: "MIT", category: "Deep Learning" },
  { tag: "#PintosOperatingSystems", postsCount: 840, college: "UC Berkeley", category: "Systems" },
  { tag: "#RaftDistributedConsensus", postsCount: 710, college: "CMU", category: "Cloud & Networks" },
  { tag: "#AdvancedGraphTheory", postsCount: 650, college: "IIT Bombay", category: "Algorithms" },
  { tag: "#QuantumGateCompilation", postsCount: 520, college: "Oxford University", category: "Quantum" },
  { tag: "#PlacementInterviewPrep", postsCount: 1450, college: "Global Scholars", category: "Career" },
];

export const INITIAL_DISCOVERABLE_SCHOLARS: Friend[] = [
  {
    id: "user-elena",
    alias: "Elena Rostova",
    username: "@elena_ml",
    college: "Stanford University",
    course: "M.S. Artificial Intelligence & ML",
    year: "Master's Degree Candidate",
    status: "friends",
    avatarColor: "bg-indigo-600",
    online: true,
    bio: "Researching Multimodal LLMs and Graph RAG architectures.",
  },
  {
    id: "user-marcus",
    alias: "Marcus Thorne",
    username: "@marcus_dist",
    college: "MIT",
    course: "B.Tech Electrical & Computer Engineering",
    year: "3rd Year (Junior)",
    status: "friends",
    avatarColor: "bg-purple-600",
    online: true,
    bio: "FPGA accelerators and low-latency distributed databases.",
  },
  {
    id: "user-priya",
    alias: "Priya Sharma",
    username: "@priya_algo",
    college: "IIT Bombay",
    course: "Mathematics & Quantum Computing",
    year: "4th Year (Senior)",
    status: "pending_received",
    avatarColor: "bg-rose-500",
    online: false,
    bio: "Spectral graph theory and randomized algorithms enthusiast.",
  },
  {
    id: "user-kai",
    alias: "Kai Tanaka",
    username: "@kai_systems",
    college: "UC Berkeley",
    course: "B.S. Computer Science & AI",
    year: "2nd Year (Sophomore)",
    status: "friends",
    avatarColor: "bg-emerald-600",
    online: true,
    bio: "Kernel hacker, Rust lover, working on eBPF telemetry.",
  },
  {
    id: "user-sophia",
    alias: "Sophia Laurent",
    username: "@sophia_oxford",
    college: "Oxford University",
    course: "Data Science & Applied Statistics",
    year: "1st Year (Freshman)",
    status: "pending_sent",
    avatarColor: "bg-amber-600",
    online: false,
    bio: "Bayesian causal inference and empirical finance modeling.",
  },
  {
    id: "user-david",
    alias: "David Chen",
    username: "@david_cmu",
    college: "Carnegie Mellon University (CMU)",
    course: "Software Engineering & Systems",
    year: "3rd Year (Junior)",
    status: "pending_received",
    avatarColor: "bg-cyan-600",
    online: true,
    bio: "Distributed consensus & high-throughput streaming systems.",
  },
  {
    id: "user-aravind",
    alias: "Aravind Rao",
    username: "@aravind_delhi",
    college: "IIT Delhi",
    course: "B.S. Computer Science & AI",
    year: "4th Year (Senior)",
    status: "pending_received",
    avatarColor: "bg-teal-600",
    online: true,
    bio: "Compiler design, LLVM passes, and neural hardware synthesis.",
  },
];

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

const INITIAL_STORIES: CommunityStory[] = [
  {
    id: "story-elena",
    username: "@elena_ml",
    alias: "Elena Rostova",
    college: "Stanford University",
    avatarColor: "bg-indigo-600",
    previewNote: "Just published complete derivations for Multi-Head Attention eigenvalues! 📐✨",
    timestamp: "15m ago",
    hasUnread: true,
  },
  {
    id: "story-marcus",
    username: "@marcus_dist",
    alias: "Marcus Thorne",
    college: "MIT",
    avatarColor: "bg-purple-600",
    previewNote: "Lab session open in 6.033. Anyone debugging Raft term elections? 💻",
    timestamp: "45m ago",
    hasUnread: true,
  },
  {
    id: "story-kai",
    username: "@kai_systems",
    alias: "Kai Tanaka",
    college: "UC Berkeley",
    avatarColor: "bg-emerald-600",
    previewNote: "Pintos file system buffer cache test cases passed 100%! Cheatsheet attached in DM.",
    timestamp: "2h ago",
    hasUnread: false,
  },
  {
    id: "story-priya",
    username: "@priya_algo",
    alias: "Priya Sharma",
    college: "IIT Bombay",
    avatarColor: "bg-rose-500",
    previewNote: "Graph min-cut duality theorem simplified into 1 page breakdown. 🚀",
    timestamp: "3h ago",
    hasUnread: true,
  },
];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    communityId: "comm-stanford-ai",
    communityName: "Stanford CS224N & CS229 AI Circle",
    authorAlias: "Elena Rostova",
    authorUsername: "@elena_ml",
    authorCollege: "Stanford University",
    authorCourse: "M.S. Artificial Intelligence & ML",
    authorYear: "Master's Degree Candidate",
    authorAvatarColor: "bg-indigo-600",
    title: "CS224N Transformer Attention & RoPE Coordinate Rotations",
    description: "Synthesized complete matrix derivations for Scaled Dot-Product Attention, Multi-Head projections, and RoPE coordinate rotations with 1024-dim tensors. Check out the attached derivations sheet!",
    category: "Notes & Cheatsheets",
    tags: ["#CS224N", "#Transformers", "#Attention", "#DeepLearning"],
    likes: 34,
    likedByUser: true,
    createdAt: "2 hours ago",
    attachmentName: "Transformer_Attention_Derivations.pdf",
    attachmentType: "Course PDF",
    comments: [
      {
        id: "c-1",
        authorAlias: "Marcus Thorne",
        authorUsername: "@marcus_dist",
        authorCollege: "MIT",
        content: "The coordinate rotation proof on page 3 is so clean! Thanks for sharing this Elena.",
        createdAt: "1 hour ago",
        likes: 4,
      },
    ],
  },
  {
    id: "post-2",
    communityId: "comm-global-cs",
    communityName: "Global Algorithms & Systems Nexus",
    authorAlias: "Marcus Thorne",
    authorUsername: "@marcus_dist",
    authorCollege: "MIT",
    authorCourse: "B.Tech Electrical & Computer Engineering",
    authorYear: "3rd Year (Junior)",
    authorAvatarColor: "bg-purple-600",
    title: "Distributed Raft Consensus: Network Partition & Split-Brain Edge Cases",
    description: "Study guide on network partition recovery, term increment rules, and log replication consistency across asynchronous node clusters. Essential for systems midterms.",
    category: "Study Groups",
    tags: ["#DistributedSystems", "#Raft", "#Consensus", "#MIT6033"],
    likes: 21,
    likedByUser: false,
    createdAt: "5 hours ago",
    attachmentName: "Raft_Consensus_EdgeCases.pdf",
    attachmentType: "Problem Set",
    comments: [],
  },
  {
    id: "post-3",
    communityId: "comm-berkeley-os",
    communityName: "UC Berkeley CS162 Operating Systems",
    authorAlias: "Kai Tanaka",
    authorUsername: "@kai_systems",
    authorCollege: "UC Berkeley",
    authorCourse: "B.S. Computer Science & AI",
    authorYear: "2nd Year (Sophomore)",
    authorAvatarColor: "bg-emerald-600",
    title: "Pintos Virtual Memory Paging & Multi-Level Page Tables Guide",
    description: "Breakdown of supplemental page tables, frame allocation table, and swap slot disk operations. Includes ASCII diagrams and lock hierarchy ordering.",
    category: "Exam Prep",
    tags: ["#CS162", "#OperatingSystems", "#Pintos", "#Paging"],
    likes: 19,
    likedByUser: false,
    createdAt: "7 hours ago",
    attachmentName: "Pintos_VM_Cheatsheet.pdf",
    attachmentType: "Cheatsheet",
    comments: [],
  },
];

const INITIAL_CONVERSATIONS: Record<string, Conversation> = {
  "@elena_ml": {
    peerUsername: "@elena_ml",
    peerAlias: "Elena Rostova",
    peerCollege: "Stanford University",
    peerAvatarColor: "bg-indigo-600",
    lastMessage: "Let me know if you want to collaborate on the CS229 problem set!",
    lastMessageTime: "25m ago",
    online: true,
    messages: [
      {
        id: "m-1",
        senderUsername: "@elena_ml",
        receiverUsername: "@user",
        content: "Hey! Saw you joined the Stanford AI Circle. Welcome!",
        createdAt: "10:30 AM",
        timestamp: Date.now() - 3600000,
      },
      {
        id: "m-2",
        senderUsername: "@user",
        receiverUsername: "@elena_ml",
        content: "Thanks Elena! Loved your notes on Rotary Positional Embeddings.",
        createdAt: "10:35 AM",
        timestamp: Date.now() - 3300000,
      },
      {
        id: "m-3",
        senderUsername: "@elena_ml",
        receiverUsername: "@user",
        content: "Let me know if you want to collaborate on the CS229 problem set!",
        createdAt: "10:42 AM",
        timestamp: Date.now() - 2900000,
      },
    ],
  },
  "@marcus_dist": {
    peerUsername: "@marcus_dist",
    peerAlias: "Marcus Thorne",
    peerCollege: "MIT",
    peerAvatarColor: "bg-purple-600",
    lastMessage: "Check out the Raft study notes I posted on the feed.",
    lastMessageTime: "2h ago",
    online: true,
    messages: [
      {
        id: "m-4",
        senderUsername: "@marcus_dist",
        receiverUsername: "@user",
        content: "Check out the Raft study notes I posted on the feed.",
        createdAt: "8:15 AM",
        timestamp: Date.now() - 7200000,
      },
    ],
  },
};

const STORAGE_KEYS = {
  CF_USER: "polaris_cf_community_auth_v2",
  PROFILE: "polaris_comm_profile_v2",
  COMMUNITIES: "polaris_comm_communities_v2",
  POSTS: "polaris_comm_posts_v2",
  FRIENDS: "polaris_comm_friends_v2",
  DMS: "polaris_comm_dms_v2",
};

// Global in-memory cache
let globalCommunityUser: ScholarProfile | null = null;
let globalCommunities: Community[] = INITIAL_COMMUNITIES;
let globalPosts: CommunityPost[] = INITIAL_POSTS;
let globalFriends: Friend[] = INITIAL_DISCOVERABLE_SCHOLARS;
let globalConversations: Record<string, Conversation> = INITIAL_CONVERSATIONS;
let globalActiveDmUsername: string = "@elena_ml";

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const cf = localStorage.getItem(STORAGE_KEYS.CF_USER);
    if (cf) globalCommunityUser = JSON.parse(cf);

    const c = localStorage.getItem(STORAGE_KEYS.COMMUNITIES);
    if (c) globalCommunities = JSON.parse(c);

    const postData = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (postData) globalPosts = JSON.parse(postData);

    const f = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (f) globalFriends = JSON.parse(f);

    const dms = localStorage.getItem(STORAGE_KEYS.DMS);
    if (dms) globalConversations = JSON.parse(dms);
  } catch {
    // fallback
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    if (globalCommunityUser) {
      localStorage.setItem(STORAGE_KEYS.CF_USER, JSON.stringify(globalCommunityUser));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(globalCommunityUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CF_USER);
    }
    localStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(globalCommunities));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(globalPosts));
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(globalFriends));
    localStorage.setItem(STORAGE_KEYS.DMS, JSON.stringify(globalConversations));
    window.dispatchEvent(new Event("polaris:community-updated"));
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  loadFromStorage();
}

export function useCommunityStore() {
  const [currentUser, setCurrentUser] = useState<ScholarProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cf = localStorage.getItem(STORAGE_KEYS.CF_USER);
        if (cf) return JSON.parse(cf);
      } catch {}
    }
    return globalCommunityUser;
  });
  const [, setVersion] = useState(0);

  useEffect(() => {
    loadFromStorage();
    setCurrentUser(globalCommunityUser);
    const handleUpdate = () => {
      setCurrentUser(globalCommunityUser);
      setVersion((v) => v + 1);
    };
    window.addEventListener("polaris:community-updated", handleUpdate);
    return () => window.removeEventListener("polaris:community-updated", handleUpdate);
  }, []);

  // ── Cloudflare Community Auth ──
  const loginWithCloudflare = (params: {
    username: string;
    college: string;
    alias: string;
    course?: string;
    year?: string;
    bio?: string;
    cfRayId?: string;
  }) => {
    const cleanUsername = params.username.startsWith("@")
      ? params.username.toLowerCase()
      : `@${params.username.toLowerCase().replace(/[^a-z0-9_]/g, "")}`;

    const colors = ["bg-indigo-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)] || "bg-indigo-600";

    const newProfile: ScholarProfile = {
      alias: params.alias.trim() || cleanUsername.replace("@", ""),
      username: cleanUsername,
      college: params.college,
      course: params.course || "B.S. Computer Science & AI",
      year: params.year || "3rd Year (Junior)",
      bio: params.bio || "Scholar collaborating via Polaris Community.",
      avatarColor,
      isSetupComplete: true,
      isCloudflareVerified: true,
      cfRayId: params.cfRayId || `cf-edge-${Math.random().toString(36).substring(2, 9)}`,
      verifiedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    globalCommunityUser = newProfile;
    saveToStorage();
    return newProfile;
  };

  const logoutCloudflare = () => {
    globalCommunityUser = null;
    saveToStorage();
  };

  const updateProfile = (updates: Partial<ScholarProfile>) => {
    if (globalCommunityUser) {
      globalCommunityUser = { ...globalCommunityUser, ...updates };
      saveToStorage();
    }
  };

  // ── Community Actions ──
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

  // ── Post Actions ──
  const createPost = (newPostData: Omit<CommunityPost, "id" | "likes" | "likedByUser" | "comments" | "createdAt">) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      likes: 0,
      likedByUser: false,
      comments: [],
      createdAt: "Just now",
      authorAvatarColor: globalCommunityUser?.avatarColor || "bg-indigo-600",
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
    const authorUser = globalCommunityUser?.username || "@scholar";
    const authorAlias = globalCommunityUser?.alias || "Scholar";
    const authorCollege = globalCommunityUser?.college || "Global Scholar";

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorAlias,
      authorUsername: authorUser,
      authorCollege,
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

  // ── Friend Request & Connections ──
  const sendFriendRequest = (userData: {
    alias: string;
    username: string;
    college: string;
    course?: string;
    year?: string;
    bio?: string;
  }) => {
    const cleanHandle = userData.username.startsWith("@") ? userData.username : `@${userData.username}`;
    const existingIndex = globalFriends.findIndex((f) => f.username.toLowerCase() === cleanHandle.toLowerCase());

    if (existingIndex >= 0 && globalFriends[existingIndex]) {
      const current = globalFriends[existingIndex];
      const newStatus = current.status === "friends" ? "friends" : "pending_sent";
      globalFriends[existingIndex] = { ...current, status: newStatus };
    } else {
      const colors = ["bg-indigo-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)] || "bg-indigo-600";
      const newFriend: Friend = {
        id: `user-${Date.now()}`,
        alias: userData.alias,
        username: cleanHandle,
        college: userData.college,
        course: userData.course || "General Engineering",
        year: userData.year || "Undergraduate",
        status: "pending_sent",
        avatarColor: randomColor,
        online: true,
        bio: userData.bio,
      };
      globalFriends = [newFriend, ...globalFriends];
    }
    saveToStorage();
  };

  const acceptFriendRequest = (friendId: string) => {
    globalFriends = globalFriends.map((f) => (f.id === friendId ? { ...f, status: "friends" as const } : f));
    saveToStorage();
  };

  const declineFriendRequest = (friendId: string) => {
    globalFriends = globalFriends.filter((f) => f.id !== friendId);
    saveToStorage();
  };

  const toggleFriendStatus = (friendId: string) => {
    globalFriends = globalFriends.map((f) => {
      if (f.id !== friendId) return f;
      if (f.status === "friends") return { ...f, status: "pending_sent" as const };
      if (f.status === "pending_sent") return { ...f, status: "friends" as const };
      if (f.status === "pending_received") return { ...f, status: "friends" as const };
      return f;
    });
    saveToStorage();
  };

  // ── Direct Messaging (DM) ──
  const sendDirectMessage = (toUsername: string, text: string) => {
    if (!text.trim()) return;

    const myUsername = globalCommunityUser?.username || "@scholar";
    const cleanTo = toUsername.startsWith("@") ? toUsername : `@${toUsername}`;

    const friendInfo = globalFriends.find((f) => f.username.toLowerCase() === cleanTo.toLowerCase());
    const peerAlias = friendInfo?.alias || cleanTo.replace("@", "");
    const peerCollege = friendInfo?.college || "Global University";
    const peerColor = friendInfo?.avatarColor || "bg-indigo-600";

    const msg: DirectMessage = {
      id: `dm-${Date.now()}`,
      senderUsername: myUsername,
      receiverUsername: cleanTo,
      content: text.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
    };

    const existingConv: Conversation = globalConversations[cleanTo] || {
      peerUsername: cleanTo,
      peerAlias,
      peerCollege,
      peerAvatarColor: peerColor,
      lastMessage: "",
      lastMessageTime: "",
      online: true,
      messages: [],
    };

    const updatedConv: Conversation = {
      ...existingConv,
      lastMessage: text.trim(),
      lastMessageTime: "Just now",
      messages: [...existingConv.messages, msg],
    };

    globalConversations = {
      ...globalConversations,
      [cleanTo]: updatedConv,
    };

    saveToStorage();

    // Auto-respond for interactive scholar peer experience
    setTimeout(() => {
      const replies = [
        `Great point! I'm reviewing the lecture slides from ${peerCollege} right now.`,
        "Got your message! Let's connect on this study topic.",
        "That makes total sense. Have you solved question 4 from the problem set yet?",
        "Awesome! I'll share the summary notes from our study circle shortly.",
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)] || "Thanks for reaching out!";

      const peerReply: DirectMessage = {
        id: `dm-reply-${Date.now()}`,
        senderUsername: cleanTo,
        receiverUsername: myUsername,
        content: replyText,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now(),
      };

      const targetConv = globalConversations[cleanTo];
      if (targetConv) {
        const nextTargetConv: Conversation = {
          ...targetConv,
          lastMessage: replyText,
          lastMessageTime: "Just now",
          messages: [...targetConv.messages, peerReply],
        };
        globalConversations = {
          ...globalConversations,
          [cleanTo]: nextTargetConv,
        };
        saveToStorage();
      }
    }, 1200);
  };

  const startConversationWith = (username: string) => {
    const cleanTo = username.startsWith("@") ? username : `@${username}`;
    globalActiveDmUsername = cleanTo;

    if (!globalConversations[cleanTo]) {
      const friendInfo = globalFriends.find((f) => f.username.toLowerCase() === cleanTo.toLowerCase());
      globalConversations = {
        ...globalConversations,
        [cleanTo]: {
          peerUsername: cleanTo,
          peerAlias: friendInfo?.alias || cleanTo.replace("@", ""),
          peerCollege: friendInfo?.college || "Global University",
          peerAvatarColor: friendInfo?.avatarColor || "bg-indigo-600",
          lastMessage: "Started new study conversation",
          lastMessageTime: "Just now",
          online: friendInfo?.online ?? true,
          messages: [],
        },
      };
      saveToStorage();
    }
  };

  return {
    communityUser: currentUser,
    profile: currentUser || {
      alias: "Guest Scholar",
      username: "@guest_scholar",
      college: "Global Academy",
      course: "Computer Science",
      year: "1st Year",
      bio: "Join via Cloudflare to customize your scholar identity.",
      isSetupComplete: false,
    },
    communities: globalCommunities,
    posts: globalPosts,
    friends: globalFriends,
    stories: INITIAL_STORIES,
    trendingTopics: TRENDING_TOPICS,
    conversations: globalConversations,
    activeDmUsername: globalActiveDmUsername,
    selectedCollegeFilter: "All Colleges",
    selectedCourseFilter: "All Courses",
    selectedYearFilter: "All Years",
    setFilters: () => {},
    setActiveDmUsername: (username: string) => {
      globalActiveDmUsername = username;
      startConversationWith(username);
    },
    loginWithCloudflare,
    logoutCloudflare,
    updateProfile,
    toggleJoinCommunity,
    createPost,
    toggleLikePost,
    addComment,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    toggleFriendStatus,
    sendDirectMessage,
    startConversationWith,
  };
}
