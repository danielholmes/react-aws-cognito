import { CognitoUser } from "amazon-cognito-identity-js";
import { AuthAccess } from "./session-to-auth-access";

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

type InternalAuthState<TUser> =
  | LoadingInternalAuthState
  | ErrorInternalAuthState
  | SignedInInternalAuthState<TUser>
  | SignedOutInternalAuthState
  | NewPasswordInternalAuthState;

type InternalAuthStateSetter<TUser> = (
  state: InternalAuthState<TUser & AuthAccess>,
) => void;

export type {
  InternalAuthState,
  NewPasswordInternalAuthState,
  SignedOutInternalAuthState,
  SignedInInternalAuthState,
  InternalAuthStateSetter,
};
