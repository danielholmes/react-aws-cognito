import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  ICognitoStorage,
} from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state.ts";
import { getUserData, UserParser } from "./get-current-user.ts";
import { AuthAccess } from "./session-to-auth-access.ts";

type SignInResult<TUser> =
  | {
      readonly type: "success";
      readonly signOut: () => Promise<void>;
      readonly authUser: TUser & AuthAccess;
    }
  | {
      readonly type: "newPassword";
      readonly signOut: () => Promise<void>;
    }
  | {
      readonly type: "mfa";
      readonly signOut: () => Promise<void>;
    };

type Services = {
  readonly userPool: CognitoUserPool;
  readonly storage: ICognitoStorage;
};

type Options<TUser> = {
  readonly onSignIn: ((user: TUser & AuthAccess) => void) | undefined;
};

async function signIn<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  { userPool, storage }: Services,
  parseUser: UserParser<TUser>,
  { onSignIn }: Options<TUser>,
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

  const result = await new Promise<SignInResult<TUser>>((resolve, reject) => {
    user.authenticateUser(authDetails, {
      async onSuccess() {
        const authUser = await getUserData(user, parseUser);
        resolve({
          type: "success",
          signOut,
          authUser,
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
    setInternalAuthState({
      type: "signedIn",
      user,
      authUser: result.authUser,
    });
    onSignIn?.(result.authUser);
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
