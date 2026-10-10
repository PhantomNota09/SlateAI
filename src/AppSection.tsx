import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./core/components/Toast";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { ChooseUsernamePage } from "./features/auth/components/ChooseUsernamePage";
import { ForgotPasswordPage } from "./features/auth/components/ForgotPasswordPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { SignInPage } from "./features/auth/components/SignInPage";
import { SignUpPage } from "./features/auth/components/SignUpPage";
import { FriendProfilePage } from "./features/friends/components/FriendProfilePage";
import { FriendsPage } from "./features/friends/components/FriendsPage";
import { HistoryPage } from "./features/history/components/HistoryPage";
import { InsightsPage } from "./features/insights/components/InsightsPage";
import { LetterboxdImportProvider } from "./features/letterboxd/context/LetterboxdImportContext";
import { LetterboxdPage } from "./features/letterboxd/components/LetterboxdPage";
import { OnboardingPage } from "./features/onboarding/components/OnboardingPage";
import { PreferencesPage } from "./features/preferences/components/PreferencesPage";
import { ProfilePage } from "./features/profile/components/ProfilePage";
import { RecommendationsPage } from "./features/recommendations/components/RecommendationsPage";
import { WatchLaterPage } from "./features/watchLater/components/WatchLaterPage";
import "./core/theme/tokens.css";

// Everything under /app/*. Loaded lazily from App.jsx so the marketing pages never download
// Firebase or any app code; visitors fetch this chunk only when they open the web app.
export default function AppSection() {
  // Signed-in app screens shouldn't show up in search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <LetterboxdImportProvider>
          <div className="slate-app">
            <Routes>
              <Route path="sign-in" element={<SignInPage />} />
              <Route path="sign-up" element={<SignUpPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="choose-username" element={<ChooseUsernamePage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="watch-later" element={<WatchLaterPage />} />
              <Route path="preferences" element={<PreferencesPage />} />
              <Route path="friends" element={<FriendsPage />} />
              <Route path="friends/:uid" element={<FriendProfilePage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="letterboxd" element={<LetterboxdPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/history" element={<HistoryPage />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Navigate to="/app/recommendations" replace />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </LetterboxdImportProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
