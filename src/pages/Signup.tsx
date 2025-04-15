
import { SignupForm } from "@/components/auth/SignupForm";

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-app-primary tracking-tight">SecureTalk</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your account to start secure messaging
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
