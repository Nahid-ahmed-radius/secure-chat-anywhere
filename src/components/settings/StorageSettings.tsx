
import { useState } from "react";
import { useStorage } from "@/contexts/StorageContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StorageSettings as StorageSettingsType } from "@/types";

export function StorageSettings() {
  const { configureStorage, storageSettings, isInitialized, error } = useStorage();
  const [provider, setProvider] = useState<'google-drive' | 'amazon-s3' | 'azure-blob' | 'dropbox' | 'local'>(
    storageSettings?.provider || 'google-drive'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<any>(storageSettings?.credentials || {});
  const [rootFolder, setRootFolder] = useState(storageSettings?.rootFolder || "secure-messaging-app");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const settings: StorageSettingsType = {
        provider,
        credentials,
        rootFolder,
      };

      const success = await configureStorage(settings);
      if (!success) {
        setFormError("Failed to configure storage. Please check your credentials.");
      }
    } catch (err) {
      console.error("Storage configuration error:", err);
      setFormError("An error occurred while configuring storage");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different credential fields based on selected provider
  const renderCredentialFields = () => {
    switch (provider) {
      case 'google-drive':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                value={credentials.accessToken || ""}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                required
              />
            </div>
          </div>
        );

      case 'amazon-s3':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="accessKeyId">Access Key ID</Label>
              <Input
                id="accessKeyId"
                value={credentials.accessKeyId || ""}
                onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="secretAccessKey">Secret Access Key</Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={credentials.secretAccessKey || ""}
                onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={credentials.region || ""}
                onChange={(e) => setCredentials({ ...credentials, region: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bucket">Bucket</Label>
              <Input
                id="bucket"
                value={credentials.bucket || ""}
                onChange={(e) => setCredentials({ ...credentials, bucket: e.target.value })}
                required
              />
            </div>
          </div>
        );

      case 'azure-blob':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={credentials.accountName || ""}
                onChange={(e) => setCredentials({ ...credentials, accountName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="accountKey">Account Key</Label>
              <Input
                id="accountKey"
                type="password"
                value={credentials.accountKey || ""}
                onChange={(e) => setCredentials({ ...credentials, accountKey: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="containerName">Container Name</Label>
              <Input
                id="containerName"
                value={credentials.containerName || ""}
                onChange={(e) => setCredentials({ ...credentials, containerName: e.target.value })}
                required
              />
            </div>
          </div>
        );

      case 'dropbox':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                value={credentials.accessToken || ""}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                required
              />
            </div>
          </div>
        );

      case 'local':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Local storage will be used for development purposes only.
              No additional credentials are required.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Storage Configuration</CardTitle>
        <CardDescription>
          Connect your storage provider to store encrypted messages and files.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error || formError}
            </div>
          )}

          {isInitialized && (
            <div className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md text-sm">
              Storage is configured and connected successfully.
            </div>
          )}

          <div className="space-y-3">
            <Label>Storage Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) => setProvider(value as any)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google-drive" id="google-drive" />
                <Label htmlFor="google-drive" className="font-normal">
                  Google Drive
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amazon-s3" id="amazon-s3" />
                <Label htmlFor="amazon-s3" className="font-normal">
                  Amazon S3
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="azure-blob" id="azure-blob" />
                <Label htmlFor="azure-blob" className="font-normal">
                  Azure Blob Storage
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dropbox" id="dropbox" />
                <Label htmlFor="dropbox" className="font-normal">
                  Dropbox
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Storage Credentials</Label>
            {renderCredentialFields()}
          </div>

          <div className="space-y-1">
            <Label htmlFor="rootFolder">Root Folder/Prefix</Label>
            <Input
              id="rootFolder"
              value={rootFolder}
              onChange={(e) => setRootFolder(e.target.value)}
              placeholder="secure-messaging-app"
            />
            <p className="text-xs text-muted-foreground mt-1">
              All data will be stored within this folder or prefix in your storage provider.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connecting..." : "Connect Storage"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
