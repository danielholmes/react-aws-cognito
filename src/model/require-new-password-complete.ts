import { CognitoUser } from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state.ts";
import { getUserData, UserParser } from "./get-current-user.ts";
import { AuthAccess } from "./session-to-auth-access.ts";

type Options<TUser> = {
  readonly onSignIn: ((user: TUser & AuthAccess) => void) | undefined;
};

async function requireNewPasswordComplete<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parser: UserParser<TUser>,
  user: CognitoUser,
  { onSignIn }: Options<TUser>,
  password: string,
) {
  // TODO: Look at source - use UserPool instead
  // https://github.com/aws-amplify/amplify-js/blob/master/packages/
  // amazon-cognito-identity-js/src/CognitoUser.js
  // This one is a bit more involved
  await new Promise<void>((resolve, reject) => {
    user.completeNewPasswordChallenge(password, [], {
      onSuccess() {
        resolve();
      },
      onFailure: reject,
    });
  });

  const authUser = await getUserData(user, parser);
  setInternalAuthState({
    type: "signedIn",
    user,
    authUser,
  });
  onSignIn?.(authUser);
}

export default requireNewPasswordComplete;
