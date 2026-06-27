export {};

declare global {
  interface User {
    id: number;
    username: string;
    avatar?: string | null;
    followed?: boolean;
    // banner?: string;
    // status?: string;
  }

  interface Tweet {
    id: number;
    content: string;
    author: User;
    created_at: Date;
    likes: number;
    replies: number;
    retweets: number;
    saves: number;
    retweetedBy?: string | null;
    hashtag?: string | null;
    image?: string | null;
    onlyFollowers?: boolean;
    liked?: boolean;
    saved?: boolean;
    retweeted?: boolean;
    replyTo?: { id: number; username: string } | null; // id - tweet
  }

  interface UserSettings extends User {
    banner?: string;
    status?: string;
  }
  interface Profile extends UserSettings {
    followers: number;
    following: number;
  }

  interface Trend {
    id: number;
    hashtag: string; // название тренда # автоматическая
    //tweets: Tweet[]; // твиты по этому хештегу тренду хз
    tweets: number; // количество твитов по этому тренду хз
  }
}
