import { AlertTriangle } from "lucide-react"

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        
        <blockquote className="text-balance text-xl font-medium text-foreground md:text-2xl lg:text-3xl">
          {'"'}We racked up a $1,000 API bill in a week trying to scale a multi-agent chatbot. We built Membrane so you don&apos;t have to.{'"'}
        </blockquote>
        
        <p className="mt-6 text-muted-foreground">
          — The Membrane Team
        </p>
      </div>
    </section>
  )
}
