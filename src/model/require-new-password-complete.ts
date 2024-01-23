import { CognitoUser } from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state";
import { getUserData, UserParser } from "./get-current-user";
import { AuthAccess } from "./session-to-auth-access";

async function requireNewPasswordComplete<TUser extends AuthAccess>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parser: UserParser<TUser>,
  user: CognitoUser,
  password: string,
): Promise<void> {
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
}

export default requireNewPasswordComplete;
