import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { VisualProofSection } from "@/components/visual-proof-section"
import { FeaturesSection } from "@/components/features-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ProblemSection />
      <VisualProofSection />
      <FeaturesSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
