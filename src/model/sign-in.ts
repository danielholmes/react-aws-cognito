/* eslint-disable @typescript-eslint/naming-convention */
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  ICognitoStorage,
} from "amazon-cognito-identity-js";
import { InternalAuthStateSetter } from "./internal-state";
import { getUserData, UserParser } from "./get-current-user";

async function signIn<TUser>(
  setInternalAuthState: InternalAuthStateSetter<TUser>,
  {
    userPool,
    storage,
  }: { userPool: CognitoUserPool; storage: ICognitoStorage },
  parseUser: UserParser<TUser>,
  email: string,
  password: string
): Promise<"success" | "newPassword"> {
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });
  const user = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: storage,
  });
  const result = await new Promise<"success" | "newPassword">(
    (resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess() {
          resolve("success");
        },
        onFailure: reject,
        newPasswordRequired() {
          setInternalAuthState({
            type: "newPassword",
            user,
          });
          resolve("newPassword");
        },
      });
    }
  );
  if (result === "success") {
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
