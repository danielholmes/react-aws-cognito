import { AuthAccess } from "./model/session-to-auth-access";

type LoadingAuthState = {
  readonly type: "loading";
};

type ErrorAuthState = {
  readonly type: "error";
  readonly message: string;
};

type SignedInAuthState<TUser> = {
  readonly type: "signedIn";
  readonly user: Omit<TUser, keyof AuthAccess>;
  readonly getValidAccessToken: () => Promise<string>;
  readonly resendEmailAddressVerification: () => Promise<void>;
  readonly signOut: () => void;
  readonly refreshUser: () => Promise<void>;
  readonly verifyEmailAddress: (code: string) => Promise<void>;
  readonly changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
};

type SignInResult =
  | { readonly type: "success"; readonly accessToken: string }
  | { readonly type: "newPassword" };

type SignUpVariables = {
  readonly emailAddress: string;
  readonly password: string;
  readonly extraAttributes?: Record<string, string>;
};

type SignedOutAuthState = {
  readonly type: "signedOut";
  readonly signIn: (email: string, password: string) => Promise<SignInResult>;
  readonly signUp: (variables: SignUpVariables) => Promise<void>;
  readonly confirmSignUp: (emailAddress: string, code: string) => Promise<void>;
  readonly resendConfirmation: (emailAddress: string) => Promise<void>;
  readonly forgotPassword: (email: string) => Promise<void>;
  readonly confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  readonly requireNewPasswordComplete?: (password: string) => Promise<void>;
};

type AuthState<TUser> =
  | LoadingAuthState
  | ErrorAuthState
  | SignedInAuthState<TUser>
  | SignedOutAuthState;

export type {
  AuthState,
  SignUpVariables,
  SignedInAuthState,
  SignedOutAuthState,
};
