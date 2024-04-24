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
  ICognitoStorage,
  NodeCallback,
  UserData,
} from "amazon-cognito-identity-js";
import { unknownToString } from "@dhau/lang-extras";
import invariant from "./invariant.ts";
import { isUserNotConfirmedException } from "./model/sign-in.ts";
import { AuthState } from "./state.ts";
import { InternalAuthState } from "./model/internal-state.ts";
import getCurrentUser, {
  getUserDataNoCache,
} from "./model/get-current-user.ts";
import sessionToAuthAccess, {
  AuthAccess,
} from "./model/session-to-auth-access.ts";
import {
  SignedInAuthState,
  createSignedInAuthState,
} from "./signed-in-auth-state.ts";
import {
  SignedOutAuthState,
  createSignedOutAuthState,
} from "./signed-out-auth-state.ts";

// Can't type this. context created on file load but user type provided on runtime.
const AuthContext = createContext<AuthState<any> | undefined>(undefined);

type AuthCognitoConfig = {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
};

type AuthProviderProps<TUser> = {
  readonly mfaDeviceName: string;
  readonly mfaIssuer: string;
  readonly parseUser: (data: UserData) => TUser;
  readonly cognitoConfig: AuthCognitoConfig;
  readonly children: ReactNode;
  readonly onSignIn?: (user: TUser & AuthAccess) => void;
  readonly storage?: ICognitoStorage;
};

function AuthProvider<TUser>({
  mfaIssuer,
  mfaDeviceName,
  cognitoConfig,
  children,
  parseUser: parseDomainUser,
  onSignIn,
  storage: providedStorage,
}: AuthProviderProps<TUser>) {
  const [internalAuthState, setInternalAuthState] = useState<
    InternalAuthState<TUser>
  >({
    type: "loading",
  });

  const parseUser = useCallback(
    (data: UserData, session: CognitoUserSession) => {
      return {
        ...parseDomainUser(data),
        ...sessionToAuthAccess(session),
      };
    },
    [parseDomainUser],
  );

  const storage = useMemo(
    () => providedStorage || window.localStorage,
    [providedStorage],
  );
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
        },
      ),
    [cognitoConfig, storage],
  );

  useEffect(() => {
    let waiting = true;
    (async () => {
      let current:
        | Awaited<ReturnType<typeof getCurrentUser<TUser>>>
        | undefined;
      try {
        current = await getCurrentUser(userPool, parseUser);
      } catch (e) {
        setInternalAuthState({
          type: "error",
          message: unknownToString(e),
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
      return createSignedInAuthState({
        mfaIssuer,
        authState: internalAuthState,
        setInternalAuthState,
        parseUser,
        refreshUser,
        mfaDeviceName,
      });
    }

    return createSignedOutAuthState({
      userPool,
      setInternalAuthState,
      internalAuthState,
      storage,
      parseUser,
      onSignIn,
    });
  }, [internalAuthState, storage, refreshUser, userPool]);
  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

function useAuthState<TUser>(): AuthState<TUser> {
  const context = useContext(AuthContext);
  invariant(context, "No Auth Context");
  return context;
}

function useSignedOutAuthState<TUser>(): SignedOutAuthState<TUser> {
  const state = useAuthState<TUser>();
  invariant(state.type === "signedOut", `Not signed out (was ${state.type})`);
  return state;
}

function useSignedInAuthState<TUser>(): SignedInAuthState<TUser> {
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
