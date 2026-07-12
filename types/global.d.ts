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
    replyAllowed?: boolean; // reply allowed if AUTHOR of the tweet follows currently logged in user
    inProgress?: boolean; // for newly sent tweets while their sending is in progress
  }

  interface TweetInput extends Pick<
    Tweet,
    "content" | "hashtag" | "onlyFollowers"
  > {
    replyTo?: number | string | null;
  }

  interface TweetResponse {
    tweet: Tweet;
    newRepliesAmount?: number;
  }

  interface TweetActionResponse {
    newLikeAmount?: number;
    newSavesAmount?: number;
    newRetweetsAmount?: number;
  }

  interface UserSettings extends User {
    banner?: string | null;
    status?: string | null;
    email: string;
  }

  interface UserSettingsInput extends Partial<
    Pick<UserSettings, "status" | "username">
  > {
    password?: string;
    oldPassword?: string;
    email?: string;
    avatar?: File | null;
    banner?: File | null;
  }

  interface Profile extends Omit<UserSettings, "email"> {
    followers: number;
    following: number;
  }

  interface Trend {
    id: string;
    hashtag: string; // trend name with automatic #
    //tweets: Tweet[]; // idk tweets under this hashtag
    tweets: number; // amount of tweets under this hashtag
  }

  interface PaginationResponse<T> {
    data: Awaited<T>;
    perPage: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  }
}
