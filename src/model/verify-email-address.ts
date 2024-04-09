import { CognitoUser } from "amazon-cognito-identity-js";
import { getUserDataNoCache, UserParser } from "./get-current-user";
import { InternalAuthStateSetter } from "./internal-state";

async function verifyEmailAddress<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  parseUser: UserParser<TUser>,
  user: CognitoUser,
  code: string,
) {
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
