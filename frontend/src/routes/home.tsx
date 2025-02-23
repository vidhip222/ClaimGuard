import { createRoute, useRouter } from "@tanstack/react-router";
import { rootRoute } from "./root";
import {
  Shield,
  FileCheck,
  Camera,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import Navbar from "../components/navbar";

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => rootRoute,
  component: LandingPage,
});

export default function LandingPage() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.claim.$put();
      return await res.json();
    },
    onSuccess: ({ id }) => {
      router.navigate({
        to: "/claim/$id",
        params: { id },
      });
    },
  });
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Navbar/>
      <main className="flex-grow">
        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Revolutionizing Insurance Claims
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Intelligent damage assessment and fraud detection for faster,
              fairer claims processing.
            </p>
            <button
              onClick={() => mutation.mutate()}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg text-lg font-semibold transition duration-300 hover:bg-gray-100 disabled:bg-gray-300"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Get Started"}
            </button>
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<FileCheck className="h-12 w-12 mb-4 text-blue-600" />}
                title="Document Analysis"
                description="AI-powered analysis of legal documents to detect inconsistencies and potential fraud."
              />
              <FeatureCard
                icon={<Camera className="h-12 w-12 mb-4 text-blue-600" />}
                title="Visual Damage Assessment"
                description="Advanced image and video processing to accurately assess property damage."
              />
              <FeatureCard
                icon={<DollarSign className="h-12 w-12 mb-4 text-blue-600" />}
                title="Real-time Cost Estimation"
                description="Dynamic pricing integration for accurate, up-to-date damage cost estimates."
              />
              <FeatureCard
                icon={
                  <AlertTriangle className="h-12 w-12 mb-4 text-blue-600" />
                }
                title="Fraud Detection"
                description="Multi-modal analysis to identify potential fraudulent claims and inconsistencies."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <Step number={1} title="Submit Claim">
                Upload documents, photos, and videos of the damage. Provide an
                interview about the incident.
              </Step>
              <Step number={2} title="AI Analysis">
                Our advanced AI analyzes all submitted materials for damage
                assessment and fraud detection.
              </Step>
              <Step number={3} title="Cost Estimation">
                Real-time cost analysis based on current market rates and
                regional factors.
              </Step>
              <Step number={4} title="Compensation Calculation">
                Determine fair compensation based on policy, claim history, and
                current circumstances.
              </Step>
              <Step number={5} title="Rapid Resolution">
                Receive a fast, fair resolution to your claim with transparent
                explanations.
              </Step>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">
              Ready to Transform Your Claims Process?
            </h2>
            <p className="text-xl mb-8">
              Contact us to learn how ClaimGuard can benefit your organization.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} ClaimGuard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex items-start">
      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{children}</p>
      </div>
    </div>
  );
}
