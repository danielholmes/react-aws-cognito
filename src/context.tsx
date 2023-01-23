import {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  CognitoUserPool,
  CognitoUserSession,
  NodeCallback,
} from "amazon-cognito-identity-js";
import { omit, partial } from "lodash-es";
import { sub, isFuture } from "date-fns";
import invariant from "tiny-invariant";
import { caughtResultToString } from "@dhau/lang";
import signIn, { isUserNotConfirmedException } from "./model/sign-in";
import requireNewPasswordComplete from "./model/require-new-password-complete";
import { AuthState, SignedInAuthState, SignedOutAuthState } from "./state";
import { InternalAuthState } from "./model/internal-state";
import getCurrentUser, {
  getUserDataNoCache,
  UserParser,
} from "./model/get-current-user";
import forgotPassword from "./model/forgot-password";
import changePassword from "./model/change-password";
import confirmForgotPassword from "./model/confirm-forgot-password";
import sessionToAuthAccess, {
  AuthAccess,
} from "./model/session-to-auth-access";
import refreshSession from "./model/refresh-session";
import signUp from "./model/sign-up";
import confirmSignUp from "./model/confirm-sign-up";
import resendConfirmation from "./model/resend-confirmation";
import resendEmailAddressVerification from "./model/resend-email-address-verification";
import verifyEmailAddress from "./model/verify-email-address";

// Can't type this. context created on file load but user type provided on runtime.
const AuthContext = createContext<AuthState<any> | undefined>(undefined);

type AuthCognitoConfig = {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
};

type AuthProviderProps<TUser extends AuthAccess> = {
  readonly parseUser: UserParser<TUser>;
  readonly cognitoConfig: AuthCognitoConfig;
  readonly children: ReactNode;
};

const storage = window.localStorage;

function AuthProvider<TUser extends AuthAccess>({
  cognitoConfig,
  children,
  parseUser,
}: AuthProviderProps<TUser>) {
  const [internalAuthState, setInternalAuthState] = useState<
    InternalAuthState<TUser>
  >({
    type: "loading",
  });

  const userPool = useMemo(
    () =>
      new CognitoUserPool(
        {
          UserPoolId: cognitoConfig.userPoolId,
          ClientId: cognitoConfig.userPoolClientId,
          Storage: storage,
        },
        (callback: NodeCallback.Any) => (error, data: CognitoUserSession) => {
          if (!error && data) {
            const newAccess = sessionToAuthAccess(data);
            setInternalAuthState((previous) => {
              // Internal state has changed while refreshing token
              if (previous.type !== "signedIn") {
                return previous;
              }

              return {
                ...previous,
                authUser: {
                  ...previous.authUser,
                  ...newAccess,
                },
              };
            });
          }

          callback(error, data);
        }
      ),
    [cognitoConfig]
  );

  useEffect(() => {
    let waiting = true;
    (async () => {
      let current;
      try {
        current = await getCurrentUser(userPool, parseUser);
      } catch (e) {
        setInternalAuthState({
          type: "error",
          message: caughtResultToString(e),
        });
      }
      if (!waiting) {
        return;
      }

      if (!current) {
        setInternalAuthState({
          type: "signedOut",
        });
        return;
      }

      const { cognitoUser, authUser: newAuthUser } = current;
      setInternalAuthState({
        type: "signedIn",
        user: cognitoUser,
        authUser: newAuthUser,
      });
    })();

    return () => {
      waiting = false;
    };
  }, [userPool]);

  const refreshUser = useCallback(async () => {
    if (internalAuthState.type !== "signedIn") {
      return;
    }

    const { user } = internalAuthState;
    const authUser = await getUserDataNoCache(user, parseUser);
    setInternalAuthState({
      type: "signedIn",
      user,
      authUser,
    });
  }, [internalAuthState]);

  const authState = useMemo((): AuthState<TUser> => {
    if (
      internalAuthState.type === "loading" ||
      internalAuthState.type === "error"
    ) {
      return internalAuthState;
    }

    if (internalAuthState.type === "signedIn") {
      const { authUser, user } = internalAuthState;
      return {
        type: "signedIn",
        async getValidAccessToken() {
          const { accessToken, accessExpiration, refreshToken } = authUser;
          const refreshTime = sub(accessExpiration, { minutes: 3 });

          // Refresh time in the future, use current access token.
          if (isFuture(refreshTime)) {
            return accessToken;
          }

          // New token is applied via CognitoUserPool refresh callback, but return the new
          // refreshed token for immediate use.
          return refreshSession(user, refreshToken);
        },
        signOut() {
          user.signOut();
          setInternalAuthState({
            type: "signedOut",
          });
        },
        user: omit(authUser, "refreshToken", "accessToken", "accessExpiration"),
        changePassword: partial(changePassword, user),
        refreshUser,
        verifyEmailAddress: partial(
          verifyEmailAddress,
          setInternalAuthState,
          parseUser,
          user
        ),
        resendEmailAddressVerification: partial(
          resendEmailAddressVerification,
          user
        ),
      };
    }

    return {
      type: "signedOut",
      signIn: partial(
        signIn,
        setInternalAuthState,
        { userPool, storage },
        parseUser
      ),
      signUp: partial(signUp, userPool),
      confirmSignUp: partial(confirmSignUp, userPool, storage),
      resendConfirmation: partial(resendConfirmation, userPool, storage),
      forgotPassword: partial(forgotPassword, { userPool, storage }),
      confirmForgotPassword: partial(confirmForgotPassword, {
        userPool,
        storage,
      }),
      requireNewPasswordComplete:
        internalAuthState.type === "newPassword"
          ? partial(
              requireNewPasswordComplete,
              setInternalAuthState,
              parseUser,
              internalAuthState.user
            )
          : undefined,
    };
  }, [internalAuthState, refreshUser, userPool]);
  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

function useAuthState<TUser extends AuthAccess>(): AuthState<TUser> {
  const context = useContext(AuthContext);
  invariant(context, "No Auth Context");
  return context;
}

function useSignedOutAuthState(): SignedOutAuthState {
  const state = useAuthState();
  invariant(state.type === "signedOut", `Not signed out (was ${state.type})`);
  return state;
}

function useSignedInAuthState<
  TUser extends AuthAccess
>(): SignedInAuthState<TUser> {
  const state = useAuthState<TUser>();
  invariant(state.type === "signedIn", `Not signed in (was ${state.type})`);
  return state;
}

export type { AuthCognitoConfig };
export {
  isUserNotConfirmedException,
  useAuthState,
  AuthProvider,
  useSignedInAuthState,
  useSignedOutAuthState,
};
