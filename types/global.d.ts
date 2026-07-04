export {};

declare global {
  interface User {
    id: string;
    username: string;
    avatar?: string | null;
    followed?: boolean;
    // banner?: string;
    // status?: string;
  }

  interface UserLoginInput {
    email: string;
    password: string;
  }
  interface UserCreateInput extends Pick<User, "username">, UserLoginInput {}

  interface Tweet {
    id: string;
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
    replyTo?: { id: string; username: string } | null; // id - tweet
  }

  interface TweetInput extends Pick<
    Tweet,
    "content" | "hashtag" | "onlyFollowers"
  > {
    replyTo?: number | string | null;
  }

  interface UserSettings extends User {
    banner?: string | null;
    status?: string | null;
  }

  interface UserSettingsInput extends Partial<
    Omit<UserSettings, "id" | "followed">
  > {
    password?: string;
    email?: string;
  }

  interface Profile extends UserSettings {
    followers: number;
    following: number;
  }

  interface Trend {
    id: string;
    hashtag: string; // trend name with automatic #
    //tweets: Tweet[]; // idk tweets under this hashtag
    tweets: number; // amount of tweets under this hashtag
  }
}
