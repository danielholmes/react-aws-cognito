import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
  UserData,
} from "amazon-cognito-identity-js";
import invariant from "../invariant";
import { AuthAccess } from "./session-to-auth-access";

type UserBundle<TUser> = {
  readonly cognitoUser: CognitoUser;
  readonly authUser: TUser;
};

type UserParser<TUser extends AuthAccess> = (
  data: UserData,
  session: CognitoUserSession
) => TUser;

async function baseGetUserData<TUser extends AuthAccess>(
  user: CognitoUser,
  parseUser: UserParser<TUser>,
  bypassCache: boolean
): Promise<TUser> {
  const session = user.getSignInUserSession();
  invariant(session, "User must have session");

  return new Promise<TUser>((resolve, reject) => {
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

        resolve(parseUser(data, session));
      },
      { bypassCache }
    );
  });
}

async function getUserDataNoCache<TUser extends AuthAccess>(
  user: CognitoUser,
  parseUser: UserParser<TUser>
): Promise<TUser> {
  return baseGetUserData(user, parseUser, true);
}

async function getUserData<TUser extends AuthAccess>(
  user: CognitoUser,
  parseUser: UserParser<TUser>
): Promise<TUser> {
  return baseGetUserData(user, parseUser, false);
}

async function getCurrentUser<TUser extends AuthAccess>(
  userPool: CognitoUserPool,
  parseUser: UserParser<TUser>
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
      }
    );
  });
}

export type { UserParser };
export { getUserData, getUserDataNoCache };
export default getCurrentUser;
