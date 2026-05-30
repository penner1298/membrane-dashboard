import { Route, Zap, Shield } from "lucide-react"

const features = [
  {
    icon: Route,
    title: "Dynamic Model Routing",
    description: "Uses the cheapest model for easy questions, and the smartest model only when needed. Automatic cost optimization without sacrificing quality."
  },
  {
    icon: Zap,
    title: "Semantic Caching",
    description: "Never pay for the same user question twice. Sub-second response times with intelligent cache matching that understands context."
  },
  {
    icon: Shield,
    title: "100% Uptime",
    description: "Built-in fallbacks mean your bot never goes down, even when upstream APIs do. Automatic failover between providers."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-secondary/50 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            Everything you need to scale
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Drop-in replacement for your existing API calls. No code changes required.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="group rounded-xl border border-border bg-background/80 p-8 shadow-sm backdrop-blur-sm transition-all hover:border-accent/50 hover:shadow-md tilt-3d"
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-3">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
