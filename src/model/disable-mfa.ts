import { CognitoUser } from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state";
import { UserParser, getUserData } from "./get-current-user";
import { AuthAccess } from "./session-to-auth-access";

async function disableMfa<TUser extends AuthAccess>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parseUser: UserParser<TUser>,
  user: CognitoUser,
) {
  await new Promise<void>((resolve, reject) => {
    user.setUserMfaPreference(
      null,
      { PreferredMfa: false, Enabled: false },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });

  setInternalAuthState({
    type: "signedIn",
    user,
    // Want to clear the cached attributes
    authUser: await getUserData(user, parseUser, { bypassCache: true }),
  });
}

export default disableMfa;
