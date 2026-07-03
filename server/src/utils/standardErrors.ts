import { HTTPException } from "hono/http-exception";

export class UnauthenticatedError extends HTTPException {
  constructor() {
    super(401, { message: "You must be authenticated to perform this action" });
    this.name = "UnauthenticatedError";
  }
}

export class MissingIdError extends HTTPException {
  constructor(message?: string) {
    super(400, { message: message ?? "Please provide target id in query" });
    this.name = "MissingIdError";
  }
}

export class Tweet404Error extends HTTPException {
  constructor(id: string | number, reply?: boolean) {
    super(404, {
      message: `Tweet with id #${id}${reply ? " you are trying to reply to" : ""} does not exist`,
    });
    this.name = "Tweet404Error";
  }
}

export class User404Error extends HTTPException {
  constructor(id: string | number) {
    super(404, {
      message: `User with id #${id} does not exist`,
    });
    this.name = "User404Error";
  }
}

export class Session404Error extends HTTPException {
  constructor(id: string) {
    super(404, {
      message: `Session with id "${id}" does not exist`,
    });
  }
}

export class ActionNoReturnError extends HTTPException {
  constructor(action: string) {
    super(500, {
      message: `${action} was successful but did not return new values for whatever reason, try again.`,
    });
  }
}
