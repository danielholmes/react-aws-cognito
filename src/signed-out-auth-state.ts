import { CognitoUserPool } from "amazon-cognito-identity-js";
import { partial } from "lodash-es";
import signUp from "./model/sign-up";
import confirmSignUp from "./model/confirm-sign-up";
import resendConfirmation from "./model/resend-confirmation";
import requireNewPasswordComplete from "./model/require-new-password-complete";
import forgotPassword from "./model/forgot-password";
import confirmForgotPassword from "./model/confirm-forgot-password";
import {
  SignedOutInternalAuthState,
  NewPasswordInternalAuthState,
  InternalAuthStateSetter,
  MfaRequiredInternalAuthState,
} from "./model/internal-state";
import { UserParser } from "./model/get-current-user";
import signIn from "./model/sign-in";
import requireMfaComplete from "./model/require-mfa-complete";

type Options<TUser> = {
  readonly userPool: CognitoUserPool;
  readonly storage: Storage;
  readonly internalAuthState:
    | SignedOutInternalAuthState
    | MfaRequiredInternalAuthState
    | NewPasswordInternalAuthState;
  readonly setInternalAuthState: InternalAuthStateSetter<TUser>;
  readonly parseUser: UserParser<TUser>;
};

function createSignedOutAuthState<TUser>({
  internalAuthState,
  userPool,
  setInternalAuthState,
  parseUser,
  storage,
}: Options<TUser>) {
  return {
    type: "signedOut" as const,
    signIn: partial(
      signIn,
      setInternalAuthState,
      { userPool, storage },
      parseUser,
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
          )
        : undefined,
    requireNewPasswordComplete:
      internalAuthState.type === "newPassword"
        ? partial(
            requireNewPasswordComplete,
            setInternalAuthState,
            parseUser,
            internalAuthState.user,
          )
        : undefined,
  };
}

type SignedOutAuthState<TUser> = ReturnType<
  typeof createSignedOutAuthState<TUser>
>;

export type { SignedOutAuthState };
export { createSignedOutAuthState };
