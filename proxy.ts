import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import {
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
} from "@/lib/clerk-routes"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/room(.*)",
  "/join(.*)",
  "/onboarding",
])

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect()
    }
  },
  {
    signInUrl: CLERK_SIGN_IN_PATH,
    signUpUrl: CLERK_SIGN_UP_PATH,
  },
)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
