import { SignedInAuthState, MfaCodeInfo } from "./signed-in-auth-state.ts";
import { SignedOutAuthState } from "./signed-out-auth-state.ts";

type LoadingAuthState = {
  readonly type: "loading";
};

type ErrorAuthState = {
  readonly type: "error";
  readonly message: string;
};

type SignUpVariables = {
  readonly emailAddress: string;
  readonly password: string;
  readonly extraAttributes?: Record<string, string>;
};

type AuthState<TUser> =
  | LoadingAuthState
  | ErrorAuthState
  | SignedInAuthState<TUser>
  | SignedOutAuthState<TUser>;

export type { MfaCodeInfo, AuthState, SignUpVariables };
