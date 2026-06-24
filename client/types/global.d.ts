export {};

declare global {
  interface User {
    id: number;
    username: string;
    image?: string;
    followed?: boolean;
    // banner?: string;
    // status?: string;
  }

  interface Tweet {
    id: number;
    content: string;
    user: User;
    date: Date;
    likes: number;
    replies: number;
    retweets: number;
    retweetedBy?: string;
    hashtag?: string;
    image?: string;
    onlyFollowers?: boolean;
    liked?: boolean;
    saved?: boolean;
    retweeted?: boolean;
    reply?: { id: number; name: string };
  }

  interface UserSettings extends User {
    banner?: string;
    status?: string;
  }
  interface Profile extends UserSettings {
    followers: number;
  }

  interface Trend {
    name: string; // название тренда # автоматическая
    //tweets: Tweet[]; // твиты по этому хештегу тренду хз
    tweets: number; // количество твитов по этому тренду хз
  }
}
