import { CognitoUser } from "amazon-cognito-identity-js";
import { getUserDataNoCache, UserParser } from "./get-current-user";
import { InternalAuthStateSetter } from "./internal-state";
import { AuthAccess } from "./session-to-auth-access";

async function verifyEmailAddress<TUser extends AuthAccess>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parseUser: UserParser<TUser>,
  user: CognitoUser,
  code: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    user.verifyAttribute("email", code, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });

  const authUser = await getUserDataNoCache(user, parseUser);
  setInternalAuthState({
    type: "signedIn",
    user,
    authUser,
  });
}

export default verifyEmailAddress;
