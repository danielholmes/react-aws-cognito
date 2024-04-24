import { CognitoUserPool, ICognitoStorage } from "amazon-cognito-identity-js";
import { partial } from "lodash-es";
import signUp from "./model/sign-up.ts";
import confirmSignUp from "./model/confirm-sign-up.ts";
import resendConfirmation from "./model/resend-confirmation.ts";
import requireNewPasswordComplete from "./model/require-new-password-complete.ts";
import forgotPassword from "./model/forgot-password.ts";
import confirmForgotPassword from "./model/confirm-forgot-password.ts";
import {
  SignedOutInternalAuthState,
  NewPasswordInternalAuthState,
  InternalAuthStateSetter,
  MfaRequiredInternalAuthState,
} from "./model/internal-state.ts";
import { UserParser } from "./model/get-current-user.ts";
import signIn from "./model/sign-in.ts";
import requireMfaComplete from "./model/require-mfa-complete.ts";
import { AuthAccess } from "./model/session-to-auth-access.ts";

type Options<TUser> = {
  readonly userPool: CognitoUserPool;
  readonly storage: ICognitoStorage;
  readonly internalAuthState:
    | SignedOutInternalAuthState
    | MfaRequiredInternalAuthState
    | NewPasswordInternalAuthState;
  readonly setInternalAuthState: InternalAuthStateSetter<TUser>;
  readonly parseUser: UserParser<TUser>;
  readonly onSignIn: ((user: TUser & AuthAccess) => void) | undefined;
};

function createSignedOutAuthState<TUser>({
  internalAuthState,
  userPool,
  setInternalAuthState,
  parseUser,
  storage,
  onSignIn,
}: Options<TUser>) {
  return {
    type: "signedOut" as const,
    signIn: partial(
      signIn,
      setInternalAuthState,
      { userPool, storage },
      parseUser,
      { onSignIn },
    ),
    signUp: partial(signUp, userPool),
    confirmSignUp: partial(confirmSignUp, userPool, storage),
    resendConfirmation: partial(resendConfirmation, userPool, storage),
    forgotPassword: partial(forgotPassword, { userPool, storage }),
    confirmForgotPassword: partial(confirmForgotPassword, {
      userPool,
      storage,
    }),
    requireMfaComplete:
      internalAuthState.type === "mfaRequired"
        ? partial(
            requireMfaComplete,
            setInternalAuthState,
            parseUser,
            internalAuthState.user,
            { onSignIn },
          )
        : undefined,
    requireNewPasswordComplete:
      internalAuthState.type === "newPassword"
        ? partial(
            requireNewPasswordComplete,
            setInternalAuthState,
            parseUser,
            internalAuthState.user,
            { onSignIn },
          )
        : undefined,
  };
}

type SignedOutAuthState<TUser> = ReturnType<
  typeof createSignedOutAuthState<TUser>
>;

export type { SignedOutAuthState };
export { createSignedOutAuthState };
