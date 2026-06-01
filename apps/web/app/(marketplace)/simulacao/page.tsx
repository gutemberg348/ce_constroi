import { Suspense } from "react";
import { SimpleFinancingSimulator } from "@/components/marketplace/simple-financing-simulator";

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">Carregando simulacao...</div>}>
      <SimpleFinancingSimulator />
    </Suspense>
  );
}
