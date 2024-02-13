/* eslint-disable @typescript-eslint/naming-convention */
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  ICognitoStorage,
} from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state";
import { getUserData, UserParser } from "./get-current-user";

type SignInResult =
  | {
      readonly type: "success";
      readonly accessToken: string;
      readonly signOut: () => Promise<void>;
    }
  | {
      readonly type: "newPassword";
      readonly signOut: () => Promise<void>;
    }
  | {
      readonly type: "mfa";
      readonly signOut: () => Promise<void>;
    };

async function signIn<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  {
    userPool,
    storage,
  }: { userPool: CognitoUserPool; storage: ICognitoStorage },
  parseUser: UserParser<TUser>,
  email: string,
  password: string,
) {
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });
  const user = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: storage,
  });

  const signOut = async () => {
    await new Promise<void>((resolve) => {
      user.signOut(resolve);
    });
    setInternalAuthState({
      type: "signedOut",
    });
  };

  const result = await new Promise<SignInResult>((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve({
          type: "success",
          accessToken: session.getAccessToken().getJwtToken(),
          signOut,
        });
      },
      onFailure: reject,
      newPasswordRequired() {
        setInternalAuthState({
          type: "newPassword",
          user,
        });
        resolve({ type: "newPassword", signOut });
      },
      totpRequired() {
        setInternalAuthState({
          type: "mfaRequired",
          user,
        });
        resolve({ type: "mfa", signOut });
      },
    });
  });
  if (result.type === "success") {
    const authUser = await getUserData(user, parseUser);
    setInternalAuthState({
      type: "signedIn",
      user,
      authUser,
    });
  }

  return result;
}

function isUserNotConfirmedException(error: unknown) {
  return (
    typeof error === "object" &&
    !!error &&
    (error as any).name === "UserNotConfirmedException"
  );
}

export { isUserNotConfirmedException };
export default signIn;
