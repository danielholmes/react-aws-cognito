import { CognitoUser } from "amazon-cognito-identity-js";
import { AuthAccess } from "./session-to-auth-access.ts";

type LoadingInternalAuthState = {
  readonly type: "loading";
};

type ErrorInternalAuthState = {
  readonly type: "error";
  readonly message: string;
};

type SignedOutInternalAuthState = {
  readonly type: "signedOut";
};

type SignedInInternalAuthState<TUser> = {
  readonly type: "signedIn";
  readonly user: CognitoUser;
  readonly authUser: TUser & AuthAccess;
};

type NewPasswordInternalAuthState = {
  readonly type: "newPassword";
  readonly user: CognitoUser;
};

type MfaRequiredInternalAuthState = {
  readonly type: "mfaRequired";
  readonly user: CognitoUser;
};

type InternalAuthState<TUser> =
  | LoadingInternalAuthState
  | ErrorInternalAuthState
  | SignedInInternalAuthState<TUser>
  | SignedOutInternalAuthState
  | NewPasswordInternalAuthState
  | MfaRequiredInternalAuthState;

type InternalAuthStateSetter<TUser> = (
  state: InternalAuthState<TUser & AuthAccess>,
) => void;

export type {
  InternalAuthState,
  NewPasswordInternalAuthState,
  SignedOutInternalAuthState,
  MfaRequiredInternalAuthState,
  SignedInInternalAuthState,
  InternalAuthStateSetter,
};
