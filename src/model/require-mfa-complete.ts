import { CognitoUser } from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state.ts";
import { UserParser, getUserData } from "./get-current-user.ts";
import { AuthAccess } from "./session-to-auth-access.ts";

type Options<TUser> = {
  readonly onSignIn: ((user: TUser & AuthAccess) => void) | undefined;
};

async function requireMfaComplete<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parseUser: UserParser<TUser>,
  user: CognitoUser,
  { onSignIn }: Options<TUser>,
  code: string,
) {
  // TODO: Look at source - use UserPool instead
  // https://github.com/aws-amplify/amplify-js/blob/master/packages/
  // amazon-cognito-identity-js/src/CognitoUser.js
  // This one is a bit more involved
  await new Promise<void>((resolve, reject) => {
    user.sendMFACode(
      code,
      {
        onSuccess() {
          resolve();
        },
        onFailure: reject,
      },
      "SOFTWARE_TOKEN_MFA",
    );
  });

  const authUser = await getUserData(user, parseUser);
  setInternalAuthState({
    type: "signedIn",
    user,
    authUser,
  });
  onSignIn?.(authUser);
}

export default requireMfaComplete;
