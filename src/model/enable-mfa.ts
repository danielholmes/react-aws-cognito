import { CognitoUser } from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state.ts";
import { UserParser, getUserData } from "./get-current-user.ts";

async function enableMfa<TUser>(
  mfaDeviceName: string,
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parseUser: UserParser<TUser>,
  user: CognitoUser,
  code: string,
) {
  await new Promise((resolve, reject) => {
    user.verifySoftwareToken(code, mfaDeviceName, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });

  await new Promise<void>((resolve, reject) => {
    user.setUserMfaPreference(
      null,
      { PreferredMfa: true, Enabled: true },
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

export default enableMfa;
