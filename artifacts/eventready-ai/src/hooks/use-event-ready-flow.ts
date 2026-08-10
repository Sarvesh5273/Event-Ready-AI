import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateSession,
  useStartSessionAnalysis,
  useGetSessionStatus,
  getGetSessionStatusQueryKey,
  useGetSessionReport,
  getGetSessionReportQueryKey,
} from "@workspace/api-client-react";
import type { StyleVibe, BudgetTier, Session, EventReadyReport } from "@workspace/api-client-react";

export type FlowScreen = "start" | "preferences" | "photo" | "processing" | "results";

export interface UploadedPhotos {
  selfieFile: File | null;
  fullBodyFile: File | null;
  selfiePreviewUrl: string | null;
  fullBodyPreviewUrl: string | null;
}

const POLL_INTERVAL_MS = 3000;

/** Orders session states so out-of-order poll responses never move state backwards. */
function progressRank(s: Session): number {
  if (s.status === "ready" || s.status === "error") return 1000;
  if (s.status === "processing") return 10 + s.currentStep;
  return 0; // "created"
}

/**
 * Owns the entire EventReady session lifecycle: screen navigation,
 * preferences, the demo-vs-live decision, session token bookkeeping, and
 * the processing poll loop. Screens are presentational — they read state
 * and call the actions returned here.
 */
export function useEventReadyFlow() {
  const [screen, setScreen] = useState<FlowScreen>("start");
  const [styleVibe, setStyleVibe] = useState<StyleVibe>("bold");
  const [budgetTier, setBudgetTier] = useState<BudgetTier>("mid");
  const [wantsDemoPersona, setWantsDemoPersona] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhotos>({
    selfieFile: null,
    fullBodyFile: null,
    selfiePreviewUrl: null,
    fullBodyPreviewUrl: null,
  });
  const [session, setSession] = useState<Session | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  // The token changes as the session progresses (created -> processing ->
  // ready/error); always send the most recently received one.
  const sessionTokenRef = useRef<string | null>(null);

  const isDemoMode = session?.mode === "demo";

  const createSession = useCreateSession();
  const startAnalysis = useStartSessionAnalysis();

  const statusQuery = useGetSessionStatus(session?.sessionId ?? "", {
    query: {
      enabled: Boolean(session?.sessionId) && screen === "processing",
      queryKey: getGetSessionStatusQueryKey(session?.sessionId ?? ""),
      refetchInterval: (query) => {
        const data = query.state.data as Session | undefined;
        if (!data) return POLL_INTERVAL_MS;
        // Keep polling through "created" (analyze may not have started yet)
        // and "processing"; only stop once we reach a terminal state.
        return data.status === "ready" || data.status === "error" ? false : POLL_INTERVAL_MS;
      },
    },
    request: {
      headers: sessionTokenRef.current ? { token: sessionTokenRef.current } : undefined,
    },
  });

  // Keep the latest token + session snapshot in sync as polling progresses.
  // Status responses can resolve out of order (e.g. a poll dispatched right
  // after session creation can resolve after the analyze call already moved
  // the session to "processing"). Since each response's token fully encodes
  // that response's state, blindly applying every response can clobber
  // further-along state with a stale one. Guard by only ever moving forward.
  const latestStatus = statusQuery.data;
  useEffect(() => {
    if (latestStatus && screen === "processing") {
      setSession((prev) => {
        if (prev && progressRank(prev) > progressRank(latestStatus)) {
          return prev;
        }
        sessionTokenRef.current = latestStatus.sessionToken;
        return latestStatus;
      });
    }
  }, [latestStatus, screen]);

  const reportQuery = useGetSessionReport(session?.sessionId ?? "", {
    query: {
      enabled: Boolean(session?.sessionId) && session?.status === "ready",
      queryKey: getGetSessionReportQueryKey(session?.sessionId ?? ""),
    },
    request: {
      headers: sessionTokenRef.current ? { token: sessionTokenRef.current } : undefined,
    },
  });

  const goToStart = useCallback(() => {
    setScreen("start");
    setFlowError(null);
  }, []);

  const startFlow = useCallback(() => {
    setWantsDemoPersona(false);
    setFlowError(null);
    setScreen("preferences");
  }, []);

  const startFlowWithDemoPersona = useCallback(() => {
    setWantsDemoPersona(true);
    setFlowError(null);
    setScreen("preferences");
  }, []);

  const confirmPreferences = useCallback(() => {
    if (wantsDemoPersona) {
      beginSession("demo");
    } else {
      setScreen("photo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsDemoPersona, styleVibe, budgetTier]);

  const setSelfieFile = useCallback((file: File | null) => {
    setPhotos((prev) => {
      if (prev.selfiePreviewUrl) URL.revokeObjectURL(prev.selfiePreviewUrl);
      return {
        ...prev,
        selfieFile: file,
        selfiePreviewUrl: file ? URL.createObjectURL(file) : null,
      };
    });
  }, []);

  const setFullBodyFile = useCallback((file: File | null) => {
    setPhotos((prev) => {
      if (prev.fullBodyPreviewUrl) URL.revokeObjectURL(prev.fullBodyPreviewUrl);
      return {
        ...prev,
        fullBodyFile: file,
        fullBodyPreviewUrl: file ? URL.createObjectURL(file) : null,
      };
    });
  }, []);

  const useDemoPersonaFromPhotoScreen = useCallback(() => {
    setWantsDemoPersona(true);
    beginSession("demo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleVibe, budgetTier]);

  const continueFromPhotos = useCallback(() => {
    beginSession("live");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleVibe, budgetTier]);

  function beginSession(mode: "demo" | "live") {
    setFlowError(null);
    createSession.mutate(
      { data: { mode, preferences: { occasion: "wedding_guest", styleVibe, budgetTier } } },
      {
        onSuccess: (created) => {
          // Don't move to the Processing screen (and don't enable status
          // polling) until analyze has actually started: otherwise a status
          // poll can race the analyze call and briefly return, then get
          // treated as, this same still-"created" state forever.
          sessionTokenRef.current = created.sessionToken;
          startAnalysis.mutate(
            { sessionId: created.sessionId, data: { sessionToken: created.sessionToken } },
            {
              onSuccess: (started) => {
                sessionTokenRef.current = started.sessionToken;
                setSession(started);
                setScreen("processing");
              },
              onError: () => {
                setFlowError("Something went wrong starting your session. Please try again.");
              },
            },
          );
        },
        onError: () => {
          setFlowError("Something went wrong creating your session. Please try again.");
        },
      },
    );
  }

  const retryWithDemoPersona = useCallback(() => {
    setWantsDemoPersona(true);
    beginSession("demo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleVibe, budgetTier]);

  const restart = useCallback(() => {
    setScreen("start");
    setWantsDemoPersona(false);
    setSession(null);
    setFlowError(null);
    sessionTokenRef.current = null;
    setPhotos((prev) => {
      if (prev.selfiePreviewUrl) URL.revokeObjectURL(prev.selfiePreviewUrl);
      if (prev.fullBodyPreviewUrl) URL.revokeObjectURL(prev.fullBodyPreviewUrl);
      return { selfieFile: null, fullBodyFile: null, selfiePreviewUrl: null, fullBodyPreviewUrl: null };
    });
  }, []);

  // Once the session reaches "ready", move to the results screen.
  useEffect(() => {
    if (session?.status === "ready" && screen === "processing") {
      setScreen("results");
    }
  }, [session?.status, screen]);

  const report = reportQuery.data as EventReadyReport | undefined;

  return useMemo(
    () => ({
      screen,
      styleVibe,
      setStyleVibe,
      budgetTier,
      setBudgetTier,
      wantsDemoPersona,
      photos,
      setSelfieFile,
      setFullBodyFile,
      session,
      isDemoMode,
      flowError: flowError ?? session?.errorMessage ?? null,
      isCreatingSession: createSession.isPending || startAnalysis.isPending,
      report,
      isLoadingReport: reportQuery.isLoading,
      reportError: reportQuery.isError,
      goToStart,
      startFlow,
      startFlowWithDemoPersona,
      confirmPreferences,
      useDemoPersonaFromPhotoScreen,
      continueFromPhotos,
      retryWithDemoPersona,
      restart,
    }),
    [
      screen,
      styleVibe,
      budgetTier,
      wantsDemoPersona,
      photos,
      session,
      isDemoMode,
      flowError,
      createSession.isPending,
      startAnalysis.isPending,
      report,
      reportQuery.isLoading,
      reportQuery.isError,
      goToStart,
      startFlow,
      startFlowWithDemoPersona,
      confirmPreferences,
      useDemoPersonaFromPhotoScreen,
      continueFromPhotos,
      retryWithDemoPersona,
      restart,
      setSelfieFile,
      setFullBodyFile,
    ],
  );
}
