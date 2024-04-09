import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
  UserData,
} from "amazon-cognito-identity-js";
import invariant from "../invariant";
import { AuthAccess } from "./session-to-auth-access";
import sessionToAuthAccess from "./session-to-auth-access";

type UserBundle<TUser> = {
  readonly cognitoUser: CognitoUser;
  readonly authUser: TUser & AuthAccess;
};

type UserParser<TUser> = (data: UserData, session: CognitoUserSession) => TUser;

async function baseGetUserData<TUser>(
  user: CognitoUser,
  parseUser: UserParser<TUser>,
  bypassCache: boolean,
) {
  const session = user.getSignInUserSession();
  invariant(session, "User must have session");

  return new Promise<TUser & AuthAccess>((resolve, reject) => {
    user.getUserData(
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        if (!data) {
          reject(new Error("Error retrieving user info"));
          return;
        }

        resolve({
          ...parseUser(data, session),
          ...sessionToAuthAccess(session),
          // Typing is wrong for lib - PreferredMfaSetting should be string | undefined
          isMfaEnabled: data.PreferredMfaSetting !== undefined,
        });
      },
      { bypassCache },
    );
  });
}

async function getUserDataNoCache<TUser>(
  user: CognitoUser,
  parseUser: UserParser<TUser>,
) {
  return baseGetUserData(user, parseUser, true);
}

type GetUserOptions = {
  readonly bypassCache?: boolean;
};

async function getUserData<TUser>(
  user: CognitoUser,
  parseUser: UserParser<TUser>,
  options?: GetUserOptions,
) {
  return baseGetUserData(user, parseUser, options?.bypassCache ?? false);
}

async function getCurrentUser<TUser>(
  userPool: CognitoUserPool,
  parseUser: UserParser<TUser>,
): Promise<UserBundle<TUser> | undefined> {
  const cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser) {
    return undefined;
  }

  return new Promise<UserBundle<TUser> | undefined>((resolve, reject) => {
    cognitoUser.getSession(
      async (error: Error | null, session: CognitoUserSession | null) => {
        if (error) {
          reject(error);
          return;
        }

        if (!session) {
          resolve(undefined);
          return;
        }

        const authUser = await getUserData(cognitoUser, parseUser);
        resolve({
          cognitoUser,
          authUser,
        });
      },
    );
  });
}

export type { UserParser };
export { getUserData, getUserDataNoCache };
export default getCurrentUser;
