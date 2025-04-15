
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate("/chat");
    }
  }, [authState.isAuthenticated]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 bg-background border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-app-primary">SecureTalk</h1>
            <span className="bg-app-accent/20 text-app-accent text-xs px-2 py-1 rounded-full">
              E2EE
            </span>
          </div>
          <div className="space-x-2">
            <a 
              href="/login" 
              className="text-sm font-medium text-app-primary hover:underline"
            >
              Login
            </a>
            <a 
              href="/signup"
              className="text-sm font-medium bg-app-primary text-white px-4 py-2 rounded-md hover:bg-app-accent transition-colors"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-16 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Storage-Agnostic <span className="text-app-primary">End-to-End Encrypted</span> Messaging Platform
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Secure communication with zero infrastructure cost. Connect your own cloud storage and take control of your data.
              </p>
              <div className="space-x-4">
                <a 
                  href="/signup"
                  className="px-6 py-3 text-white font-medium bg-app-primary rounded-lg hover:bg-app-accent transition-colors inline-block"
                >
                  Get Started
                </a>
                <a 
                  href="#features"
                  className="px-6 py-3 text-app-primary font-medium bg-transparent border border-app-primary rounded-lg hover:bg-app-primary/5 transition-colors inline-block"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <LoginForm />
            </div>
          </div>
        </section>
        
        <section id="features" className="py-16 px-6 bg-white dark:bg-gray-800">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Zero Server Cost</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Fully client-hosted deployment with no centralized backend from the platform provider.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Storage-Agnostic</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Support for multiple storage providers including Google Drive, Azure Blob Storage, and Amazon S3.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">End-to-End Encryption</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  True E2EE for all messages and files with asymmetric key-pair generation and local-first message cache.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Flexible Pricing</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-app-success">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">Startup</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Up to 10 team members</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-success shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">All messaging features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-success shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">5 GB storage per user</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-success shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">15 days message history</span>
                  </li>
                </ul>
                <a 
                  href="/signup"
                  className="block text-center py-2 px-4 bg-app-success text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Get Started
                </a>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transform md:scale-105 border-t-4 border-app-primary">
                <div className="absolute -top-3 right-4">
                  <span className="bg-app-primary text-white text-xs px-2 py-1 rounded-full">Popular</span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">SMB</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Up to 50 team members</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-primary shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">All messaging features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-primary shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">20 GB storage per user</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-primary shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">90 days message history</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-primary shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Priority support</span>
                  </li>
                </ul>
                <a 
                  href="/signup"
                  className="block text-center py-2 px-4 bg-app-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Get Started
                </a>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-app-accent">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">Enterprise</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Unlimited team members</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-accent shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">All messaging features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-accent shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">100 GB storage per user</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-accent shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Unlimited message history</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-accent shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Dedicated support</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-app-accent shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Custom deployment options</span>
                  </li>
                </ul>
                <a 
                  href="/signup"
                  className="block text-center py-2 px-4 bg-app-accent text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">SecureTalk</h2>
            <p className="text-sm">
              End-to-end encrypted messaging platform with zero infrastructure cost and storage-agnostic integration.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4 text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: info@securetalk.com</li>
              <li>Twitter: @securetalk</li>
              <li>GitHub: github.com/securetalk</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          © {new Date().getFullYear()} SecureTalk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
