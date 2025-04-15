
import { StorageSettings } from "@/components/settings/StorageSettings";

export default function StorageSetup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-app-primary tracking-tight">Storage Configuration</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect your storage provider to use with the secure messaging platform
          </p>
        </div>
        <StorageSettings />
      </div>
    </div>
  );
}
